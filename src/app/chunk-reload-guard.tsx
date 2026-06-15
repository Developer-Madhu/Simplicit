"use client";

import { useEffect } from "react";

/**
 * ChunkReloadGuard
 * ----------------
 * Recovers from Next.js "ChunkLoadError" / "Loading chunk … failed" — which
 * happen when the browser is running an old build (after a dev restart or a
 * production redeploy) and requests a lazy chunk whose hash no longer exists.
 *
 * On such an error it performs a single page reload to fetch the current
 * build. A short one-shot guard (sessionStorage) prevents reload loops while
 * still allowing recovery from a *later* failed chunk in the same session.
 *
 * Renders nothing and touches no app state — safe to mount anywhere.
 */

const FLAG = "sf-chunk-reloaded";
const CHUNK_ERROR =
  /Loading chunk [\w./-]+ failed|ChunkLoadError|error loading dynamically imported module|Failed to fetch dynamically imported module/i;

export function ChunkReloadGuard() {
  useEffect(() => {
    // Clear the one-shot guard once the page has proven stable, so a future
    // failed chunk can recover again. Rapid loops are still prevented because
    // an immediate re-error fires while the flag is still set.
    const clearTimer = window.setTimeout(() => {
      try {
        sessionStorage.removeItem(FLAG);
      } catch {
        /* sessionStorage unavailable — ignore */
      }
    }, 5000);

    const recover = (msg?: string) => {
      if (!msg || !CHUNK_ERROR.test(msg)) return;
      try {
        if (sessionStorage.getItem(FLAG)) return; // already attempted once
        sessionStorage.setItem(FLAG, "1");
      } catch {
        /* sessionStorage unavailable — still attempt one reload */
      }
      window.location.reload();
    };

    const onError = (e: ErrorEvent) => {
      // Resource (img/script tag) errors have no message — ignored by the guard.
      recover(e?.message || (e?.error as Error | undefined)?.message);
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      const reason = e?.reason as unknown;
      // Strings and Errors are straightforward. But some APIs (resource loads,
      // WebSocket/XHR, media, WASM/emscripten loaders) reject with a DOM Event,
      // which has no `.message` — Next's dev overlay then renders the opaque
      // "[object Event]". Synthesize a readable message from the Event so the
      // chunk-error detector can still match, and log what actually failed so
      // it's debuggable instead of anonymous.
      let message: string | undefined;
      if (typeof reason === "string") {
        message = reason;
      } else if (typeof Event !== "undefined" && reason instanceof Event) {
        const target = reason.target as (Element & { src?: string; href?: string; url?: string }) | null;
        const where = target
          ? `${target.tagName ?? target.constructor?.name ?? "?"}` +
            `${target.src ? ` src=${target.src}` : ""}` +
            `${target.href ? ` href=${target.href}` : ""}` +
            `${target.url ? ` url=${target.url}` : ""}`
          : "unknown target";
        message = `${reason.type} event from ${where}`;
        console.warn(`[unhandledrejection] DOM Event reason — ${message}`, reason);
      } else {
        message = (reason as Error | undefined)?.message;
      }
      recover(message);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.clearTimeout(clearTimer);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
