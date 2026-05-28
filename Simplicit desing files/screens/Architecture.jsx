// StackForge Architecture Preview — full canvas with draggable nodes,
// service relationships, zoom controls, minimap, sidebar.

const Architecture = () => {
  const Icons = window.Icons;
  const { useState } = React;
  const [selected, setSelected] = useState('api');
  const [layer, setLayer] = useState('services');

  const A = window.SF_ARCH;
  const nodeById = Object.fromEntries(A.nodes.map(n => [n.id, n]));
  const sel = nodeById[selected];

  // Canvas size
  const W = 1240, H = 600;

  return (
    <div className="sf-app" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--sf-bg)' }}>
      <window.Sidebar active="generations" projects={window.SF_PROJECTS.slice(0,4)} />
      <div className="sf-col sf-grow" style={{ minWidth: 0 }}>
        <window.Topbar
          breadcrumbs={['Acme Studio', 'Examly API', 'Architecture']}
          right={<>
            <button className="sf-btn sf-btn--sm"><Icons.Refresh size={11} /> Regenerate</button>
            <button className="sf-btn sf-btn--sm"><Icons.Download size={11} /> Export SVG</button>
            <button className="sf-btn sf-btn--primary sf-btn--sm"><Icons.Github size={11} /> Push</button>
          </>}
        />

        <div className="sf-row sf-grow" style={{ minHeight: 0 }}>
          {/* Left layers panel */}
          <aside style={{ width: 220, flex: '0 0 auto', borderRight: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)', padding: '14px 12px' }}>
            <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px 8px' }}>Layers</div>
            {[
              { id: 'services', label: 'Services',     n: 6 },
              { id: 'data',     label: 'Data',         n: 3 },
              { id: 'auth',     label: 'Auth flow',    n: 4 },
              { id: 'api',      label: 'API surface',  n: 38 },
              { id: 'jobs',     label: 'Background jobs', n: 4 },
              { id: 'deploy',   label: 'Deploy targets', n: 2 },
            ].map(l => (
              <button key={l.id} onClick={() => setLayer(l.id)} className="sf-row" style={{
                width: '100%', gap: 10, padding: '7px 10px',
                background: layer === l.id ? 'rgba(255,255,255,0.05)' : 'transparent',
                borderRadius: 6, border: '1px solid', borderColor: layer === l.id ? 'var(--sf-border)' : 'transparent',
                color: layer === l.id ? 'var(--sf-text)' : 'var(--sf-text-muted)',
                fontFamily: 'inherit', fontSize: 12.5, cursor: 'pointer', textAlign: 'left',
              }}>
                <span className="sf-grow">{l.label}</span>
                <span className="mono sf-faint" style={{ fontSize: 10.5 }}>{l.n}</span>
              </button>
            ))}

            <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '20px 10px 8px' }}>Legend</div>
            {[
              { c: 'blue',   l: 'Client / edge' },
              { c: 'purple', l: 'Service' },
              { c: 'green',  l: 'Data store' },
              { c: 'amber',  l: 'Payments' },
            ].map(x => (
              <div key={x.c} className="sf-row" style={{ padding: '4px 10px', gap: 10, fontSize: 12, color: 'var(--sf-text-muted)' }}>
                <span className={`sf-dot sf-dot--${x.c}`} /> {x.l}
              </div>
            ))}

            <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '20px 10px 8px' }}>Generated</div>
            <div style={{ padding: '4px 10px', fontSize: 12, color: 'var(--sf-text-muted)' }}>
              6.4s · 10 nodes<br/>13 edges · 11 tables
            </div>
          </aside>

          {/* Main canvas */}
          <main style={{ flex: 1, position: 'relative', overflow: 'hidden', background: 'var(--sf-bg)' }}>
            <div className="sf-linegrid" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
            <div style={{ position: 'absolute', inset: 0, padding: '24px 28px', overflow: 'auto' }} className="sf-scroll">
              <div style={{ position: 'relative', width: W, height: H }}>
                {/* Edges */}
                <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
                  {A.edges.map(([f, t, l], i) => {
                    const from = { x: nodeById[f].x + 160, y: nodeById[f].y + 32 };
                    const to   = { x: nodeById[t].x,        y: nodeById[t].y + 32 };
                    return <window.ArchEdge key={i} from={from} to={to} label={l} animated={i % 3 === 0} />;
                  })}
                </svg>
                {/* Nodes */}
                {A.nodes.map(n => (
                  <div key={n.id} onClick={() => setSelected(n.id)} style={{
                    position: 'absolute', left: n.x, top: n.y,
                    cursor: 'pointer', filter: selected === n.id ? 'drop-shadow(0 0 0 1px var(--sf-text))' : 'none',
                  }}>
                    <window.ArchNode {...n} status />
                    {selected === n.id && (
                      <div style={{
                        position: 'absolute', inset: -3, borderRadius: 12,
                        border: '1.5px solid var(--sf-text)', pointerEvents: 'none',
                      }} />
                    )}
                  </div>
                ))}

                {/* Cluster labels */}
                <div style={{ position: 'absolute', left: 460, top: -22 }} className="mono sf-faint" style={{ fontSize: 11, position: 'absolute', left: 470, top: -22, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  api · /v1
                </div>
              </div>
            </div>

            {/* Floating toolbar */}
            <div style={{ position: 'absolute', top: 16, left: 16 }} className="sf-row sf-card-elev" >
              <div className="sf-row" style={{ padding: 4, gap: 2 }}>
                {['Pan','Select','Annotate'].map((m, i) => (
                  <button key={m} className="sf-row" style={{
                    height: 26, padding: '0 10px', borderRadius: 6, border: 'none',
                    background: i === 0 ? 'var(--sf-elevated)' : 'transparent',
                    color: i === 0 ? 'var(--sf-text)' : 'var(--sf-text-muted)',
                    fontFamily: 'inherit', fontSize: 11.5, cursor: 'pointer',
                  }}>{m}</button>
                ))}
              </div>
            </div>

            {/* Zoom controls */}
            <div className="sf-row sf-card-elev" style={{ position: 'absolute', bottom: 16, left: 16, padding: 4, gap: 2 }}>
              <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: '0 7px' }}>−</button>
              <span className="mono" style={{ fontSize: 11, padding: '0 8px', color: 'var(--sf-text-muted)' }}>100%</span>
              <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: '0 7px' }}>+</button>
              <div className="sf-vdivider" style={{ height: 16, margin: '0 4px' }} />
              <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: '0 7px' }}>fit</button>
              <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: '0 7px' }}>1:1</button>
            </div>

            {/* Minimap */}
            <div className="sf-card-elev" style={{
              position: 'absolute', bottom: 16, right: 16, width: 220, height: 130,
              padding: 6, background: 'var(--sf-surface-2)', overflow: 'hidden',
            }}>
              <div className="sf-row" style={{ padding: '2px 6px 6px' }}>
                <span className="mono sf-faint" style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Minimap</span>
                <span className="sf-grow" />
                <Icons.More size={11} cls="sf-faint" />
              </div>
              <div className="sf-linegrid" style={{ position: 'relative', width: '100%', height: 92, borderRadius: 4, overflow: 'hidden', background: 'var(--sf-bg)' }}>
                <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.16)', transformOrigin: 'top left', width: 1240, height: 600 }}>
                  {A.nodes.map(n => (
                    <div key={n.id} style={{
                      position: 'absolute', left: n.x, top: n.y, width: 160, height: 64,
                      background: 'rgba(255,255,255,0.10)', borderRadius: 8,
                    }} />
                  ))}
                </div>
                <div style={{ position: 'absolute', left: '5%', top: '8%', width: '60%', height: '70%', border: '1px solid var(--sf-text)', borderRadius: 3 }} />
              </div>
            </div>
          </main>

          {/* Right inspector */}
          <aside style={{ width: 320, flex: '0 0 auto', borderLeft: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)', padding: 18, overflow: 'auto' }} className="sf-scroll">
            <div className="sf-row" style={{ marginBottom: 14 }}>
              <span className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Inspector</span>
              <span className="sf-grow" />
              <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: '0 5px' }}><Icons.X size={11} /></button>
            </div>
            <div className="sf-row" style={{ gap: 10, marginBottom: 14 }}>
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(() => { const Ic = Icons[sel.icon]; return <Ic size={15} />; })()}
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{sel.title}</div>
                <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{sel.kind}</div>
              </div>
            </div>

            <div className="sf-card" style={{ padding: 12, marginBottom: 12 }}>
              <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Implementation</div>
              <div className="mono" style={{ fontSize: 12 }}>{sel.subtitle}</div>
            </div>

            <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Connections</div>
            <div className="sf-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
              {A.edges.filter(([f, t]) => f === selected || t === selected).map(([f, t, l], i, arr) => {
                const other = f === selected ? t : f;
                const dir = f === selected ? '→' : '←';
                return (
                  <div key={i} className="sf-row" style={{ padding: '8px 12px', gap: 8, borderBottom: i < arr.length-1 ? '1px solid var(--sf-border)' : 'none' }}>
                    <span className="sf-faint" style={{ fontSize: 12 }}>{dir}</span>
                    <span style={{ fontSize: 12.5 }}>{nodeById[other].title}</span>
                    <span className="sf-grow" />
                    {l && <span className="mono sf-faint" style={{ fontSize: 10.5 }}>{l}</span>}
                  </div>
                );
              })}
            </div>

            <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>Properties</div>
            <div className="sf-card" style={{ padding: 12 }}>
              {[
                ['Replicas', '2 · auto-scale'],
                ['Region',   'iad1 · primary'],
                ['Memory',   '512 MB'],
                ['Concurrency', '50 / instance'],
                ['Auth',     'session · role-gated'],
              ].map(([k, v]) => (
                <div key={k} className="sf-row" style={{ padding: '6px 0', borderBottom: '1px dashed var(--sf-border)' }}>
                  <span className="mono sf-faint" style={{ fontSize: 11, width: 100 }}>{k}</span>
                  <span style={{ fontSize: 12.5 }}>{v}</span>
                </div>
              ))}
            </div>

            <button className="sf-btn sf-btn--sm" style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}>
              <Icons.Code size={11} /> View handler code
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
};

window.Architecture = Architecture;
