import { NextRequest, NextResponse } from "next/server";

/**
 * Phase 1a — GitHub OAuth initiation.
 * Redirects to GitHub's authorize screen with a CSRF state cookie that ALSO
 * remembers where the user started, so the callback returns them there.
 */
export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "GitHub OAuth not configured" }, { status: 500 });
  }

  // Random state value, validated in the callback to prevent CSRF.
  const state = crypto.randomUUID();

  // Remember the page the user came from (e.g. /workspace) so the callback can
  // send them back instead of dumping them on /dashboard. Same-origin only.
  let returnTo = "/workspace";
  const referer = request.headers.get("referer");
  if (referer) {
    try {
      const ref = new URL(referer);
      if (ref.origin === new URL(request.url).origin && ref.pathname.startsWith("/")) {
        returnTo = ref.pathname + ref.search;
      }
    } catch {
      // ignore a malformed referer — fall back to /workspace
    }
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: process.env.GITHUB_REDIRECT_URI!,
    scope: "repo read:user", // repo = read private repos; read:user = username
    state,
  });

  const response = NextResponse.redirect(
    `https://github.com/login/oauth/authorize?${params.toString()}`
  );

  // Store the state value AND the return path together in the httpOnly cookie.
  response.cookies.set("github_oauth_state", JSON.stringify({ state, returnTo }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return response;
}
