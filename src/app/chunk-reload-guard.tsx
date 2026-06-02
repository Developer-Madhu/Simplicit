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
      recover(typeof reason === "string" ? reason : (reason as Error | undefined)?.message);
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
