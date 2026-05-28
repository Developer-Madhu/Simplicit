// StackForge Deployment Wizard — multi-step.

const Deploy = () => {
  const Icons = window.Icons;
  const { useState } = React;
  const [step, setStep] = useState(2); // showing the env step by default

  const STEPS = [
    { n: 1, t: 'Review',           d: 'Architecture & modules' },
    { n: 2, t: 'Environment',      d: 'Validate variables' },
    { n: 3, t: 'Integrations',     d: 'Connect services' },
    { n: 4, t: 'Repository',       d: 'GitHub destination' },
    { n: 5, t: 'Deploy',           d: 'Push & build' },
  ];

  return (
    <div className="sf-app" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--sf-bg)' }}>
      <window.Sidebar active="deployments" projects={window.SF_PROJECTS.slice(0,4)} />
      <div className="sf-col sf-grow" style={{ minWidth: 0 }}>
        <window.Topbar
          breadcrumbs={['Acme Studio', 'Examly API', 'Deploy']}
          right={<>
            <button className="sf-btn sf-btn--sm"><Icons.X size={11} /> Cancel</button>
          </>}
        />

        <div className="sf-row sf-grow" style={{ minHeight: 0 }}>
          {/* Step rail */}
          <aside style={{ width: 280, flex: '0 0 auto', borderRight: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)', padding: '28px 20px' }}>
            <span className="mono" style={{ fontSize: 10.5, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sf-text-faint)' }}>Deployment wizard</span>
            <h2 style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.02em', margin: '8px 0 22px' }}>Examly API</h2>

            <div className="sf-col" style={{ gap: 0 }}>
              {STEPS.map((s, i) => {
                const done = s.n < step;
                const current = s.n === step;
                return (
                  <div key={s.n} className="sf-row" style={{
                    alignItems: 'flex-start', gap: 12, padding: '12px 0',
                    opacity: !done && !current && s.n > step ? 0.55 : 1,
                  }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 auto' }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: 999,
                        background: done ? 'var(--sf-text)' : 'transparent',
                        border: current ? '1.5px solid var(--sf-text)' : (done ? 'none' : '1.5px solid var(--sf-border-strong)'),
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flex: '0 0 auto',
                      }}>
                        {done ? <Icons.Check size={11} cls="" />
                          : <span className="mono" style={{ fontSize: 10.5, color: current ? 'var(--sf-text)' : 'var(--sf-text-muted)' }}>{s.n}</span>}
                      </div>
                      {i < STEPS.length-1 && <div style={{ width: 1.5, flex: 1, background: done ? 'var(--sf-text)' : 'var(--sf-border)', minHeight: 24, marginTop: 4 }} />}
                    </div>
                    <div style={{ paddingBottom: 12 }}>
                      <div style={{ fontSize: 13.5, fontWeight: current ? 500 : 400, color: done || current ? 'var(--sf-text)' : 'var(--sf-text-muted)' }}>{s.t}</div>
                      <div className="sf-faint" style={{ fontSize: 11.5, marginTop: 2 }}>{s.d}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>

          {/* Step body */}
          <main className="sf-grow sf-scroll" style={{ overflow: 'auto', padding: 40 }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
              {step === 1 && <ReviewStep />}
              {step === 2 && <EnvStep />}
              {step === 3 && <IntegrationsStep />}
              {step === 4 && <RepoStep />}
              {step === 5 && <DeployStep />}

              <div className="sf-row" style={{ marginTop: 40, paddingTop: 22, borderTop: '1px solid var(--sf-border)', gap: 8 }}>
                <button onClick={() => setStep(s => Math.max(1, s-1))} className="sf-btn">← Back</button>
                <span className="sf-grow" />
                <span className="sf-muted" style={{ fontSize: 12.5 }}>Step {step} of {STEPS.length}</span>
                <button onClick={() => setStep(s => Math.min(STEPS.length, s+1))} className="sf-btn sf-btn--primary">
                  {step === STEPS.length ? 'Done' : 'Continue'} <Icons.ArrowR size={11} />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

function StepHead({ title, subtitle, eyebrow }) {
  return (
    <div style={{ marginBottom: 28 }}>
      {eyebrow && <div className="mono" style={{ fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--sf-text-faint)', marginBottom: 8 }}>{eyebrow}</div>}
      <h2 style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
      {subtitle && <p className="sf-muted" style={{ fontSize: 14, marginTop: 8 }}>{subtitle}</p>}
    </div>
  );
}

function ReviewStep() {
  return (
    <>
      <StepHead eyebrow="Step 01" title="Review architecture" subtitle="One last look before we ship." />
      <div className="sf-card sf-linegrid" style={{ height: 320, position: 'relative', overflow: 'hidden', marginBottom: 18 }}>
        <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.55)', transformOrigin: 'top left' }}>
          {window.SF_ARCH.nodes.map(n => <window.ArchNode key={n.id} {...n} status />)}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[['8','Modules'],['11','Tables'],['38','Routes']].map(([v,l]) => (
          <div key={l} className="sf-card" style={{ padding: 14 }}>
            <div style={{ fontSize: 22, fontWeight: 500 }}>{v}</div>
            <div className="sf-faint" style={{ fontSize: 11.5 }}>{l}</div>
          </div>
        ))}
      </div>
    </>
  );
}

function EnvStep() {
  const Icons = window.Icons;
  const rows = [
    { k: 'DATABASE_URL',          v: 'postgres://…',                       status: 'ok',      provider: 'Neon Postgres' },
    { k: 'REDIS_URL',             v: 'redis://…',                          status: 'ok',      provider: 'Upstash' },
    { k: 'AUTH_SECRET',           v: 'auto · 32 bytes',                    status: 'ok',      provider: 'Generated' },
    { k: 'STRIPE_SECRET_KEY',     v: 'sk_live_••••',                       status: 'ok',      provider: 'Stripe' },
    { k: 'STRIPE_WEBHOOK_SECRET', v: '— missing —',                        status: 'missing', provider: '' },
    { k: 'S3_BUCKET',             v: 'examly-attempts',                    status: 'ok',      provider: 'Cloudflare R2' },
    { k: 'RESEND_API_KEY',        v: 're_••••',                            status: 'ok',      provider: 'Resend' },
    { k: 'OAUTH_GOOGLE_ID',       v: '— optional —',                       status: 'opt',     provider: '' },
  ];
  return (
    <>
      <StepHead eyebrow="Step 02" title="Configure environment" subtitle="StackForge inferred reasonable defaults — fill in anything that's missing." />
      <div className="sf-card" style={{ padding: 0, overflow: 'hidden' }}>
        {rows.map((r, i) => (
          <div key={r.k} className="sf-row" style={{ padding: '12px 16px', borderBottom: i < rows.length-1 ? '1px solid var(--sf-border)' : 'none', gap: 10 }}>
            <span className="mono" style={{ flex: '0 0 220px', fontSize: 12 }}>{r.k}</span>
            <span className="mono" style={{ flex: 1, fontSize: 11.5, color: r.status === 'missing' ? 'var(--sf-red)' : 'var(--sf-text-muted)' }}>{r.v}</span>
            {r.provider && <span className="sf-chip">{r.provider}</span>}
            {r.status === 'ok'      && <span className="sf-chip" style={{ color: 'var(--sf-green)' }}><span className="sf-dot sf-dot--green" />ready</span>}
            {r.status === 'missing' && <button className="sf-btn sf-btn--primary sf-btn--sm">Set</button>}
            {r.status === 'opt'     && <span className="sf-chip">optional</span>}
          </div>
        ))}
      </div>
      <div className="sf-card" style={{ marginTop: 16, padding: 14, background: 'var(--sf-surface)' }}>
        <div className="sf-row" style={{ gap: 10 }}>
          <Icons.AlertTri size={14} cls="" />
          <span style={{ fontSize: 13 }}>1 variable missing</span>
          <span className="sf-grow" />
          <button className="sf-btn sf-btn--sm">Fix all with defaults</button>
        </div>
      </div>
    </>
  );
}

function IntegrationsStep() {
  return (
    <>
      <StepHead eyebrow="Step 03" title="Connect integrations" subtitle="StackForge will provision these resources alongside your deployment." />
      <div className="sf-col" style={{ gap: 10 }}>
        {[
          { ic: 'Github',   t: 'GitHub',           s: 'connected · acme-studio',     btn: null },
          { ic: 'Database', t: 'Neon Postgres',    s: 'will create new database',    btn: 'Configure' },
          { ic: 'Rocket',   t: 'Railway',          s: 'will deploy 2 services',      btn: 'Configure' },
          { ic: 'Cloud',    t: 'Cloudflare R2',    s: 'will create bucket: examly-attempts', btn: null },
          { ic: 'Zap',      t: 'Stripe',           s: 'connected · live mode',       btn: null },
          { ic: 'Bell',     t: 'Resend (email)',   s: 'connected',                   btn: null },
        ].map(it => {
          const Ic = window.Icons[it.ic];
          return (
            <div key={it.t} className="sf-card" style={{ padding: 14 }}>
              <div className="sf-row" style={{ gap: 12 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--sf-surface-2)', border: '1px solid var(--sf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ic size={14} />
                </div>
                <div className="sf-grow">
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{it.t}</div>
                  <div className="sf-faint" style={{ fontSize: 11.5 }}>{it.s}</div>
                </div>
                <span className="sf-chip"><span className="sf-dot sf-dot--green" /> ready</span>
                {it.btn && <button className="sf-btn sf-btn--sm">{it.btn}</button>}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function RepoStep() {
  const Icons = window.Icons;
  return (
    <>
      <StepHead eyebrow="Step 04" title="Push to GitHub" subtitle="We'll create a new repository under your account and push the generated code." />
      <div className="sf-card" style={{ padding: 18, marginBottom: 16 }}>
        <div className="sf-row" style={{ gap: 12, marginBottom: 16 }}>
          <Icons.Github size={16} />
          <span style={{ fontSize: 13 }}>acme-studio</span>
          <span className="sf-chip">connected</span>
          <span className="sf-grow" />
          <button className="sf-btn sf-btn--ghost sf-btn--sm">Change account</button>
        </div>
        <FormRow label="Repository name">
          <div className="sf-row" style={{ background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', borderRadius: 8, padding: '0 12px', height: 38 }}>
            <span className="mono sf-faint" style={{ fontSize: 12 }}>acme-studio/</span>
            <input defaultValue="examly-api" className="mono" style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--sf-font-mono)', fontSize: 12.5, color: 'var(--sf-text)', marginLeft: 4 }} />
          </div>
        </FormRow>
        <FormRow label="Visibility">
          <div className="sf-row" style={{ gap: 8 }}>
            {['Private','Internal','Public'].map((v, i) => (
              <button key={v} className="sf-btn sf-btn--sm" style={{ background: i === 0 ? 'var(--sf-surface-2)' : 'transparent', borderColor: i === 0 ? 'var(--sf-border-strong)' : 'var(--sf-border)' }}>
                {i === 0 && <Icons.Lock size={10} />} {v}
              </button>
            ))}
          </div>
        </FormRow>
        <FormRow label="Description">
          <input className="sf-input" style={{ height: 38 }} defaultValue="Backend for Examly — generated with StackForge." />
        </FormRow>
        <FormRow label="Branch protection" hint="Require PR review and CI pass on main.">
          <Toggle2 on />
        </FormRow>
      </div>
    </>
  );
}

function DeployStep() {
  const Icons = window.Icons;
  return (
    <>
      <StepHead eyebrow="Step 05" title="Deploying…" subtitle="Watch the logs while StackForge ships your backend." />

      <div className="sf-col" style={{ gap: 6, marginBottom: 18 }}>
        {[
          { l: 'Creating GitHub repository', s: 'done',    d: 'acme-studio/examly-api' },
          { l: 'Pushing 124 files',          s: 'done',    d: '12 commits' },
          { l: 'Provisioning Neon database', s: 'done',    d: 'us-east-1 · 0.25 vCPU' },
          { l: 'Provisioning Upstash Redis', s: 'done',    d: 'us-east-1' },
          { l: 'Building api service',       s: 'active',  d: 'docker · stage 3 / 4' },
          { l: 'Building worker',            s: 'pending', d: '' },
          { l: 'Running migrations',         s: 'pending', d: '11 tables · 16 indexes' },
          { l: 'Health check',               s: 'pending', d: 'GET /healthz' },
        ].map((r, i) => (
          <div key={i} className="sf-row" style={{ gap: 12, padding: '6px 0' }}>
            <div style={{
              width: 16, height: 16, borderRadius: 999, flex: '0 0 auto',
              background: r.s === 'done' ? 'var(--sf-text)' : 'transparent',
              border: r.s === 'active' ? '1.5px solid var(--sf-blue)' : (r.s === 'done' ? 'none' : '1.5px solid var(--sf-border-strong)'),
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {r.s === 'done' && <Icons.Check size={9} />}
              {r.s === 'active' && <span className="sf-dot sf-dot--blue sf-pulse" />}
            </div>
            <span style={{ fontSize: 13, color: r.s === 'pending' ? 'var(--sf-text-muted)' : 'var(--sf-text)' }}>
              {r.l}
              {r.s === 'active' && <span className="sf-caret" />}
            </span>
            <span className="sf-grow" />
            <span className="mono sf-faint" style={{ fontSize: 11 }}>{r.d}</span>
          </div>
        ))}
      </div>

      {/* Live build log */}
      <div className="sf-code" style={{ padding: '14px 16px', fontSize: 11.5, lineHeight: 1.7, maxHeight: 220, overflow: 'auto' }} className="sf-code sf-scroll">
        <div><span className="tok-cmt">[15:42:01]</span> <span className="tok-fn">▶ build</span> apps/api · node:20-alpine</div>
        <div><span className="tok-cmt">[15:42:03]</span> + pnpm install --frozen-lockfile</div>
        <div><span className="tok-cmt">[15:42:08]</span> Packages: <span className="tok-num">142</span> · cache hit <span className="tok-str">98%</span></div>
        <div><span className="tok-cmt">[15:42:14]</span> + pnpm run build</div>
        <div><span className="tok-cmt">[15:42:18]</span> <span className="tok-type">tsc</span> --build · <span className="tok-str">no errors</span></div>
        <div><span className="tok-cmt">[15:42:21]</span> <span className="tok-fn">▶ migrate</span> 0001_init.sql · <span className="tok-num">11</span> tables</div>
        <div><span className="tok-cmt">[15:42:24]</span> <span className="tok-fn">▶ deploy</span> stage 3/4 · pushing image…<span className="sf-caret" /></div>
      </div>
    </>
  );
}

function FormRow({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div className="sf-row" style={{ marginBottom: 6 }}>
        <label style={{ fontSize: 12.5, color: 'var(--sf-text-muted)' }}>{label}</label>
        <span className="sf-grow" />
        {hint && <span className="sf-faint" style={{ fontSize: 11 }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
function Toggle2({ on }) {
  return (
    <div style={{ width: 30, height: 18, borderRadius: 999, background: on ? 'var(--sf-text)' : 'rgba(255,255,255,0.10)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 2, left: on ? 14 : 2, width: 14, height: 14, borderRadius: 999, background: on ? 'var(--sf-bg)' : 'var(--sf-text)' }} />
    </div>
  );
}

window.Deploy = Deploy;
