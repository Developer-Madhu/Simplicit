import { BackendBlueprint } from "@/features/architecture/types";
import { AnthropicService } from "./anthropic-service";
import { NvidiaService } from "./nvidia-service";
import { resolveProvider } from "./llm-provider";

/**
 * Agent 5 — Test Writer
 * Runs AFTER Agent 4 (Stability): tests are written against security-patched,
 * integrity-validated files, not mid-generation drafts. Replaces the old
 * TestGenerationEngine (which generated one test per capability inside the
 * Agent 2 block).
 *
 * One Anthropic call per module group (service + controller + DTOs in, one
 * complete pair of spec files out). Calls run sequentially to stay under
 * rate limits — test generation is best-effort and off the critical path.
 *
 * Error convention: per-module failures are logged and recorded in
 * modulesSkipped, never thrown. The only thrown error is the structural
 * "TestWriterError:" guard (zero modules discovered on a non-empty
 * blueprint), which the pipeline catch-all re-throws to the caller.
 */

export interface TestWriterInput {
  patchedFiles: Map<string, string>; // the complete file map post-Agent-3 and post-Agent-4
  blueprint: BackendBlueprint; // for module structure and method signatures
}

export interface GeneratedTestFile {
  path: string; // e.g. src/modules/user/user.service.spec.ts
  content: string; // Jest test file content
}

export interface TestWriterOutput {
  testFiles: GeneratedTestFile[]; // all generated spec files
  allFiles: Map<string, string>; // patchedFiles + testFiles merged
  modulesProcessed: number;
  modulesSkipped: string[]; // module names where generation failed
}

interface ModuleFileGroup {
  moduleName: string; // e.g. "user"
  entityName: string; // for test descriptions
  serviceFilePath: string; // e.g. src/modules/user/user.service.ts
  serviceContent: string;
  controllerFilePath: string; // e.g. src/modules/user/usermodule.controller.ts
  controllerContent: string;
  dtoFilePaths: string[]; // all DTO files for this module (emitted flat under src/dto/)
  isPrimary: boolean; // from BlueprintEntity.isPrimary
}

const TEST_WRITER_SYSTEM_PROMPT = `You are a backend test writer generating Jest + Supertest tests for NestJS services and controllers.
You always write complete, runnable test files — no placeholders, no TODOs, no ellipsis.
You know the NestJS testing module pattern (Test.createTestingModule).
You know how to mock dependencies using jest.fn() and Jest's module override system.

OUTPUT FORMAT — respond with ONLY a JSON object, no markdown, no explanation:
{
  "serviceSpec": "complete content of the .service.spec.ts file",
  "controllerSpec": "complete content of the .controller.spec.ts file"
}

RULES:
- Import paths must match the actual file structure (relative imports)
- Mock all external dependencies (repositories, Drizzle db instance, other services)
- For primary entities (full CRUD): test findAll, findById, create, update, delete
- For non-primary entities: test findAll and create only
- Controller tests use NestJS's httpMocks or @nestjs/testing + supertest pattern
- Service tests use unit test pattern (mock the db/repository layer)
- Each test has a describe block per method
- Use beforeEach to reset mocks
- Do not import from paths that don't exist in the provided files`;

export class TestWriterAgent {
  private files: Map<string, string> = new Map();

  async execute(input: TestWriterInput): Promise<TestWriterOutput> {
    this.files = input.patchedFiles;

    const discoverySkipped: string[] = [];
    const groups = this.discoverModuleFiles(input.blueprint, input.patchedFiles, discoverySkipped);

    // Structural guard: a non-empty blueprint that yields zero discoverable
    // modules means the path conventions broke — that must surface.
    if (groups.length === 0 && input.blueprint.entities.length > 0) {
      throw new Error(
        "TestWriterError: Could not discover any module files from blueprint. Check getModuleFolder path conventions."
      );
    }

    const testFiles: GeneratedTestFile[] = [];
    const loopSkipped: string[] = [];

    // Sequential — one call at a time, not Promise.all().
    // Avoids Anthropic rate limits; test generation is not on the critical path.
    for (const group of groups) {
      try {
        const generated = await this.generateTestsForModule(group, input.blueprint);
        if (generated.length === 0) {
          loopSkipped.push(group.moduleName);
          continue;
        }
        testFiles.push(...generated);
      } catch (err) {
        console.error(`TestWriterAgent: failed for module ${group.moduleName}:`, err);
        loopSkipped.push(group.moduleName);
      }
    }

    // Merge test files into the complete file map
    const allFiles = new Map(input.patchedFiles);
    for (const tf of testFiles) {
      allFiles.set(tf.path, tf.content);
    }

    return {
      testFiles,
      allFiles,
      modulesProcessed: groups.length - loopSkipped.length,
      modulesSkipped: [...discoverySkipped, ...loopSkipped],
    };
  }

  // ── Discovery ──────────────────────────────────────────────────────

  /**
   * Mirrors the emission logic in NestJSGenerator: one service per entity
   * (ServiceGenerator names it `${entity.name}Service` with module
   * `${entity.name}Module`), emitted only when a blueprint module of that
   * name exists. Derived paths are verified against the actual file map,
   * with a suffix-scan fallback so path drift skips a module instead of
   * silently mis-pairing files.
   */
  private discoverModuleFiles(
    blueprint: BackendBlueprint,
    files: Map<string, string>,
    skipped: string[]
  ): ModuleFileGroup[] {
    const groups: ModuleFileGroup[] = [];
    const fileKeys = Array.from(files.keys());

    for (const entity of blueprint.entities) {
      const entityLower = entity.name.toLowerCase();
      const expectedModuleName = `${entity.name}Module`;

      const mod = blueprint.modules.find(
        (m) => m.name === expectedModuleName || (Array.isArray(m.entities) && m.entities.includes(entity.name))
      );

      // Derive the expected paths the same way NestJSGenerator emits them.
      let servicePath: string | undefined;
      let controllerPath: string | undefined;
      if (mod) {
        const folder = `src/modules/${this.getModuleFolder(mod, blueprint)}`;
        servicePath = `${folder}/${entityLower}.service.ts`;
        controllerPath = `${folder}/${mod.name.toLowerCase()}.controller.ts`;
      }

      // Verify against the real file map; fall back to a suffix scan.
      if (!servicePath || !files.has(servicePath)) {
        servicePath = fileKeys.find((k) => k.endsWith(`/${entityLower}.service.ts`));
      }
      if (servicePath && (!controllerPath || !files.has(controllerPath))) {
        const dir = servicePath.slice(0, servicePath.lastIndexOf("/"));
        controllerPath = files.has(controllerPath ?? "")
          ? controllerPath
          : fileKeys.find((k) => k.startsWith(`${dir}/`) && k.endsWith(".controller.ts"));
      }

      if (!servicePath || !controllerPath || !files.has(servicePath) || !files.has(controllerPath)) {
        skipped.push(entityLower);
        continue;
      }

      // DTOs are emitted flat under src/dto/ (not per-module folders), named
      // after the entity (e.g. createuserrequest.dto.ts) — match by entity name.
      const dtoFilePaths = fileKeys.filter(
        (k) => k.startsWith("src/dto/") && k.endsWith(".dto.ts") && k.toLowerCase().includes(entityLower)
      );

      groups.push({
        moduleName: servicePath.split("/").slice(-2, -1)[0] ?? entityLower,
        entityName: entity.name,
        serviceFilePath: servicePath,
        serviceContent: files.get(servicePath)!,
        controllerFilePath: controllerPath,
        controllerContent: files.get(controllerPath)!,
        dtoFilePaths,
        isPrimary: entity.isPrimary === true,
      });
    }

    return groups;
  }

  /**
   * Mirror of NestJSGenerator.getModuleFolder (private there) — keep in sync.
   * Community-grouped folder when featureModules exist, flat base otherwise.
   */
  private getModuleFolder(mod: { name: string; entities?: string[] }, blueprint: BackendBlueprint): string {
    const base = mod.name.toLowerCase().replace("module", "");
    if (!blueprint.featureModules?.length) return base;

    const memberNames: string[] = Array.isArray(mod.entities) ? mod.entities : [];
    const entity = blueprint.entities.find(
      (e) => `${e.name}Module` === mod.name || memberNames.includes(e.name)
    );
    if (!entity || entity.communityId === undefined || entity.communityId === -1) return base;

    const feature = blueprint.featureModules.find((f) => f.communityId === entity.communityId);
    if (!feature) return base;

    const featureSlug = feature.name.toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-+|-+$/g, "");
    if (!featureSlug || featureSlug === base) return base;
    return `${featureSlug}/${base}`;
  }

  // ── Per-module generation ──────────────────────────────────────────

  private async generateTestsForModule(
    group: ModuleFileGroup,
    blueprint: BackendBlueprint
  ): Promise<GeneratedTestFile[]> {
    const prompt = this.buildTestPrompt(group, blueprint);
    // Provider per the shared cascade (Anthropic preferred, NVIDIA fallback).
    const provider = resolveProvider("test-writer");
    const llm = provider === "nvidia" ? NvidiaService : AnthropicService;
    const raw = await llm.chatComplete(TEST_WRITER_SYSTEM_PROMPT, prompt, { max_tokens: 3000 });
    return this.parseTestResponse(raw, group);
  }

  private buildTestPrompt(group: ModuleFileGroup, _blueprint: BackendBlueprint): string {
    const dtoSections = group.dtoFilePaths
      .map((p) => `${p}:\n${this.files.get(p) ?? ""}`)
      .join("\n\n");

    return `Module: ${group.moduleName}
Entity: ${group.entityName}
isPrimary: ${group.isPrimary}

SERVICE FILE (${group.serviceFilePath}):
${group.serviceContent}

CONTROLLER FILE (${group.controllerFilePath}):
${group.controllerContent}

DTO FILES:
${dtoSections}

Generate complete Jest test files for this service and controller.`;
  }

  /**
   * Open-weight models (NVIDIA's deepseek) sometimes wrap the JSON in preamble
   * text even after fence-stripping. Slice from the first '{' to the last '}'
   * so JSON.parse sees just the object; return the input unchanged when there's
   * no brace pair (let JSON.parse fail naturally as before).
   */
  private extractJsonObject(raw: string): string {
    const start = raw.indexOf("{");
    const end = raw.lastIndexOf("}");
    if (start === -1 || end === -1 || end <= start) return raw;
    return raw.slice(start, end + 1);
  }

  private parseTestResponse(rawResponse: string, group: ModuleFileGroup): GeneratedTestFile[] {
    try {
      const cleaned = rawResponse.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
      const parsed = JSON.parse(this.extractJsonObject(cleaned));

      if (
        typeof parsed?.serviceSpec !== "string" || parsed.serviceSpec.length === 0 ||
        typeof parsed?.controllerSpec !== "string" || parsed.controllerSpec.length === 0
      ) {
        throw new Error('Response is missing non-empty "serviceSpec"/"controllerSpec" keys');
      }

      return [
        { path: group.serviceFilePath.replace(/\.ts$/, ".spec.ts"), content: parsed.serviceSpec },
        { path: group.controllerFilePath.replace(/\.ts$/, ".spec.ts"), content: parsed.controllerSpec },
      ];
    } catch (err) {
      // Non-fatal: the module is reported as skipped, the pipeline continues.
      console.error(`TestWriterAgent: JSON parse failed for module ${group.moduleName}: ${err}`);
      return [];
    }
  }
}
