import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Phase 1b — GitHub OAuth callback.
 * Validates the CSRF state, exchanges the code for a token, fetches the GitHub
 * username, stores the token in Supabase, then returns the user to wherever they
 * started the flow (captured in the state cookie) — defaulting to /workspace.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");

  // Parse the state cookie: { state, returnTo }. Falls back to a plain string
  // (legacy) for storedState, and to /workspace if absent/corrupt.
  let storedState: string | undefined;
  let returnTo = "/workspace";
  const rawCookie = request.cookies.get("github_oauth_state")?.value;
  if (rawCookie) {
    try {
      const parsed = JSON.parse(rawCookie);
      storedState = parsed.state;
      if (typeof parsed.returnTo === "string" && parsed.returnTo.startsWith("/")) {
        returnTo = parsed.returnTo;
      }
    } catch {
      storedState = rawCookie;
    }
  }

  // Helper: redirect back to where the user started, appending a status param,
  // and clear the one-time state cookie.
  const redirectBack = (params: string) => {
    const sep = returnTo.includes("?") ? "&" : "?";
    const res = NextResponse.redirect(new URL(`${returnTo}${sep}${params}`, request.url));
    res.cookies.delete("github_oauth_state");
    return res;
  };

  // Validate state to prevent CSRF.
  if (!code || !state || state !== storedState) {
    return redirectBack("error=github_oauth_failed");
  }

  // Exchange code for an access token.
  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: process.env.GITHUB_REDIRECT_URI,
    }),
  });

  const tokenData = await tokenResponse.json();

  if (tokenData.error || !tokenData.access_token) {
    return redirectBack("error=github_token_failed");
  }

  // Fetch the GitHub username to display in the UI.
  const userResponse = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
    },
  });
  const githubUser = await userResponse.json();

  // Store the token in Supabase, linked to the current authenticated user.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    await supabase.from("user_integrations").upsert(
      {
        user_id: user.id,
        provider: "github",
        access_token: tokenData.access_token,
        github_username: githubUser.login,
        scopes: tokenData.scope,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,provider" }
    );
  }

  return redirectBack("github_connected=true");
}
