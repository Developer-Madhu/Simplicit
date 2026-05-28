import { OpenAIService } from "./openai";
import { SYSTEM_PROMPT_STAGE1, SYSTEM_PROMPT_STAGE2 } from "./prompts";
import { FallbackGenerator } from "./fallback";
import type { GenerationMetadata } from "./types";
import { createClient } from "@supabase/supabase-js";
import { SchemaParser } from "./schema-parser";
import { APIGenerator } from "./api-generator";

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
    onProgress: (update: PipelineProgressUpdate) => void
  ): Promise<GenerationMetadata> {
    const isApiKeyConfigured = !!process.env.OPENAI_API_KEY;

    try {
      const promptLower = prompt.toLowerCase();
      if (promptLower.includes("supabase") && promptLower.includes("lucia")) {
        throw new Error("ConflictError: Cannot reconcile using both Supabase Auth and Lucia Auth in the same project context.");
      }

      if (localMode) {
        return await this.runFallback(projectId, prompt, stack, onProgress);
      }

      // 1. Initial Analyzing Stage
      onProgress({ stage: "analyzing", message: "Analyzing system requirements..." });
      await new Promise((resolve) => setTimeout(resolve, 800)); // micro-delay for realistic UI transition

      if (!isApiKeyConfigured) {
        throw new Error("KeyMissingError: OpenAI API key is missing. Please configure OPENAI_API_KEY or run in local offline mode.");
      }

      // 2. Stage 1: Architecture & Overview
      onProgress({ stage: "architecture", message: "Designing system architecture and stack components..." });
      const stage1Prompt = `User Prompt: "${prompt}"\nFramework/Stack: "${stack}"`;
      const stage1ResponseRaw = await OpenAIService.chatComplete(SYSTEM_PROMPT_STAGE1, stage1Prompt);
      const stage1Data = JSON.parse(stage1ResponseRaw.trim());

      // 3. Stage 2: Schema design
      onProgress({ stage: "schema", message: "Designing database schema tables and relationships..." });
      const stage2Prompt = `User Prompt: "${prompt}"\nFramework/Stack: "${stack}"\nStage 1 Architecture Output:\n${JSON.stringify(stage1Data)}`;
      const stage2ResponseRaw = await OpenAIService.chatComplete(SYSTEM_PROMPT_STAGE2, stage2Prompt);
      const stage2Data = JSON.parse(stage2ResponseRaw.trim());

      // 4. Stage 3: Routing & Auth
      onProgress({ stage: "routes", message: "Mapping API routes and authentication flow..." });
      await new Promise((resolve) => setTimeout(resolve, 600));

      // 5. Stage 4: Preparing outputs & compiling files
      onProgress({ stage: "files", message: "Assembling final project folder structure..." });
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Consolidated metadata structure
      const schemaTables = stage2Data.schemaTables || [];
      const schemaCode = stage2Data.schemaCode || [];
      const normalizedSchema = SchemaParser.parse(schemaCode, schemaTables);

      const rawApiRoutes = stage1Data.apiRoutes || [];
      const apiRoutes = APIGenerator.enrich(rawApiRoutes, normalizedSchema);

      const metadata: GenerationMetadata = {
        stackSummary: stage1Data.stackSummary || {},
        modules: stage1Data.modules || [],
        apiRoutes,
        schemaTables,
        architectureNodes: stage1Data.architectureNodes || [],
        architectureEdges: stage1Data.architectureEdges || [],
        fileTree: stage2Data.fileTree || [],
        routeCode: stage2Data.routeCode || [],
        schemaCode,
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

      // Persistence
      await this.saveToDatabase(projectId, metadata);

      onProgress({ stage: "done", message: "Generation completed successfully!", metadata });
      return metadata;
    } catch (error: any) {
      if (error.message.startsWith("ConflictError") || error.message.startsWith("KeyMissingError")) {
        throw error;
      }
      // AI pipeline error. Running fallback...
      // If OpenAI rate limit, API key failure, timeout, or json parsing error occurred, fall back to fallback generator
      return await this.runFallback(projectId, prompt, stack, onProgress, error.message);
    }
  }

  private static async runFallback(
    projectId: string,
    prompt: string,
    stack: string,
    onProgress: (update: PipelineProgressUpdate) => void,
    originalError?: string
  ): Promise<GenerationMetadata> {
    // Progress simulations for the fallback so it feels realistic
    onProgress({ stage: "architecture", message: "Designing system architecture and stack components (local)..." });
    await new Promise((resolve) => setTimeout(resolve, 1000));

    onProgress({ stage: "schema", message: "Designing database schema tables and relationships (local)..." });
    await new Promise((resolve) => setTimeout(resolve, 1200));

    onProgress({ stage: "routes", message: "Mapping API routes and authentication flow (local)..." });
    await new Promise((resolve) => setTimeout(resolve, 900));

    onProgress({ stage: "files", message: "Assembling final project folder structure (local)..." });
    await new Promise((resolve) => setTimeout(resolve, 700));

    const metadata = FallbackGenerator.generate(prompt, stack);

    // Compile normalized schema and enrich APIs for fallback
    try {
      metadata.normalizedSchema = SchemaParser.parse(metadata.schemaCode, metadata.schemaTables);
      metadata.apiRoutes = APIGenerator.enrich(metadata.apiRoutes, metadata.normalizedSchema);
    } catch (e) {
      // Failed to parse fallback schema or enrich APIs
    }

    // Save fallback metadata to DB
    await this.saveToDatabase(projectId, metadata);

    onProgress({ stage: "done", message: "Generation completed successfully (local)!", metadata });
    return metadata;
  }

  private static async saveToDatabase(projectId: string, metadata: GenerationMetadata): Promise<void> {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      console.warn("Supabase credentials missing, skipping persistence");
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { error } = await supabase
      .from("projects")
      .update({
        generation_metadata: metadata,
        status: "deployed",
        dot: "green",
        health: 100,
        updated_at: new Date().toISOString(),
      })
      .eq("id", projectId);

    if (error) {
      console.error("Failed to persist generation metadata to database:", error);
      throw error;
    }
  }
}
