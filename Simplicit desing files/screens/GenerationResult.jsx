// StackForge Generation Result — detailed view of a generated backend.
// Tabs, file tree + editor split, route list, schema preview, etc.

const GenerationResult = () => {
  const Icons = window.Icons;
  const { useState } = React;
  const [tab, setTab] = useState('overview');
  const [selectedFile, setSelectedFile] = useState({ name: 'routes.ts', path: 'apps/api/src/modules/exams/routes.ts' });

  const TABS = [
    { id: 'overview', label: 'Overview', icon: 'Compass' },
    { id: 'arch',     label: 'Architecture', icon: 'Layers' },
    { id: 'schema',   label: 'Schema',  icon: 'Database' },
    { id: 'routes',   label: 'API',     icon: 'Code' },
    { id: 'auth',     label: 'Auth',    icon: 'Lock' },
    { id: 'env',      label: 'Env',     icon: 'Key' },
    { id: 'deploy',   label: 'Deploy',  icon: 'Rocket' },
  ];

  return (
    <div className="sf-app" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--sf-bg)' }}>
      <window.Sidebar active="generations" projects={window.SF_PROJECTS.slice(0,4)} />
      <div className="sf-col sf-grow" style={{ minWidth: 0 }}>
        <window.Topbar
          breadcrumbs={['Acme Studio', 'Projects', 'Examly API', 'Generation #042']}
          right={<>
            <button className="sf-btn sf-btn--sm"><Icons.Refresh size={11} /> Regenerate</button>
            <button className="sf-btn sf-btn--sm"><Icons.Github size={11} /> Push to GitHub</button>
            <button className="sf-btn sf-btn--primary sf-btn--sm"><Icons.Download size={11} /> Export</button>
          </>}
        />

        {/* Page header */}
        <div style={{ padding: '20px 28px 0', borderBottom: '1px solid var(--sf-border)' }}>
          <div className="sf-row" style={{ marginBottom: 14 }}>
            <div>
              <div className="sf-row" style={{ gap: 8, marginBottom: 4 }}>
                <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>Examly API</h1>
                <span className="sf-chip"><span className="sf-dot sf-dot--green" /> Generated · 6.4s</span>
                <span className="sf-chip sf-chip-mono">v1 · 042</span>
              </div>
              <p className="sf-muted" style={{ fontSize: 13, margin: 0, maxWidth: 760, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                "{window.SF_PROMPT}"
              </p>
            </div>
            <span className="sf-grow" />
            <div className="sf-row" style={{ gap: 16, fontSize: 12, color: 'var(--sf-text-muted)' }}>
              <span><span className="sf-faint">Stack</span> · <span className="mono">Hono · PG · Redis</span></span>
              <span><span className="sf-faint">By</span> · Alex Chen</span>
              <span><span className="sf-faint">Updated</span> · 12m ago</span>
            </div>
          </div>

          {/* Tabs */}
          <div className="sf-row" style={{ gap: 2 }}>
            {TABS.map(t => {
              const Ic = Icons[t.icon];
              const active = tab === t.id;
              return (
                <button key={t.id} onClick={() => setTab(t.id)} className="sf-row" style={{
                  gap: 7, padding: '10px 14px', background: 'transparent', border: 'none',
                  fontFamily: 'inherit', fontSize: 13,
                  color: active ? 'var(--sf-text)' : 'var(--sf-text-muted)',
                  cursor: 'pointer', position: 'relative',
                }}>
                  <Ic size={12.5} /> {t.label}
                  {active && <span style={{ position: 'absolute', left: 12, right: 12, bottom: -1, height: 1.5, background: 'var(--sf-text)', borderRadius: 1 }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Body */}
        <main className="sf-grow sf-scroll" style={{ overflow: 'auto', minHeight: 0 }}>
          {tab === 'overview' && <OverviewTab />}
          {tab === 'arch'     && <ArchTab />}
          {tab === 'schema'   && <SchemaTab />}
          {tab === 'routes'   && <RoutesTab selectedFile={selectedFile} setSelectedFile={setSelectedFile} />}
          {tab === 'auth'     && <AuthTab />}
          {tab === 'env'      && <EnvTab />}
          {tab === 'deploy'   && <DeployHint />}
        </main>
      </div>
    </div>
  );
};

function OverviewTab() {
  const Icons = window.Icons;
  return (
    <div style={{ padding: 28, maxWidth: 1280, margin: '0 auto' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 22 }}>
        {/* Summary */}
        <div className="sf-card" style={{ padding: 22 }}>
          <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Architecture summary</div>
          <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: 0, color: 'var(--sf-text)' }}>
            A modular monolith on <span className="mono" style={{ color: 'var(--sf-text-muted)' }}>Hono</span>, fronted by a thin
            edge layer. <span className="mono" style={{ color: 'var(--sf-text-muted)' }}>PostgreSQL</span> is the primary store; <span className="mono" style={{ color: 'var(--sf-text-muted)' }}>Redis</span> handles sessions and
            rate limits. Background work runs in <span className="mono" style={{ color: 'var(--sf-text-muted)' }}>BullMQ</span> workers — autograde, analytics, mail.
            Payments use <span className="mono" style={{ color: 'var(--sf-text-muted)' }}>Stripe</span> Checkout with signed webhooks; proctoring snapshots go to
            <span className="mono" style={{ color: 'var(--sf-text-muted)' }}> S3</span> with presigned uploads. Auth is session-based via <span className="mono" style={{ color: 'var(--sf-text-muted)' }}>Lucia</span>, with role-gated middleware on every route.
          </p>
          <div className="sf-row" style={{ gap: 6, marginTop: 18, flexWrap: 'wrap' }}>
            {Object.entries(window.SF_STACK).map(([k, v]) => (
              <span key={k} className="sf-chip sf-chip-mono">{k}: {v}</span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {[
            { l: 'Modules', v: '8',   d: '+8' },
            { l: 'Tables',  v: '11',  d: '11 new' },
            { l: 'Routes',  v: '38',  d: '38 new' },
            { l: 'Files',   v: '124', d: '124 · 3.4 MB' },
          ].map(s => (
            <div key={s.l} className="sf-card" style={{ padding: 16 }}>
              <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>{s.l}</div>
              <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>{s.v}</div>
              <div className="sf-faint" style={{ fontSize: 11.5, marginTop: 4 }}>{s.d}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Modules grid */}
      <div className="sf-row" style={{ marginBottom: 12 }}>
        <span className="mono" style={{ fontSize: 11, color: 'var(--sf-text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Generated modules</span>
        <span className="sf-grow" />
        <button className="sf-btn sf-btn--ghost sf-btn--sm">Reorder</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {window.SF_MODULES.map(m => {
          const Ic = Icons[m.icon];
          return (
            <div key={m.id} className="sf-card" style={{ padding: 16, minHeight: 140 }}>
              <div className="sf-row" style={{ marginBottom: 12 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--sf-surface-2)', border: '1px solid var(--sf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ic size={13} />
                </div>
                <span className="sf-grow" />
                <span className={`sf-chip ${m.status === 'optional' ? '' : ''}`}>
                  <span className={`sf-dot sf-dot--${m.status === 'optional' ? 'amber' : 'green'}`} /> {m.status}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{m.name}</div>
              <p className="sf-muted" style={{ fontSize: 12, lineHeight: 1.45, margin: 0 }}>{m.desc}</p>
              <div className="sf-row" style={{ marginTop: 12 }}>
                <span className="mono sf-faint" style={{ fontSize: 11 }}>{m.files} files</span>
                <span className="sf-grow" />
                <Icons.ArrowR size={12} cls="sf-faint" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Next steps */}
      <div className="sf-card-elev" style={{ marginTop: 24, padding: 22 }}>
        <div className="sf-row" style={{ marginBottom: 14 }}>
          <span className="sf-h2 sf-grow">Next steps</span>
          <span className="sf-chip"><span className="sf-dot sf-dot--blue sf-pulse" /> 3 suggestions</span>
        </div>
        <div className="sf-col" style={{ gap: 6 }}>
          {[
            { ic: 'Github',   t: 'Push this to a new GitHub repository',  k: '⌘⇧G' },
            { ic: 'Rocket',   t: 'Deploy to Railway with one click',      k: '⌘⇧D' },
            { ic: 'Database', t: 'Provision a Postgres on Neon',          k: '⌘⇧N' },
          ].map((s, i) => {
            const Ic = Icons[s.ic];
            return (
              <div key={i} className="sf-row" style={{ padding: '10px 12px', borderRadius: 8, gap: 12, background: 'var(--sf-bg)' }}>
                <Ic size={14} cls="sf-muted" />
                <span className="sf-grow" style={{ fontSize: 13 }}>{s.t}</span>
                <span className="sf-kbd">{s.k}</span>
                <button className="sf-btn sf-btn--sm">Run</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ArchTab() {
  // Reuse mini diagram from workspace
  return <div style={{ padding: 28, maxWidth: 1280, margin: '0 auto' }}>
    <div className="sf-card sf-linegrid" style={{ height: 520, position: 'relative', overflow: 'hidden', background: 'var(--sf-bg)' }}>
      <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.95)', transformOrigin: 'top left' }}>
        {window.SF_ARCH.nodes.map(n => <window.ArchNode key={n.id} {...n} status />)}
        <svg style={{ position: 'absolute', inset: 0 }} width="1200" height="320">
          {window.SF_ARCH.edges.map(([f, t, l], i) => {
            const nodeById = Object.fromEntries(window.SF_ARCH.nodes.map(n => [n.id, n]));
            const from = { x: nodeById[f].x + 160, y: nodeById[f].y + 32 };
            const to   = { x: nodeById[t].x,        y: nodeById[t].y + 32 };
            return <window.ArchEdge key={i} from={from} to={to} label={l} animated={i % 4 === 0} />;
          })}
        </svg>
      </div>
    </div>
  </div>;
}

function SchemaTab() {
  return (
    <div style={{ padding: 28, maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
      <div>
        <div className="sf-row" style={{ marginBottom: 10 }}>
          <span className="sf-h2 sf-grow">Database schema</span>
          <span className="sf-chip sf-chip-mono">11 tables · 16 indexes</span>
        </div>
        <div className="sf-card sf-linegrid" style={{ position: 'relative', height: 520, overflow: 'hidden', background: 'var(--sf-bg)' }}>
          {window.SF_SCHEMA.map(t => <window.SchemaTable key={t.name} {...t} />)}
        </div>
      </div>
      <div>
        <div className="sf-h2" style={{ marginBottom: 10 }}>schema.ts</div>
        <window.CodeBlock language="ts" title="packages/db/schema.ts" lines={window.SF_CODE_SCHEMA} height={520} scroll />
      </div>
    </div>
  );
}

function RoutesTab({ selectedFile, setSelectedFile }) {
  const Icons = window.Icons;
  return (
    <div style={{ height: '100%', display: 'flex' }}>
      {/* File tree */}
      <div style={{ width: 280, flex: '0 0 auto', borderRight: '1px solid var(--sf-border)', overflow: 'auto', background: 'var(--sf-bg-2)' }}>
        <div className="sf-row" style={{ padding: '12px 14px', borderBottom: '1px solid var(--sf-border)' }}>
          <span className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Files</span>
          <span className="sf-grow" />
          <span className="sf-chip sf-chip-mono" style={{ height: 17, fontSize: 10 }}>124</span>
        </div>
        <div style={{ padding: 10 }}>
          <window.FileTree
            nodes={window.SF_FILE_TREE}
            selected="apps/api/src/modules/exams/routes.ts"
          />
        </div>
      </div>

      {/* Center: code */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <div className="sf-row" style={{ padding: '8px 14px', borderBottom: '1px solid var(--sf-border)', gap: 8, background: 'var(--sf-bg-2)' }}>
          {['routes.ts', 'service.ts', 'autograde.ts'].map((n, i) => (
            <span key={n} className="sf-row" style={{
              height: 24, padding: '0 10px', gap: 6, borderRadius: 6, fontSize: 12,
              background: i === 0 ? 'var(--sf-elevated)' : 'transparent',
              color: i === 0 ? 'var(--sf-text)' : 'var(--sf-text-muted)',
              border: i === 0 ? '1px solid var(--sf-border)' : '1px solid transparent',
            }}>
              <Icons.File size={11} cls="sf-faint" /> {n}
              {i === 0 && <Icons.X size={10} cls="sf-faint" />}
            </span>
          ))}
          <span className="sf-grow" />
          <span className="mono sf-faint" style={{ fontSize: 11 }}>apps/api/src/modules/exams/routes.ts</span>
          <button className="sf-btn sf-btn--ghost sf-btn--sm"><Icons.Copy size={11} /></button>
        </div>
        <div style={{ flex: 1, minHeight: 0, overflow: 'auto' }}>
          <window.CodeBlock language="ts" lines={window.SF_CODE_ROUTES} scroll height="100%" />
        </div>
      </div>

      {/* Right: route list */}
      <div style={{ width: 340, flex: '0 0 auto', borderLeft: '1px solid var(--sf-border)', overflow: 'auto', background: 'var(--sf-bg-2)' }}>
        <div className="sf-row" style={{ padding: '12px 14px', borderBottom: '1px solid var(--sf-border)' }}>
          <span className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>API surface</span>
          <span className="sf-grow" />
          <span className="sf-chip sf-chip-mono" style={{ height: 17, fontSize: 10 }}>38 routes</span>
        </div>
        {window.SF_ROUTES.map((r, i) => <window.RouteRow key={i} {...r} />)}
      </div>
    </div>
  );
}

function AuthTab() {
  const Icons = window.Icons;
  return (
    <div style={{ padding: 28, maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
      <div className="sf-card" style={{ padding: 22 }}>
        <Icons.Lock size={16} cls="sf-muted" />
        <div className="sf-h2" style={{ marginTop: 12 }}>Auth strategy</div>
        <p className="sf-muted" style={{ fontSize: 13, marginTop: 6 }}>
          Session-based auth via Lucia. Sessions stored in Redis, hashed tokens in HTTP-only cookies.
          Role check happens in middleware on every route.
        </p>
        <div className="sf-col" style={{ marginTop: 16, gap: 8 }}>
          {[
            ['Providers', 'Email + OAuth (GitHub, Google)'],
            ['Sessions',  'Cookie + Redis · 30-day rolling'],
            ['Roles',     'student · instructor · admin'],
            ['MFA',       'TOTP (opt-in)'],
            ['Rate limit', '60 / min / IP'],
          ].map(([k, v]) => (
            <div key={k} className="sf-row" style={{ padding: '8px 0', borderBottom: '1px dashed var(--sf-border)' }}>
              <span className="mono sf-faint" style={{ fontSize: 11, width: 100 }}>{k}</span>
              <span style={{ fontSize: 12.5 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="sf-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sf-row" style={{ padding: '14px 18px', borderBottom: '1px solid var(--sf-border)' }}>
          <span className="sf-h2 sf-grow">Auth flow</span>
        </div>
        <div style={{ padding: 22 }}>
          {[
            { n: 1, t: 'POST /auth/login', d: 'Email + password (or magic link request)' },
            { n: 2, t: 'Validate credentials', d: 'Argon2id verify · constant time' },
            { n: 3, t: 'Create session', d: 'Lucia · token in HTTP-only cookie' },
            { n: 4, t: 'Cache in Redis', d: 'TTL 30 days · sliding refresh' },
            { n: 5, t: 'requireAuth() middleware', d: 'Resolves session, attaches user to ctx' },
            { n: 6, t: 'requireRole(role)',  d: 'Per-route gating' },
          ].map((s, i) => (
            <div key={s.n} className="sf-row" style={{ alignItems: 'flex-start', gap: 12, paddingBottom: 14 }}>
              <div style={{ width: 24, height: 24, borderRadius: 999, background: 'var(--sf-surface-2)', border: '1px solid var(--sf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: '0 0 auto' }}>
                <span className="mono" style={{ fontSize: 10.5 }}>{s.n}</span>
              </div>
              <div className="sf-grow">
                <div className="mono" style={{ fontSize: 12.5 }}>{s.t}</div>
                <div className="sf-faint" style={{ fontSize: 11.5, marginTop: 1 }}>{s.d}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EnvTab() {
  const Icons = window.Icons;
  const env = [
    { k: 'DATABASE_URL',          v: 'postgres://…',                        kind: 'secret', note: 'Primary Postgres' },
    { k: 'REDIS_URL',             v: 'redis://…',                           kind: 'secret', note: 'Sessions + queues' },
    { k: 'AUTH_SECRET',           v: '••••••••••••••••',                    kind: 'secret', note: 'Session HMAC' },
    { k: 'STRIPE_SECRET_KEY',     v: 'sk_live_••••',                        kind: 'secret', note: 'Stripe API' },
    { k: 'STRIPE_WEBHOOK_SECRET', v: 'whsec_••••',                          kind: 'secret', note: 'Webhook verify' },
    { k: 'S3_BUCKET',             v: 'examly-attempts',                     kind: 'public', note: 'Proctoring uploads' },
    { k: 'S3_REGION',             v: 'us-east-1',                           kind: 'public' },
    { k: 'RESEND_API_KEY',        v: 're_••••',                             kind: 'secret', note: 'Transactional mail' },
    { k: 'OAUTH_GOOGLE_ID',       v: '••••.apps.googleusercontent.com',     kind: 'public' },
    { k: 'OAUTH_GOOGLE_SECRET',   v: '••••',                                kind: 'secret' },
    { k: 'NODE_ENV',              v: 'production',                          kind: 'public' },
    { k: 'PORT',                  v: '8080',                                kind: 'public' },
  ];
  return (
    <div style={{ padding: 28, maxWidth: 1080, margin: '0 auto' }}>
      <div className="sf-row" style={{ marginBottom: 12 }}>
        <span className="sf-h2 sf-grow">Environment variables</span>
        <button className="sf-btn sf-btn--sm"><Icons.Copy size={11} /> Copy .env.example</button>
        <button className="sf-btn sf-btn--sm"><Icons.Plus size={11} /> Add variable</button>
      </div>
      <div className="sf-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sf-row" style={{ padding: '8px 14px', borderBottom: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)', fontSize: 11, color: 'var(--sf-text-faint)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          <span style={{ flex: '0 0 260px' }}>Key</span>
          <span style={{ flex: '0 0 80px' }}>Type</span>
          <span className="sf-grow">Value</span>
          <span style={{ flex: '0 0 24px' }} />
        </div>
        {env.map((e, i) => (
          <div key={e.k} className="sf-row" style={{ padding: '10px 14px', borderBottom: i < env.length-1 ? '1px solid var(--sf-border)' : 'none', gap: 8 }}>
            <span className="mono" style={{ flex: '0 0 260px', fontSize: 12 }}>{e.k}</span>
            <span style={{ flex: '0 0 80px' }} className="sf-chip">
              {e.kind === 'secret' ? <Icons.Lock size={10} /> : <Icons.Eye size={10} />}
              {e.kind}
            </span>
            <span className="mono sf-grow" style={{ fontSize: 11.5, color: 'var(--sf-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.v}</span>
            {e.note && <span className="sf-faint" style={{ fontSize: 11.5 }}>{e.note}</span>}
            <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: '0 4px' }}><Icons.More size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeployHint() {
  const Icons = window.Icons;
  return (
    <div style={{ padding: 60, textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
      <Icons.Rocket size={20} cls="sf-muted" />
      <div className="sf-h2" style={{ marginTop: 14 }}>Ready to deploy</div>
      <p className="sf-muted" style={{ fontSize: 14 }}>Open the deployment wizard to push this generation to your infra.</p>
      <button className="sf-btn sf-btn--primary sf-btn--lg" style={{ marginTop: 14 }}>Open wizard <Icons.ArrowR size={12} /></button>
    </div>
  );
}

window.GenerationResult = GenerationResult;
