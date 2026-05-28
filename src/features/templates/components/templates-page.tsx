"use client";

import { Box, Globe, Layers as LayersIcon, Rocket, Server, Sparkles } from "lucide-react";
import { AppTopbar } from "@/features/shell";

const Icons = {
  Box,
  Globe,
  Layers: LayersIcon,
  Rocket,
  Server,
  Sparkle: Sparkles
} as const;

const templates = [
  { id: "t1", name: "SaaS Backend", desc: "Multi-tenant API, billing, RBAC, admin.", icon: "Box" as const, uses: 1284 },
  { id: "t2", name: "Marketplace", desc: "Two-sided listings, payments, escrow, search.", icon: "Globe" as const, uses: 612 },
  { id: "t3", name: "AI Product", desc: "Vector store, prompt logs, usage metering.", icon: "Sparkle" as const, uses: 901 },
  { id: "t4", name: "LMS", desc: "Courses, lessons, video, quizzes, certificates.", icon: "Layers" as const, uses: 305 },
  { id: "t5", name: "Exam System", desc: "Tests, proctoring, autograding, analytics.", icon: "Layers" as const, uses: 207 },
  { id: "t6", name: "Internal Tools API", desc: "Admin panels, audit logs, exports.", icon: "Server" as const, uses: 488 }
];

export function TemplatesPage() {
  return (
    <div className="sf-app" style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: "var(--sf-bg)" }}>
      <AppTopbar
        breadcrumbs={["Acme Studio", "Templates"]}
        actions={
          <button className="sf-btn sf-btn--primary sf-btn--sm" type="button">
            <Icons.Rocket size={11} style={{ marginRight: 4 }} /> Start from template
          </button>
        }
      />
      <main className="sf-scroll" style={{ flex: 1, overflowY: "auto", padding: 28 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--sf-text)", margin: 0 }}>Templates</h1>
          <p className="sf-muted" style={{ fontSize: 13.5, color: "var(--sf-text-muted)", marginTop: 6, marginBottom: 24 }}>
            Start from the same prebuilt backend shapes shown throughout the design system.
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
            {templates.map((template) => {
              const Ic = Icons[template.icon];
              return (
                <div key={template.id} className="sf-card" style={{ padding: 16, display: "flex", flexDirection: "column" }}>
                  <div className="sf-row" style={{ marginBottom: 14, alignItems: "center" }}>
                    <div
                      style={{
                        width: 30,
                        height: 30,
                        borderRadius: 8,
                        background: "var(--sf-surface-2)",
                        border: "1px solid var(--sf-border)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      <Ic size={13} style={{ color: "var(--sf-text)" }} />
                    </div>
                    <span className="sf-grow" />
                    <span className="sf-chip sf-chip-mono">{template.uses} uses</span>
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--sf-text)" }}>{template.name}</div>
                  <p className="sf-muted" style={{ fontSize: 12, color: "var(--sf-text-muted)", marginTop: 6, marginBottom: 16, lineHeight: 1.4, flex: 1 }}>
                    {template.desc}
                  </p>
                  <button className="sf-btn sf-btn--sm" style={{ width: "100%", justifyContent: "center" }} type="button">
                    Use template
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
