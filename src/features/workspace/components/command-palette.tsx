import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Sparkles, Box, Rocket, Github, Database, Server, Lock, Layers3, Key } from "lucide-react";

const commandGroups = [
  { label: 'Actions', items: [
    { ic: Sparkles, t: 'New generation', sub: 'Start a fresh prompt', k: '⌘N' },
    { ic: Box,  t: 'Open project…',   sub: 'Select from workspace', k: '⌘O' },
    { ic: Rocket,  t: 'Deploy current',  sub: 'Deploy current project', k: '⌘⇧D' },
    { ic: Github,  t: 'Push to GitHub',  sub: 'Push current project' },
  ]},
  { label: 'Generate', items: [
    { ic: Database, t: 'Generate schema',   sub: 'Add or extend tables' },
    { ic: Server,   t: 'Generate module',   sub: 'New API surface' },
    { ic: Lock,     t: 'Generate auth flow', sub: 'OAuth · Email · SSO' },
  ]},
  { label: 'Navigate', items: [
    { ic: Layers3,   t: 'Architecture',     sub: 'System diagram' },
    { ic: Key, t: 'Settings · API keys', sub: '' },
  ]},
];

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => { 
    inputRef.current?.focus(); 
  }, []);

  const filteredGroups = useMemo(() => {
    if (!q) return commandGroups;
    return commandGroups.map(g => {
      const items = g.items.filter(it => it.t.toLowerCase().includes(q.toLowerCase()) || it.sub.toLowerCase().includes(q.toLowerCase()));
      return { ...g, items };
    }).filter(g => g.items.length > 0);
  }, [q]);

  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      backdropFilter: 'blur(4px)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      paddingTop: '12vh',
    }}>
      <div onClick={e => e.stopPropagation()} className="sf-card-elev" style={{
        width: 560, maxWidth: '92vw', boxShadow: '0 40px 100px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06) inset',
        overflow: 'hidden',
      }}>
        <div className="sf-row" style={{ padding: '12px 16px', gap: 10, borderBottom: '1px solid var(--sf-border)' }}>
          <Search size={14} className="sf-muted" />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Type a command or search…" style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--sf-text)', fontFamily: 'inherit', fontSize: 14,
          }}/>
          <span className="sf-kbd">esc</span>
        </div>
        <div className="sf-scroll" style={{ maxHeight: 380, overflow: 'auto', padding: '8px 8px 12px' }}>
          {filteredGroups.map(g => (
            <div key={g.label} style={{ marginTop: 8 }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--sf-text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px' }}>{g.label}</div>
              {g.items.map((it, i) => {
                const Ic = it.ic;
                return (
                  <div key={i} className="sf-row" style={{
                    padding: '8px 10px', gap: 12, borderRadius: 6, cursor: 'pointer',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Ic size={14} className="sf-muted" />
                    <div className="sf-grow">
                      <div style={{ fontSize: 13, color: 'var(--sf-text)' }}>{it.t}</div>
                      {it.sub && <div className="sf-faint" style={{ fontSize: 11.5 }}>{it.sub}</div>}
                    </div>
                    {it.k && <span className="sf-kbd">{it.k}</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
