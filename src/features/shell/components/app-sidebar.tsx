"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icons } from "@/components/ui/icons";
import { useProjects } from "@/features/dashboard";
import { Brand } from "./brand";
import { useShell } from "../context/shell-context";
import { useWorkspace } from "@/features/workspace/context/workspace-context";

const nav = [
  { key: "workspace", label: "Workspace", href: "/workspace", icon: "Sparkle", shortcut: "W" },
  { key: "projects", label: "Projects", href: "/dashboard", icon: "Folder", shortcut: "P" },
  { key: "generations", label: "Generations", href: "/generations/demo", icon: "Layers", shortcut: "G" },
  { key: "templates", label: "Templates", href: "/templates", icon: "Cube", shortcut: "T" },
  { key: "deployments", label: "Deployments", href: "/deployments", icon: "Rocket", shortcut: "D" }
];

const bottomNav = [
  { key: "docs", label: "Documentation", href: "/docs", icon: "File" },
  { key: "settings", label: "Settings", href: "/settings", icon: "Settings" }
];

function navKeyFromPath(pathname: string) {
  if (pathname.startsWith("/workspace")) return "workspace";
  if (pathname.startsWith("/dashboard")) return "projects";
  if (pathname.startsWith("/generations")) return "generations";
  if (pathname.startsWith("/templates")) return "templates";
  if (pathname.startsWith("/deployments")) return "deployments";
  if (pathname.startsWith("/docs")) return "docs";
  if (pathname.startsWith("/settings")) return "settings";
  return "workspace";
}

interface AppSidebarProps {
  forceExpanded?: boolean;
}

export function AppSidebar({ forceExpanded = false }: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const active = navKeyFromPath(pathname);
  
  const { activeWorkspace } = useWorkspace();
  const { data: dbProjects = [] } = useProjects(activeWorkspace?.id);

  const { sidebarCollapsed, toggleSidebar, setMobileOpen } = useShell();
  const collapsed = forceExpanded ? false : sidebarCollapsed;

  // Single-key keyboard shortcut navigations (Jakob's Law)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement).isContentEditable
      ) {
        return;
      }

      if (e.metaKey || e.ctrlKey || e.altKey) {
        return;
      }

      const key = e.key.toLowerCase();
      switch (key) {
        case "w":
          router.push("/workspace");
          break;
        case "p":
          router.push("/dashboard");
          break;
        case "g":
          router.push("/generations/demo");
          break;
        case "t":
          router.push("/templates");
          break;
        case "d":
          router.push("/deployments");
          break;
        case "s":
          router.push("/settings");
          break;
        case "h":
          router.push("/docs");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  const handleLinkClick = () => {
    setMobileOpen(false);
  };

  const renderItem = ({
    label,
    href,
    icon: iconKey,
    shortcut,
    key
  }: {
    label: string;
    href: string;
    icon: string;
    shortcut?: string;
    key: string;
  }) => {
    const isActive = active === key;
    const Icon = Icons[iconKey as keyof typeof Icons];

    return (
      <Link
        key={key}
        href={href}
        onClick={handleLinkClick}
        className="sf-row"
        style={{
          width: '100%', gap: 10, padding: '7px 10px',
          background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
          border: '1px solid', borderColor: isActive ? 'var(--sf-border)' : 'transparent',
          borderRadius: 8, color: isActive ? 'var(--sf-text)' : 'var(--sf-text-muted)',
          fontSize: 13, cursor: 'pointer', textAlign: 'left',
          fontFamily: 'inherit', letterSpacing: '-0.005em',
          transition: 'background .12s, border-color .12s, color .12s',
        }}
      >
        <Icon size={15} />
        {!collapsed && <span className="sf-grow">{label}</span>}
        {!collapsed && shortcut && (
          <span className="sf-kbd" style={{ opacity: isActive ? 1 : 0.6 }}>
            {shortcut}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside
      style={{
        width: "100%",
        height: "100%",
        flex: "1 1 auto",
        background: "var(--sf-bg-2)",
        display: "flex",
        flexDirection: "column",
        padding: "14px 10px 12px",
      }}
    >
      <div className="sf-row" style={{ gap: 8, padding: "4px 8px 14px" }}>
        <Brand compact={collapsed} />
        {!collapsed && <span className="sf-grow" />}
        {!collapsed && (
          <button 
            className="sf-btn sf-btn--ghost sf-btn--sm" 
            style={{ padding: "0 6px" }} 
            aria-label="New" 
            type="button"
            onClick={() => router.push("/workspace")}
          >
            <Icons.Plus size={13} />
          </button>
        )}
      </div>

      {/* Workspace switcher */}
      {!collapsed && (
        <button 
          className="sf-row" 
          style={{
            width: '100%', gap: 10, padding: '8px 10px', marginBottom: 14,
            background: 'var(--sf-surface)', border: '1px solid var(--sf-border)',
            borderRadius: 8, cursor: 'pointer', color: 'var(--sf-text)',
            fontFamily: 'inherit', textAlign: 'left',
          }} 
          type="button"
          onClick={() => router.push("/settings")}
        >
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: 'linear-gradient(135deg, oklch(0.72 0.16 250), oklch(0.72 0.16 290))',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10.5, fontWeight: 600, color: '#0A0A0B',
          }}>{activeWorkspace?.name?.charAt(0) || 'W'}</div>
          <span className="sf-grow" style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeWorkspace?.name || 'Workspace'}</span>
          <Icons.ChevD size={13} />
        </button>
      )}

      <nav className="sf-col" style={{ gap: 2 }}>
        {nav.map((item) => renderItem(item))}
      </nav>

      {/* Project list */}
      {!collapsed && dbProjects.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="sf-row" style={{ padding: '0 10px 6px', justifyContent: 'space-between' }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'var(--sf-text-faint)', textTransform: 'uppercase' }}>Recent</span>
            <Icons.Plus size={12} className="sf-faint" onClick={() => router.push('/dashboard')} style={{ cursor: 'pointer' }} />
          </div>
          <div className="sf-col" style={{ gap: 1 }}>
            {dbProjects.slice(0, 4).map(p => (
              <button 
                key={p.id} 
                className="sf-row" 
                style={{
                  width: '100%', gap: 8, padding: '5px 10px',
                  background: 'transparent', border: 'none', borderRadius: 6,
                  color: 'var(--sf-text-muted)', fontSize: 12.5, cursor: 'pointer',
                  textAlign: 'left', fontFamily: 'inherit',
                }} 
                type="button"
                onClick={() => router.push(`/generations/${p.id}`)}
              >
                <span className={`sf-dot sf-dot--${p.dot || 'gray'}`} />
                <span className="sf-grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sf-grow" style={{ flex: '1 1 auto' }} />

      <nav className="sf-col" style={{ gap: 2, paddingTop: 8, borderTop: '1px solid var(--sf-border)' }}>
        {bottomNav.map((item) => renderItem(item))}
      </nav>

      {/* Collapse Toggle Trigger (Only visible on Desktop screen sizes) */}
      {!forceExpanded && (
        <button
          onClick={toggleSidebar}
          className="sf-row"
          style={{
            width: '100%', gap: 10, padding: '7px 10px', marginTop: 8,
            background: 'transparent',
            border: '1px solid transparent',
            borderRadius: 8, color: 'var(--sf-text-muted)',
            fontSize: 13, cursor: 'pointer', textAlign: 'left',
            fontFamily: 'inherit', letterSpacing: '-0.005em',
            transition: 'background .12s, color .12s',
          }}
          type="button"
        >
          <div style={{ transform: collapsed ? "none" : "rotate(180deg)", display: "flex", alignItems: "center", transition: "transform 0.15s ease" }}>
            <Icons.Chev size={15} />
          </div>
          {!collapsed && <span>Collapse sidebar</span>}
        </button>
      )}

      {/* Usage card */}
      {!collapsed && (
        <div className="sf-card" style={{ padding: 10, marginTop: 10, background: 'var(--sf-surface)' }}>
          <div className="sf-row" style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 11.5 }} className="sf-muted">Generations</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--sf-text)' }}>42 / 100</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
            <div style={{ width: '42%', height: '100%', background: 'var(--sf-text)', borderRadius: 999 }} />
          </div>
          <button 
            className="sf-btn sf-btn--sm" 
            style={{ width: '100%', marginTop: 10, justifyContent: 'center' }} 
            type="button"
            onClick={() => router.push("/settings")}
          >
            Upgrade plan
          </button>
        </div>
      )}
    </aside>
  );
}
