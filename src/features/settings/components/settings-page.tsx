"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/auth-context";
import { useToast } from "@/features/auth/context/toast-context";
import { useWorkspace } from "@/features/workspace/context/workspace-context";
import { useProfile, useUpdateProfile, useDisplayName } from "@/features/workspace/api/workspaces";
import {
  Bell,
  Cloud,
  Database,
  Download,
  Github,
  Key,
  Lock,
  MoreHorizontal,
  Plus,
  Rocket,
  Sparkles,
  User,
  Zap,
  Copy,
  Code as CodeIcon,
  X as XIcon
} from "lucide-react";

import { AppTopbar } from "@/features/shell";

const Icons = {
  User,
  Zap,
  Sparkle: Sparkles,
  Download,
  Key,
  Github,
  Cloud,
  Database,
  Rocket,
  Bell,
  Lock,
  Copy,
  Code: CodeIcon,
  More: MoreHorizontal,
  Plus,
  X: XIcon
} as const;

function Toggle({ on: initialOn = false }: { on?: boolean }) {
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

function Progress({ value = 0, height = 4, color = "var(--sf-text)" }) {
  return (
    <div style={{ height, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
      <div
        style={{
          width: `${value}%`,
          height: "100%",
          background: color,
          borderRadius: 999,
          transition: "width .4s cubic-bezier(.2,.7,.3,1)"
        }}
      />
    </div>
  );
}

const SECTIONS = [
  {
    group: "Workspace",
    items: [
      { id: "profile", label: "Profile", icon: "User" as const },
      { id: "members", label: "Members", icon: "User" as const },
      { id: "billing", label: "Billing", icon: "Zap" as const }
    ]
  },
  {
    group: "Generation",
    items: [
      { id: "ai", label: "AI provider", icon: "Sparkle" as const },
      { id: "export", label: "Export defaults", icon: "Download" as const },
      { id: "api-keys", label: "API keys", icon: "Key" as const }
    ]
  },
  {
    group: "Integrations",
    items: [
      { id: "github", label: "GitHub", icon: "Github" as const },
      { id: "vercel", label: "Vercel", icon: "Cloud" as const },
      { id: "supabase", label: "Supabase", icon: "Database" as const },
      { id: "railway", label: "Railway", icon: "Rocket" as const }
    ]
  },
  {
    group: "System",
    items: [
      { id: "notify", label: "Notifications", icon: "Bell" as const },
      { id: "security", label: "Security", icon: "Lock" as const }
    ]
  }
];

export function SettingsPage() {
  const [section, setSection] = useState("api-keys");
  const displayName = useDisplayName();

  return (
    <div className="sf-app" style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: "var(--sf-bg)" }}>
      <AppTopbar breadcrumbs={[displayName, "Settings"]} />

      <div className="sf-row sf-grow" style={{ minHeight: 0 }}>
        {/* Settings sidebar */}
        <aside
          style={{
            width: 220,
            flex: "0 0 auto",
            borderRight: "1px solid var(--sf-border)",
            background: "var(--sf-bg-2)",
            padding: "18px 12px",
            overflowY: "auto"
          }}
          className="sf-scroll"
        >
          {SECTIONS.map((grp, gi) => (
            <div key={grp.group} style={{ marginBottom: gi < SECTIONS.length - 1 ? 16 : 0 }}>
              <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 10px 6px", color: "var(--sf-text-faint)" }}>
                {grp.group}
              </div>
              {grp.items.map((it) => {
                const Ic = Icons[it.icon];
                const active = section === it.id;
                return (
                  <button
                    key={it.id}
                    onClick={() => setSection(it.id)}
                    className="sf-row"
                    style={{
                      width: "100%",
                      gap: 10,
                      padding: "7px 10px",
                      background: active ? "rgba(255,255,255,0.05)" : "transparent",
                      border: "1px solid",
                      borderColor: active ? "var(--sf-border)" : "transparent",
                      borderRadius: 6,
                      color: active ? "var(--sf-text)" : "var(--sf-text-muted)",
                      fontFamily: "inherit",
                      fontSize: 12.5,
                      cursor: "pointer",
                      textAlign: "left",
                      alignItems: "center"
                    }}
                    type="button"
                  >
                    <Ic size={13} style={{ color: active ? "inherit" : "var(--sf-text-faint)" }} /> {it.label}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        {/* Settings body */}
        <main className="sf-scroll" style={{ flex: 1, overflowY: "auto" }}>
          <div style={{ maxWidth: 880, margin: "0 auto", padding: "28px 36px 80px" }}>
            {section === "api-keys" && <APIKeysSection />}
            {section === "ai" && <AISection />}
            {section === "profile" && <ProfileSection />}
            {section === "github" && (
              <IntegrationDetail name="GitHub" status="connected" desc="Push generated projects to GitHub repositories." />
            )}
            {section === "vercel" && (
              <IntegrationDetail name="Vercel" status="connected" desc="Deploy generated projects to Vercel." />
            )}
            {section === "supabase" && (
              <IntegrationDetail name="Supabase" status="disconnected" desc="Use Supabase as your Postgres + Auth provider." />
            )}
            {section === "railway" && (
              <IntegrationDetail name="Railway" status="connected" desc="One-click deploy to Railway with provisioned services." />
            )}
            {section === "billing" && <BillingSection />}
            {section === "export" && <ExportSection />}
            {section === "notify" && <NotifySection />}
            {section === "members" && <MembersSection />}
            {section === "security" && <SecuritySection />}
          </div>
        </main>
      </div>
    </div>
  );
}

interface SectionHeadProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

function SectionHead({ title, subtitle, actions }: SectionHeadProps) {
  return (
    <div className="sf-row" style={{ marginBottom: 26, alignItems: "flex-start" }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", margin: 0, color: "var(--sf-text)" }}>
          {title}
        </h2>
        {subtitle && (
          <p className="sf-muted" style={{ fontSize: 13.5, margin: "6px 0 0", color: "var(--sf-text-muted)" }}>
            {subtitle}
          </p>
        )}
      </div>
      <span className="sf-grow" />
      {actions}
    </div>
  );
}

interface FieldRowProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

function FieldRow({ label, hint, children }: FieldRowProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "220px 1fr",
        gap: 24,
        padding: "18px 0",
        borderBottom: "1px solid var(--sf-border)",
        alignItems: "start"
      }}
    >
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sf-text)" }}>{label}</div>
        {hint && (
          <div className="sf-faint" style={{ fontSize: 11.5, marginTop: 4, lineHeight: 1.45, color: "var(--sf-text-faint)" }}>
            {hint}
          </div>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}

function APIKeysSection() {
  const keys = [
    {
      name: "production",
      token: "sf_live_••••••••••••2f3a",
      created: "May 04 2026",
      lastUsed: "12 min ago",
      scope: "all"
    },
    {
      name: "ci",
      token: "sf_live_••••••••••••71b8",
      created: "Apr 22 2026",
      lastUsed: "2 h ago",
      scope: "generate, deploy"
    },
    {
      name: "local-dev",
      token: "sf_dev_•••••••••••••c4e0",
      created: "Apr 02 2026",
      lastUsed: "yesterday",
      scope: "generate"
    }
  ];
  return (
    <>
      <SectionHead
        title="API keys"
        subtitle="Use these to call Simplicit from your own scripts and CI."
        actions={
          <button className="sf-btn sf-btn--primary sf-btn--sm" type="button">
            <Icons.Plus size={11} style={{ marginRight: 4 }} /> New key
          </button>
        }
      />
      <div className="sf-card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          className="sf-row"
          style={{
            padding: "10px 16px",
            borderBottom: "1px solid var(--sf-border)",
            background: "var(--sf-bg-2)",
            fontSize: 11,
            color: "var(--sf-text-faint)",
            letterSpacing: "0.04em",
            textTransform: "uppercase"
          }}
        >
          <span style={{ flex: "0 0 130px" }}>Name</span>
          <span style={{ flex: "0 0 220px" }}>Token</span>
          <span style={{ flex: "0 0 160px" }}>Scope</span>
          <span style={{ flex: "0 0 120px" }}>Created</span>
          <span className="sf-grow">Last used</span>
        </div>
        {keys.map((k, i) => (
          <div
            key={k.name}
            className="sf-row"
            style={{
              padding: "12px 16px",
              borderBottom: i < keys.length - 1 ? "1px solid var(--sf-border)" : "none",
              gap: 8,
              fontSize: 13,
              alignItems: "center"
            }}
          >
            <span className="sf-row" style={{ flex: "0 0 130px", gap: 6, alignItems: "center" }}>
              <Icons.Key size={11} style={{ color: "var(--sf-text-faint)" }} />
              <span>{k.name}</span>
            </span>
            <span className="mono" style={{ flex: "0 0 220px", fontSize: 11.5, color: "var(--sf-text-muted)" }}>
              {k.token}
            </span>
            <span style={{ flex: "0 0 160px", fontSize: 12, color: "var(--sf-text-muted)" }}>{k.scope}</span>
            <span style={{ flex: "0 0 120px", fontSize: 12 }} className="sf-muted">
              {k.created}
            </span>
            <span className="sf-grow sf-faint" style={{ fontSize: 12, color: "var(--sf-text-faint)" }}>
              {k.lastUsed}
            </span>
            <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: "0 5px" }} type="button">
              <Icons.Copy size={11} />
            </button>
            <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: "0 5px" }} type="button">
              <Icons.More size={13} />
            </button>
          </div>
        ))}
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 500, marginTop: 36, marginBottom: 12, color: "var(--sf-text)" }}>Webhooks</h3>
      <div className="sf-card" style={{ padding: 18 }}>
        <div className="sf-row" style={{ marginBottom: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sf-text)" }}>POST · acmestudio.com/hooks/simplicit</div>
            <div className="sf-faint" style={{ fontSize: 11.5, marginTop: 4, color: "var(--sf-text-faint)" }}>
              generation.completed · deployment.failed · deployment.succeeded
            </div>
          </div>
          <span className="sf-grow" />
          <span className="sf-chip" style={{ marginRight: 8 }}>
            <span className="sf-dot sf-dot--green" style={{ marginRight: 6 }} /> Active
          </span>
          <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: "0 5px" }} type="button">
            <Icons.More size={13} />
          </button>
        </div>
      </div>
    </>
  );
}

function AISection() {
  return (
    <>
      <SectionHead
        title="AI provider"
        subtitle="Choose which model powers generation. Bring your own key for higher rate limits."
      />

      <FieldRow label="Architect model" hint="Used for system design, schema, and code planning.">
        <div className="sf-card" style={{ padding: 12 }}>
          <div className="sf-row" style={{ gap: 12, alignItems: "center" }}>
            <Icons.Sparkle size={14} style={{ color: "var(--sf-text)" }} />
            <div className="sf-grow">
              <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--sf-text)" }}>Simplicit Architect 2.4</div>
              <div className="sf-faint" style={{ fontSize: 11.5, color: "var(--sf-text-faint)" }}>
                Default · multi-pass reasoning, schema-aware
              </div>
            </div>
            <span className="sf-chip" style={{ marginRight: 8 }}>Recommended</span>
            <button className="sf-btn sf-btn--sm" type="button">Change</button>
          </div>
        </div>
      </FieldRow>

      <FieldRow label="Code model" hint="Used to author individual files once the plan is approved.">
        <div className="sf-card" style={{ padding: 12 }}>
          <div className="sf-row" style={{ gap: 12, alignItems: "center" }}>
            <Icons.Code size={14} style={{ color: "var(--sf-text)" }} />
            <div className="sf-grow">
              <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--sf-text)" }}>Auto (best available)</div>
              <div className="sf-faint" style={{ fontSize: 11.5, color: "var(--sf-text-faint)" }}>
                Selects based on file kind and length
              </div>
            </div>
            <button className="sf-btn sf-btn--sm" type="button">Configure</button>
          </div>
        </div>
      </FieldRow>

      <FieldRow
        label="Bring your own keys"
        hint="Routes your generations through your own API account. We never store responses."
      >
        <div className="sf-col" style={{ gap: 10 }}>
          {[
            { name: "Anthropic", val: "sk-ant-•••••••", dot: "green" },
            { name: "OpenAI", val: "sk-•••••••", dot: "green" },
            { name: "Google", val: "— not set —", dot: "gray" }
          ].map((p) => (
            <div key={p.name} className="sf-card" style={{ padding: 12 }}>
              <div className="sf-row" style={{ gap: 12, alignItems: "center" }}>
                <span className={`sf-dot sf-dot--${p.dot}`} />
                <div className="sf-grow">
                  <div style={{ fontSize: 13, color: "var(--sf-text)" }}>{p.name}</div>
                  <div className="mono sf-faint" style={{ fontSize: 11, color: "var(--sf-text-faint)" }}>
                    {p.val}
                  </div>
                </div>
                <button className="sf-btn sf-btn--ghost sf-btn--sm" type="button">
                  {p.dot === "gray" ? "Connect" : "Manage"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </FieldRow>

      <FieldRow label="Privacy" hint="What we do with your prompts and code.">
        <div className="sf-card" style={{ padding: 16 }}>
          {[
            { l: "Train on your prompts", v: "never", dot: "green" },
            { l: "Retain code outputs", v: "30 days", dot: "gray" },
            { l: "Share with subprocessors", v: "never", dot: "green" }
          ].map((r) => (
            <div
              key={r.l}
              className="sf-row"
              style={{ padding: "8px 0", borderBottom: "1px dashed var(--sf-border)", alignItems: "center" }}
            >
              <span style={{ fontSize: 12.5, color: "var(--sf-text)" }}>{r.l}</span>
              <span className="sf-grow" />
              <span className={`sf-dot sf-dot--${r.dot}`} />
              <span className="mono sf-muted" style={{ fontSize: 11.5, marginLeft: 6, color: "var(--sf-text-muted)" }}>
                {r.v}
              </span>
            </div>
          ))}
        </div>
      </FieldRow>
    </>
  );
}

function ProfileSection() {
  const { signOut } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const { activeWorkspace } = useWorkspace();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState("");
  useEffect(() => {
    if (profile) setName(profile.full_name ?? "");
  }, [profile?.full_name]);

  const dirty = profile != null && name.trim() !== (profile.full_name ?? "");

  const handleSave = async () => {
    try {
      await updateProfile.mutateAsync({ full_name: name.trim() || null as any });
      toast("Profile updated", "success");
    } catch (e: any) {
      toast(e?.message || "Failed to update profile", "error");
    }
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/sign-in");
    router.refresh();
  };

  return (
    <>
      <SectionHead title="Profile" subtitle="Your workspace identity." />
      <FieldRow label="Display name" hint="Shown across the app — sidebar, breadcrumbs and project bylines.">
        <div className="sf-row" style={{ gap: 8 }}>
          <input
            className="sf-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            maxLength={60}
            style={{ maxWidth: 320, height: 36 }}
          />
          <button
            className="sf-btn sf-btn--primary sf-btn--sm"
            onClick={handleSave}
            disabled={!dirty || updateProfile.isPending}
            type="button"
          >
            {updateProfile.isPending ? "Saving…" : "Save"}
          </button>
        </div>
      </FieldRow>
      <FieldRow label="Email">
        <input className="sf-input" value={profile?.email ?? ""} readOnly style={{ maxWidth: 320, height: 36, opacity: 0.7 }} />
      </FieldRow>
      <FieldRow label="Workspace name" hint="Shown in the sidebar and on shared links.">
        <input className="sf-input" value={activeWorkspace?.name ?? ""} readOnly style={{ maxWidth: 320, height: 36, opacity: 0.7 }} />
      </FieldRow>
      <FieldRow label="Theme" hint="Dark only for now. Light coming soon.">
        <div className="sf-row" style={{ gap: 8 }}>
          {["Dark", "High contrast", "Auto"].map((t, i) => (
            <button
              key={t}
              className="sf-btn sf-btn--sm"
              style={{
                background: i === 0 ? "var(--sf-surface-2)" : "transparent",
                borderColor: i === 0 ? "var(--sf-border-strong)" : "var(--sf-border)"
              }}
              type="button"
            >
              {t}
            </button>
          ))}
        </div>
      </FieldRow>
      <FieldRow label="Session" hint="Sign out of your account on this device.">
        <button
          className="sf-btn sf-btn--sm"
          style={{ borderColor: "var(--sf-red)", color: "var(--sf-red)" }}
          onClick={handleSignOut}
          type="button"
        >
          Sign out
        </button>
      </FieldRow>
    </>
  );
}

interface IntegrationDetailProps {
  name: string;
  status: string;
  desc: string;
}

function IntegrationDetail({ name, status, desc }: IntegrationDetailProps) {
  return (
    <>
      <SectionHead
        title={name}
        subtitle={desc}
        actions={
          status === "connected" ? (
            <button className="sf-btn sf-btn--sm" type="button">Disconnect</button>
          ) : (
            <button className="sf-btn sf-btn--primary sf-btn--sm" type="button">Connect</button>
          )
        }
      />
      <div className="sf-card" style={{ padding: 18 }}>
        <div className="sf-row" style={{ gap: 14, alignItems: "center" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: "var(--sf-surface-2)",
              border: "1px solid var(--sf-border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            {name === "GitHub" ? (
              <Icons.Github size={20} style={{ color: "var(--sf-text)" }} />
            ) : name === "Vercel" ? (
              <Icons.Cloud size={20} style={{ color: "var(--sf-text)" }} />
            ) : name === "Supabase" ? (
              <Icons.Database size={20} style={{ color: "var(--sf-text)" }} />
            ) : (
              <Icons.Rocket size={20} style={{ color: "var(--sf-text)" }} />
            )}
          </div>
          <div className="sf-grow">
            <div className="sf-row" style={{ gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 500, color: "var(--sf-text)" }}>{name}</span>
              <span className="sf-chip">
                <span className={`sf-dot sf-dot--${status === "connected" ? "green" : "gray"}`} style={{ marginRight: 6 }} /> {status}
              </span>
            </div>
            <div className="sf-muted" style={{ fontSize: 12.5, marginTop: 2, color: "var(--sf-text-muted)" }}>
              {desc}
            </div>
          </div>
        </div>
        {status === "connected" && (
          <div
            className="sf-row"
            style={{
              marginTop: 18,
              paddingTop: 16,
              borderTop: "1px solid var(--sf-border)",
              gap: 16,
              fontSize: 12.5,
              color: "var(--sf-text)"
            }}
          >
            <div>
              <div className="sf-faint" style={{ fontSize: 11, color: "var(--sf-text-faint)" }}>
                Account
              </div>
              <div className="mono">acme-studio</div>
            </div>
            <div>
              <div className="sf-faint" style={{ fontSize: 11, color: "var(--sf-text-faint)" }}>
                Scopes
              </div>
              <div>repo, workflow, admin:org</div>
            </div>
            <div>
              <div className="sf-faint" style={{ fontSize: 11, color: "var(--sf-text-faint)" }}>
                Connected
              </div>
              <div>Apr 12 2026</div>
            </div>
          </div>
        )}
      </div>

      <h3 style={{ fontSize: 15, fontWeight: 500, marginTop: 28, marginBottom: 12, color: "var(--sf-text)" }}>Permissions</h3>
      <div className="sf-card" style={{ padding: 0, overflow: "hidden" }}>
        {[
          { l: "Read repositories", d: "View existing repos in your account", on: true },
          { l: "Create repositories", d: "Push new generated projects", on: true },
          { l: "Write to existing repos", d: "Modify code in current repos", on: false },
          { l: "Trigger workflows", d: "Run GitHub Actions from Simplicit", on: true }
        ].map((p, i, arr) => (
          <div
            key={p.l}
            className="sf-row"
            style={{ padding: "14px 18px", borderBottom: i < arr.length - 1 ? "1px solid var(--sf-border)" : "none", alignItems: "center" }}
          >
            <div className="sf-grow">
              <div style={{ fontSize: 13, color: "var(--sf-text)" }}>{p.l}</div>
              <div className="sf-faint" style={{ fontSize: 11.5, marginTop: 1, color: "var(--sf-text-faint)" }}>
                {p.d}
              </div>
            </div>
            <Toggle on={p.on} />
          </div>
        ))}
      </div>
    </>
  );
}

function BillingSection() {
  return (
    <>
      <SectionHead title="Billing" subtitle="Plan, usage, and invoices." />
      <div className="sf-card-elev" style={{ padding: 22, marginBottom: 24 }}>
        <div className="sf-row" style={{ marginBottom: 12, alignItems: "center" }}>
          <span className="sf-chip">Current plan</span>
          <span className="sf-grow" />
          <button className="sf-btn sf-btn--sm" type="button">Change plan</button>
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", margin: "0 0 4px", color: "var(--sf-text)" }}>
          Studio · $49/mo
        </h3>
        <p className="sf-muted" style={{ fontSize: 13, margin: 0, color: "var(--sf-text-muted)" }}>
          Renews July 1, 2026 · 5 seats included
        </p>
      </div>
      {[
        { l: "Generations", v: "42 / 100", pct: 42 },
        { l: "Build minutes", v: "184 / 500", pct: 36.8 },
        { l: "Team seats", v: "3 / 5", pct: 60 }
      ].map((u) => (
        <div key={u.l} style={{ marginBottom: 14 }}>
          <div className="sf-row" style={{ marginBottom: 6, alignItems: "center" }}>
            <span style={{ fontSize: 13, color: "var(--sf-text)" }}>{u.l}</span>
            <span className="sf-grow" />
            <span className="mono sf-faint" style={{ fontSize: 11.5, color: "var(--sf-text-faint)" }}>
              {u.v}
            </span>
          </div>
          <Progress value={u.pct} />
        </div>
      ))}
    </>
  );
}

function ExportSection() {
  return (
    <>
      <SectionHead title="Export defaults" subtitle="Defaults applied when you export a project." />
      <FieldRow label="Package manager">
        <div className="sf-row" style={{ gap: 6 }}>
          {["pnpm", "npm", "bun", "yarn"].map((p, i) => (
            <button
              key={p}
              className="sf-btn sf-btn--sm"
              style={{
                background: i === 0 ? "var(--sf-surface-2)" : "transparent",
                borderColor: i === 0 ? "var(--sf-border-strong)" : "var(--sf-border)"
              }}
              type="button"
            >
              {p}
            </button>
          ))}
        </div>
      </FieldRow>
      <FieldRow label="Include Dockerfile" hint="Multi-stage build, runs as non-root user.">
        <Toggle on />
      </FieldRow>
      <FieldRow label="Include GitHub Actions" hint="Lint, type-check, test, deploy on push.">
        <Toggle on />
      </FieldRow>
      <FieldRow label="Include SDK package" hint="A typed client package generated from your OpenAPI spec.">
        <Toggle on />
      </FieldRow>
    </>
  );
}

function NotifySection() {
  return (
    <>
      <SectionHead title="Notifications" />
      {[
        ["Generation completed", "Email, in-app"],
        ["Deployment failed", "Email, Slack, in-app"],
        ["Deployment succeeded", "Slack"],
        ["Weekly summary", "Email"]
      ].map(([l, v]) => (
        <FieldRow key={l} label={l}>
          <input className="sf-input" defaultValue={v} style={{ maxWidth: 320, height: 36 }} />
        </FieldRow>
      ))}
    </>
  );
}

function MembersSection() {
  const members = [
    { n: "Alex Chen", e: "alex@acmestudio.com", r: "Owner" },
    { n: "Priya Okafor", e: "priya@acmestudio.com", r: "Admin" },
    { n: "Sam Vargas", e: "sam@acmestudio.com", r: "Member" }
  ];
  return (
    <>
      <SectionHead
        title="Members"
        subtitle="3 of 5 seats used."
        actions={<button className="sf-btn sf-btn--primary sf-btn--sm" type="button">Invite member</button>}
      />
      <div className="sf-card" style={{ padding: 0, overflow: "hidden" }}>
        {members.map((m, i) => (
          <div
            key={m.e}
            className="sf-row"
            style={{
              padding: "14px 18px",
              borderBottom: i < members.length - 1 ? "1px solid var(--sf-border)" : "none",
              gap: 12,
              alignItems: "center"
            }}
          >
            <div
              className="sf-avatar"
              style={{
                width: 24,
                height: 24,
                borderRadius: 999,
                border: "1px solid var(--sf-border)",
                background: "var(--sf-elevated)",
                fontSize: 10.5,
                fontWeight: 600,
                color: "var(--sf-text-muted)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {m.n
                .split(" ")
                .map((s) => s[0])
                .join("")}
            </div>
            <div className="sf-grow">
              <div style={{ fontSize: 13, color: "var(--sf-text)" }}>{m.n}</div>
              <div className="sf-faint" style={{ fontSize: 11.5, color: "var(--sf-text-faint)" }}>
                {m.e}
              </div>
            </div>
            <span className="sf-chip">{m.r}</span>
            <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: "0 5px" }} type="button">
              <Icons.More size={13} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

function SecuritySection() {
  return (
    <>
      <SectionHead title="Security" subtitle="Sign-in and session controls." />
      <FieldRow label="Two-factor authentication" hint="Required for owners and admins.">
        <Toggle on />
      </FieldRow>
      <FieldRow label="Session timeout">
        <input className="sf-input" defaultValue="30 days" style={{ maxWidth: 200, height: 36 }} />
      </FieldRow>
      <FieldRow label="SAML SSO" hint="Enterprise plan only.">
        <button className="sf-btn sf-btn--sm" disabled style={{ opacity: 0.5 }} type="button">
          Configure
        </button>
      </FieldRow>
      <FieldRow label="Audit log" hint="Export the last 90 days of workspace events.">
        <button className="sf-btn sf-btn--sm" type="button">
          <Icons.Download size={11} style={{ marginRight: 4 }} /> Export
        </button>
      </FieldRow>
    </>
  );
}
