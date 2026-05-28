// Main AI Workspace — the centerpiece. Fully interactive.
// States: idle → composing → streaming → result.

const Workspace = () => {
  const { useState, useEffect, useRef, useMemo } = React;
  const Icons = window.Icons;

  // ----- State machine -----
  // 'idle' = empty prompt, presets visible
  // 'composing' = typing
  // 'streaming' = AI is "thinking" — progressive plan
  // 'done' = finished, modules + preview ready
  const [stage, setStage] = useState('idle');
  const [prompt, setPrompt] = useState('');
  const [streamStep, setStreamStep] = useState(0); // index into reasoning timeline
  const [previewTab, setPreviewTab] = useState('arch');
  const [stack, setStack] = useState('Hono');
  const [mode, setMode] = useState('exam');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [chips, setChips] = useState(['Postgres', 'Lucia auth', 'Stripe', 'Redis cache']);

  const presets = [
    { id: 'saas',    label: 'SaaS backend',         icon: 'Cube' },
    { id: 'market',  label: 'Marketplace',          icon: 'Globe' },
    { id: 'ai',      label: 'AI product',           icon: 'Sparkle' },
    { id: 'lms',     label: 'LMS',                  icon: 'File' },
    { id: 'exam',    label: 'Exam system',          icon: 'Layers' },
  ];

  const promptSuggestions = [
    'Add proctoring with snapshot intervals',
    'Use Cloudflare R2 for storage',
    'Generate seed data for 1k students',
    'Add audit logging on instructor mutations',
  ];

  const reasoning = [
    { label: 'Parsing requirements',     detail: '8 entities · 3 user roles · payments',           dur: 800 },
    { label: 'Selecting stack',          detail: 'Hono · PostgreSQL · Lucia · BullMQ',             dur: 700 },
    { label: 'Designing schema',         detail: '11 tables, 6 indexes, 3 enums',                  dur: 1200 },
    { label: 'Mapping API surface',      detail: '38 routes across 6 modules',                     dur: 900 },
    { label: 'Authoring auth flow',      detail: 'Email + OAuth, session + JWT',                   dur: 800 },
    { label: 'Wiring background jobs',   detail: 'Autograde · Analytics · Email',                  dur: 700 },
    { label: 'Generating IaC',           detail: 'Docker + Railway + .env',                        dur: 600 },
    { label: 'Validating architecture',  detail: 'All references resolved',                        dur: 500 },
  ];

  // Run the streaming animation
  useEffect(() => {
    if (stage !== 'streaming') return;
    if (streamStep >= reasoning.length) {
      const t = setTimeout(() => setStage('done'), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStreamStep(s => s + 1), reasoning[streamStep].dur);
    return () => clearTimeout(t);
  }, [stage, streamStep]);

  // Cmd+K palette
  useEffect(() => {
    const onKey = e => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(o => !o); }
      if (e.key === 'Escape') setPaletteOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const startGeneration = () => {
    if (!prompt.trim()) {
      setPrompt(window.SF_PROMPT);
    }
    setStage('streaming');
    setStreamStep(0);
  };

  const resetAll = () => { setStage('idle'); setStreamStep(0); setPrompt(''); };

  // ===== Render helpers =====
  const StackToken = ({ children, accent }) => (
    <span className="sf-chip sf-chip-mono" style={{
      background: accent ? `oklch(0.30 0.10 ${accent} / 0.18)` : 'rgba(255,255,255,0.04)',
      color: accent ? `oklch(0.82 0.14 ${accent})` : 'var(--sf-text-muted)',
      borderColor: accent ? `oklch(0.40 0.10 ${accent} / 0.3)` : 'var(--sf-border)',
    }}>{children}</span>
  );

  // ===== Composer =====
  const Composer = () => (
    <div style={{ width: '100%', maxWidth: 760 }}>
      <div className="sf-row" style={{ gap: 8, marginBottom: 18, justifyContent: 'center' }}>
        <span className="sf-chip" style={{ height: 24, padding: '0 10px' }}>
          <Icons.Sparkle size={11} cls="" /> StackForge · v2.4
        </span>
        <span className="sf-chip sf-chip-mono" style={{ height: 24, padding: '0 10px' }}>
          claude-architect
        </span>
      </div>
      <h1 className="sf-h1" style={{ textAlign: 'center', marginBottom: 10, fontSize: 32 }}>
        What are you shipping?
      </h1>
      <p className="sf-muted" style={{ textAlign: 'center', marginBottom: 28, fontSize: 14 }}>
        Describe your product in plain English. StackForge will design a production-ready backend.
      </p>

      {/* Big prompt card */}
      <div className="sf-card-elev" style={{
        padding: 0, overflow: 'hidden',
        boxShadow: '0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset',
      }}>
        <textarea
          value={prompt}
          onChange={e => { setPrompt(e.target.value); setStage(e.target.value ? 'composing' : 'idle'); }}
          onKeyDown={e => { if ((e.metaKey||e.ctrlKey) && e.key === 'Enter') startGeneration(); }}
          placeholder="Build backend for an online exam platform with student auth, instructor dashboard, analytics, payments, and test management."
          rows={4}
          style={{
            width: '100%', padding: '20px 22px', resize: 'none',
            background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--sf-text)', fontFamily: 'var(--sf-font-sans)',
            fontSize: 15, lineHeight: 1.55, letterSpacing: '-0.005em',
          }}
        />
        {/* Toolbar */}
        <div className="sf-row" style={{
          padding: '10px 14px', gap: 8,
          borderTop: '1px solid var(--sf-border)',
          background: 'var(--sf-bg-2)',
        }}>
          <button className="sf-btn sf-btn--sm sf-btn--ghost" style={{ padding: '0 8px' }}>
            <Icons.Plus size={12} /> Attach
          </button>
          <div className="sf-vdivider" style={{ height: 18, margin: '0 2px' }} />
          {/* Stack selector */}
          <div className="sf-row" style={{ gap: 4 }}>
            <span className="sf-faint" style={{ fontSize: 11.5 }}>stack</span>
            <div className="sf-row" style={{ background: 'var(--sf-surface)', borderRadius: 6, padding: 2 }}>
              {['Hono', 'Fastify', 'Express'].map(s => (
                <button key={s} onClick={() => setStack(s)} className="mono" style={{
                  height: 22, padding: '0 8px', borderRadius: 4, border: 'none',
                  background: stack === s ? 'var(--sf-elevated)' : 'transparent',
                  color: stack === s ? 'var(--sf-text)' : 'var(--sf-text-muted)',
                  fontSize: 10.5, cursor: 'pointer',
                }}>{s}</button>
              ))}
            </div>
          </div>
          <div className="sf-vdivider" style={{ height: 18, margin: '0 2px' }} />
          <button className="sf-btn sf-btn--sm sf-btn--ghost" style={{ padding: '0 8px' }}>
            <Icons.Database size={12} /> Postgres
          </button>
          <button className="sf-btn sf-btn--sm sf-btn--ghost" style={{ padding: '0 8px' }}>
            <Icons.Lock size={12} /> Lucia
          </button>

          <span className="sf-grow" />

          <span className="sf-faint mono" style={{ fontSize: 10.5 }}>
            {prompt.length} · ⌘↵ to run
          </span>
          <button
            disabled={stage === 'streaming'}
            onClick={startGeneration}
            className="sf-btn sf-btn--primary sf-btn--sm"
            style={{ paddingRight: 10, opacity: stage === 'streaming' ? 0.6 : 1 }}
          >
            <Icons.Sparkle size={12} /> Generate
            <span className="sf-kbd" style={{ background: 'rgba(0,0,0,0.10)', color: 'rgba(0,0,0,0.6)', borderColor: 'rgba(0,0,0,0.10)' }}>⌘↵</span>
          </button>
        </div>
      </div>

      {/* Mode + presets */}
      <div style={{ marginTop: 28 }}>
        <div className="sf-row" style={{ marginBottom: 10 }}>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--sf-text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Start from a preset
          </span>
          <span className="sf-grow" />
          <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ fontSize: 11.5 }}>
            Browse templates <Icons.ArrowR size={11} />
          </button>
        </div>
        <div className="sf-row" style={{ gap: 8, flexWrap: 'wrap' }}>
          {presets.map(p => {
            const Ic = Icons[p.icon];
            const active = mode === p.id;
            return (
              <button key={p.id} onClick={() => setMode(p.id)} className="sf-row" style={{
                gap: 8, height: 34, padding: '0 12px',
                background: active ? 'var(--sf-surface-2)' : 'var(--sf-surface)',
                border: '1px solid', borderColor: active ? 'var(--sf-border-strong)' : 'var(--sf-border)',
                borderRadius: 8, color: active ? 'var(--sf-text)' : 'var(--sf-text-muted)',
                fontFamily: 'inherit', fontSize: 12.5, cursor: 'pointer',
              }}>
                <Ic size={13} /> {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Suggestion chips */}
      <div style={{ marginTop: 20 }}>
        <div className="sf-row" style={{ marginBottom: 10 }}>
          <span className="mono" style={{ fontSize: 10.5, color: 'var(--sf-text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Smart suggestions
          </span>
        </div>
        <div className="sf-row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {promptSuggestions.map(s => (
            <button key={s} onClick={() => setPrompt(p => p + (p ? ' ' : '') + s + '.')} className="sf-chip" style={{
              height: 26, padding: '0 10px', fontSize: 11.5, cursor: 'pointer', background: 'transparent',
            }}>
              <Icons.Plus size={10} /> {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ===== Streaming view =====
  const Streaming = () => (
    <div style={{ width: '100%', maxWidth: 760 }}>
      <div className="sf-row" style={{ gap: 10, marginBottom: 18 }}>
        <span className="sf-chip" style={{ height: 24, padding: '0 10px', color: 'var(--sf-blue)', borderColor: 'oklch(0.4 0.12 250 / 0.4)' }}>
          <span className="sf-dot sf-dot--blue sf-pulse" /> Generating · {streamStep}/{reasoning.length}
        </span>
        <button onClick={resetAll} className="sf-btn sf-btn--sm sf-btn--ghost">
          <Icons.Stop size={11} /> Stop
        </button>
        <span className="sf-grow" />
        <span className="mono sf-faint" style={{ fontSize: 11 }}>est. 24s remaining</span>
      </div>

      <h2 className="sf-h1" style={{ marginBottom: 8, fontSize: 26 }}>
        Designing your backend
      </h2>
      <p className="sf-muted" style={{ marginBottom: 24, fontSize: 13.5 }}>
        Streaming the architecture — each step is reasoned and verified.
      </p>

      <div className="sf-card-elev" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Quoted prompt header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)' }}>
          <div className="sf-row" style={{ gap: 8, marginBottom: 6 }}>
            <Icons.Sparkle size={11} cls="" />
            <span className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Prompt</span>
          </div>
          <div style={{ fontSize: 13.5, color: 'var(--sf-text-muted)', lineHeight: 1.5 }}>
            {prompt || window.SF_PROMPT}
          </div>
        </div>

        {/* Reasoning timeline */}
        <div className="sf-col" style={{ padding: '14px 18px' }}>
          {reasoning.map((r, i) => {
            const done = i < streamStep;
            const active = i === streamStep;
            const pending = i > streamStep;
            return (
              <div key={i} className="sf-row" style={{
                gap: 12, padding: '8px 0', alignItems: 'flex-start',
                opacity: pending ? 0.35 : 1,
                transition: 'opacity .3s',
              }}>
                <div style={{
                  width: 18, height: 18, borderRadius: 999,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: done ? 'var(--sf-text)' : (active ? 'transparent' : 'var(--sf-surface-2)'),
                  border: active ? '1.5px solid var(--sf-blue)' : 'none',
                  marginTop: 1,
                  flex: '0 0 auto',
                }}>
                  {done && <Icons.Check size={10} cls="" />}
                  {active && <span className="sf-dot sf-dot--blue sf-pulse" />}
                </div>
                <div className="sf-grow">
                  <div style={{ fontSize: 13.5, color: 'var(--sf-text)' }}>
                    {r.label}
                    {active && <span className="sf-caret" />}
                  </div>
                  <div className="mono sf-faint" style={{ fontSize: 11, marginTop: 2 }}>
                    {r.detail}
                  </div>
                </div>
                {done && <span className="mono sf-faint" style={{ fontSize: 10.5 }}>
                  {(r.dur / 1000).toFixed(1)}s
                </span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // ===== Done view =====
  const Done = () => (
    <div style={{ width: '100%', maxWidth: 760 }}>
      <div className="sf-row" style={{ gap: 10, marginBottom: 18 }}>
        <span className="sf-chip" style={{ height: 24, padding: '0 10px', color: 'var(--sf-green)', borderColor: 'oklch(0.4 0.10 145 / 0.3)' }}>
          <span className="sf-dot sf-dot--green" /> Generation complete · 6.4s
        </span>
        <button onClick={resetAll} className="sf-btn sf-btn--sm sf-btn--ghost">
          <Icons.Refresh size={11} /> New
        </button>
        <span className="sf-grow" />
        <button className="sf-btn sf-btn--sm">
          <Icons.Eye size={11} /> Open architecture
        </button>
        <button className="sf-btn sf-btn--primary sf-btn--sm">
          <Icons.Download size={11} /> Export project
        </button>
      </div>

      <h2 className="sf-h1" style={{ marginBottom: 8, fontSize: 26 }}>
        Examly API — backend ready
      </h2>
      <p className="sf-muted" style={{ marginBottom: 24, fontSize: 13.5 }}>
        8 modules · 11 tables · 38 routes · 124 files. Open the right panel to inspect everything.
      </p>

      {/* Summary stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 22 }}>
        {[
          { l: 'Modules', v: '8' },
          { l: 'Tables',  v: '11' },
          { l: 'Routes',  v: '38' },
          { l: 'Files',   v: '124' },
        ].map(s => (
          <div key={s.l} className="sf-card" style={{ padding: '14px 14px 12px' }}>
            <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.l}</div>
            <div style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 6 }}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>
        Generated modules
      </div>
      <div className="sf-card" style={{ padding: 0 }}>
        {window.SF_MODULES.slice(0, 6).map((m, i) => {
          const Ic = Icons[m.icon];
          return (
            <div key={m.id} className="sf-row" style={{
              padding: '12px 14px', gap: 12,
              borderBottom: i < 5 ? '1px solid var(--sf-border)' : 'none',
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8, flex: '0 0 auto',
                background: 'var(--sf-surface-2)', border: '1px solid var(--sf-border)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Ic size={14} />
              </div>
              <div className="sf-grow">
                <div className="sf-row" style={{ gap: 8 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 500 }}>{m.name}</span>
                  <span className="sf-chip sf-chip-mono" style={{ height: 17, padding: '0 5px', fontSize: 9.5 }}>{m.files} files</span>
                </div>
                <div className="sf-muted" style={{ fontSize: 12, marginTop: 1 }}>{m.desc}</div>
              </div>
              <button className="sf-btn sf-btn--sm sf-btn--ghost">
                <Icons.Eye size={11} /> Preview
              </button>
              <button className="sf-btn sf-btn--sm sf-btn--ghost">
                <Icons.Refresh size={11} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ===== Right preview panel =====
  const RightPanel = () => {
    const tabs = [
      { id: 'arch',   label: 'Architecture', icon: 'Layers' },
      { id: 'schema', label: 'Schema',       icon: 'Database' },
      { id: 'routes', label: 'API',          icon: 'Code' },
      { id: 'files',  label: 'Files',        icon: 'Folder' },
    ];

    return (
      <aside style={{
        width: 460, flex: '0 0 auto',
        borderLeft: '1px solid var(--sf-border)',
        background: 'var(--sf-bg-2)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* Tabs */}
        <div className="sf-row" style={{ padding: '10px 14px 0', gap: 2, borderBottom: '1px solid var(--sf-border)' }}>
          {tabs.map(t => {
            const Ic = Icons[t.icon];
            const active = previewTab === t.id;
            return (
              <button key={t.id} onClick={() => setPreviewTab(t.id)} className="sf-row" style={{
                gap: 6, padding: '8px 12px 10px', background: 'transparent',
                border: 'none', fontFamily: 'inherit', fontSize: 12.5,
                color: active ? 'var(--sf-text)' : 'var(--sf-text-muted)',
                cursor: 'pointer', position: 'relative',
              }}>
                <Ic size={12} /> {t.label}
                {active && <span style={{ position: 'absolute', left: 10, right: 10, bottom: -1, height: 1.5, background: 'var(--sf-text)', borderRadius: 1 }} />}
              </button>
            );
          })}
          <span className="sf-grow" />
          <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ marginBottom: 6, padding: '0 6px' }}>
            <Icons.More size={14} />
          </button>
        </div>

        <div className="sf-scroll sf-grow" style={{ overflow: 'auto', padding: 16 }}>
          {previewTab === 'arch' && <ArchPreview stage={stage} streamStep={streamStep} />}
          {previewTab === 'schema' && <SchemaPreview stage={stage} streamStep={streamStep} />}
          {previewTab === 'routes' && <RoutesPreview stage={stage} streamStep={streamStep} />}
          {previewTab === 'files' && <FilesPreview stage={stage} />}
        </div>

        {/* Footer status */}
        <div className="sf-row" style={{ padding: '8px 14px', borderTop: '1px solid var(--sf-border)', gap: 10, background: 'var(--sf-bg)' }}>
          <span className="sf-dot sf-dot--green" />
          <span className="mono sf-faint" style={{ fontSize: 10.5 }}>
            {stage === 'done' ? 'verified · 0 errors' : stage === 'streaming' ? 'streaming' : 'idle'}
          </span>
          <span className="sf-grow" />
          <span className="mono sf-faint" style={{ fontSize: 10.5 }}>v2.4 · {window.SF_STACK.framework}</span>
        </div>
      </aside>
    );
  };

  return (
    <div className="sf-app" style={{ height: '100%', width: '100%', display: 'flex', overflow: 'hidden', background: 'var(--sf-bg)' }}>
      <window.Sidebar active="workspace" projects={window.SF_PROJECTS.slice(0, 4)} />

      <div className="sf-col sf-grow" style={{ minWidth: 0 }}>
        <window.Topbar
          breadcrumbs={['Acme Studio', 'Workspace', 'New generation']}
          right={
            <button className="sf-btn sf-btn--sm">
              <Icons.Github size={12} /> Connect repo
            </button>
          }
        />

        <div className="sf-row sf-grow" style={{ minHeight: 0 }}>
          {/* Main canvas */}
          <main className="sf-scroll" style={{
            flex: '1 1 auto', overflow: 'auto', position: 'relative',
            background: 'var(--sf-bg)',
          }}>
            <div className="sf-dotgrid" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />
            <div style={{
              position: 'relative', padding: '56px 56px 80px',
              display: 'flex', justifyContent: 'center',
              minHeight: '100%',
            }}>
              {stage === 'streaming' ? <Streaming /> : stage === 'done' ? <Done /> : <Composer />}
            </div>
          </main>

          <RightPanel />
        </div>
      </div>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </div>
  );
};

// ===== Right-panel preview content =====
function ArchPreview({ stage, streamStep }) {
  const Icons = window.Icons;
  const A = window.SF_ARCH;
  // Reveal nodes progressively while streaming
  const visibleIds = useMemo(() => {
    if (stage === 'idle' || stage === 'composing') return ['web', 'edge'];
    if (stage === 'done') return A.nodes.map(n => n.id);
    // streaming
    const order = ['web', 'edge', 'api', 'auth', 'exam', 'pg', 'redis', 'pay', 'queue', 's3'];
    return order.slice(0, Math.min(order.length, Math.ceil(streamStep * 1.5)));
  }, [stage, streamStep]);

  const nodeById = Object.fromEntries(A.nodes.map(n => [n.id, n]));
  const W = 1080, H = 320;

  return (
    <div>
      <div className="sf-row" style={{ marginBottom: 10 }}>
        <span className="sf-h3 sf-grow">System architecture</span>
        <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: '0 6px' }}><Icons.Refresh size={12} /></button>
        <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: '0 6px' }}><Icons.More size={12} /></button>
      </div>

      <div className="sf-card sf-linegrid" style={{
        position: 'relative', width: '100%', height: 340, overflow: 'hidden',
        background: 'var(--sf-bg)',
      }}>
        <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.42)', transformOrigin: 'top left', width: W, height: H }}>
          {/* Edges */}
          <svg width={W} height={H} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {A.edges.map(([f, t, label], i) => {
              if (!visibleIds.includes(f) || !visibleIds.includes(t)) return null;
              const from = { x: nodeById[f].x + 160, y: nodeById[f].y + 32 };
              const to   = { x: nodeById[t].x,        y: nodeById[t].y + 32 };
              return <window.ArchEdge key={i} from={from} to={to} label={label} animated={stage === 'streaming'} />;
            })}
          </svg>
          {A.nodes.map(n => {
            if (!visibleIds.includes(n.id)) return null;
            return <window.ArchNode key={n.id} {...n} status />;
          })}
        </div>
        {/* Mini overlay */}
        <div style={{ position: 'absolute', right: 10, top: 10 }}>
          <div className="sf-chip sf-chip-mono" style={{ height: 20, padding: '0 8px', fontSize: 10 }}>
            {visibleIds.length} / {A.nodes.length} nodes
          </div>
        </div>
        {/* Zoom controls */}
        <div className="sf-row" style={{ position: 'absolute', right: 10, bottom: 10, gap: 4 }}>
          <button className="sf-btn sf-btn--sm" style={{ padding: '0 7px', background: 'var(--sf-surface)' }}>−</button>
          <button className="sf-btn sf-btn--sm" style={{ padding: '0 7px', background: 'var(--sf-surface)' }}>+</button>
          <button className="sf-btn sf-btn--sm" style={{ padding: '0 7px', background: 'var(--sf-surface)' }}>fit</button>
        </div>
      </div>

      {/* Stack summary */}
      <div className="sf-h3" style={{ marginTop: 18, marginBottom: 10 }}>Stack</div>
      <div className="sf-card" style={{ padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', rowGap: 9, columnGap: 18 }}>
          {Object.entries(window.SF_STACK).map(([k, v]) => (
            <div key={k} className="sf-row" style={{ gap: 8, minWidth: 0 }}>
              <span className="mono" style={{ fontSize: 10.5, color: 'var(--sf-text-faint)', width: 64, flex: '0 0 auto' }}>{k}</span>
              <span className="mono" style={{ fontSize: 11.5, color: 'var(--sf-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SchemaPreview({ stage, streamStep }) {
  const Icons = window.Icons;
  const visibleCount = stage === 'done' ? window.SF_SCHEMA.length : stage === 'streaming' ? Math.min(window.SF_SCHEMA.length, streamStep + 1) : 2;
  return (
    <div>
      <div className="sf-row" style={{ marginBottom: 10 }}>
        <span className="sf-h3 sf-grow">Database schema</span>
        <span className="sf-chip sf-chip-mono">Postgres 16</span>
      </div>
      <div className="sf-card sf-linegrid" style={{ position: 'relative', width: '100%', height: 360, overflow: 'hidden', background: 'var(--sf-bg)' }}>
        <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.36) translate(0,0)', transformOrigin: 'top left', width: 1200, height: 600 }}>
          {window.SF_SCHEMA.slice(0, visibleCount).map(t => <window.SchemaTable key={t.name} {...t} />)}
        </div>
      </div>
      <div className="sf-h3" style={{ marginTop: 18, marginBottom: 10 }}>Sample</div>
      <window.CodeBlock
        language="ts"
        title="packages/db/schema.ts"
        lines={window.SF_CODE_SCHEMA}
        height={260}
        scroll
      />
    </div>
  );
}

function RoutesPreview({ stage, streamStep }) {
  const visibleCount = stage === 'done' ? window.SF_ROUTES.length : stage === 'streaming' ? Math.min(window.SF_ROUTES.length, Math.floor(streamStep * 2.4)) : 0;
  return (
    <div>
      <div className="sf-row" style={{ marginBottom: 10 }}>
        <span className="sf-h3 sf-grow">API routes</span>
        <span className="sf-chip sf-chip-mono">{visibleCount} routes</span>
      </div>
      <div className="sf-card" style={{ overflow: 'hidden' }}>
        {window.SF_ROUTES.slice(0, visibleCount).map((r, i) => (
          <window.RouteRow key={i} {...r} />
        ))}
        {visibleCount === 0 && (
          <div className="sf-muted" style={{ padding: 24, textAlign: 'center', fontSize: 12 }}>
            Generate to see routes
          </div>
        )}
      </div>
      <div className="sf-h3" style={{ marginTop: 18, marginBottom: 10 }}>Handler preview</div>
      <window.CodeBlock language="ts" title="modules/exams/routes.ts" lines={window.SF_CODE_ROUTES} height={260} scroll />
    </div>
  );
}

function FilesPreview({ stage }) {
  return (
    <div>
      <div className="sf-row" style={{ marginBottom: 10 }}>
        <span className="sf-h3 sf-grow">Files</span>
        <span className="sf-chip sf-chip-mono">{stage === 'done' ? '124 files' : '— files'}</span>
      </div>
      <div className="sf-card" style={{ padding: '10px 6px' }}>
        <window.FileTree nodes={window.SF_FILE_TREE} />
      </div>
    </div>
  );
}

// ===== Command Palette =====
function CommandPalette({ onClose }) {
  const Icons = window.Icons;
  const [q, setQ] = React.useState('');
  const inputRef = React.useRef();
  React.useEffect(() => { inputRef.current?.focus(); }, []);

  const groups = [
    { label: 'Actions', items: [
      { ic: 'Sparkle', t: 'New generation', sub: 'Start a fresh prompt', k: '⌘N' },
      { ic: 'Folder',  t: 'Open project…',   sub: '6 projects', k: '⌘O' },
      { ic: 'Rocket',  t: 'Deploy current',  sub: 'Railway · Examly API', k: '⌘⇧D' },
      { ic: 'Github',  t: 'Push to GitHub',  sub: 'acme/examly-api' },
    ]},
    { label: 'Generate', items: [
      { ic: 'Database', t: 'Generate schema',   sub: 'Add or extend tables' },
      { ic: 'Server',   t: 'Generate module',   sub: 'New API surface' },
      { ic: 'Lock',     t: 'Generate auth flow', sub: 'OAuth · Email · SSO' },
    ]},
    { label: 'Navigate', items: [
      { ic: 'Layers',   t: 'Architecture',     sub: 'System diagram' },
      { ic: 'Settings', t: 'Settings · API keys', sub: '' },
    ]},
  ];

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
          <Icons.Search size={14} cls="sf-muted" />
          <input ref={inputRef} value={q} onChange={e => setQ(e.target.value)} placeholder="Type a command or search…" style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            color: 'var(--sf-text)', fontFamily: 'inherit', fontSize: 14,
          }}/>
          <span className="sf-kbd">esc</span>
        </div>
        <div style={{ maxHeight: 380, overflow: 'auto', padding: '8px 8px 12px' }}>
          {groups.map(g => (
            <div key={g.label} style={{ marginTop: 8 }}>
              <div className="mono" style={{ fontSize: 10, color: 'var(--sf-text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px' }}>{g.label}</div>
              {g.items.map((it, i) => {
                const Ic = Icons[it.ic];
                return (
                  <div key={i} className="sf-row" style={{
                    padding: '8px 10px', gap: 12, borderRadius: 6, cursor: 'pointer',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <Ic size={14} cls="sf-muted" />
                    <div className="sf-grow">
                      <div style={{ fontSize: 13 }}>{it.t}</div>
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

window.Workspace = Workspace;
