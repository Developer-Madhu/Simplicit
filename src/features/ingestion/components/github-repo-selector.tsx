"use client";

import { useEffect, useState } from "react";
import { Github, Search, Lock, Loader2, X } from "lucide-react";

interface Repo {
  id: number;
  name: string;
  fullName: string;
  private: boolean;
  description: string | null;
  language: string | null;
  updatedAt: string;
  defaultBranch: string;
  owner: string;
}

interface Props {
  onRepoSelected: (repo: { owner: string; repo: string; branch: string }) => void;
  onClose: () => void;
}

/**
 * Phase 3a — GitHub repo selector.
 * 1. Checks connection status via /api/auth/github/token
 * 2. If not connected → "Connect GitHub" link to /api/auth/github (OAuth)
 * 3. If connected → username + searchable repo list from /api/github/repos
 * 4. Repo click → onRepoSelected({ owner, repo, branch })
 *
 * The GitHub token never reaches this component — only connection status,
 * the username, and repo metadata are returned by the server routes.
 */
export function GitHubRepoSelector({ onRepoSelected, onClose }: Props) {
  const [status, setStatus] = useState<"loading" | "disconnected" | "connected">("loading");
  const [username, setUsername] = useState("");
  const [repos, setRepos] = useState<Repo[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const tokenData = await fetch("/api/auth/github/token").then((r) => r.json());
        if (cancelled) return;
        if (!tokenData.connected) {
          setStatus("disconnected");
          return;
        }
        setUsername(tokenData.username ?? "");
        setStatus("connected");

        const reposData = await fetch("/api/github/repos").then((r) => r.json());
        if (cancelled) return;
        if (Array.isArray(reposData.repos)) setRepos(reposData.repos);
        else setError(reposData.error || "Failed to load repositories");
      } catch {
        if (!cancelled) setStatus("disconnected");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = repos.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="sf-col" style={{ minWidth: 0 }}>
      {/* Header */}
      <div
        className="sf-row"
        style={{ gap: 8, padding: "0 0 12px", borderBottom: "1px solid var(--sf-border)" }}
      >
        <Github size={14} style={{ color: "var(--sf-text-muted)" }} />
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--sf-text)" }}>
          Import from GitHub
        </span>
        <span className="sf-grow" />
        <button
          onClick={onClose}
          className="sf-btn sf-btn--ghost sf-btn--sm"
          style={{ padding: "0 4px" }}
          type="button"
        >
          <X size={13} />
        </button>
      </div>

      {status === "loading" && (
        <div
          className="sf-row sf-center"
          style={{ gap: 8, padding: "32px 0", color: "var(--sf-text-muted)" }}
        >
          <Loader2 size={14} className="sf-spin" />
          <span style={{ fontSize: 12.5 }}>Checking GitHub connection…</span>
        </div>
      )}

      {status === "disconnected" && (
        <div className="sf-col" style={{ gap: 12, padding: "20px 4px", alignItems: "flex-start" }}>
          <p style={{ fontSize: 12.5, color: "var(--sf-text-muted)", lineHeight: 1.5, margin: 0 }}>
            Connect your GitHub account to import any of your repositories directly — public or
            private.
          </p>
          <a href="/api/auth/github" className="sf-btn sf-btn--primary sf-btn--sm" style={{ textDecoration: "none" }}>
            <Github size={12} style={{ marginRight: 6 }} /> Connect GitHub
          </a>
        </div>
      )}

      {status === "connected" && (
        <div className="sf-col" style={{ gap: 0 }}>
          <div className="sf-col" style={{ gap: 8, padding: "12px 0" }}>
            <span style={{ fontSize: 12, color: "var(--sf-text-faint)" }}>
              Connected as{" "}
              <strong style={{ color: "var(--sf-text)" }}>@{username || "github"}</strong>
            </span>
            <div
              className="sf-row"
              style={{
                gap: 8,
                height: 32,
                background: "var(--sf-bg)",
                border: "1px solid var(--sf-border)",
                borderRadius: 8,
                padding: "0 10px",
              }}
            >
              <Search size={13} style={{ color: "var(--sf-text-faint)" }} />
              <input
                placeholder="Search repositories…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  fontFamily: "inherit",
                  fontSize: 12.5,
                  color: "var(--sf-text)",
                }}
              />
            </div>
          </div>

          {error && (
            <div style={{ padding: "10px 0", fontSize: 12, color: "var(--sf-red)" }}>{error}</div>
          )}

          <div className="sf-scroll" style={{ maxHeight: 320, overflowY: "auto", margin: "0 -4px" }}>
            {filtered.map((repo) => (
              <button
                key={repo.id}
                onClick={() =>
                  onRepoSelected({ owner: repo.owner, repo: repo.name, branch: repo.defaultBranch })
                }
                className="sf-col"
                style={{
                  alignItems: "flex-start",
                  width: "100%",
                  gap: 2,
                  padding: "10px 8px",
                  textAlign: "left",
                  border: "none",
                  borderBottom: "1px solid var(--sf-border)",
                  background: "transparent",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                type="button"
              >
                <span
                  className="sf-row"
                  style={{ gap: 6, fontSize: 13, fontWeight: 500, color: "var(--sf-text)" }}
                >
                  {repo.private && <Lock size={11} style={{ color: "var(--sf-text-faint)" }} />}
                  {repo.name}
                </span>
                {repo.description && (
                  <span
                    style={{
                      fontSize: 11.5,
                      color: "var(--sf-text-muted)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: "100%",
                    }}
                  >
                    {repo.description}
                  </span>
                )}
                <span className="mono" style={{ fontSize: 10.5, color: "var(--sf-text-faint)" }}>
                  {repo.language ?? "—"} · updated {new Date(repo.updatedAt).toLocaleDateString()}
                </span>
              </button>
            ))}
            {filtered.length === 0 && (
              <div
                style={{
                  padding: "24px 0",
                  textAlign: "center",
                  fontSize: 12,
                  color: "var(--sf-text-faint)",
                }}
              >
                No repositories found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
