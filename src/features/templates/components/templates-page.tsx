"use client";

import { AppTopbar } from "@/features/shell";
import { useDisplayName } from "@/features/workspace/api/workspaces";

export function TemplatesPage() {
  const displayName = useDisplayName();
  return (
    <div className="sf-app" style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: "var(--sf-bg)" }}>
      <AppTopbar breadcrumbs={[displayName, "Templates"]} />
      <main className="sf-scroll" style={{ flex: 1, overflowY: "auto", padding: 28 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--sf-text)", margin: 0 }}>Templates</h1>
          <p className="sf-muted" style={{ fontSize: 13.5, color: "var(--sf-text-muted)", marginTop: 6, marginBottom: 24 }}>
            Start from prebuilt backend shapes for common use cases.
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "80px 24px",
              textAlign: "center",
              opacity: 0.5,
              fontFamily: "var(--sf-font-sans)",
            }}
          >
            <p style={{ fontSize: "15px", marginBottom: "8px" }}>Templates coming soon</p>
            <p style={{ fontSize: "13px" }}>
              Pre-built backend templates for common use cases will appear here.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
