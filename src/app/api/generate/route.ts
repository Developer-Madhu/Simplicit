import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GenerationPipeline } from "@/features/generation/api/pipeline";
import { sanitizePrompt } from "@/lib/prompt-sanitizer";

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

    // Server-side prompt sanitization (defense in depth — the client can be bypassed)
    const sanitized = sanitizePrompt(prompt);
    if (sanitized.blocked) {
      return new Response(JSON.stringify({ error: sanitized.reason }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    const safePrompt = sanitized.clean;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // If ingestion context is available, emit it as a stream event
          if (context) {
            const contextSummary = {
              stage: "context",
              framework: context.framework?.name || "Unknown",
              routes: context.routes?.length || 0,
              files: context.fileTree?.length || 0,
              integrations: context.metadata?.existingBackendIntegrations || [],
            };
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(contextSummary)}\n\n`)
            );
          }

          await GenerationPipeline.execute(projectId, safePrompt, stack, !!localMode, blueprint, (update) => {
            const dataStr = `data: ${JSON.stringify(update)}\n\n`;
            controller.enqueue(encoder.encode(dataStr));
          });
        } catch (err: any) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                stage: "error",
                message: "Pipeline execution failed",
                error: err.message || String(err),
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
