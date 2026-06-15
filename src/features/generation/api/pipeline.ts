import { AnthropicService } from "./anthropic-service";
import { SYSTEM_PROMPT_STAGE1, SYSTEM_PROMPT_STAGE2 } from "./prompts";
import { FallbackGenerator } from "./fallback";
import type { GenerationMetadata } from "./types";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import { SchemaParser } from "./schema-parser";
import { APIGenerator } from "./api-generator";
import { BackendBlueprint } from "@/features/architecture/types";
import { SchemaCompiler } from "@/features/architecture/engines/schema-compiler";
import { ApiSurfaceCompiler } from "@/features/architecture/engines/api-surface-compiler";
import { CapabilityApiGenerator } from "@/features/architecture/engines/capability-api-generator";
import { ServiceGenerator } from "@/features/architecture/engines/service-generator";
import { DtoGenerator } from "@/features/architecture/engines/dto-generator";
import { PermissionGenerator } from "@/features/architecture/engines/permission-generator";
import { DrizzleGenerator } from "./drizzle-generator";
import { CodeGenerationPlan } from "./generation-plan";
import { GenerationGuard } from "./generation-guard";
import { NestJSGenerator } from "./nestjs-generator";
import { ProjectExporter } from "./project-exporter";
import { wrapPromptForLLM } from "@/lib/prompt-sanitizer";
// Phase 7a: these AI engines were referenced but never imported, which threw a
// ReferenceError at runtime and routed every blueprint run into runFallback.
import { ServiceLogicAIEngine } from "./service-logic-ai-engine";
import { AIContextBuilder } from "./ai-context-builder";
import { SecurityAgent, SecurityAgentOutput } from "./security-agent";
import { TestWriterAgent, TestWriterOutput } from "./test-writer-agent";
import { SDKGenerator } from "./sdk-generator";
import { hasAnyProvider } from "./llm-provider";
import type { PipelineEvent, PipelineStage } from "../types/pipeline-events";
import { translateError } from "../utils/error-translator";

export class GenerationPipeline {
  /**
   * Run the complete multi-stage generation orchestration pipeline.
   * Send progress messages back via the onProgress callback.
   */
  public static async execute(
    projectId: string,
    prompt: string,
    stack: string,
    localMode: boolean,
    blueprint: BackendBlueprint | null,
    onEvent?: (event: PipelineEvent) => void,
    // Phase 4b: lightweight graph analytics threaded from ingestion. Optional
    // and not yet consumed inside the pipeline — reserved for future use.
    _graphAnalytics?: import("@/features/ingestion/types").SerializableIngestionResult["graphAnalytics"] | null
  ): Promise<GenerationMetadata> {
    const startTime = Date.now();

    try {
      // Agent 1 (Architect) runs client-side before this pipeline — the
      // approved blueprint IS its output, so report it as already done.
      onEvent?.({
        type: "stage_update", stage: "ARCHITECT", status: "done",
        message: blueprint ? "Architecture blueprint approved" : "Architecture derived from prompt",
        timestamp: Date.now(),
      });

      const promptLower = prompt.toLowerCase();
      if (promptLower.includes("supabase") && promptLower.includes("lucia")) {
        throw new Error("ConflictError: Cannot reconcile using both Supabase Auth and Lucia Auth in the same project context.");
      }

      if (localMode) {
        return await this.runFallback(projectId, prompt, stack, onEvent, undefined, blueprint, startTime);
      }

      // ── AGENT 2: GENERATOR ───────────────────────────────────────────────────
      onEvent?.({
        type: "stage_update", stage: "GENERATOR", status: "running",
        message: blueprint ? "Synchronizing approved architecture blueprint..." : "Analyzing system requirements...",
        timestamp: Date.now(),
      });
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (blueprint) {
        const validationErrors = GenerationGuard.validate(blueprint);
        if (validationErrors.length > 0) {
          console.warn(`ReadinessWarning: ${validationErrors[0]}. Proceeding anyway.`);
        }
      }

      // Single startup gate: the pipeline needs at least one LLM provider. Each
      // agent then resolves its own provider via the cascade (Anthropic preferred,
      // NVIDIA fallback) — no per-provider gating here.
      if (!hasAnyProvider()) {
        throw new Error("KeyMissingError: No LLM provider configured. Set ANTHROPIC_API_KEY or NVIDIA_API_KEY.");
      }

      let metadata: GenerationMetadata;

      try {
        metadata = blueprint
          ? await this.executeDeterministicPipeline(blueprint, prompt, stack, onEvent)
          : await this.executeAIDrivenPipeline(prompt, stack, onEvent);
      } catch (err: any) {
        // The SECURITY block inside the deterministic pipeline emits its own
        // stage error; everything else in this call is the GENERATOR stage.
        if (!String(err?.message ?? err).startsWith("SecurityError")) {
          const userError = translateError(err, "GENERATOR");
          onEvent?.({ type: "stage_update", stage: "GENERATOR", status: "error", message: userError.title, userError, timestamp: Date.now() });
        }
        throw err;
      }

      // ── AGENT 4: STABILITY — mandatory file-generation gate ──────────────────
      onEvent?.({ type: "stage_update", stage: "STABILITY", status: "running", message: "Validating project integrity...", timestamp: Date.now() });
      const integrity = this.runIntegrityCheck(metadata);

      if (!integrity.isValid) {
        if (integrity.missingCritical.length === 0) {
          // Defensive: isValid is derived from missingCritical, so this is
          // unreachable today. If a future edit re-couples isValid to the
          // structural counts, NEVER throw an empty "missing critical files"
          // error — log loudly and let the pipeline proceed instead.
          console.error(
            "[runIntegrityCheck] Integrity flagged invalid with an empty missing-files list — this is a check-logic bug, not a real generation failure. Proceeding."
          );
        } else {
          const gateError = new Error(`GenerationError: Project integrity check failed. Missing critical files: ${integrity.missingCritical.join(', ')}`);
          const userError = translateError(gateError, "STABILITY");
          onEvent?.({ type: "stage_update", stage: "STABILITY", status: "error", message: userError.title, userError, timestamp: Date.now() });
          throw gateError;
        }
      }
      if (integrity.warnings.length > 0) {
        console.warn(`[runIntegrityCheck] Non-fatal integrity warnings (proceeding): ${integrity.warnings.join(", ")}`);
      }
      onEvent?.({
        type: "stage_update", stage: "STABILITY", status: "done",
        message: `${integrity.fileCount} files validated (${integrity.controllerCount} controllers, ${integrity.serviceCount} services)`,
        timestamp: Date.now(),
      });

      // ── AGENT 5: TEST WRITER ─────────────────────────────────────────────────
      // Runs after Agent 4: metadata.files is the security-patched (Agent 3),
      // integrity-validated (Agent 4) file map. Blueprint-driven discovery, so
      // the AI-driven branch (no blueprint) is skipped.
      let testWriterOutput: TestWriterOutput | undefined;
      if (blueprint) {
        onEvent?.({ type: "stage_update", stage: "TEST_WRITER", status: "running", message: "Writing Jest + Supertest tests for generated modules...", timestamp: Date.now() });
        try {
          const testWriter = new TestWriterAgent();
          testWriterOutput = await testWriter.execute({
            patchedFiles: new Map(Object.entries(metadata.files || {})),
            blueprint,
          });
          metadata.files = Object.fromEntries(testWriterOutput.allFiles);
          metadata.fileTree = Object.keys(metadata.files).map(path => ({ id: path, name: path.split('/').pop()!, type: 'file' as const }));
          onEvent?.({
            type: "stage_update", stage: "TEST_WRITER", status: "done",
            message: testWriterOutput.modulesSkipped.length > 0
              ? `${testWriterOutput.modulesProcessed} modules tested, ${testWriterOutput.modulesSkipped.length} skipped (${testWriterOutput.modulesSkipped.join(", ")})`
              : `${testWriterOutput.modulesProcessed} modules tested`,
            timestamp: Date.now(),
          });
        } catch (err) {
          const userError = translateError(err, "TEST_WRITER");
          onEvent?.({ type: "stage_update", stage: "TEST_WRITER", status: "error", message: userError.title, userError, timestamp: Date.now() });
          throw err;
        }
      } else {
        onEvent?.({ type: "stage_update", stage: "TEST_WRITER", status: "skipped", message: "Skipped — prompt-only generation has no blueprint to test against", timestamp: Date.now() });
      }
      // ─────────────────────────────────────────────────────────────────────────

      // ── AGENT 6: SDK GENERATOR ────────────────────────────────────────────────
      // Deterministic, no LLM. Adds the typed frontend SDK to the final
      // artifact. metadata.files at this point is post-Agent-3/4/5 — the SDK
      // files merge into it so persistence and the editor see the full set.
      let sdkGenerated = false;
      if (blueprint) {
        onEvent?.({ type: "stage_update", stage: "SDK", status: "running", message: "Generating typed API client for your frontend...", timestamp: Date.now() });
        try {
          const sdkGenerator = new SDKGenerator();
          const sdkOutput = sdkGenerator.execute({
            blueprint,
            filesWithTests: new Map(Object.entries(metadata.files || {})),
            deploymentUrl: undefined, // populated post-deploy; placeholder for now
          });
          metadata.files = Object.fromEntries(sdkOutput.allFiles);
          metadata.fileTree = Object.keys(metadata.files).map(path => ({ id: path, name: path.split('/').pop()!, type: 'file' as const }));
          sdkGenerated = true;
          onEvent?.({ type: "stage_update", stage: "SDK", status: "done", message: "SDK generated: api-client.ts, src/types/api.ts, .env.production", timestamp: Date.now() });
        } catch (err) {
          const userError = translateError(err, "SDK");
          onEvent?.({ type: "stage_update", stage: "SDK", status: "error", message: userError.title, userError, timestamp: Date.now() });
          throw err;
        }
      } else {
        onEvent?.({ type: "stage_update", stage: "SDK", status: "skipped", message: "Skipped — no blueprint to derive an API client from", timestamp: Date.now() });
      }
      // ─────────────────────────────────────────────────────────────────────────

      // Persistence
      await this.saveToDatabase(projectId, metadata);

      onEvent?.({
        type: "complete",
        message: "Backend ready",
        summary: {
          totalFiles: Object.keys(metadata.files ?? {}).length,
          modulesGenerated: blueprint?.entities?.length ?? 0,
          testFilesGenerated: testWriterOutput?.testFiles.length ?? 0,
          securityIssuesFound: metadata.securitySummary?.issuesFound ?? 0,
          securityIssuesFixed: metadata.securitySummary?.issuesFixed ?? 0,
          sdkFilesGenerated: sdkGenerated,
          durationMs: Date.now() - startTime,
        },
        timestamp: Date.now(),
      });
      return metadata;
    } catch (error: any) {
      console.error("Pipeline Execution Failure:", error);
      if (
        error.message.startsWith("ConflictError") ||
        error.message.startsWith("KeyMissingError") ||
        error.message.startsWith("GenerationError") ||
        error.message.startsWith("SecurityError") ||
        error.message.startsWith("TestWriterError") ||
        error.message.startsWith("SDKError")
      ) {
        // Persist the failure so a hard-refresh of the IDE can reconstruct the
        // error panel + Retry instead of being stranded. Best-effort: never let
        // a persistence problem mask the original error.
        await this.persistFailure(projectId, this.stageFromError(error.message), error.message).catch(() => {});
        throw error;
      }
      return await this.runFallback(projectId, prompt, stack, onEvent, error.message, blueprint, startTime);
    }
  }

  /** Best-effort mapping of a tagged pipeline error to the stage it came from. */
  private static stageFromError(message: string): PipelineStage {
    if (message.startsWith("ConflictError")) return "ARCHITECT";
    if (message.startsWith("SecurityError")) return "SECURITY";
    if (message.startsWith("TestWriterError")) return "TEST_WRITER";
    if (message.startsWith("SDKError")) return "SDK";
    if (message.startsWith("GenerationError") && message.includes("integrity")) return "STABILITY";
    return "GENERATOR";
  }

  /**
   * Failure-path persistence. There is no 'failed' value in the projects.status
   * CHECK constraint (deployed|building|draft|paused), so a failed run is marked
   * 'paused' + generation_metadata.lastError. This both moves status away from
   * 'building' (so the IDE's reconnect poll terminates) and gives a refresh
   * enough to rebuild the error panel. Existing metadata (blueprint, source_files,
   * ingestion) is preserved so Retry can re-run from it.
   */
  private static async persistFailure(projectId: string, stage: PipelineStage, message: string): Promise<void> {
    // Service-role client: the anon client is RLS-blocked from writing the
    // project row (no user session server-side). Ownership was already verified
    // at the /api/generate boundary.
    const supabase = createServiceRoleClient();

    let existingMeta: Record<string, any> = {};
    try {
      const { data } = await supabase
        .from("projects")
        .select("generation_metadata")
        .eq("id", projectId)
        .maybeSingle();
      existingMeta = data?.generation_metadata ?? {};
    } catch {
      existingMeta = {};
    }

    await supabase.from("projects").update({
      generation_metadata: {
        ...existingMeta,
        lastError: { stage, message, timestamp: Date.now() },
      },
      status: "paused",
      dot: "gray",
      updated_at: new Date().toISOString(),
    }).eq("id", projectId);
  }

  private static runIntegrityCheck(metadata: GenerationMetadata): {
    isValid: boolean;
    fileCount: number;
    controllerCount: number;
    serviceCount: number;
    missingCritical: string[];
    warnings: string[];
  } {
    const files = metadata.files || {};
    const filePaths = Object.keys(files);

    // HARD requirements — actual files the generated backend cannot run without.
    const critical = ["package.json", "README.md"];
    const missingCritical = critical.filter(path => !files[path]);
    if (!filePaths.some(p => p.includes('schema.ts'))) {
        missingCritical.push("src/db/schema.ts");
    }

    const controllerCount = filePaths.filter(p => p.includes('.controller.ts') || p.includes('route')).length;
    const serviceCount = filePaths.filter(p => p.includes('.service.ts') || p.includes('service')).length;

    // SOFT, structural concerns — non-fatal. A blueprint with no entities (e.g. a
    // source project where domain analysis found none, like a CRA app) legitimately
    // produces no services/controllers. That is a degenerate-but-not-corrupt result
    // and must NOT hard-fail — previously it tripped `isValid` while contributing
    // nothing to `missingCritical`, producing the confusing empty "Missing critical
    // files: " error. These are logged by the caller and the pipeline proceeds.
    const warnings: string[] = [];
    if (filePaths.length < 3) warnings.push(`only ${filePaths.length} file(s) generated`);
    if (controllerCount < 1) warnings.push("no controllers generated");
    if (serviceCount < 1) warnings.push("no services generated");

    // Hard-fail ONLY on genuinely-missing critical files, so a thrown message always
    // names real entries — this eliminates the empty-list failure class entirely.
    const isValid = missingCritical.length === 0;

    return {
      isValid,
      fileCount: filePaths.length,
      controllerCount,
      serviceCount,
      missingCritical,
      warnings,
    };
  }

  private static async executeDeterministicPipeline(
    blueprint: BackendBlueprint,
    prompt: string,
    stack: string,
    onEvent?: (event: PipelineEvent) => void
  ): Promise<GenerationMetadata> {
    // 1. Schema Compilation (No AI)
    onEvent?.({ type: "progress", stage: "GENERATOR", status: "running", message: "Compiling database schema from blueprint...", timestamp: Date.now() });
    const compiler = new SchemaCompiler();
    const normalizedSchema = compiler.compile(blueprint);
    const schemaCode = DrizzleGenerator.generateSchema(normalizedSchema);
    const relationsCode = DrizzleGenerator.generateRelations(normalizedSchema);

    // 2. API & Surface Compilation (No AI)
    onEvent?.({ type: "progress", stage: "GENERATOR", status: "running", message: "Generating deterministic API surface and DTOs...", timestamp: Date.now() });
    const apiCompiler = new ApiSurfaceCompiler();
    const capApiGenerator = new CapabilityApiGenerator();
    const apiSurface = [
        ...apiCompiler.compile(blueprint),
        ...capApiGenerator.generate(blueprint.capabilities)
    ];

    const dtoGenerator = new DtoGenerator();
    const dtos = blueprint.entities.flatMap(e => dtoGenerator.generate(e));

    const serviceGenerator = new ServiceGenerator();
    const services = serviceGenerator.generate(blueprint);

    // [M3 PROBE — REMOVE] what module does ServiceGenerator tag the first entity's service with?
    console.log("[M3 PROBE] ServiceGenerator first svc.module:", services[0]?.module, "| all svc.module:", JSON.stringify(services.map(s => s.module)));

    const permissionGenerator = new PermissionGenerator();
    const permissions = permissionGenerator.generate(blueprint);

    // 3. Architecture Projection
    const architectureNodes: any[] = blueprint.entities.map((e, i) => ({ 
      id: e.name, 
      kind: 'entity', 
      title: e.name,
      subtitle: e.tableName,
      icon: 'Database',
      accent: 'blue',
      x: 100 + (i % 3) * 200,
      y: 120 + Math.floor(i / 3) * 100
    }));
    const architectureEdges: any[] = (blueprint.entities.flatMap(e => 
      (e.relationships || []).map((r: any) => [e.name, r.target, 'owns'])
    ));

    // 4. Routing & Logic (LLM-guided by blueprint contract)
    onEvent?.({ type: "progress", stage: "GENERATOR", status: "running", message: "Generating API routes and service logic...", timestamp: Date.now() });
    const generationPlan = CodeGenerationPlan.create(blueprint, normalizedSchema);

    // 3. AI Business Logic Generation (Constrained Implementer)
    onEvent?.({ type: "progress", stage: "GENERATOR", status: "running", message: "Implementing functional business logic via AI...", timestamp: Date.now() });
    const implementations = await ServiceLogicAIEngine.implement(blueprint, services, dtos);
    
    // TEST GENERATION REMOVED FROM AGENT 2 BLOCK
    // Agent 5 (TestWriterAgent) now handles test generation after Agent 4 (Stability).
    // Tests are written on security-patched, type-validated code — not mid-generation.

    // [M3 PROBE — REMOVE] blueprint.modules right before NestJSGenerator consumes them.
    console.log("[M3 PROBE] blueprint.modules:", JSON.stringify(blueprint.modules?.map(m => ({ name: m.name, entities: m.entities, services: m.services })), null, 2));

    // 5. Final Assembly (NestJS Compilation)
    onEvent?.({ type: "progress", stage: "GENERATOR", status: "running", message: "Assembling final NestJS project structure...", timestamp: Date.now() });
    const nestFiles = NestJSGenerator.generate(blueprint, normalizedSchema, apiSurface, services, dtos, permissions, implementations);

    // Emit the compiled Drizzle schema at the canonical path the generated code
    // already imports: src/infra/database.module.ts does `import * as schema from
    // '../db/schema'`, and the Stability gate (runIntegrityCheck) requires a
    // schema.ts file. NestJSGenerator doesn't write it — the schema/relations
    // code lives only in metadata.schemaCode (display) — so without this the
    // assembled project both fails the integrity check and wouldn't compile.
    nestFiles["src/db/schema.ts"] = schemaCode.join("\n");
    onEvent?.({ type: "stage_update", stage: "GENERATOR", status: "done", message: "Backend code generated", timestamp: Date.now() });

    // ── AGENT 3: SECURITY ────────────────────────────────────────────────────
    onEvent?.({ type: "stage_update", stage: "SECURITY", status: "running", message: "Scanning for security issues...", timestamp: Date.now() });
    let securityOutput: SecurityAgentOutput;
    try {
      const securityAgent = new SecurityAgent();
      securityOutput = await securityAgent.execute({
        generatedFiles: new Map(Object.entries(nestFiles)),
        blueprint,
        generatedPackageJson: nestFiles["package.json"],
      });
      onEvent?.({
        type: "stage_update", stage: "SECURITY", status: "done",
        message: securityOutput.report.issues.length === 0
          ? "No security issues found"
          : `${securityOutput.report.autoFixed} issue(s) auto-fixed, ${securityOutput.report.requiresManualReview.length} flagged for review`,
        timestamp: Date.now(),
      });
    } catch (err) {
      const userError = translateError(err, "SECURITY");
      onEvent?.({ type: "stage_update", stage: "SECURITY", status: "error", message: userError.title, userError, timestamp: Date.now() });
      throw err; // still propagate — the outer catch decides whether to fallback or surface
    }
    // Agent 4 (Stability) must validate the patched files, not Agent 2's originals.
    const securedFiles: Record<string, string> = Object.fromEntries(securityOutput.patchedFiles);
    // ─────────────────────────────────────────────────────────────────────────

    // 6. Runtime Validation & Export Preparation
    onEvent?.({ type: "progress", stage: "STABILITY", status: "running", message: "Validating runtime readiness...", timestamp: Date.now() });
    const exportResult = ProjectExporter.prepare(blueprint, securedFiles);

    // Non-blocking validation for MVP flow
    if (!exportResult.isExportable && exportResult.readinessScore < 80) {
        console.warn(`Project readiness score is ${exportResult.readinessScore}%, proceeding anyway.`);
    }

    const fileTree = Object.keys(securedFiles).map(path => ({ id: path, name: path.split('/').pop()!, type: 'file' as const }));

    return {
      stackSummary: {
        database: blueprint.infrastructure.database.provider,
        auth: blueprint.infrastructure.auth.provider,
        hosting: "Standard"
      },
      modules: blueprint.modules.map(m => ({ 
        id: m.name.toLowerCase(),
        name: m.name, 
        desc: `Module managing ${m.entities.join(', ')}`,
        icon: 'Layers',
        status: 'ready' as const,
        files: 4,
        routes: [], 
        entities: m.entities 
      })),
      apiRoutes: apiSurface.map(api => ({
        path: api.path,
        method: api.method,
        auth: api.isProtected ? "session" : null,
      })),
      schemaTables: normalizedSchema.tables.map((t, i) => ({ 
        name: t.name, 
        columns: t.fields.map(f => ({ name: f.name, type: f.type, pk: f.primaryKey, fk: f.fk })),
        x: 100 + (i % 3) * 260,
        y: 80 + Math.floor(i / 3) * 200,
        accent: (['blue', 'purple', 'green', 'amber'][i % 4]) as any
      })),
      architectureNodes,
      architectureEdges,
      fileTree,
      routeCode: Object.values(securedFiles),
      schemaCode: schemaCode.concat(relationsCode),
      files: securedFiles,
      securitySummary: {
        issuesFound: securityOutput.report.issues.length,
        issuesFixed: securityOutput.report.autoFixed,
      },
      authStrategy: {
        providers: blueprint.infrastructure.auth.provider,
        sessions: "Standard",
        roles: blueprint.permissions.map(p => p.role).join(', '),
        mfa: "None",
        rateLimit: "60 / min",
      },
      authFlowSteps: exportResult.issues.map((iss, i) => ({ n: i + 1, t: iss.component, d: iss.message })),
      envVariables: blueprint.integrations.flatMap(i => i.requiredEnv.map(k => ({ k, v: 'PLACEHOLDER', kind: 'secret' as const }))),
      normalizedSchema,
      apiSurface,
      services,
      serviceImplementations: implementations,
      dtos,
      permissions
    };
  }

  private static async executeAIDrivenPipeline(
    prompt: string,
    stack: string,
    onEvent?: (event: PipelineEvent) => void
  ): Promise<GenerationMetadata> {
    // Stage 1: Architecture & Overview
    onEvent?.({ type: "progress", stage: "GENERATOR", status: "running", message: "Designing system architecture and stack components...", timestamp: Date.now() });
    const stage1Prompt = `User Prompt:\n${wrapPromptForLLM(prompt)}\nFramework/Stack: "${stack}"`;
    const stage1ResponseRaw = await AnthropicService.chatComplete(SYSTEM_PROMPT_STAGE1, stage1Prompt);
    const stage1Data = JSON.parse(stage1ResponseRaw.trim());

    // Stage 2: Schema design
    onEvent?.({ type: "progress", stage: "GENERATOR", status: "running", message: "Designing database schema tables and relationships...", timestamp: Date.now() });
    const stage2Prompt = `User Prompt:\n${wrapPromptForLLM(prompt)}\nFramework/Stack: "${stack}"\nStage 1 Architecture Output:\n${JSON.stringify(stage1Data)}`;
    const stage2ResponseRaw = await AnthropicService.chatComplete(SYSTEM_PROMPT_STAGE2, stage2Prompt);
    const stage2Data = JSON.parse(stage2ResponseRaw.trim());

    // Stage 3 & 4
    onEvent?.({ type: "progress", stage: "GENERATOR", status: "running", message: "Mapping API routes and authentication flow...", timestamp: Date.now() });
    await new Promise((resolve) => setTimeout(resolve, 600));
    onEvent?.({ type: "progress", stage: "GENERATOR", status: "running", message: "Assembling final project folder structure...", timestamp: Date.now() });
    await new Promise((resolve) => setTimeout(resolve, 500));

    const schemaTables = stage2Data.schemaTables || [];
    const schemaCode = stage2Data.schemaCode || [];
    const normalizedSchema = SchemaParser.parse(schemaCode, schemaTables);
    const rawApiRoutes = stage1Data.apiRoutes || [];
    const apiRoutes = APIGenerator.enrich(rawApiRoutes, normalizedSchema);

    // Assembly into files map for the exporter
    const files: Record<string, string> = {
        "src/db/schema.ts": Array.isArray(schemaCode) ? schemaCode.join('\n') : schemaCode,
        "package.json": JSON.stringify({ name: "ai-generated-backend", version: "0.0.1", dependencies: {} }, null, 2),
        "README.md": "# AI Generated Backend\n\nGenerated via Simplicit AI-Driven Pipeline."
    };

    if (stage2Data.routeCode) {
        files["src/app/api/routes.ts"] = Array.isArray(stage2Data.routeCode) ? stage2Data.routeCode.join('\n') : stage2Data.routeCode;
    }

    onEvent?.({ type: "stage_update", stage: "GENERATOR", status: "done", message: "Backend code generated", timestamp: Date.now() });

    return {
      stackSummary: stage1Data.stackSummary || {},
      modules: stage1Data.modules || [],
      apiRoutes,
      schemaTables,
      architectureNodes: stage1Data.architectureNodes || [],
      architectureEdges: stage1Data.architectureEdges || [],
      fileTree: stage2Data.fileTree || [],
      routeCode: stage2Data.routeCode || [],
      schemaCode,
      files,
      authStrategy: stage2Data.authStrategy || {
        providers: "Email + Google SSO",
        sessions: "Lucia",
        roles: "user",
        mfa: "None",
        rateLimit: "60 / min",
      },
      authFlowSteps: stage2Data.authFlowSteps || [],
      envVariables: stage2Data.envVariables || [],
      normalizedSchema,
    };
  }

  private static async runFallback(
    projectId: string,
    prompt: string,
    stack: string,
    onEvent?: (event: PipelineEvent) => void,
    originalError?: string,
    blueprint?: BackendBlueprint | null,
    startTime: number = Date.now()
  ): Promise<GenerationMetadata> {
    onEvent?.({ type: "progress", stage: "GENERATOR", status: "running", message: "Generation using fallback mode — this may produce simpler output", timestamp: Date.now() });
    onEvent?.({ type: "progress", stage: "GENERATOR", status: "running", message: "Designing system architecture (local fallback)...", timestamp: Date.now() });
    await new Promise((resolve) => setTimeout(resolve, 800));
    onEvent?.({ type: "progress", stage: "GENERATOR", status: "running", message: "Designing database schema (local fallback)...", timestamp: Date.now() });
    await new Promise((resolve) => setTimeout(resolve, 800));
    onEvent?.({ type: "progress", stage: "GENERATOR", status: "running", message: "Mapping API routes (local fallback)...", timestamp: Date.now() });
    await new Promise((resolve) => setTimeout(resolve, 800));
    onEvent?.({ type: "progress", stage: "GENERATOR", status: "running", message: "Assembling final project structure (local fallback)...", timestamp: Date.now() });

    const metadata = FallbackGenerator.generate(prompt, stack);

    // If blueprint exists, run the deterministic compilers to produce real code
    if (blueprint) {
        const compiler = new SchemaCompiler();
        const normalizedSchema = compiler.compile(blueprint);
        const schemaCode = DrizzleGenerator.generateSchema(normalizedSchema);
        const relationsCode = DrizzleGenerator.generateRelations(normalizedSchema);

        const apiCompiler = new ApiSurfaceCompiler();
        const capApiGenerator = new CapabilityApiGenerator();
        const apiSurface = [
            ...apiCompiler.compile(blueprint),
            ...capApiGenerator.generate(blueprint.capabilities)
        ];

        const dtoGenerator = new DtoGenerator();
        const dtos = blueprint.entities.flatMap(e => dtoGenerator.generate(e));

        const serviceGenerator = new ServiceGenerator();
        const services = serviceGenerator.generate(blueprint);

        const permissionGenerator = new PermissionGenerator();
        const permissions = permissionGenerator.generate(blueprint);

        // Generate files (NestJS structure with TODO logic)
        const nestFiles = NestJSGenerator.generate(blueprint, normalizedSchema, apiSurface, services, dtos, permissions);
        
        metadata.normalizedSchema = normalizedSchema;
        metadata.schemaCode = schemaCode.concat(relationsCode);
        metadata.files = nestFiles;
        metadata.apiRoutes = apiSurface.map(api => ({
            path: api.path,
            method: api.method,
            auth: api.isProtected ? "session" : null,
        }));
        metadata.schemaTables = normalizedSchema.tables.map((t, i) => ({ 
            name: t.name, 
            columns: t.fields.map(f => ({ name: f.name, type: f.type, pk: f.primaryKey, fk: f.fk })),
            x: 100 + (i % 3) * 260,
            y: 80 + Math.floor(i / 3) * 200,
            accent: (['blue', 'purple', 'green', 'amber'][i % 4]) as any
        }));
        metadata.fileTree = Object.keys(nestFiles).map(path => ({ id: path, name: path.split('/').pop()!, type: 'file' as const }));
    } else {
        try {
            metadata.normalizedSchema = SchemaParser.parse(metadata.schemaCode, metadata.schemaTables);
            metadata.apiRoutes = APIGenerator.enrich(metadata.apiRoutes, metadata.normalizedSchema);
        } catch (e) {}
    }

    await this.saveToDatabase(projectId, metadata);
    onEvent?.({
      type: "complete",
      message: "Backend ready (fallback mode)",
      summary: {
        totalFiles: Object.keys(metadata.files ?? {}).length,
        modulesGenerated: blueprint?.entities?.length ?? 0,
        testFilesGenerated: 0,
        securityIssuesFound: 0,
        securityIssuesFixed: 0,
        sdkFilesGenerated: false,
        durationMs: Date.now() - startTime,
      },
      timestamp: Date.now(),
    });
    return metadata;
  }

  private static async saveToDatabase(projectId: string, metadata: GenerationMetadata): Promise<void> {
    // Service-role client: the anon client is RLS-blocked from writing the
    // project row (no user session server-side). Ownership was already verified
    // at the /api/generate boundary.
    const supabase = createServiceRoleClient();

    // Read existing metadata to preserve blueprint/ingestion/requirements/spec
    // that the workspace wrote at project-creation time. Without this merge the
    // pipeline overwrite would permanently destroy the BackendBlueprint.
    let existingMeta: Record<string, any> = {};
    try {
      const { data: existing } = await supabase
        .from("projects")
        .select("generation_metadata")
        .eq("id", projectId)
        .maybeSingle();
      existingMeta = existing?.generation_metadata ?? {};
    } catch {
      existingMeta = {};
    }

    await supabase.from("projects").update({
      generation_metadata: {
        ...existingMeta,                       // preserve blueprint/ingestion/spec/requirements
        ...metadata,                           // add new files/modules/apiRoutes/schemaTables
        lastError: null,                       // clear any prior failure now that this run succeeded
        generatedAt: new Date().toISOString(),
      },
      status: "deployed",
      dot: "green",
      health: 100,
      updated_at: new Date().toISOString(),
    }).eq("id", projectId);
  }
}
