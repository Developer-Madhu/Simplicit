import type { GenerationMetadata } from "./types";

/**
 * Fallback Generator
 * Provides a minimal project structure when AI generation is unavailable.
 * No hardcoded Stripe/Redis/Lucia defaults.
 */
export class FallbackGenerator {
  public static generate(prompt: string, stack: string): GenerationMetadata {
    return {
      stackSummary: { 
        framework: stack,
        runtime: "Node.js",
        database: "PostgreSQL"
      },
      modules: [],
      apiRoutes: [],
      schemaTables: [],
      architectureNodes: [],
      architectureEdges: [],
      fileTree: [],
      routeCode: [],
      schemaCode: [],
      authStrategy: {
        providers: "Standard",
        sessions: "Standard",
        roles: "user",
        mfa: "None",
        rateLimit: "60 / min",
      },
      authFlowSteps: [],
      envVariables: [
        { k: "DATABASE_URL", v: "postgres://...", kind: "secret", note: "Primary Database" },
      ],
    };
  }
}
