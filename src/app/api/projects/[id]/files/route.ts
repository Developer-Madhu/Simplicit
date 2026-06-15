import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * PATCH /api/projects/[id]/files
 * Persists an edited generated-backend file into generation_metadata.files[path].
 * Inert by design — no re-validation or pipeline re-run, just persistence.
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Next 15: params is async
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path, content } = await request.json().catch(() => ({}));
  if (typeof path !== "string" || typeof content !== "string") {
    return NextResponse.json({ error: "path and content are required" }, { status: 400 });
  }

  // Ownership is also enforced by RLS (the server client carries the user
  // session), but check explicitly so a non-owner gets 404 rather than a silent
  // no-op update.
  const { data: project } = await supabase
    .from("projects")
    .select("generation_metadata, user_id")
    .eq("id", id)
    .single();

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const metadata = (project.generation_metadata ?? {}) as Record<string, unknown>;
  const files = { ...((metadata.files as Record<string, string>) ?? {}), [path]: content };

  const { error } = await supabase
    .from("projects")
    .update({
      generation_metadata: { ...metadata, files },
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

/**
 * DELETE /api/projects/[id]/files
 * Removes a generated-backend file from generation_metadata.files[path].
 * Same auth/ownership pattern as PATCH above (authenticated cookie client +
 * explicit owner check) — not the service-role client.
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> } // Next 15: params is async
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { path } = await request.json().catch(() => ({}));
  if (typeof path !== "string" || !path) {
    return NextResponse.json({ error: "path required" }, { status: 400 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("generation_metadata, user_id")
    .eq("id", id)
    .single();

  if (!project || project.user_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const metadata = (project.generation_metadata ?? {}) as Record<string, unknown>;
  const files = { ...((metadata.files as Record<string, string>) ?? {}) };
  delete files[path];

  const { error } = await supabase
    .from("projects")
    .update({
      generation_metadata: { ...metadata, files },
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
