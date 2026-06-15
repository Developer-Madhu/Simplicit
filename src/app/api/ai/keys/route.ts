import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * /api/ai/keys — user-supplied AI provider keys (BYOK), storage only.
 *
 * SECURITY: api_key is write-only. GET NEVER selects or returns it — only the
 * provider, timestamps, and boolean "configured" flags. The stored key is kept
 * for future server-side use; it is never sent back to the client.
 */

const VALID_PROVIDERS = ["anthropic", "nvidia"] as const;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("user_ai_keys")
    .select("provider, created_at, updated_at") // NEVER select api_key
    .eq("user_id", user.id);

  return Response.json({
    keys: data ?? [],
    // Which providers are configured — booleans only, never the keys.
    anthropic: data?.some((k) => k.provider === "anthropic") ?? false,
    nvidia: data?.some((k) => k.provider === "nvidia") ?? false,
  });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { provider, api_key } = await req.json().catch(() => ({}));
  if (!provider || !api_key) {
    return Response.json({ error: "provider and api_key required" }, { status: 400 });
  }
  if (!VALID_PROVIDERS.includes(provider)) {
    return Response.json({ error: "Invalid provider" }, { status: 400 });
  }

  const { error } = await supabase
    .from("user_ai_keys")
    .upsert({ user_id: user.id, provider, api_key }, { onConflict: "user_id,provider" });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
