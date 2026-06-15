import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Deploy-token management (Railway/Render).
 * GET returns only which providers are configured — NEVER the tokens.
 * POST upserts a token (server-to-server only from this point on).
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data } = await supabase
    .from("user_deploy_settings")
    .select("provider, updated_at") // NEVER select api_token in GET
    .eq("user_id", user.id);

  return NextResponse.json({
    railway: data?.some((r) => r.provider === "railway") ?? false,
    render: data?.some((r) => r.provider === "render") ?? false,
  });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { provider, api_token } = await request.json();
  if (!provider || !api_token) {
    return NextResponse.json({ error: "provider and api_token required" }, { status: 400 });
  }
  if (!["railway", "render"].includes(provider)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 });
  }

  const { error } = await supabase.from("user_deploy_settings").upsert(
    { user_id: user.id, provider, api_token, updated_at: new Date().toISOString() },
    { onConflict: "user_id,provider" }
  );
  if (error) {
    return NextResponse.json({ error: "Failed to save deploy settings" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
