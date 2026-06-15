import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS entirely. SERVER-SIDE ONLY.
 *
 * Never import this in any file that could end up in a client bundle: the
 * service_role key grants unrestricted access to every row. It is used only for
 * pipeline persistence writes to a project row whose ownership was already
 * verified by the calling route handler (see /api/generate's owner gate).
 *
 * Canonical env var is SUPABASE_SERVICE_ROLE_KEY; SUPABASE_SERVICE_KEY is also
 * accepted (no NEXT_PUBLIC_ prefix on either — must stay server-only).
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase service role not configured: SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_KEY) missing from server env"
    );
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
