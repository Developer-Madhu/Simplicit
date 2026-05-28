"use client";

import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { useShell } from "../context/shell-context";
import { useAuth } from "@/features/auth/context/auth-context";

interface AppTopbarProps {
  breadcrumbs?: string[];
  actions?: ReactNode;
  withSearch?: boolean;
}

export function AppTopbar({
  breadcrumbs = [],
  actions = null,
  withSearch = true
}: AppTopbarProps) {
  const router = useRouter();
  const { setCommandPaletteOpen, userDropdownOpen, toggleUserDropdown, setUserDropdownOpen } = useShell();
  const { user, signOut } = useAuth();

  // Dynamic user profile initials
  const initials = user
    ? (
        (user.user_metadata?.first_name?.[0] || "") + 
        (user.user_metadata?.last_name?.[0] || "")
      ).toUpperCase() || user.email?.[0]?.toUpperCase() || "JD"
    : "JD";

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    await signOut();
    router.push("/sign-in");
    router.refresh();
  };

  const navigateTo = (path: string) => {
    setUserDropdownOpen(false);
    router.push(path);
  };

  return (
    <div
      className="sf-row"
      style={{
        height: 48,
        padding: '0 16px',
        borderBottom: '1px solid var(--sf-border)',
        background: 'var(--sf-bg)',
        gap: 12,
        flex: '0 0 auto',
        position: "relative",
      }}
    >
      <div className="sf-row" style={{ gap: 6, fontSize: 13 }}>
        {breadcrumbs.map((b, i) => (
          <span key={i} className="sf-row" style={{ gap: 6 }}>
            {i > 0 && <span className="sf-faint" style={{ fontSize: 12 }}>/</span>}
            <span style={{ color: i === breadcrumbs.length - 1 ? 'var(--sf-text)' : 'var(--sf-text-muted)' }}>{b}</span>
          </span>
        ))}
      </div>
      <span className="sf-grow" />
      
      {withSearch && (
        <button
          className="sf-row"
          style={{
            gap: 8, padding: '0 10px', height: 30,
            background: 'var(--sf-surface)', border: '1px solid var(--sf-border)',
            borderRadius: 8, color: 'var(--sf-text-dim)', fontSize: 12.5,
            cursor: 'pointer', fontFamily: 'inherit',
            minWidth: 220,
          }}
          onClick={() => setCommandPaletteOpen(true)}
          type="button"
        >
          <Icons.Search size={13} />
          <span className="sf-grow" style={{ textAlign: 'left' }}>Search or run command…</span>
          <span className="sf-kbd">⌘K</span>
        </button>
      )}

      {actions}
      
      <button
        className="sf-btn sf-btn--ghost sf-btn--sm"
        style={{ padding: '0 7px' }}
        aria-label="Notifications"
        type="button"
        onClick={() => navigateTo("/settings")}
      >
        <Icons.Bell size={14} />
      </button>

      {/* User profile avatar trigger */}
      <div style={{ position: "relative" }}>
        <div 
          className="sf-avatar" 
          style={{ cursor: "pointer", userSelect: "none" }}
          onClick={toggleUserDropdown}
        >
          {initials}
        </div>

        {/* User Dropdown Overlay Menu */}
        {userDropdownOpen && (
          <>
            {/* Click-away backdrop overlay */}
            <div 
              style={{ position: "fixed", inset: 0, zIndex: 40, cursor: "default" }}
              onClick={() => setUserDropdownOpen(false)}
            />
            <div
              className="sf-card-elev"
              style={{
                position: "absolute",
                top: 34,
                right: 0,
                width: 220,
                padding: "6px 4px",
                zIndex: 50,
                background: "var(--sf-surface-2)",
                border: "1px solid var(--sf-border-strong)",
                boxShadow: "var(--sf-shadow-lg)",
                animation: "sf-dropdown-fade 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              }}
            >
              {/* Account header info */}
              <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid var(--sf-border)" }}>
                <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--sf-text)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.user_metadata?.first_name ? `${user.user_metadata.first_name} ${user.user_metadata.last_name || ""}` : "Simplicit Developer"}
                </div>
                <div className="sf-faint" style={{ fontSize: 11, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user?.email || "personal@account.dev"}
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: "4px 0" }}>
                <button
                  onClick={() => navigateTo("/settings")}
                  className="sf-row"
                  style={{
                    width: "100%", padding: "6px 8px", fontSize: 12.5, border: "none", background: "transparent",
                    color: "var(--sf-text-muted)", borderRadius: 4, cursor: "pointer", textAlign: "left", gap: 8
                  }}
                  type="button"
                >
                  <Icons.Settings size={12} /> Workspace Settings
                </button>
                <button
                  onClick={() => navigateTo("/settings")}
                  className="sf-row"
                  style={{
                    width: "100%", padding: "6px 8px", fontSize: 12.5, border: "none", background: "transparent",
                    color: "var(--sf-text-muted)", borderRadius: 4, cursor: "pointer", textAlign: "left", gap: 8
                  }}
                  type="button"
                >
                  <Icons.User size={12} /> Team Members
                </button>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: "var(--sf-border)", margin: "4px 0" }} />

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                className="sf-row"
                style={{
                  width: "100%", padding: "6px 8px", fontSize: 12.5, border: "none", background: "transparent",
                  color: "var(--sf-red)", borderRadius: 4, cursor: "pointer", textAlign: "left", gap: 8
                }}
                type="button"
              >
                <Icons.Power size={12} /> Sign out
              </button>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes sf-dropdown-fade {
          from {
            opacity: 0;
            transform: translateY(6px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
