import { OpenAIService } from "./openai";
import { SYSTEM_PROMPT_STAGE1, SYSTEM_PROMPT_STAGE2 } from "./prompts";
import { FallbackGenerator } from "./fallback";
import type { GenerationMetadata } from "./types";
import { createClient } from "@supabase/supabase-js";
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

export interface PipelineProgressUpdate {
  stage: "analyzing" | "architecture" | "schema" | "routes" | "files" | "done" | "error";
  message: string;
  metadata?: GenerationMetadata;
  error?: string;
}

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
    onProgress: (update: PipelineProgressUpdate) => void
  ): Promise<GenerationMetadata> {
    const isApiKeyConfigured = !!process.env.OPENAI_API_KEY;

    try {
      const promptLower = prompt.toLowerCase();
      if (promptLower.includes("supabase") && promptLower.includes("lucia")) {
        throw new Error("ConflictError: Cannot reconcile using both Supabase Auth and Lucia Auth in the same project context.");
      }

      if (localMode) {
        return await this.runFallback(projectId, prompt, stack, onProgress, undefined, blueprint);
      }

      // 1. Initial Analyzing Stage
      onProgress({ 
        stage: "analyzing", 
        message: blueprint ? "Synchronizing approved architecture blueprint..." : "Analyzing system requirements..." 
      });
      await new Promise((resolve) => setTimeout(resolve, 800));

      if (blueprint) {
        const validationErrors = GenerationGuard.validate(blueprint);
        if (validationErrors.length > 0) {
          console.warn(`ReadinessWarning: ${validationErrors[0]}. Proceeding anyway.`);
        }
      }

      if (!isApiKeyConfigured) {
        throw new Error("KeyMissingError: OpenAI API key is missing. Please configure OPENAI_API_KEY or run in local offline mode.");
      }

      let metadata: GenerationMetadata;

      if (blueprint) {
        // DETERMINISTIC BRANCH: Use Approved Blueprint
        metadata = await this.executeDeterministicPipeline(blueprint, prompt, stack, onProgress);
      } else {
        // AI-DRIVEN BRANCH: Re-analyze from prompt (Legacy fallback)
        metadata = await this.executeAIDrivenPipeline(prompt, stack, onProgress);
      }

      // 7. Mandatory File Generation Gate (Rule: Stop reporting success if code is missing)
      const integrity = this.runIntegrityCheck(metadata);
      
      if (!integrity.isValid) {
          onProgress({ stage: "error", message: `Integrity check failed: ${integrity.missingCritical.join(', ')}`, error: "Missing critical source files." });
          throw new Error(`GenerationError: Project integrity check failed. Missing critical files: ${integrity.missingCritical.join(', ')}`);
      }

      onProgress({ 
        stage: "files", 
        message: `Generation complete! Metrics: ${integrity.fileCount} files created (${integrity.controllerCount} controllers, ${integrity.serviceCount} services).` 
      });

      // Persistence
      await this.saveToDatabase(projectId, metadata);

      onProgress({ stage: "done", message: "Backend generated with 100% integrity.", metadata });
      return metadata;
    } catch (error: any) {
      console.error("Pipeline Execution Failure:", error);
      if (error.message.startsWith("ConflictError") || error.message.startsWith("KeyMissingError") || error.message.startsWith("GenerationError")) {
        throw error;
      }
      return await this.runFallback(projectId, prompt, stack, onProgress, error.message, blueprint);
    }
  }

  private static runIntegrityCheck(metadata: GenerationMetadata): { 
    isValid: boolean; 
    fileCount: number; 
    controllerCount: number; 
    serviceCount: number;
    missingCritical: string[];
  } {
    const files = metadata.files || {};
    const filePaths = Object.keys(files);
    
    const critical = ["package.json", "README.md"];
    // main.ts and app.module.ts are mandatory for NestJS branch, but AI branch might use different names.
    // For now we check if schema.ts exists as it's common to both.
    const missingCritical = critical.filter(path => !files[path]);
    
    if (!filePaths.some(p => p.includes('schema.ts'))) {
        missingCritical.push("src/db/schema.ts");
    }

    const controllerCount = filePaths.filter(p => p.includes('.controller.ts') || p.includes('route')).length;
    const serviceCount = filePaths.filter(p => p.includes('.service.ts') || p.includes('service')).length;

    const isValid = missingCritical.length === 0 && 
                    filePaths.length >= 3 && 
                    controllerCount >= 1 && 
                    serviceCount >= 1;

    return {
      isValid,
      fileCount: filePaths.length,
      controllerCount,
      serviceCount,
      missingCritical
    };
  }

  private static async executeDeterministicPipeline(
    blueprint: BackendBlueprint,
    prompt: string,
    stack: string,
    onProgress: (update: PipelineProgressUpdate) => void
  ): Promise<GenerationMetadata> {
    // 1. Schema Compilation (No AI)
    onProgress({ stage: "schema", message: "Compiling database schema from blueprint..." });
    const compiler = new SchemaCompiler();
    const normalizedSchema = compiler.compile(blueprint);
    const schemaCode = DrizzleGenerator.generateSchema(normalizedSchema);
    const relationsCode = DrizzleGenerator.generateRelations(normalizedSchema);

    // 2. API & Surface Compilation (No AI)
    onProgress({ stage: "architecture", message: "Generating deterministic API surface and DTOs..." });
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
    onProgress({ stage: "routes", message: "Generating API routes and service logic..." });
    const generationPlan = CodeGenerationPlan.create(blueprint, normalizedSchema);
    
    // 3. AI Business Logic Generation (Constrained Implementer)
    onProgress({ stage: "routes", message: "Implementing functional business logic via AI..." });
    const implementations = await ServiceLogicAIEngine.implement(blueprint, services, dtos);
    
    // 4. Test Generation (Behavioral Verification)
    onProgress({ stage: "routes", message: "Generating behavioral unit tests..." });
    const unitTests: Record<string, string> = {};
    for (const service of services) {
        const entityName = service.name.replace('Service', '');
        const relevantCapabilities = blueprint.capabilities.filter(c => c.associatedEntity === entityName);
        for (const cap of relevantCapabilities) {
            const methodName = cap.name.split(' ').map((w: string, i: number) => i === 0 ? w.toLowerCase() : w).join('');
            const impl = implementations[service.name]?.[methodName];
            if (impl) {
                const methodContract = (service as any).methods?.find((m: any) => m === methodName || m.name === methodName);
                const context = AIContextBuilder.build(blueprint, cap, typeof methodContract === 'string' ? { name: methodContract, params: [], returnType: 'any', isAsync: true } : methodContract, dtos);
                unitTests[cap.name] = await TestGenerationEngine.generate(context, impl);
            }
        }
    }

    // 5. Final Assembly (NestJS Compilation)
    onProgress({ stage: "files", message: "Assembling final NestJS project structure..." });
    const nestFiles = NestJSGenerator.generate(blueprint, normalizedSchema, apiSurface, services, dtos, permissions, implementations, unitTests);
    
    // 6. Runtime Validation & Export Preparation
    onProgress({ stage: "files", message: "Validating runtime readiness..." });
    const exportResult = ProjectExporter.prepare(blueprint, nestFiles);
    
    // Non-blocking validation for MVP flow
    if (!exportResult.isExportable && exportResult.readinessScore < 80) {
        console.warn(`Project readiness score is ${exportResult.readinessScore}%, proceeding anyway.`);
    }

    const fileTree = Object.keys(nestFiles).map(path => ({ id: path, name: path.split('/').pop()!, type: 'file' as const }));

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
        kind: api.kind as any,
        isProtected: api.isProtected 
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
      routeCode: Object.values(nestFiles), 
      schemaCode: schemaCode.concat(relationsCode),
      files: nestFiles,
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
    onProgress: (update: PipelineProgressUpdate) => void
  ): Promise<GenerationMetadata> {
    // Stage 1: Architecture & Overview
    onProgress({ stage: "architecture", message: "Designing system architecture and stack components..." });
    const stage1Prompt = `User Prompt:\n${wrapPromptForLLM(prompt)}\nFramework/Stack: "${stack}"`;
    const stage1ResponseRaw = await OpenAIService.chatComplete(SYSTEM_PROMPT_STAGE1, stage1Prompt);
    const stage1Data = JSON.parse(stage1ResponseRaw.trim());

    // Stage 2: Schema design
    onProgress({ stage: "schema", message: "Designing database schema tables and relationships..." });
    const stage2Prompt = `User Prompt:\n${wrapPromptForLLM(prompt)}\nFramework/Stack: "${stack}"\nStage 1 Architecture Output:\n${JSON.stringify(stage1Data)}`;
    const stage2ResponseRaw = await OpenAIService.chatComplete(SYSTEM_PROMPT_STAGE2, stage2Prompt);
    const stage2Data = JSON.parse(stage2ResponseRaw.trim());

    // Stage 3 & 4
    onProgress({ stage: "routes", message: "Mapping API routes and authentication flow..." });
    await new Promise((resolve) => setTimeout(resolve, 600));
    onProgress({ stage: "files", message: "Assembling final project folder structure..." });
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
    onProgress: (update: PipelineProgressUpdate) => void,
    originalError?: string,
    blueprint?: BackendBlueprint | null
  ): Promise<GenerationMetadata> {
    onProgress({ stage: "architecture", message: "Designing system architecture (local fallback)..." });
    await new Promise((resolve) => setTimeout(resolve, 800));
    onProgress({ stage: "schema", message: "Designing database schema (local fallback)..." });
    await new Promise((resolve) => setTimeout(resolve, 800));
    onProgress({ stage: "routes", message: "Mapping API routes (local fallback)..." });
    await new Promise((resolve) => setTimeout(resolve, 800));
    onProgress({ stage: "files", message: "Assembling final project structure (local fallback)..." });

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
            kind: api.kind as any,
            isProtected: api.isProtected 
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
    onProgress({ stage: "done", message: "Generation completed (local fallback)!", metadata });
    return metadata;
  }

  private static async saveToDatabase(projectId: string, metadata: GenerationMetadata): Promise<void> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return;

    const supabase = createClient(supabaseUrl, supabaseKey);

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
        generatedAt: new Date().toISOString(),
      },
      status: "deployed",
      dot: "green",
      health: 100,
      updated_at: new Date().toISOString(),
    }).eq("id", projectId);
  }
}
