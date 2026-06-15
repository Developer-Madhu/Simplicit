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

  // Railway deploy-token settings, wired to /api/deploy/settings.
  const [railwayToken, setRailwayToken] = useState("");
  const [railwayConfigured, setRailwayConfigured] = useState(false);
  const [railwaySaving, setRailwaySaving] = useState(false);
  const [railwayError, setRailwayError] = useState<string | null>(null);
  const [railwaySuccess, setRailwaySuccess] = useState(false);

  useEffect(() => {
    fetch("/api/deploy/settings")
      .then((r) => r.json())
      .then((data) => setRailwayConfigured(data.railway ?? false))
      .catch(() => {}); // silent fail — UI shows unconfigured
  }, []);

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
              <div className="railway-settings">
                <h2
                  style={{
                    fontFamily: "var(--sf-font-sans)",
                    fontSize: 22,
                    fontWeight: 500,
                    letterSpacing: "-0.02em",
                    margin: 0,
                    color: "var(--sf-text)",
                  }}
                >
                  Railway Deployment
                </h2>
                <p
                  style={{
                    fontFamily: "var(--sf-font-sans)",
                    fontSize: 13.5,
                    color: "var(--sf-text-muted)",
                    opacity: 0.9,
                    margin: "6px 0 0",
                  }}
                >
                  {railwayConfigured
                    ? "Railway token is configured. Paste a new token to replace it."
                    : "Paste your Railway API token to enable one-click deployment."}
                </p>
                <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                  <input
                    className="sf-input"
                    type="password"
                    placeholder="Railway API token"
                    value={railwayToken}
                    onChange={(e) => {
                      setRailwayToken(e.target.value);
                      setRailwayError(null);
                      setRailwaySuccess(false);
                    }}
                    style={{ fontFamily: "var(--sf-font-mono)", flex: 1, height: 36 }}
                  />
                  <button
                    className="sf-btn sf-btn--primary sf-btn--sm"
                    disabled={!railwayToken.trim() || railwaySaving}
                    onClick={async () => {
                      setRailwaySaving(true);
                      setRailwayError(null);
                      try {
                        const res = await fetch("/api/deploy/settings", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            provider: "railway",
                            api_token: railwayToken.trim(),
                          }),
                        });
                        if (!res.ok) {
                          const d = await res.json();
                          setRailwayError(d.error ?? "Save failed");
                        } else {
                          setRailwayConfigured(true);
                          setRailwayToken("");
                          setRailwaySuccess(true);
                          setTimeout(() => setRailwaySuccess(false), 3000);
                        }
                      } catch {
                        setRailwayError("Network error — try again");
                      } finally {
                        setRailwaySaving(false);
                      }
                    }}
                    type="button"
                  >
                    {railwaySaving ? "Saving…" : "Save Token"}
                  </button>
                </div>
                {railwayError && (
                  <p style={{ color: "var(--sf-error, red)", marginTop: "8px", fontFamily: "var(--sf-font-sans)" }}>
                    {railwayError}
                  </p>
                )}
                {railwaySuccess && (
                  <p style={{ color: "var(--sf-success, green)", marginTop: "8px", fontFamily: "var(--sf-font-sans)" }}>
                    Token saved. Railway deployment is now enabled.
                  </p>
                )}
              </div>
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
  return (
    <>
      <SectionHead
        title="API keys"
        subtitle="Use these to call Simplicit from your own scripts and CI."
        actions={
          <button className="sf-btn sf-btn--primary sf-btn--sm" type="button" disabled title="Coming soon">
            <Icons.Plus size={11} style={{ marginRight: 4 }} /> New key
          </button>
        }
      />
      <p style={{ opacity: 0.5, fontSize: "13px", fontFamily: "var(--sf-font-sans)" }}>
        API key management coming soon.
      </p>

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
  const [mode, setMode] = useState<"simplicit" | "byok">("simplicit");
  const [anthropicConfigured, setAnthropicConfigured] = useState(false);
  const [nvidiaConfigured, setNvidiaConfigured] = useState(false);

  // Booleans only — the GET endpoint never returns the key values.
  useEffect(() => {
    fetch("/api/ai/keys")
      .then((r) => r.json())
      .then((data) => {
        setAnthropicConfigured(data.anthropic ?? false);
        setNvidiaConfigured(data.nvidia ?? false);
        if (data.anthropic || data.nvidia) setMode("byok"); // already BYOK → show it
      })
      .catch(() => {}); // silent — UI shows unconfigured
  }, []);

  return (
    <>
      <SectionHead title="AI provider" subtitle="Use Simplicit's managed models, or bring your own API keys." />

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {(
          [
            { id: "simplicit", label: "Use Simplicit models" },
            { id: "byok", label: "Use my own keys" },
          ] as const
        ).map((opt) => {
          const active = mode === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setMode(opt.id)}
              className="sf-btn sf-btn--sm"
              style={{
                background: active ? "var(--sf-surface-2)" : "transparent",
                borderColor: active ? "var(--sf-border-strong)" : "var(--sf-border)",
                color: active ? "var(--sf-text)" : "var(--sf-text-muted)",
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {mode === "simplicit" ? (
        <p style={{ fontSize: 13, color: "var(--sf-text-muted)", fontFamily: "var(--sf-font-sans)" }}>
          Generations run on Simplicit&apos;s managed models. No setup required.
        </p>
      ) : (
        <div className="sf-col" style={{ gap: 14 }}>
          <AIKeyRow
            provider="anthropic"
            label="Anthropic"
            placeholder="sk-ant-..."
            configured={anthropicConfigured}
            onSaved={() => setAnthropicConfigured(true)}
          />
          <AIKeyRow
            provider="nvidia"
            label="NVIDIA"
            placeholder="nvapi-..."
            configured={nvidiaConfigured}
            onSaved={() => setNvidiaConfigured(true)}
          />
          <p style={{ fontSize: 11.5, color: "var(--sf-text-faint)", fontFamily: "var(--sf-font-sans)", marginTop: 4 }}>
            Keys are stored securely and never shown again after saving. (Saved now; using them for generation ships
            in a later update.)
          </p>
        </div>
      )}
    </>
  );
}

function AIKeyRow({
  provider,
  label,
  placeholder,
  configured,
  onSaved,
}: {
  provider: "anthropic" | "nvidia";
  label: string;
  placeholder: string;
  configured: boolean;
  onSaved: () => void;
}) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, api_key: value.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(d.error ?? "Save failed");
      } else {
        setValue(""); // never keep the key in component state after save
        setSuccess(true);
        onSaved();
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch {
      setError("Network error — try again");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sf-card" style={{ padding: 12 }}>
      <div className="sf-row" style={{ gap: 10, alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--sf-text)" }}>{label}</span>
        <span className="sf-grow" />
        {configured && (
          <span className="sf-chip" style={{ color: "var(--sf-green)" }}>
            <span className="sf-dot sf-dot--green" style={{ marginRight: 6 }} /> Configured
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          className="sf-input"
          type="password"
          placeholder={configured ? "Paste a new key to replace" : placeholder}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
            setSuccess(false);
          }}
          style={{ fontFamily: "var(--sf-font-mono)", flex: 1, height: 34 }}
        />
        <button
          className="sf-btn sf-btn--primary sf-btn--sm"
          disabled={!value.trim() || saving}
          onClick={save}
          type="button"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
      {error && (
        <p style={{ color: "var(--sf-error, red)", marginTop: 6, fontSize: 12, fontFamily: "var(--sf-font-sans)" }}>
          {error}
        </p>
      )}
      {success && (
        <p style={{ color: "var(--sf-success, green)", marginTop: 6, fontSize: 12, fontFamily: "var(--sf-font-sans)" }}>
          {label} key saved.
        </p>
      )}
    </div>
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
  return (
    <>
      <SectionHead
        title="Members"
        actions={<button className="sf-btn sf-btn--primary sf-btn--sm" type="button" disabled title="Coming soon">Invite member</button>}
      />
      <p style={{ opacity: 0.5, fontSize: "13px", fontFamily: "var(--sf-font-sans)" }}>
        Team management coming soon.
      </p>
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
