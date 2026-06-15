import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GenerationPipeline } from "@/features/generation/api/pipeline";
import { sanitizePrompt } from "@/lib/prompt-sanitizer";
import type { PipelineEvent, PipelineStage } from "@/features/generation/types/pipeline-events";
import { toSSELine } from "@/features/generation/types/pipeline-events";
import { translateError } from "@/features/generation/utils/error-translator";

// Simple in-memory per-user rate limiting.
// TODO: replace with Redis rate limiting for production (module Maps don't
// persist/coordinate across serverless instances).
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10; // max requests
const RATE_WINDOW_MS = 60000; // per 60 seconds

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true; // allowed
  }
  if (entry.count >= RATE_LIMIT) {
    return false; // blocked
  }
  entry.count++;
  return true; // allowed
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Per-user rate limiting (defense against credit-burning loops/abuse)
    if (!checkRateLimit(user.id)) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please wait a moment before generating again." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { projectId, prompt, stack, localMode, context, blueprint } = body;
    if (!projectId || !prompt || !stack) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Ownership gate (Phase I): the pipeline persists via a service-role client
    // that bypasses RLS, so we MUST confirm here that the authenticated user owns
    // this project before any write can be triggered. This `supabase` client is
    // the cookie-authenticated (RLS-protected) one — a project the user doesn't
    // own simply isn't visible to it, returning null → 404.
    const { data: ownedProject } = await supabase
      .from("projects")
      .select("user_id")
      .eq("id", projectId)
      .maybeSingle();
    if (!ownedProject || ownedProject.user_id !== user.id) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Server-side prompt sanitization (defense in depth — the client can be bypassed)
    const sanitized = sanitizePrompt(prompt);
    if (sanitized.blocked) {
      return new Response(JSON.stringify({ error: sanitized.reason }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const safePrompt = sanitized.clean;

    // ── SSE stream: typed PipelineEvent objects, emitted as the pipeline runs ──
    const encoder = new TextEncoder();
    let controller!: ReadableStreamDefaultController;
    const stream = new ReadableStream({
      start(c) {
        controller = c;
      },
    });

    const emit = (event: PipelineEvent) => {
      try {
        controller.enqueue(encoder.encode(toSSELine(event)));
      } catch {
        // Controller already closed — generation finished or client disconnected
      }
    };

    // Track the last stage the pipeline reported, so the top-level catch can
    // attribute a hard failure to the right stage.
    let currentStage: PipelineStage | undefined;
    const trackingEmit = (event: PipelineEvent) => {
      if (event.stage) currentStage = event.stage;
      emit(event);
    };

    const runPipeline = async () => {
      try {
        // Emit initial pending states for all stages
        const stages: PipelineStage[] = ["ARCHITECT", "GENERATOR", "SECURITY", "STABILITY", "TEST_WRITER", "SDK"];
        for (const stage of stages) {
          emit({ type: "stage_update", stage, status: "pending", message: "Waiting...", timestamp: Date.now() });
        }

        // If ingestion context is available, surface it as a progress event
        if (context) {
          emit({
            type: "progress",
            message: `Analyzed ${context.framework?.name || "Unknown"} project: ${context.routes?.length || 0} routes, ${context.fileTree?.length || 0} files`,
            timestamp: Date.now(),
          });
        }

        // Phase 4b: surface the persisted graph analytics from the ingestion
        // context to the pipeline. Threaded for future server-side use — not
        // yet consumed inside the pipeline (see Phase 4b notes).
        const graphAnalytics = context?.graphAnalytics ?? null;
        await GenerationPipeline.execute(projectId, safePrompt, stack, !!localMode, blueprint, trackingEmit, graphAnalytics);
      } catch (err) {
        // Pipeline threw (critical failure, not recoverable). The stage-level
        // try/catches already emitted stage errors; this is the top-level one.
        const userError = translateError(err, currentStage ?? "GENERATOR");
        emit({
          type: "error",
          message: userError.title,
          userError,
          timestamp: Date.now(),
        });
      } finally {
        controller.close();
      }
    };

    // Start the pipeline without awaiting — events stream as it runs.
    void runPipeline();

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no", // prevents Nginx from buffering SSE
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
