"use client";

import { useState } from "react";
import {
  Check,
  ArrowRight,
  X as XIcon,
  AlertTriangle,
  Github,
  Database,
  Rocket,
  Cloud,
  Zap,
  Bell,
  Lock,
  Globe,
  FileText,
  Cylinder,
  HardDrive
} from "lucide-react";

import { AppTopbar } from "@/features/shell";
import { useDisplayName } from "@/features/workspace/api/workspaces";
import styles from "./deploy-page.module.css";

const Icons = {
  Check,
  ArrowRight,
  X: XIcon,
  AlertTriangle,
  Github,
  Database,
  Rocket,
  Cloud,
  Zap,
  Bell,
  Lock,
  Globe,
  FileText,
  Cylinder,
  HardDrive
} as const;

function ArchNode({
  kind,
  title,
  subtitle,
  accent = "blue",
  icon
}: {
  kind: string;
  title: string;
  subtitle?: string;
  accent?: string;
  icon: keyof typeof Icons;
}) {
  const Ic = Icons[icon] || Icons.Database;
  return (
    <div
      style={{
        position: "absolute",
        width: 160,
        height: 64,
        background: "var(--sf-surface)",
        border: "1px solid var(--sf-border-strong)",
        borderRadius: 10,
        padding: "8px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
        userSelect: "none"
      }}
    >
      <div className="sf-row" style={{ gap: 6, alignItems: "center" }}>
        <Ic size={12} className="text-muted" style={{ color: "var(--sf-text-muted)" }} />
        <span className="mono" style={{ fontSize: 10, color: "var(--sf-text-faint)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {kind}
        </span>
        <span className="sf-grow" />
        <span className={`sf-dot sf-dot--${accent}`} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2, color: "var(--sf-text)" }}>{title}</div>
      {subtitle && <div className="mono" style={{ fontSize: 10.5, color: "var(--sf-text-muted)" }}>{subtitle}</div>}
    </div>
  );
}

const STEPS = [
  { n: 1, t: "Review", d: "Architecture & modules" },
  { n: 2, t: "Environment", d: "Validate variables" },
  { n: 3, t: "Integrations", d: "Connect services" },
  { n: 4, t: "Repository", d: "GitHub destination" },
  { n: 5, t: "Deploy", d: "Push & build" }
];

export function DeployPage() {
  const [step, setStep] = useState(2);
  const displayName = useDisplayName();

  return (
    <div className={`sf-app ${styles.root}`} style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: "var(--sf-bg)" }}>
      <AppTopbar
        breadcrumbs={[displayName, "Examly API", "Deploy"]}
        actions={
          <button className="sf-btn sf-btn--sm" onClick={() => setStep(1)}>
            <Icons.X size={11} /> Cancel
          </button>
        }
      />

      <div className={`sf-grow ${styles.body}`}>
        {/* Step rail */}
        <aside className={styles.rail}>
          <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--sf-text-faint)" }}>
            Deployment wizard
          </span>
          <h2 style={{ fontSize: 20, fontWeight: 500, letterSpacing: "-0.02em", margin: "8px 0 22px", color: "var(--sf-text)" }}>
            Current Project
          </h2>

          <div className="sf-col" style={{ gap: 0 }}>
            {STEPS.map((s, i) => {
              const done = s.n < step;
              const current = s.n === step;
              return (
                <div
                  key={s.n}
                  className="sf-row"
                  style={{
                    alignItems: "flex-start",
                    gap: 12,
                    padding: "12px 0",
                    opacity: !done && !current && s.n > step ? 0.55 : 1
                  }}
                >
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: "0 0 auto" }}>
                    <div
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 999,
                        background: done ? "var(--sf-text)" : "transparent",
                        border: current ? "1.5px solid var(--sf-text)" : done ? "none" : "1.5px solid var(--sf-border-strong)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: "0 0 auto"
                      }}
                    >
                      {done ? (
                        <Icons.Check size={11} style={{ color: "var(--sf-bg)" }} />
                      ) : (
                        <span className="mono" style={{ fontSize: 10.5, color: current ? "var(--sf-text)" : "var(--sf-text-muted)" }}>
                          {s.n}
                        </span>
                      )}
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        style={{
                          width: 1.5,
                          flex: 1,
                          background: done ? "var(--sf-text)" : "var(--sf-border)",
                          minHeight: 24,
                          marginTop: 4
                        }}
                      />
                    )}
                  </div>
                  <div style={{ paddingBottom: 12 }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: current ? 500 : 400,
                        color: done || current ? "var(--sf-text)" : "var(--sf-text-muted)"
                      }}
                    >
                      {s.t}
                    </div>
                    <div className="sf-faint" style={{ fontSize: 11.5, marginTop: 2, color: "var(--sf-text-faint)" }}>
                      {s.d}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </aside>

        {/* Step body */}
        <main className="sf-grow sf-scroll" style={{ overflowY: "auto", padding: 40 }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            {step === 1 && <ReviewStep />}
            {step === 2 && <EnvStep />}
            {step === 3 && <IntegrationsStep />}
            {step === 4 && <RepoStep />}
            {step === 5 && <DeployStep />}

            <div className="sf-row" style={{ marginTop: 40, paddingTop: 22, borderTop: "1px solid var(--sf-border)", gap: 8, alignItems: "center" }}>
              <button onClick={() => setStep((s) => Math.max(1, s - 1))} className="sf-btn" type="button">
                ← Back
              </button>
              <span className="sf-grow" />
              <span className="sf-muted" style={{ fontSize: 12.5, color: "var(--sf-text-muted)" }}>
                Step {step} of {STEPS.length}
              </span>
              <button
                onClick={() => setStep((s) => Math.min(STEPS.length, s + 1))}
                className="sf-btn sf-btn--primary"
                type="button"
              >
                {step === STEPS.length ? "Done" : "Continue"}{" "}
                <Icons.ArrowRight size={11} style={{ marginLeft: 4 }} />
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function StepHead({ title, subtitle, eyebrow }: { title: string; subtitle: string; eyebrow?: string }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {eyebrow && (
        <div
          className="mono"
          style={{
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--sf-text-faint)",
            marginBottom: 8
          }}
        >
          {eyebrow}
        </div>
      )}
      <h2 style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em", margin: 0, color: "var(--sf-text)" }}>
        {title}
      </h2>
      {subtitle && (
        <p className="sf-muted" style={{ fontSize: 14, marginTop: 8, color: "var(--sf-text-muted)" }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

function ReviewStep() {
  return (
    <>
      <StepHead eyebrow="Step 01" title="Review architecture" subtitle="One last look before we ship." />
      <div
        className="sf-card sf-linegrid"
        style={{
          height: 320,
          position: "relative",
          overflow: "hidden",
          marginBottom: 18,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span className="sf-muted">Architecture Preview Unavailable</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 10 }}>
        {[
          ["—", "Modules"],
          ["—", "Tables"],
          ["—", "Routes"]
        ].map(([v, l]) => (
          <div key={l} className="sf-card" style={{ padding: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 500, color: "var(--sf-text)" }}>{v}</div>
            <div className="sf-faint" style={{ fontSize: 11.5, color: "var(--sf-text-faint)" }}>
              {l}
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function EnvStep() {
  const rows = [
    { k: "DATABASE_URL", v: "postgres://…", status: "ok", provider: "Neon Postgres" },
    { k: "REDIS_URL", v: "redis://…", status: "ok", provider: "Upstash" },
    { k: "AUTH_SECRET", v: "auto · 32 bytes", status: "ok", provider: "Generated" },
    { k: "STRIPE_SECRET_KEY", v: "sk_live_••••", status: "ok", provider: "Stripe" },
    { k: "STRIPE_WEBHOOK_SECRET", v: "— missing —", status: "missing", provider: "" },
    { k: "S3_BUCKET", v: "project-storage", status: "ok", provider: "Cloudflare R2" },
    { k: "RESEND_API_KEY", v: "re_••••", status: "ok", provider: "Resend" },
    { k: "OAUTH_GOOGLE_ID", v: "— optional —", status: "opt", provider: "" }
  ];
  return (
    <>
      <StepHead
        eyebrow="Step 02"
        title="Configure environment"
        subtitle="Simplicit inferred reasonable defaults — fill in anything that's missing."
      />
      <div className="sf-card" style={{ padding: 0, overflow: "hidden" }}>
        {rows.map((r, i) => (
          <div
            key={r.k}
            className={styles.envRow}
            style={{
              padding: "12px 16px",
              borderBottom: i < rows.length - 1 ? "1px solid var(--sf-border)" : "none",
            }}
          >
            <span className={`mono ${styles.envKey}`} style={{ fontSize: 12, color: "var(--sf-text)" }}>
              {r.k}
            </span>
            <span
              className={`mono ${styles.envValue}`}
              style={{
                fontSize: 11.5,
                color: r.status === "missing" ? "var(--sf-red)" : "var(--sf-text-muted)"
              }}
            >
              {r.v}
            </span>
            {r.provider && <span className="sf-chip">{r.provider}</span>}
            {r.status === "ok" && (
              <span className="sf-chip" style={{ color: "var(--sf-green)" }}>
                <span className="sf-dot sf-dot--green" style={{ marginRight: 6 }} />
                ready
              </span>
            )}
            {r.status === "missing" && (
              <button className="sf-btn sf-btn--primary sf-btn--sm" type="button">
                Set
              </button>
            )}
            {r.status === "opt" && <span className="sf-chip">optional</span>}
          </div>
        ))}
      </div>
      <div className="sf-card" style={{ marginTop: 16, padding: 14, background: "var(--sf-surface)" }}>
        <div className="sf-row" style={{ gap: 10, alignItems: "center" }}>
          <Icons.AlertTriangle size={14} style={{ color: "var(--sf-amber)" }} />
          <span style={{ fontSize: 13, color: "var(--sf-text)" }}>1 variable missing</span>
          <span className="sf-grow" />
          <button className="sf-btn sf-btn--sm" type="button">
            Fix all with defaults
          </button>
        </div>
      </div>
    </>
  );
}

function IntegrationsStep() {
  const items = [
    { ic: "Github" as const, t: "GitHub", s: "connected · acme-studio", btn: null },
    { ic: "Database" as const, t: "Neon Postgres", s: "will create new database", btn: "Configure" },
    { ic: "Rocket" as const, t: "Railway", s: "will deploy 2 services", btn: "Configure" },
    { ic: "Cloud" as const, t: "Cloudflare R2", s: "will create bucket: examly-attempts", btn: null },
    { ic: "Zap" as const, t: "Stripe", s: "connected · live mode", btn: null },
    { ic: "Bell" as const, t: "Resend (email)", s: "connected", btn: null }
  ];

  return (
    <>
      <StepHead
        eyebrow="Step 03"
        title="Connect integrations"
        subtitle="Simplicit will provision these resources alongside your deployment."
      />
      <div className="sf-col" style={{ gap: 10 }}>
        {items.map((it) => {
          const Ic = Icons[it.ic];
          return (
            <div key={it.t} className="sf-card" style={{ padding: 14 }}>
              <div className="sf-row" style={{ gap: 12, alignItems: "center" }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 8,
                    background: "var(--sf-surface-2)",
                    border: "1px solid var(--sf-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Ic size={14} style={{ color: "var(--sf-text)" }} />
                </div>
                <div className="sf-grow">
                  <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--sf-text)" }}>{it.t}</div>
                  <div className="sf-faint" style={{ fontSize: 11.5, color: "var(--sf-text-faint)" }}>
                    {it.s}
                  </div>
                </div>
                <span className="sf-chip">
                  <span className="sf-dot sf-dot--green" style={{ marginRight: 6 }} /> ready
                </span>
                {it.btn && (
                  <button className="sf-btn sf-btn--sm" type="button">
                    {it.btn}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function FormRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="sf-row" style={{ marginBottom: 6, alignItems: "center" }}>
        <label style={{ fontSize: 12.5, color: "var(--sf-text-muted)" }}>{label}</label>
        <span className="sf-grow" />
        {hint && (
          <span className="sf-faint" style={{ fontSize: 11, color: "var(--sf-text-faint)" }}>
            {hint}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function Toggle2({ on: initialOn = false }: { on?: boolean }) {
  const [on, setOn] = useState(initialOn);
  return (
    <div
      onClick={() => setOn(!on)}
      style={{
        width: 30,
        height: 18,
        borderRadius: 999,
        background: on ? "var(--sf-text)" : "rgba(255,255,255,0.10)",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.2s"
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: on ? 14 : 2,
          width: 14,
          height: 14,
          borderRadius: 999,
          background: on ? "var(--sf-bg)" : "var(--sf-text)",
          transition: "left 0.2s"
        }}
      />
    </div>
  );
}

function RepoStep() {
  return (
    <>
      <StepHead
        eyebrow="Step 04"
        title="Push to GitHub"
        subtitle="We'll create a new repository under your account and push the generated code."
      />
      <div className="sf-card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="sf-row" style={{ gap: 12, marginBottom: 16, alignItems: "center" }}>
          <Icons.Github size={16} style={{ color: "var(--sf-text)" }} />
          <span style={{ fontSize: 13, color: "var(--sf-text)" }}>acme-studio</span>
          <span className="sf-chip">connected</span>
          <span className="sf-grow" />
          <button className="sf-btn sf-btn--ghost sf-btn--sm" type="button">
            Change account
          </button>
        </div>
        <FormRow label="Repository name">
          <div
            className="sf-row"
            style={{
              background: "var(--sf-surface)",
              border: "1px solid var(--sf-border)",
              borderRadius: 8,
              padding: "0 12px",
              height: 38,
              alignItems: "center"
            }}
          >
            <span className="mono sf-faint" style={{ fontSize: 12, color: "var(--sf-text-faint)" }}>
              acme-studio/
            </span>
            <input
              defaultValue="examly-api"
              className="mono"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "var(--sf-font-mono)",
                fontSize: 12.5,
                color: "var(--sf-text)",
                marginLeft: 4
              }}
            />
          </div>
        </FormRow>
        <FormRow label="Visibility">
          <div className="sf-row" style={{ gap: 8 }}>
            {["Private", "Internal", "Public"].map((v, i) => (
              <button
                key={v}
                className="sf-btn sf-btn--sm"
                style={{
                  background: i === 0 ? "var(--sf-surface-2)" : "transparent",
                  borderColor: i === 0 ? "var(--sf-border-strong)" : "var(--sf-border)"
                }}
                type="button"
              >
                {i === 0 && <Icons.Lock size={10} style={{ marginRight: 4 }} />} {v}
              </button>
            ))}
          </div>
        </FormRow>
        <FormRow label="Description">
          <input
            className="sf-input"
            style={{ height: 38 }}
            defaultValue="Backend for Examly — generated with Simplicit."
          />
        </FormRow>
        <FormRow label="Branch protection" hint="Require PR review and CI pass on main.">
          <Toggle2 on />
        </FormRow>
      </div>
    </>
  );
}

function DeployStep() {
  return (
    <>
      <StepHead eyebrow="Step 05" title="Deploying…" subtitle="Watch the logs while Simplicit ships your backend." />

      <div className="sf-col" style={{ gap: 6, marginBottom: 18 }}>
        {[
          { l: "Creating GitHub repository", s: "done", d: "acme-studio/examly-api" },
          { l: "Pushing 124 files", s: "done", d: "12 commits" },
          { l: "Provisioning Neon database", s: "done", d: "us-east-1 · 0.25 vCPU" },
          { l: "Provisioning Upstash Redis", s: "done", d: "us-east-1" },
          { l: "Building api service", s: "active", d: "docker · stage 3 / 4" },
          { l: "Building worker", s: "pending", d: "" },
          { l: "Running migrations", s: "pending", d: "11 tables · 16 indexes" },
          { l: "Health check", s: "pending", d: "GET /healthz" }
        ].map((r, i) => (
          <div key={i} className="sf-row" style={{ gap: 12, padding: "6px 0", alignItems: "center" }}>
            <div
              style={{
                width: 16,
                height: 16,
                borderRadius: 999,
                flex: "0 0 auto",
                background: r.s === "done" ? "var(--sf-text)" : "transparent",
                border:
                  r.s === "active"
                    ? "1.5px solid var(--sf-blue)"
                    : r.s === "done"
                    ? "none"
                    : "1.5px solid var(--sf-border-strong)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {r.s === "done" && <Icons.Check size={9} style={{ color: "var(--sf-bg)" }} />}
              {r.s === "active" && (
                <span
                  className="sf-dot sf-dot--blue"
                  style={{
                    animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite"
                  }}
                />
              )}
            </div>
            <span style={{ fontSize: 13, color: r.s === "pending" ? "var(--sf-text-muted)" : "var(--sf-text)" }}>
              {r.l}
            </span>
            <span className="sf-grow" />
            <span className="mono sf-faint" style={{ fontSize: 11, color: "var(--sf-text-faint)" }}>
              {r.d}
            </span>
          </div>
        ))}
      </div>

      {/* Live build log */}
      <div
        className="sf-code sf-scroll"
        style={{
          padding: "14px 16px",
          fontSize: 11.5,
          lineHeight: 1.7,
          maxHeight: 220,
          overflowY: "auto"
        }}
      >
        <div>
          <span className="tok-cmt">[15:42:01]</span> <span className="tok-fn">▶ build</span> apps/api · node:20-alpine
        </div>
        <div>
          <span className="tok-cmt">[15:42:03]</span> + pnpm install --frozen-lockfile
        </div>
        <div>
          <span className="tok-cmt">[15:42:08]</span> Packages: <span className="tok-num">142</span> · cache hit{" "}
          <span className="tok-str">98%</span>
        </div>
        <div>
          <span className="tok-cmt">[15:42:14]</span> + pnpm run build
        </div>
        <div>
          <span className="tok-cmt">[15:42:18]</span> <span className="tok-type">tsc</span> --build ·{" "}
          <span className="tok-str">no errors</span>
        </div>
        <div>
          <span className="tok-cmt">[15:42:21]</span> <span className="tok-fn">▶ migrate</span> 0001_init.sql ·{" "}
          <span className="tok-num">11</span> tables
        </div>
        <div>
          <span className="tok-cmt">[15:42:24]</span> <span className="tok-fn">▶ deploy</span> stage 3/4 · pushing
          image…
        </div>
      </div>
    </>
  );
}
