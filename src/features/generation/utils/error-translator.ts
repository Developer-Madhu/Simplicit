import type { PipelineStage, UserFacingError } from "../types/pipeline-events";

/**
 * Translates every internal error into a UserFacingError.
 * No raw error messages ever reach the UI — the raw text only survives in
 * technicalDetail (rendered collapsed, opt-in).
 */
export function translateError(err: unknown, stage: PipelineStage): UserFacingError {
  const message = err instanceof Error ? err.message : String(err);
  return matchErrorToUserMessage(message, stage);
}

function matchErrorToUserMessage(message: string, stage: PipelineStage): UserFacingError {
  // ── TAGGED PIPELINE ERRORS (checked first — exact, authoritative) ────
  // ConflictError in this codebase = two auth systems requested at once.
  if (message.startsWith("ConflictError:")) {
    return {
      title: "Conflicting authentication systems",
      explanation:
        "Your project asks for two authentication systems at once (e.g. Supabase Auth and Lucia). A backend can only have one.",
      action: "Pick a single auth provider in your prompt or the stack wizard and re-run.",
      recoverable: false,
      stage: "ARCHITECT",
      technicalDetail: message,
    };
  }
  // KeyMissingError = the server has NEITHER provider key configured.
  if (message.startsWith("KeyMissingError:")) {
    return {
      title: "AI service not configured",
      explanation: "The generation service needs at least one AI provider configured.",
      action: "Add ANTHROPIC_API_KEY or NVIDIA_API_KEY to the server environment, or use local offline mode.",
      recoverable: false,
      stage,
      technicalDetail: message,
    };
  }
  if (message.startsWith("SecurityError:")) {
    const detail = message.replace("SecurityError:", "").trim();
    return {
      title: "Security issues found that need your attention",
      explanation: `The generated code has security problems that could not be fixed automatically: ${detail}`,
      action: "Review the security report in the editor. Fix the flagged issues before deploying.",
      recoverable: false,
      stage: "SECURITY",
      technicalDetail: message,
    };
  }
  if (message.startsWith("TestWriterError:")) {
    return {
      title: "Could not generate tests",
      explanation:
        "The test generator could not find the generated service files. The backend was still generated successfully.",
      action: "You can write tests manually or try re-running.",
      recoverable: true,
      stage: "TEST_WRITER",
      technicalDetail: message,
    };
  }
  if (message.startsWith("SDKError:")) {
    return {
      title: "Could not generate API client",
      explanation: "The SDK generator could not find any entities in the blueprint.",
      action: "Your backend was generated but without the api-client.ts file. Try re-running.",
      recoverable: true,
      stage: "SDK",
      technicalDetail: message,
    };
  }
  if (message.startsWith("GenerationError:")) {
    // Architect (the wizard's output) has already passed by the time a
    // GenerationError can fire, so don't send the user back to re-check wizard
    // answers — that's the wrong layer and wastes their time.
    return {
      title: "Backend generation failed",
      explanation: "The generator produced an incomplete backend for this project.",
      action:
        "Try re-running. If this keeps happening on this project, the project structure may have an edge case the generator doesn't handle yet.",
      recoverable: true,
      stage,
      technicalDetail: message,
    };
  }

  // ── AI SERVICE ERRORS ────────────────────────────────────────────────
  // NVIDIA NIM (Agent 2's optional code-gen provider) — rate limits, or a
  // model-not-found from a stale catalog name. NVIDIA is an implementation
  // detail of the GENERATOR stage, not a stage of its own, and it degrades to
  // the default provider, so this is always recoverable.
  if (message.includes("nvapi") || message.includes("integrate.api.nvidia.com")) {
    return {
      title: "Code generation provider issue",
      explanation: "The configured code-generation model is temporarily unavailable.",
      action:
        "Generation will retry using the default provider. If this persists, check NVIDIA_MODEL in server config.",
      recoverable: true,
      stage: "GENERATOR",
      technicalDetail: message,
    };
  }
  if (message.includes("rate_limit") || message.includes("429")) {
    return {
      title: "Generation limit reached",
      explanation: "The AI service is busy right now.",
      action: "Wait 30 seconds and try again. Your project is saved.",
      recoverable: true,
      stage,
      technicalDetail: message,
    };
  }
  if (message.includes("timeout") || message.includes("ETIMEDOUT") || message.includes("504")) {
    return {
      title: "AI took too long to respond",
      explanation: "The generation request timed out. This happens occasionally with large projects.",
      action: "Try again — it usually works on the second attempt.",
      recoverable: true,
      stage,
      technicalDetail: message,
    };
  }
  if (message.includes("401") || message.includes("invalid_api_key") || message.includes("authentication")) {
    return {
      title: "AI service authentication failed",
      explanation: "There is a configuration problem with the generation service.",
      action: "Contact support — this is not something you can fix from here.",
      recoverable: false,
      stage,
      technicalDetail: message,
    };
  }
  if (message.includes("overloaded") || message.includes("503")) {
    return {
      title: "AI service is temporarily unavailable",
      explanation: "The generation service is under high load.",
      action: "Wait 1-2 minutes and try again.",
      recoverable: true,
      stage,
      technicalDetail: message,
    };
  }

  // ── STABILITY ERRORS ─────────────────────────────────────────────────
  if (message.includes("TypeScript")) {
    return {
      title: "Generated code has type errors",
      explanation:
        "The code generator produced TypeScript that doesn't compile. This usually happens with unusual project structures.",
      action: "Try re-running. If it fails again, open an issue with your project structure.",
      recoverable: true,
      stage: "STABILITY",
      technicalDetail: message,
    };
  }
  if (message.includes("circular") || message.includes("CircularDependency")) {
    return {
      title: "Circular dependency in generated modules",
      explanation: "Two generated modules are referencing each other in a way that creates a loop.",
      action: "Try re-running. If this persists, your project may have an unusual entity structure.",
      recoverable: true,
      stage: "STABILITY",
      technicalDetail: message,
    };
  }

  // ── DEPLOY ERRORS ────────────────────────────────────────────────────
  if (message.includes("RAILWAY_TOKEN") || message.includes("deploy token")) {
    return {
      title: "Deploy token not configured",
      explanation: "You need a Railway API token to deploy from Simplicit.",
      action: "Go to Settings → Deploy and add your Railway API token.",
      recoverable: false,
      stage: "DEPLOY",
    };
  }
  if (message.includes("deploy") && message.includes("failed")) {
    return {
      title: "Deployment failed",
      explanation: "Railway accepted the code but the build failed.",
      action:
        "Check your Railway dashboard for build logs. The most common cause is a missing DATABASE_URL environment variable.",
      recoverable: false,
      stage: "DEPLOY",
      technicalDetail: message,
    };
  }

  // ── NETWORK ERRORS ───────────────────────────────────────────────────
  if (message.includes("ECONNRESET") || message.includes("ECONNREFUSED") || message.includes("fetch failed")) {
    return {
      title: "Connection lost",
      explanation: "The server lost its connection mid-generation.",
      action: "Check your internet connection and try again.",
      recoverable: true,
      stage,
      technicalDetail: message,
    };
  }

  // ── FALLBACK ─────────────────────────────────────────────────────────
  return {
    title: "Something went wrong",
    explanation: "An unexpected error occurred during the generation process.",
    action: "Try re-running. If this keeps happening, contact support.",
    recoverable: true,
    stage,
    technicalDetail: message,
  };
}
