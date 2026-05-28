// Shared chrome for the StackForge app: Sidebar, Topbar, CommandPalette pill, etc.
// Relies on window.Icons.

const { useState, useEffect, useRef, useMemo, useCallback, Fragment } = React;
const I = () => window.Icons;

// ----- Brand mark -----
function SFLogo({ size = 22, withText = true }) {
  return (
    <div className="sf-row" style={{ gap: 8 }}>
      <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
        <defs>
          <linearGradient id="sf-mg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#fff" stopOpacity="1"/>
            <stop offset="1" stopColor="#fff" stopOpacity="0.55"/>
          </linearGradient>
        </defs>
        <rect x="1.5" y="1.5" width="21" height="21" rx="6" fill="#16161A" stroke="rgba(255,255,255,0.12)"/>
        <path d="M7 8.5 12 6l5 2.5L12 11 7 8.5Z" fill="url(#sf-mg)"/>
        <path d="M7 12 12 14.5 17 12" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
        <path d="M7 15.5 12 18 17 15.5" stroke="rgba(255,255,255,0.32)" strokeWidth="1.4" fill="none" strokeLinejoin="round"/>
      </svg>
      {withText && (
        <span style={{ fontWeight: 600, letterSpacing: '-0.02em', fontSize: 14 }}>
          StackForge
        </span>
      )}
    </div>
  );
}

// ----- Sidebar -----
const SIDEBAR_NAV = [
  { key: 'workspace', label: 'Workspace', icon: 'Sparkle', shortcut: 'W' },
  { key: 'projects',  label: 'Projects',  icon: 'Folder',  shortcut: 'P' },
  { key: 'generations', label: 'Generations', icon: 'Layers', shortcut: 'G' },
  { key: 'templates', label: 'Templates', icon: 'Cube',    shortcut: 'T' },
  { key: 'deployments', label: 'Deployments', icon: 'Rocket', shortcut: 'D' },
];
const SIDEBAR_BOTTOM = [
  { key: 'docs', label: 'Documentation', icon: 'File' },
  { key: 'settings', label: 'Settings', icon: 'Settings' },
];

function Sidebar({ active = 'workspace', onNav, projects = [], collapsed = false }) {
  const Icons = I();
  const Item = ({ it, isActive }) => {
    const Ic = Icons[it.icon];
    return (
      <button
        onClick={() => onNav?.(it.key)}
        className="sf-row"
        style={{
          width: '100%', gap: 10, padding: '7px 10px',
          background: isActive ? 'rgba(255,255,255,0.05)' : 'transparent',
          border: '1px solid', borderColor: isActive ? 'var(--sf-border)' : 'transparent',
          borderRadius: 8, color: isActive ? 'var(--sf-text)' : 'var(--sf-text-muted)',
          fontSize: 13, cursor: 'pointer', textAlign: 'left',
          fontFamily: 'inherit', letterSpacing: '-0.005em',
        }}
        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
      >
        <Ic size={15} />
        {!collapsed && <span className="sf-grow">{it.label}</span>}
        {!collapsed && it.shortcut && <span className="sf-kbd" style={{ opacity: isActive ? 1 : 0.6 }}>{it.shortcut}</span>}
      </button>
    );
  };
  return (
    <aside style={{
      width: collapsed ? 56 : 240, flex: '0 0 auto',
      borderRight: '1px solid var(--sf-border)',
      background: 'var(--sf-bg-2)',
      display: 'flex', flexDirection: 'column',
      padding: '14px 10px 12px',
    }}>
      <div className="sf-row" style={{ gap: 8, padding: '4px 8px 14px' }}>
        <SFLogo withText={!collapsed} />
        {!collapsed && <span className="sf-grow" />}
        {!collapsed && (
          <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: '0 6px' }} aria-label="New">
            <Icons.Plus size={13} />
          </button>
        )}
      </div>

      {/* Workspace switcher */}
      {!collapsed && (
        <button className="sf-row" style={{
          width: '100%', gap: 10, padding: '8px 10px', marginBottom: 14,
          background: 'var(--sf-surface)', border: '1px solid var(--sf-border)',
          borderRadius: 8, cursor: 'pointer', color: 'var(--sf-text)',
          fontFamily: 'inherit', textAlign: 'left',
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: 'linear-gradient(135deg, oklch(0.72 0.16 250), oklch(0.72 0.16 290))',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10.5, fontWeight: 600, color: '#0A0A0B',
          }}>A</div>
          <span className="sf-grow" style={{ fontSize: 13, fontWeight: 500 }}>Acme Studio</span>
          <Icons.ChevD size={13} />
        </button>
      )}

      <nav className="sf-col" style={{ gap: 2 }}>
        {SIDEBAR_NAV.map(it => <Item key={it.key} it={it} isActive={active === it.key} />)}
      </nav>

      {/* Project list */}
      {!collapsed && projects.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <div className="sf-row" style={{ padding: '0 10px 6px', justifyContent: 'space-between' }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.06em', color: 'var(--sf-text-faint)', textTransform: 'uppercase' }}>Recent</span>
            <Icons.Plus size={12} cls="sf-faint" />
          </div>
          <div className="sf-col" style={{ gap: 1 }}>
            {projects.map(p => (
              <button key={p.id} className="sf-row" style={{
                width: '100%', gap: 8, padding: '5px 10px',
                background: 'transparent', border: 'none', borderRadius: 6,
                color: 'var(--sf-text-muted)', fontSize: 12.5, cursor: 'pointer',
                textAlign: 'left', fontFamily: 'inherit',
              }}>
                <span className={`sf-dot sf-dot--${p.dot || 'gray'}`} />
                <span className="sf-grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="sf-grow" />

      <nav className="sf-col" style={{ gap: 2, paddingTop: 8, borderTop: '1px solid var(--sf-border)' }}>
        {SIDEBAR_BOTTOM.map(it => <Item key={it.key} it={it} isActive={active === it.key} />)}
      </nav>

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
          <button className="sf-btn sf-btn--sm" style={{ width: '100%', marginTop: 10, justifyContent: 'center' }}>Upgrade plan</button>
        </div>
      )}
    </aside>
  );
}

// ----- Topbar -----
function Topbar({ breadcrumbs = [], right = null, withSearch = true }) {
  const Icons = I();
  return (
    <div className="sf-row" style={{
      height: 48, padding: '0 16px',
      borderBottom: '1px solid var(--sf-border)',
      background: 'var(--sf-bg)',
      gap: 12, flex: '0 0 auto',
    }}>
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
        <button className="sf-row" style={{
          gap: 8, padding: '0 10px', height: 30,
          background: 'var(--sf-surface)', border: '1px solid var(--sf-border)',
          borderRadius: 8, color: 'var(--sf-text-dim)', fontSize: 12.5,
          cursor: 'pointer', fontFamily: 'inherit',
          minWidth: 220,
        }}>
          <Icons.Search size={13} />
          <span className="sf-grow" style={{ textAlign: 'left' }}>Search or run command…</span>
          <span className="sf-kbd">⌘K</span>
        </button>
      )}
      {right}
      <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: '0 7px' }} aria-label="Notifications">
        <Icons.Bell size={14} />
      </button>
      <div className="sf-avatar">JD</div>
    </div>
  );
}

window.SFLogo = SFLogo;
window.Sidebar = Sidebar;
window.Topbar = Topbar;
