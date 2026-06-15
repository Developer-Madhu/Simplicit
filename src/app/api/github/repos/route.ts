import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Phase 2a — List the authenticated user's GitHub repositories.
 * Token is read server-side from Supabase; never accepted from the client.
 */
export async function GET(request: NextRequest) {
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

  if (!integration) {
    return NextResponse.json({ error: "GitHub not connected" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = searchParams.get("page") ?? "1";

  const response = await fetch(
    `https://api.github.com/user/repos?sort=updated&per_page=30&page=${page}&type=all`,
    {
      headers: {
        Authorization: `Bearer ${integration.access_token}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );

  const repos = await response.json();
  if (!Array.isArray(repos)) {
    // GitHub returns an error object (not an array) on failure.
    return NextResponse.json({ error: "Failed to fetch repositories" }, { status: 502 });
  }

  return NextResponse.json({
    repos: repos.map((r: any) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      private: r.private,
      description: r.description,
      language: r.language,
      updatedAt: r.updated_at,
      defaultBranch: r.default_branch,
      owner: r.owner.login,
    })),
  });
}
