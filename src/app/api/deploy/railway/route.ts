import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service-role";
import type { PipelineEvent } from "@/features/generation/types/pipeline-events";
import { toSSELine } from "@/features/generation/types/pipeline-events";
import { translateError } from "@/features/generation/utils/error-translator";

/**
 * Deploy flow (Railway), streamed as SSE PipelineEvents — same pattern as
 * /api/generate. Both credentials are read server-side (GitHub token from
 * user_integrations, Railway token from user_deploy_settings); neither ever
 * reaches the client. The generated files are loaded from the project's
 * persisted generation_metadata rather than shipped from the client.
 *
 * Steps: create private GitHub repo → push files (Git Data API, one commit)
 * → Railway projectCreate → serviceCreate from the repo → serviceDomainCreate.
 */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Railway token from DB (never from client)
  const { data: settings } = await supabase
    .from("user_deploy_settings")
    .select("api_token")
    .eq("user_id", user.id)
    .eq("provider", "railway")
    .maybeSingle();

  if (!settings?.api_token) {
    return NextResponse.json(
      { error: "Railway deploy token not configured. Go to Settings → Deploy to add it." },
      { status: 400 }
    );
  }

  // GitHub token from user_integrations (same pattern as github/download)
  const { data: integration } = await supabase
    .from("user_integrations")
    .select("access_token, github_username")
    .eq("user_id", user.id)
    .eq("provider", "github")
    .maybeSingle();

  if (!integration?.access_token) {
    return NextResponse.json(
      { error: "GitHub account not connected. Connect GitHub to enable deployment." },
      { status: 400 }
    );
  }

  const body = await request.json();
  const { projectId, projectName } = body as { projectId?: string; projectName?: string };
  // Optional override (kept for API compatibility); the canonical source is the DB.
  let generatedFiles: Record<string, string> | null =
    body.generatedFiles && typeof body.generatedFiles === "object" ? body.generatedFiles : null;

  if (!generatedFiles) {
    if (!projectId) {
      return NextResponse.json({ error: "projectId is required" }, { status: 400 });
    }
    const { data: project } = await supabase
      .from("projects")
      .select("generation_metadata")
      .eq("id", projectId)
      .maybeSingle();
    generatedFiles = (project?.generation_metadata?.files as Record<string, string>) ?? null;
  }

  if (!generatedFiles || Object.keys(generatedFiles).length === 0) {
    return NextResponse.json(
      { error: "No generated files found for this project. Run a generation first." },
      { status: 400 }
    );
  }
  const files = generatedFiles;

  const encoder = new TextEncoder();
  let streamController!: ReadableStreamDefaultController;
  const stream = new ReadableStream({
    start(c) {
      streamController = c;
    },
  });

  const emit = (event: PipelineEvent) => {
    try {
      streamController.enqueue(encoder.encode(toSSELine(event)));
    } catch {
      /* stream closed */
    }
  };

  const deploy = async () => {
    try {
      emit({
        type: "deploy_update", stage: "DEPLOY", status: "running",
        message: "Creating GitHub repository...", timestamp: Date.now(),
      });

      // Step 1: Create a private GitHub repo
      const slug = (projectName || "app").toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "app";
      const repoName = `simplicit-${slug}-backend-${Date.now()}`;
      const repo = await createGitHubRepo(integration.access_token, repoName);

      emit({
        type: "deploy_update", stage: "DEPLOY", status: "running",
        message: `Pushing ${Object.keys(files).length} generated files to ${repo.full_name}...`,
        timestamp: Date.now(),
      });

      // Step 2: Push generated files (single commit via the Git Data API)
      await pushFilesToRepo(integration.access_token, repo.full_name, files);

      emit({
        type: "deploy_update", stage: "DEPLOY", status: "running",
        message: "Creating Railway project and service...", timestamp: Date.now(),
      });

      // Step 3: Railway project + service from the repo + public domain
      const deployment = await createRailwayProject(settings.api_token, repoName, repo.full_name);

      emit({
        type: "deploy_update", stage: "DEPLOY", status: "done",
        message: "Deployed — your backend is starting up",
        deployUrl: deployment.url,
        timestamp: Date.now(),
      });

      // Persist deploy URL so it survives page refresh. Non-fatal: the SSE done
      // event already reached the client, so a DB hiccup must not fail the deploy.
      if (projectId) {
        try {
          const db = createServiceRoleClient();
          const { data: existing } = await db
            .from("projects")
            .select("generation_metadata")
            .eq("id", projectId)
            .single();

          await db
            .from("projects")
            .update({
              generation_metadata: {
                ...(existing?.generation_metadata ?? {}),
                deployUrl: deployment.url,
                deployedAt: new Date().toISOString(),
              },
              status: "deployed",
            })
            .eq("id", projectId);
        } catch (dbErr) {
          console.error("Failed to persist deploy URL:", dbErr);
        }
      }
    } catch (err) {
      const userError = translateError(err, "DEPLOY");
      emit({
        type: "stage_update", stage: "DEPLOY", status: "error",
        message: userError.title, userError, timestamp: Date.now(),
      });
    } finally {
      streamController.close();
    }
  };

  void deploy();

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// ── GitHub helpers ─────────────────────────────────────────────────────

async function createGitHubRepo(token: string, repoName: string): Promise<{ full_name: string; html_url: string }> {
  const res = await fetch("https://api.github.com/user/repos", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/vnd.github.v3+json",
    },
    body: JSON.stringify({
      name: repoName,
      private: true,
      description: "Generated by Simplicit",
      auto_init: false,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Deploy failed — GitHub repo creation: ${err.message ?? res.statusText}`);
  }
  return res.json();
}

/**
 * Pushes all files as ONE commit using the Git Data API:
 * blobs → tree → commit (no parents — the repo is empty) → refs/heads/main.
 */
async function pushFilesToRepo(token: string, fullName: string, files: Record<string, string>) {
  const base = `https://api.github.com/repos/${fullName}`;
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    Accept: "application/vnd.github.v3+json",
  };

  // Create blobs with bounded concurrency (file maps run 30-60 entries).
  const entries = Object.entries(files);
  const blobs: { path: string; sha: string }[] = [];
  const CHUNK = 8;
  for (let i = 0; i < entries.length; i += CHUNK) {
    const chunk = entries.slice(i, i + CHUNK);
    const results = await Promise.all(
      chunk.map(async ([path, content]) => {
        const blobRes = await fetch(`${base}/git/blobs`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            content: Buffer.from(content ?? "", "utf8").toString("base64"),
            encoding: "base64",
          }),
        });
        if (!blobRes.ok) throw new Error(`Deploy failed — could not upload ${path} to GitHub`);
        const blob = await blobRes.json();
        return { path, sha: blob.sha as string };
      })
    );
    blobs.push(...results);
  }

  const treeRes = await fetch(`${base}/git/trees`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      tree: blobs.map((b) => ({ path: b.path, mode: "100644", type: "blob", sha: b.sha })),
    }),
  });
  if (!treeRes.ok) throw new Error("Deploy failed — could not create the git tree on GitHub");
  const tree = await treeRes.json();

  const commitRes = await fetch(`${base}/git/commits`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      message: "feat: generated backend from Simplicit",
      tree: tree.sha,
      parents: [], // first commit — empty repo
    }),
  });
  if (!commitRes.ok) throw new Error("Deploy failed — could not create the initial commit on GitHub");
  const commit = await commitRes.json();

  const refRes = await fetch(`${base}/git/refs`, {
    method: "POST",
    headers,
    body: JSON.stringify({ ref: "refs/heads/main", sha: commit.sha }),
  });
  if (!refRes.ok) throw new Error("Deploy failed — could not create the main branch on GitHub");
}

// ── Railway helpers (GraphQL v2 — docs.railway.com/integrations/api) ──

const RAILWAY_ENDPOINT = "https://backboard.railway.com/graphql/v2";

async function railwayGql<T>(token: string, query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(RAILWAY_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    if (res.status === 401 || res.status === 403) {
      throw new Error("Deploy failed — Railway rejected the API token (RAILWAY_TOKEN invalid or expired)");
    }
    throw new Error(`Deploy failed — Railway API returned status ${res.status}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(`Deploy failed — Railway API: ${json.errors[0]?.message ?? "unknown GraphQL error"}`);
  }
  return json.data as T;
}

/**
 * projectCreate → environments(projectId) → serviceCreate(source.repo)
 * → serviceDomainCreate. Creating a service from a GitHub source triggers
 * the initial build automatically.
 */
async function createRailwayProject(
  railwayToken: string,
  projectName: string,
  repoFullName: string
): Promise<{ url: string }> {
  const project = await railwayGql<{ projectCreate: { id: string } }>(
    railwayToken,
    `mutation projectCreate($input: ProjectCreateInput!) {
      projectCreate(input: $input) { id name }
    }`,
    { input: { name: projectName } }
  );
  const railwayProjectId = project.projectCreate.id;

  const envs = await railwayGql<{ environments: { edges: Array<{ node: { id: string; name: string } }> } }>(
    railwayToken,
    `query environments($projectId: String!) {
      environments(projectId: $projectId) { edges { node { id name } } }
    }`,
    { projectId: railwayProjectId }
  );
  const environmentId =
    envs.environments.edges.find((e) => e.node.name === "production")?.node.id ??
    envs.environments.edges[0]?.node.id;
  if (!environmentId) {
    throw new Error("Deploy failed — the Railway project has no environment");
  }

  const service = await railwayGql<{ serviceCreate: { id: string } }>(
    railwayToken,
    `mutation serviceCreate($input: ServiceCreateInput!) {
      serviceCreate(input: $input) { id name }
    }`,
    { input: { projectId: railwayProjectId, name: projectName, source: { repo: repoFullName }, branch: "main" } }
  );
  const serviceId = service.serviceCreate.id;

  const domain = await railwayGql<{ serviceDomainCreate: { domain: string } }>(
    railwayToken,
    `mutation serviceDomainCreate($input: ServiceDomainCreateInput!) {
      serviceDomainCreate(input: $input) { domain }
    }`,
    { input: { serviceId, environmentId, targetPort: 3000 } }
  );

  return { url: `https://${domain.serviceDomainCreate.domain}` };
}
