import { NextRequest } from "next/server";
import { resolveProvider } from "@/features/generation/api/llm-provider";
import { AnthropicService } from "@/features/generation/api/anthropic-service";
import { NvidiaService } from "@/features/generation/api/nvidia-service";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/ai/file
 * Server-side proxy for the IDE's Explain/Edit file actions. The browser cannot
 * call api.anthropic.com directly (CORS + no client key), so this route runs the
 * model server-side through the existing provider cascade (llm-provider.ts).
 *
 * Body: { action: "explain" | "edit", path, content, instruction? }
 * Returns: { result } on success, { error } otherwise.
 */
export async function POST(req: NextRequest) {
  // createClient() from @/lib/supabase/server is async — must await it.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { action, path, content, instruction } = await req.json().catch(() => ({}));
  if (!action || !content) {
    return Response.json({ error: "action and content required" }, { status: 400 });
  }

  let prompt: string;
  if (action === "explain") {
    prompt = `Explain what this file does in plain English. Be concise (3-5 sentences max). Focus on what it does functionally, not NestJS internals.\n\nFile: ${path}\n\n<file_content>\n${content}\n</file_content>`;
  } else if (action === "edit") {
    if (!instruction) {
      return Response.json({ error: "instruction required" }, { status: 400 });
    }
    prompt = `Edit this file according to the instruction. Return ONLY the complete updated file content, no explanation, no markdown fences.\n\nInstruction: ${instruction}\n\nFile: ${path}\n\n<file_content>\n${content}\n</file_content>`;
  } else {
    return Response.json({ error: "unknown action" }, { status: 400 });
  }

  try {
    // resolveProvider requires an agent name; this file action reuses the
    // generator agent's provider selection. It throws if no key is configured.
    const provider = resolveProvider("generator");
    const result =
      provider === "anthropic"
        ? await AnthropicService.chatComplete("You are a helpful coding assistant.", prompt, { max_tokens: 1000 })
        : await NvidiaService.chatComplete("You are a helpful coding assistant.", prompt, { max_tokens: 1000 });
    return Response.json({ result });
  } catch (err) {
    const message = err instanceof Error ? err.message : "AI call failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
