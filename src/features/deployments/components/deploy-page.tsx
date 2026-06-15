"use client";

import { AppTopbar } from "@/features/shell";
import { useDisplayName } from "@/features/workspace/api/workspaces";

export function DeployPage() {
  const displayName = useDisplayName();
  return (
    <div
      className="sf-app"
      style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: "var(--sf-bg)" }}
    >
      <AppTopbar breadcrumbs={[displayName, "Deployments"]} />
      <main className="sf-scroll" style={{ flex: 1, overflowY: "auto" }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 24px",
            textAlign: "center",
            fontFamily: "var(--sf-font-sans)",
          }}
        >
          <p style={{ fontSize: "15px", marginBottom: "8px" }}>Deployment history</p>
          <p style={{ fontSize: "13px", opacity: 0.5, maxWidth: "400px" }}>
            Deploy your generated backends from inside the code editor. Your deployment history will appear here.
          </p>
        </div>
      </main>
    </div>
  );
}
