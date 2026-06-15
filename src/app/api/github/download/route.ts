import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Phase 2b — Download a repository as a zipball, server-side.
 * The GitHub token is read from Supabase (never from the client). Only the raw
 * zip bytes are returned to the client, which feeds them into processZipFile().
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: integration } = await supabase
    .from("user_integrations")
    .select("access_token")
    .eq("user_id", user.id)
    .eq("provider", "github")
    .maybeSingle();

  const token = integration?.access_token ?? null;
  if (!token) return NextResponse.json({ error: "GitHub not connected" }, { status: 401 });

  const { owner, repo, branch } = await request.json();
  if (!owner || !repo) {
    return NextResponse.json({ error: "Missing owner or repo" }, { status: 400 });
  }

  // GitHub zipball endpoint follows a redirect to the archive bytes.
  const ref = branch ? encodeURIComponent(branch) : "";
  const ghRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/zipball/${ref}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!ghRes.ok) {
    return NextResponse.json(
      { error: `GitHub zipball fetch failed: ${ghRes.status}` },
      { status: ghRes.status === 404 ? 404 : 502 }
    );
  }

  const zipBuffer = await ghRes.arrayBuffer();

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${repo}.zip"`,
    },
  });
}
