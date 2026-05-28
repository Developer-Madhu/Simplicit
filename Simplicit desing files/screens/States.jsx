// StackForge States — empty states + AI thinking / loading states.

// ============================================================
// EMPTY STATES — each a full screen variant
// ============================================================

function EmptyShell({ active = 'projects', title, breadcrumbs, children }) {
  return (
    <div className="sf-app" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--sf-bg)' }}>
      <window.Sidebar active={active} projects={[]} />
      <div className="sf-col sf-grow" style={{ minWidth: 0 }}>
        <window.Topbar breadcrumbs={breadcrumbs} />
        <main className="sf-grow sf-scroll" style={{ overflow: 'auto', display: 'flex' }}>
          {children}
        </main>
      </div>
    </div>
  );
}

const EmptyProjects = () => {
  const Icons = window.Icons;
  return (
    <EmptyShell active="projects" breadcrumbs={['Acme Studio', 'Projects']}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ maxWidth: 520, textAlign: 'center' }}>
          {/* Illustrative scaffold */}
          <div style={{
            width: 220, height: 140, margin: '0 auto 28px',
            position: 'relative', borderRadius: 14, overflow: 'hidden',
            background: 'var(--sf-bg-2)', border: '1px solid var(--sf-border)',
          }}>
            <div className="sf-linegrid" style={{ position: 'absolute', inset: 0, opacity: 0.7 }} />
            <div style={{
              position: 'absolute', left: '20%', top: '24%', width: '60%', height: '50%',
              border: '1.5px dashed rgba(255,255,255,0.18)', borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--sf-text-faint)',
            }}>
              <Icons.Plus size={22} />
            </div>
          </div>

          <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
            No projects yet
          </h2>
          <p className="sf-muted" style={{ fontSize: 14, margin: '0 0 24px', lineHeight: 1.5 }}>
            Describe what you want to build. StackForge will design a backend,
            generate the code, and let you deploy it in minutes.
          </p>
          <div className="sf-row" style={{ gap: 8, justifyContent: 'center' }}>
            <button className="sf-btn sf-btn--primary"><Icons.Sparkle size={12} /> Generate first backend</button>
            <button className="sf-btn"><Icons.Cube size={12} /> Browse templates</button>
          </div>

          {/* Starter prompt suggestions */}
          <div style={{ marginTop: 36 }}>
            <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
              Or start from a prompt
            </div>
            <div className="sf-col" style={{ gap: 6 }}>
              {[
                '"Backend for an online exam platform with proctoring and payments"',
                '"Marketplace API with escrow and seller onboarding"',
                '"AI document workspace with shared prompts and usage limits"',
              ].map(p => (
                <button key={p} className="sf-card sf-row" style={{
                  padding: '10px 14px', gap: 10, cursor: 'pointer',
                  fontFamily: 'inherit', color: 'var(--sf-text-muted)', fontSize: 12.5,
                  textAlign: 'left',
                }}>
                  <Icons.Sparkle size={11} cls="sf-faint" />
                  <span className="sf-grow">{p}</span>
                  <Icons.ArrowR size={11} cls="sf-faint" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </EmptyShell>
  );
};

const EmptyFailed = () => {
  const Icons = window.Icons;
  return (
    <EmptyShell active="generations" breadcrumbs={['Acme Studio', 'Examly API', 'Generation #043']}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
        <div style={{ maxWidth: 560, textAlign: 'center' }}>
          <div style={{
            width: 48, height: 48, borderRadius: 12, margin: '0 auto 22px',
            background: 'oklch(0.35 0.12 25 / 0.20)', border: '1px solid oklch(0.4 0.12 25 / 0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--sf-red)',
          }}>
            <Icons.AlertTri size={20} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 8px' }}>
            Generation failed
          </h2>
          <p className="sf-muted" style={{ fontSize: 14, margin: '0 0 22px', lineHeight: 1.5 }}>
            The architect agent couldn't reconcile two requirements in your prompt.
            Adjust the prompt or split the project, then try again.
          </p>

          <div className="sf-card" style={{ padding: 14, textAlign: 'left', marginBottom: 18 }}>
            <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>Conflict</div>
            <div style={{ fontSize: 13, lineHeight: 1.5 }}>
              "Use Supabase for auth" and "Self-host on Railway with Lucia" point to two different auth strategies.
              Pick one — or generate two services if you need both.
            </div>
            <div className="sf-row" style={{ gap: 6, marginTop: 12 }}>
              <button className="sf-btn sf-btn--sm">Use Supabase Auth</button>
              <button className="sf-btn sf-btn--sm">Use Lucia</button>
            </div>
          </div>

          <div className="sf-row" style={{ gap: 8, justifyContent: 'center' }}>
            <button className="sf-btn"><Icons.Refresh size={12} /> Try again</button>
            <button className="sf-btn"><Icons.Code size={12} /> Edit prompt</button>
            <button className="sf-btn sf-btn--ghost"><Icons.File size={12} /> View logs</button>
          </div>
        </div>
      </div>
    </EmptyShell>
  );
};

const EmptyAPIKeys = () => {
  const Icons = window.Icons;
  return (
    <EmptyShell active="settings" breadcrumbs={['Acme Studio', 'Settings', 'API keys']}>
      <div style={{ flex: 1, padding: 40 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 6px' }}>API keys</h2>
          <p className="sf-muted" style={{ fontSize: 13.5, margin: '0 0 24px' }}>Use these to call StackForge from your own scripts and CI.</p>

          <div className="sf-card" style={{ padding: 40, textAlign: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, margin: '0 auto 18px',
              background: 'var(--sf-surface-2)', border: '1px solid var(--sf-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icons.Key size={18} cls="sf-muted" />
            </div>
            <h3 style={{ fontSize: 16, fontWeight: 500, margin: '0 0 6px' }}>No API keys yet</h3>
            <p className="sf-muted" style={{ fontSize: 13, margin: '0 0 20px', maxWidth: 380, marginLeft: 'auto', marginRight: 'auto' }}>
              Create a key to use the StackForge CLI or call our HTTP API from your own scripts. Keys are shown once and never stored in plaintext.
            </p>
            <button className="sf-btn sf-btn--primary"><Icons.Plus size={12} /> Create your first key</button>
            <div className="sf-row" style={{ justifyContent: 'center', marginTop: 14, fontSize: 11.5, color: 'var(--sf-text-faint)' }}>
              <a className="sf-row" style={{ gap: 6 }}><Icons.File size={11} /> Read the API docs</a>
            </div>
          </div>
        </div>
      </div>
    </EmptyShell>
  );
};

const EmptyIntegrations = () => {
  const Icons = window.Icons;
  return (
    <EmptyShell active="settings" breadcrumbs={['Acme Studio', 'Settings', 'Integrations']}>
      <div style={{ flex: 1, padding: 40 }}>
        <div style={{ maxWidth: 880, margin: '0 auto' }}>
          <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 6px' }}>Integrations</h2>
          <p className="sf-muted" style={{ fontSize: 13.5, margin: '0 0 24px' }}>Connect StackForge to the services your team already uses.</p>

          <div className="sf-card" style={{ padding: 16, marginBottom: 24, background: 'var(--sf-surface)' }}>
            <div className="sf-row" style={{ gap: 12 }}>
              <Icons.Info size={14} cls="" />
              <span style={{ fontSize: 13 }}>You haven't connected any integrations yet. Connect at least GitHub to deploy.</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { ic: 'Github',   t: 'GitHub',     d: 'Push generated projects to repositories.', recommended: true },
              { ic: 'Cloud',    t: 'Vercel',     d: 'Deploy generated projects to Vercel.' },
              { ic: 'Rocket',   t: 'Railway',    d: 'One-click backend deploy.' },
              { ic: 'Database', t: 'Supabase',   d: 'Use Supabase for Postgres + Auth.' },
              { ic: 'Database', t: 'Neon',       d: 'Serverless Postgres branches.' },
              { ic: 'Zap',      t: 'Stripe',     d: 'Wire up payments end-to-end.' },
            ].map(it => {
              const Ic = Icons[it.ic];
              return (
                <div key={it.t} className="sf-card" style={{ padding: 16 }}>
                  <div className="sf-row" style={{ marginBottom: 14 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--sf-surface-2)', border: '1px solid var(--sf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Ic size={13} />
                    </div>
                    <span className="sf-grow" />
                    {it.recommended && <span className="sf-chip">Recommended</span>}
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{it.t}</div>
                  <p className="sf-muted" style={{ fontSize: 12, margin: '4px 0 16px' }}>{it.d}</p>
                  <button className="sf-btn sf-btn--sm" style={{ width: '100%', justifyContent: 'center' }}>Connect</button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </EmptyShell>
  );
};

// ============================================================
// LOADING / AI THINKING
// ============================================================

const AIThinking = () => {
  const Icons = window.Icons;
  const { useState, useEffect } = React;

  // Animated progress
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 800);
    return () => clearInterval(id);
  }, []);

  const stages = [
    { l: 'Parsing requirements',    pct: 100 },
    { l: 'Selecting stack',         pct: 100 },
    { l: 'Designing schema',        pct: 100 },
    { l: 'Mapping API surface',     pct: 78  },
    { l: 'Authoring auth flow',     pct: 0   },
    { l: 'Wiring background jobs',  pct: 0   },
    { l: 'Generating IaC',          pct: 0   },
  ];

  // Streaming files
  const files = [
    'apps/api/src/index.ts',
    'apps/api/src/app.ts',
    'apps/api/src/modules/auth/routes.ts',
    'apps/api/src/modules/auth/service.ts',
    'apps/api/src/modules/exams/routes.ts',
    'apps/api/src/modules/exams/service.ts',
    'apps/api/src/modules/exams/autograde.ts',
    'apps/api/src/modules/payments/routes.ts',
    'packages/db/schema.ts',
    'packages/db/migrations/0001_init.sql',
  ];

  return (
    <div className="sf-app" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--sf-bg)' }}>
      <window.Sidebar active="workspace" projects={window.SF_PROJECTS.slice(0,4)} collapsed />
      <div className="sf-col sf-grow" style={{ minWidth: 0, position: 'relative' }}>
        <window.Topbar breadcrumbs={['Acme Studio', 'Workspace', 'Generation #043']} withSearch={false} right={
          <button className="sf-btn sf-btn--sm"><Icons.Stop size={11} /> Stop</button>
        } />

        <main style={{ flex: 1, minHeight: 0, position: 'relative', overflow: 'hidden' }}>
          {/* Background grids */}
          <div className="sf-dotgrid" style={{ position: 'absolute', inset: 0, opacity: 0.5 }} />
          <div aria-hidden style={{
            position: 'absolute', left: '50%', top: '20%', width: 720, height: 480,
            transform: 'translateX(-50%)',
            background: 'radial-gradient(ellipse, oklch(0.4 0.14 250 / 0.18), transparent 70%)',
            filter: 'blur(40px)', pointerEvents: 'none',
          }} />

          <div className="sf-grow sf-scroll" style={{ position: 'absolute', inset: 0, overflow: 'auto', padding: '36px 40px' }}>
            <div style={{ maxWidth: 1080, margin: '0 auto' }}>
              {/* Header */}
              <div className="sf-row" style={{ gap: 10, marginBottom: 16 }}>
                <span className="sf-chip" style={{ height: 26, padding: '0 12px' }}>
                  <span className="sf-dot sf-dot--blue sf-pulse" /> Architecting · 12.4s elapsed
                </span>
                <span className="sf-chip sf-chip-mono">claude-architect</span>
                <span className="sf-grow" />
                <span className="mono sf-faint" style={{ fontSize: 11 }}>~ 28s remaining</span>
              </div>

              <h1 style={{ fontSize: 32, fontWeight: 500, letterSpacing: '-0.025em', margin: '0 0 6px' }}>
                Designing your backend<span className="sf-caret" />
              </h1>
              <p className="sf-muted" style={{ fontSize: 14, margin: '0 0 28px', maxWidth: 700 }}>
                Each step is reasoned, verified, and streamed to the file system in real time.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {/* Reasoning timeline */}
                <div className="sf-card-elev" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="sf-row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--sf-border)' }}>
                    <span className="sf-h3 sf-grow">Reasoning</span>
                    <span className="sf-chip sf-chip-mono">3 / 7</span>
                  </div>
                  <div style={{ padding: '6px 16px 14px' }}>
                    {stages.map((s, i) => (
                      <div key={i} className="sf-row" style={{ gap: 10, padding: '8px 0' }}>
                        <div style={{
                          width: 16, height: 16, borderRadius: 999, flex: '0 0 auto',
                          background: s.pct === 100 ? 'var(--sf-text)' : 'transparent',
                          border: s.pct > 0 && s.pct < 100 ? '1.5px solid var(--sf-blue)' : (s.pct === 100 ? 'none' : '1.5px solid var(--sf-border-strong)'),
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                          {s.pct === 100 && <Icons.Check size={9} />}
                          {s.pct > 0 && s.pct < 100 && <span className="sf-dot sf-dot--blue sf-pulse" />}
                        </div>
                        <div className="sf-grow">
                          <div className="sf-row">
                            <span style={{ fontSize: 13, color: s.pct === 0 ? 'var(--sf-text-muted)' : 'var(--sf-text)' }}>
                              {s.l}{s.pct > 0 && s.pct < 100 && <span className="sf-caret" />}
                            </span>
                            <span className="sf-grow" />
                            {s.pct > 0 && s.pct < 100 && <span className="mono sf-faint" style={{ fontSize: 10.5 }}>{s.pct}%</span>}
                          </div>
                          {s.pct > 0 && s.pct < 100 && (
                            <div style={{ marginTop: 6 }}>
                              <window.Progress value={s.pct} color="var(--sf-blue)" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Live file stream */}
                <div className="sf-card-elev" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="sf-row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--sf-border)' }}>
                    <span className="sf-h3 sf-grow">Writing files</span>
                    <span className="mono sf-faint" style={{ fontSize: 11 }}>76 / 124</span>
                  </div>
                  <div className="sf-code sf-scroll" style={{ border: 'none', borderRadius: 0, padding: '12px 16px', fontSize: 11.5, lineHeight: 1.8, maxHeight: 240, overflow: 'auto' }}>
                    {files.map((f, i) => {
                      const done = i < files.length - 2;
                      const active = i === files.length - 2;
                      return (
                        <div key={i} style={{ opacity: i < files.length - 2 - 6 ? 0.4 : 1 }}>
                          <span className="tok-cmt">[15:42:{(i*3 + 12).toString().padStart(2, '0')}]</span>
                          {' '}
                          {done && <span className="tok-str">+ write </span>}
                          {active && <span className="tok-num">› writing </span>}
                          <span className="tok-prop">{f}</span>
                          {done && <span className="mono sf-faint"> +{Math.floor(Math.random()*200 + 30)}</span>}
                          {active && <span className="sf-caret" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Progressive architecture preview */}
              <div className="sf-card-elev sf-linegrid" style={{
                marginTop: 16, padding: 0, height: 320, position: 'relative', overflow: 'hidden',
              }}>
                <div className="sf-row" style={{ padding: '12px 16px', borderBottom: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)' }}>
                  <span className="sf-h3 sf-grow">Architecture</span>
                  <span className="sf-chip sf-chip-mono"><span className="sf-dot sf-dot--blue sf-pulse" /> 7 / 10 nodes</span>
                </div>
                <div style={{ position: 'absolute', inset: 48 + 8, transform: 'scale(0.7)', transformOrigin: 'top left', width: '145%' }}>
                  {window.SF_ARCH.nodes.slice(0, 7).map(n => <window.ArchNode key={n.id} {...n} status />)}
                  <svg style={{ position: 'absolute', inset: 0 }} width="1200" height="320">
                    {window.SF_ARCH.edges.slice(0, 8).map(([f, t, l], i) => {
                      const nodeById = Object.fromEntries(window.SF_ARCH.nodes.map(n => [n.id, n]));
                      const from = { x: nodeById[f].x + 160, y: nodeById[f].y + 32 };
                      const to   = { x: nodeById[t].x,        y: nodeById[t].y + 32 };
                      return <window.ArchEdge key={i} from={from} to={to} label={l} animated />;
                    })}
                  </svg>
                </div>
                {/* Streaming dots */}
                <div className="sf-row" style={{ position: 'absolute', bottom: 10, left: 16, gap: 5 }}>
                  {[0,1,2].map(i => <span key={i} className="sf-dot sf-dot--blue sf-pulse" style={{ animationDelay: `${i*0.2}s` }} />)}
                  <span className="mono sf-faint" style={{ fontSize: 10.5, marginLeft: 4 }}>streaming…</span>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

const SkeletonLoading = () => {
  return (
    <div className="sf-app" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--sf-bg)' }}>
      <window.Sidebar active="projects" projects={[]} />
      <div className="sf-col sf-grow" style={{ minWidth: 0 }}>
        <window.Topbar breadcrumbs={['Acme Studio', 'Projects']} />
        <main className="sf-grow sf-scroll" style={{ overflow: 'auto', padding: 28 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            <div className="sf-skel" style={{ width: 180, height: 28, marginBottom: 8 }} />
            <div className="sf-skel" style={{ width: 320, height: 14, marginBottom: 24 }} />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              {[1,2,3,4].map(i => (
                <div key={i} className="sf-card" style={{ padding: 16 }}>
                  <div className="sf-skel" style={{ width: 80, height: 12, marginBottom: 14 }} />
                  <div className="sf-skel" style={{ width: 60, height: 28 }} />
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {Array.from({length: 6}).map((_, i) => (
                <div key={i} className="sf-card" style={{ padding: 18, minHeight: 160 }}>
                  <div className="sf-row" style={{ gap: 10, marginBottom: 18 }}>
                    <div className="sf-skel" style={{ width: 32, height: 32, borderRadius: 8 }} />
                    <span className="sf-grow" />
                    <div className="sf-skel" style={{ width: 50, height: 18, borderRadius: 999 }} />
                  </div>
                  <div className="sf-skel" style={{ width: '60%', height: 14, marginBottom: 8 }} />
                  <div className="sf-skel" style={{ width: '90%', height: 12, marginBottom: 6 }} />
                  <div className="sf-skel" style={{ width: '40%', height: 12, marginBottom: 18 }} />
                  <div className="sf-row" style={{ gap: 6 }}>
                    <div className="sf-skel" style={{ width: 50, height: 16, borderRadius: 999 }} />
                    <div className="sf-skel" style={{ width: 50, height: 16, borderRadius: 999 }} />
                    <div className="sf-skel" style={{ width: 50, height: 16, borderRadius: 999 }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

Object.assign(window, { EmptyProjects, EmptyFailed, EmptyAPIKeys, EmptyIntegrations, AIThinking, SkeletonLoading });
