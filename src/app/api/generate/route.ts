import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { GenerationPipeline } from "@/features/generation/api/pipeline";

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

    const body = await req.json();
    const { projectId, prompt, stack, localMode, context } = body;
    if (!projectId || !prompt || !stack) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

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

          await GenerationPipeline.execute(projectId, prompt, stack, !!localMode, (update) => {
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
