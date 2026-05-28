// StackForge Settings — profile, API keys, AI provider, integrations, billing.

const Settings = () => {
  const Icons = window.Icons;
  const { useState } = React;
  const [section, setSection] = useState('api-keys');

  const SECTIONS = [
    { group: 'Workspace', items: [
      { id: 'profile',    label: 'Profile',          icon: 'User' },
      { id: 'members',    label: 'Members',          icon: 'User' },
      { id: 'billing',    label: 'Billing',          icon: 'Zap' },
    ]},
    { group: 'Generation', items: [
      { id: 'ai',         label: 'AI provider',      icon: 'Sparkle' },
      { id: 'export',     label: 'Export defaults',  icon: 'Download' },
      { id: 'api-keys',   label: 'API keys',         icon: 'Key' },
    ]},
    { group: 'Integrations', items: [
      { id: 'github',     label: 'GitHub',           icon: 'Github' },
      { id: 'vercel',     label: 'Vercel',           icon: 'Cloud' },
      { id: 'supabase',   label: 'Supabase',         icon: 'Database' },
      { id: 'railway',    label: 'Railway',          icon: 'Rocket' },
    ]},
    { group: 'System', items: [
      { id: 'notify',     label: 'Notifications',    icon: 'Bell' },
      { id: 'security',   label: 'Security',         icon: 'Lock' },
    ]},
  ];

  return (
    <div className="sf-app" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--sf-bg)' }}>
      <window.Sidebar active="settings" projects={window.SF_PROJECTS.slice(0,4)} />
      <div className="sf-col sf-grow" style={{ minWidth: 0 }}>
        <window.Topbar breadcrumbs={['Acme Studio', 'Settings']} right={null} />

        <div className="sf-row sf-grow" style={{ minHeight: 0 }}>
          {/* Settings sidebar */}
          <aside style={{ width: 220, flex: '0 0 auto', borderRight: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)', padding: '18px 12px', overflow: 'auto' }} className="sf-scroll">
            {SECTIONS.map((grp, gi) => (
              <div key={grp.group} style={{ marginBottom: gi < SECTIONS.length - 1 ? 16 : 0 }}>
                <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px 6px' }}>{grp.group}</div>
                {grp.items.map(it => {
                  const Ic = Icons[it.icon];
                  const active = section === it.id;
                  return (
                    <button key={it.id} onClick={() => setSection(it.id)} className="sf-row" style={{
                      width: '100%', gap: 10, padding: '7px 10px',
                      background: active ? 'rgba(255,255,255,0.05)' : 'transparent',
                      border: '1px solid', borderColor: active ? 'var(--sf-border)' : 'transparent',
                      borderRadius: 6,
                      color: active ? 'var(--sf-text)' : 'var(--sf-text-muted)',
                      fontFamily: 'inherit', fontSize: 12.5, cursor: 'pointer', textAlign: 'left',
                    }}>
                      <Ic size={13} cls={active ? '' : 'sf-faint'} /> {it.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </aside>

          {/* Settings body */}
          <main className="sf-scroll" style={{ flex: 1, overflow: 'auto' }}>
            <div style={{ maxWidth: 880, margin: '0 auto', padding: '28px 36px 80px' }}>
              {section === 'api-keys' && <APIKeysSection />}
              {section === 'ai'       && <AISection />}
              {section === 'profile'  && <ProfileSection />}
              {section === 'github'   && <IntegrationDetail name="GitHub" status="connected" desc="Push generated projects to GitHub repositories." />}
              {section === 'vercel'   && <IntegrationDetail name="Vercel" status="connected" desc="Deploy generated projects to Vercel." />}
              {section === 'supabase' && <IntegrationDetail name="Supabase" status="disconnected" desc="Use Supabase as your Postgres + Auth provider." />}
              {section === 'railway'  && <IntegrationDetail name="Railway" status="connected" desc="One-click deploy to Railway with provisioned services." />}
              {section === 'billing'  && <BillingSection />}
              {section === 'export'   && <ExportSection />}
              {section === 'notify'   && <NotifySection />}
              {section === 'members'  && <MembersSection />}
              {section === 'security' && <SecuritySection />}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

function SectionHead({ title, subtitle, actions }) {
  return (
    <div className="sf-row" style={{ marginBottom: 26, alignItems: 'flex-start' }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
        {subtitle && <p className="sf-muted" style={{ fontSize: 13.5, margin: '6px 0 0' }}>{subtitle}</p>}
      </div>
      <span className="sf-grow" />
      {actions}
    </div>
  );
}
function FieldRow({ label, hint, children }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 24, padding: '18px 0', borderBottom: '1px solid var(--sf-border)' }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {hint && <div className="sf-faint" style={{ fontSize: 11.5, marginTop: 4, lineHeight: 1.45 }}>{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function APIKeysSection() {
  const Icons = window.Icons;
  const keys = [
    { name: 'production', token: 'sf_live_••••••••••••2f3a', created: 'May 04 2026', lastUsed: '12 min ago', scope: 'all' },
    { name: 'ci',         token: 'sf_live_••••••••••••71b8', created: 'Apr 22 2026', lastUsed: '2 h ago',    scope: 'generate, deploy' },
    { name: 'local-dev',  token: 'sf_dev_•••••••••••••c4e0', created: 'Apr 02 2026', lastUsed: 'yesterday',  scope: 'generate' },
  ];
  return (
    <>
      <SectionHead
        title="API keys"
        subtitle="Use these to call StackForge from your own scripts and CI."
        actions={<button className="sf-btn sf-btn--primary sf-btn--sm"><Icons.Plus size={11} /> New key</button>}
      />
      <div className="sf-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="sf-row" style={{ padding: '10px 16px', borderBottom: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)', fontSize: 11, color: 'var(--sf-text-faint)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          <span style={{ flex: '0 0 130px' }}>Name</span>
          <span style={{ flex: '0 0 220px' }}>Token</span>
          <span style={{ flex: '0 0 160px' }}>Scope</span>
          <span style={{ flex: '0 0 120px' }}>Created</span>
          <span className="sf-grow">Last used</span>
        </div>
        {keys.map((k, i) => (
          <div key={k.name} className="sf-row" style={{ padding: '12px 16px', borderBottom: i < keys.length-1 ? '1px solid var(--sf-border)' : 'none', gap: 8, fontSize: 13 }}>
            <span style={{ flex: '0 0 130px' }} className="sf-row">
              <Icons.Key size={11} cls="sf-faint" /> <span style={{ marginLeft: 6 }}>{k.name}</span>
            </span>
            <span className="mono" style={{ flex: '0 0 220px', fontSize: 11.5, color: 'var(--sf-text-muted)' }}>{k.token}</span>
            <span style={{ flex: '0 0 160px', fontSize: 12, color: 'var(--sf-text-muted)' }}>{k.scope}</span>
            <span style={{ flex: '0 0 120px', fontSize: 12 }} className="sf-muted">{k.created}</span>
            <span className="sf-grow sf-faint" style={{ fontSize: 12 }}>{k.lastUsed}</span>
            <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: '0 5px' }}><Icons.Copy size={11} /></button>
            <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: '0 5px' }}><Icons.More size={13} /></button>
          </div>
        ))}
      </div>

      <h3 className="sf-h3" style={{ marginTop: 36, marginBottom: 12 }}>Webhooks</h3>
      <div className="sf-card" style={{ padding: 18 }}>
        <div className="sf-row" style={{ marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>POST · acmestudio.com/hooks/stackforge</div>
            <div className="sf-faint" style={{ fontSize: 11.5, marginTop: 4 }}>generation.completed · deployment.failed · deployment.succeeded</div>
          </div>
          <span className="sf-grow" />
          <span className="sf-chip"><span className="sf-dot sf-dot--green" /> Active</span>
          <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: '0 5px' }}><Icons.More size={13} /></button>
        </div>
      </div>
    </>
  );
}

function AISection() {
  const Icons = window.Icons;
  return (
    <>
      <SectionHead title="AI provider" subtitle="Choose which model powers generation. Bring your own key for higher rate limits." />

      <FieldRow label="Architect model" hint="Used for system design, schema, and code planning.">
        <div className="sf-card" style={{ padding: 12 }}>
          <div className="sf-row" style={{ gap: 12 }}>
            <Icons.Sparkle size={14} />
            <div className="sf-grow">
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>StackForge Architect 2.4</div>
              <div className="sf-faint" style={{ fontSize: 11.5 }}>Default · multi-pass reasoning, schema-aware</div>
            </div>
            <span className="sf-chip">Recommended</span>
            <button className="sf-btn sf-btn--sm">Change</button>
          </div>
        </div>
      </FieldRow>

      <FieldRow label="Code model" hint="Used to author individual files once the plan is approved.">
        <div className="sf-card" style={{ padding: 12 }}>
          <div className="sf-row" style={{ gap: 12 }}>
            <Icons.Code size={14} />
            <div className="sf-grow">
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>Auto (best available)</div>
              <div className="sf-faint" style={{ fontSize: 11.5 }}>Selects based on file kind and length</div>
            </div>
            <button className="sf-btn sf-btn--sm">Configure</button>
          </div>
        </div>
      </FieldRow>

      <FieldRow label="Bring your own keys" hint="Routes your generations through your own API account. We never store responses.">
        <div className="sf-col" style={{ gap: 10 }}>
          {[
            { name: 'Anthropic', val: 'sk-ant-•••••••', dot: 'green' },
            { name: 'OpenAI',    val: 'sk-•••••••',     dot: 'green' },
            { name: 'Google',    val: '— not set —',     dot: 'gray' },
          ].map(p => (
            <div key={p.name} className="sf-card" style={{ padding: 12 }}>
              <div className="sf-row" style={{ gap: 12 }}>
                <span className={`sf-dot sf-dot--${p.dot}`} />
                <div className="sf-grow">
                  <div style={{ fontSize: 13 }}>{p.name}</div>
                  <div className="mono sf-faint" style={{ fontSize: 11 }}>{p.val}</div>
                </div>
                <button className="sf-btn sf-btn--ghost sf-btn--sm">{p.dot === 'gray' ? 'Connect' : 'Manage'}</button>
              </div>
            </div>
          ))}
        </div>
      </FieldRow>

      <FieldRow label="Privacy" hint="What we do with your prompts and code.">
        <div className="sf-card" style={{ padding: 16 }}>
          {[
            { l: 'Train on your prompts',     v: 'never', dot: 'green' },
            { l: 'Retain code outputs',       v: '30 days', dot: 'gray' },
            { l: 'Share with subprocessors',  v: 'never', dot: 'green' },
          ].map(r => (
            <div key={r.l} className="sf-row" style={{ padding: '8px 0', borderBottom: '1px dashed var(--sf-border)' }}>
              <span style={{ fontSize: 12.5 }}>{r.l}</span>
              <span className="sf-grow" />
              <span className={`sf-dot sf-dot--${r.dot}`} />
              <span className="mono sf-muted" style={{ fontSize: 11.5, marginLeft: 6 }}>{r.v}</span>
            </div>
          ))}
        </div>
      </FieldRow>
    </>
  );
}

function ProfileSection() {
  return (
    <>
      <SectionHead title="Profile" subtitle="Your workspace identity." />
      <FieldRow label="Display name">
        <input className="sf-input" defaultValue="Alex Chen" style={{ maxWidth: 320, height: 36 }} />
      </FieldRow>
      <FieldRow label="Workspace name" hint="Shown in the sidebar and on shared links.">
        <input className="sf-input" defaultValue="Acme Studio" style={{ maxWidth: 320, height: 36 }} />
      </FieldRow>
      <FieldRow label="Theme" hint="Dark only for now. Light coming soon.">
        <div className="sf-row" style={{ gap: 8 }}>
          {['Dark','High contrast','Auto'].map((t, i) => (
            <button key={t} className="sf-btn sf-btn--sm" style={{
              background: i === 0 ? 'var(--sf-surface-2)' : 'transparent',
              borderColor: i === 0 ? 'var(--sf-border-strong)' : 'var(--sf-border)',
            }}>{t}</button>
          ))}
        </div>
      </FieldRow>
    </>
  );
}

function IntegrationDetail({ name, status, desc }) {
  const Icons = window.Icons;
  return (
    <>
      <SectionHead
        title={name}
        subtitle={desc}
        actions={status === 'connected'
          ? <button className="sf-btn sf-btn--sm">Disconnect</button>
          : <button className="sf-btn sf-btn--primary sf-btn--sm">Connect</button>}
      />
      <div className="sf-card" style={{ padding: 18 }}>
        <div className="sf-row" style={{ gap: 14 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--sf-surface-2)', border: '1px solid var(--sf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {name === 'GitHub' ? <Icons.Github size={20} /> :
             name === 'Vercel' ? <Icons.Cloud size={20} /> :
             name === 'Supabase' ? <Icons.Database size={20} /> :
             <Icons.Rocket size={20} />}
          </div>
          <div className="sf-grow">
            <div className="sf-row" style={{ gap: 8 }}>
              <span style={{ fontSize: 14, fontWeight: 500 }}>{name}</span>
              <span className="sf-chip">
                <span className={`sf-dot sf-dot--${status === 'connected' ? 'green' : 'gray'}`} /> {status}
              </span>
            </div>
            <div className="sf-muted" style={{ fontSize: 12.5, marginTop: 2 }}>{desc}</div>
          </div>
        </div>
        {status === 'connected' && (
          <div className="sf-row" style={{ marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--sf-border)', gap: 16, fontSize: 12.5 }}>
            <div>
              <div className="sf-faint" style={{ fontSize: 11 }}>Account</div>
              <div className="mono">acme-studio</div>
            </div>
            <div>
              <div className="sf-faint" style={{ fontSize: 11 }}>Scopes</div>
              <div>repo, workflow, admin:org</div>
            </div>
            <div>
              <div className="sf-faint" style={{ fontSize: 11 }}>Connected</div>
              <div>Apr 12 2026</div>
            </div>
          </div>
        )}
      </div>

      <h3 className="sf-h3" style={{ marginTop: 28, marginBottom: 12 }}>Permissions</h3>
      <div className="sf-card" style={{ padding: 0, overflow: 'hidden' }}>
        {[
          { l: 'Read repositories', d: 'View existing repos in your account', on: true },
          { l: 'Create repositories', d: 'Push new generated projects', on: true },
          { l: 'Write to existing repos', d: 'Modify code in current repos', on: false },
          { l: 'Trigger workflows', d: 'Run GitHub Actions from StackForge', on: true },
        ].map((p, i, arr) => (
          <div key={p.l} className="sf-row" style={{ padding: '14px 18px', borderBottom: i < arr.length-1 ? '1px solid var(--sf-border)' : 'none' }}>
            <div className="sf-grow">
              <div style={{ fontSize: 13 }}>{p.l}</div>
              <div className="sf-faint" style={{ fontSize: 11.5, marginTop: 1 }}>{p.d}</div>
            </div>
            <div style={{
              width: 28, height: 16, borderRadius: 999,
              background: p.on ? 'var(--sf-text)' : 'rgba(255,255,255,0.08)',
              position: 'relative', cursor: 'pointer',
            }}>
              <div style={{
                position: 'absolute', top: 2, left: p.on ? 14 : 2,
                width: 12, height: 12, borderRadius: 999,
                background: p.on ? 'var(--sf-bg)' : 'var(--sf-text)',
                transition: 'left .15s',
              }} />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function BillingSection() {
  return (
    <>
      <SectionHead title="Billing" subtitle="Plan, usage, and invoices." />
      <div className="sf-card-elev" style={{ padding: 22, marginBottom: 24 }}>
        <div className="sf-row" style={{ marginBottom: 12 }}>
          <span className="sf-chip">Current plan</span>
          <span className="sf-grow" />
          <button className="sf-btn sf-btn--sm">Change plan</button>
        </div>
        <h3 style={{ fontSize: 22, fontWeight: 500, letterSpacing: '-0.02em', margin: '0 0 4px' }}>Studio · $49/mo</h3>
        <p className="sf-muted" style={{ fontSize: 13, margin: 0 }}>Renews July 1, 2026 · 5 seats included</p>
      </div>
      {[
        { l: 'Generations',  v: '42 / 100',  pct: 42 },
        { l: 'Build minutes', v: '184 / 500', pct: 36.8 },
        { l: 'Team seats',   v: '3 / 5',    pct: 60 },
      ].map(u => (
        <div key={u.l} style={{ marginBottom: 14 }}>
          <div className="sf-row" style={{ marginBottom: 6 }}>
            <span style={{ fontSize: 13 }}>{u.l}</span>
            <span className="sf-grow" />
            <span className="mono sf-faint" style={{ fontSize: 11.5 }}>{u.v}</span>
          </div>
          <window.Progress value={u.pct} />
        </div>
      ))}
    </>
  );
}

function ExportSection() {
  return (
    <>
      <SectionHead title="Export defaults" subtitle="Defaults applied when you export a project." />
      <FieldRow label="Package manager"><div className="sf-row" style={{ gap: 6 }}>
        {['pnpm','npm','bun','yarn'].map((p, i) => (
          <button key={p} className="sf-btn sf-btn--sm" style={{ background: i === 0 ? 'var(--sf-surface-2)' : 'transparent', borderColor: i === 0 ? 'var(--sf-border-strong)' : 'var(--sf-border)' }}>{p}</button>
        ))}
      </div></FieldRow>
      <FieldRow label="Include Dockerfile" hint="Multi-stage build, runs as non-root user.">
        <Toggle on />
      </FieldRow>
      <FieldRow label="Include GitHub Actions" hint="Lint, type-check, test, deploy on push.">
        <Toggle on />
      </FieldRow>
      <FieldRow label="Include SDK package" hint="A typed client package generated from your OpenAPI spec.">
        <Toggle on />
      </FieldRow>
    </>
  );
}

function NotifySection() {
  return (
    <>
      <SectionHead title="Notifications" />
      {[
        ['Generation completed', 'Email, in-app'],
        ['Deployment failed', 'Email, Slack, in-app'],
        ['Deployment succeeded', 'Slack'],
        ['Weekly summary', 'Email'],
      ].map(([l, v]) => (
        <FieldRow key={l} label={l}>
          <input className="sf-input" defaultValue={v} style={{ maxWidth: 320, height: 36 }} />
        </FieldRow>
      ))}
    </>
  );
}

function MembersSection() {
  const members = [
    { n: 'Alex Chen',     e: 'alex@acmestudio.com',  r: 'Owner' },
    { n: 'Priya Okafor',  e: 'priya@acmestudio.com', r: 'Admin' },
    { n: 'Sam Vargas',    e: 'sam@acmestudio.com',   r: 'Member' },
  ];
  return (
    <>
      <SectionHead title="Members" subtitle="3 of 5 seats used."
        actions={<button className="sf-btn sf-btn--primary sf-btn--sm">Invite member</button>} />
      <div className="sf-card" style={{ padding: 0, overflow: 'hidden' }}>
        {members.map((m, i) => (
          <div key={m.e} className="sf-row" style={{ padding: '14px 18px', borderBottom: i < members.length-1 ? '1px solid var(--sf-border)' : 'none', gap: 12 }}>
            <div className="sf-avatar">{m.n.split(' ').map(s => s[0]).join('')}</div>
            <div className="sf-grow">
              <div style={{ fontSize: 13 }}>{m.n}</div>
              <div className="sf-faint" style={{ fontSize: 11.5 }}>{m.e}</div>
            </div>
            <span className="sf-chip">{m.r}</span>
            <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: '0 5px' }}><window.Icons.More size={13} /></button>
          </div>
        ))}
      </div>
    </>
  );
}

function SecuritySection() {
  return (
    <>
      <SectionHead title="Security" subtitle="Sign-in and session controls." />
      <FieldRow label="Two-factor authentication" hint="Required for owners and admins."><Toggle on /></FieldRow>
      <FieldRow label="Session timeout"><input className="sf-input" defaultValue="30 days" style={{ maxWidth: 200, height: 36 }} /></FieldRow>
      <FieldRow label="SAML SSO" hint="Enterprise plan only."><button className="sf-btn sf-btn--sm" disabled style={{ opacity: 0.5 }}>Configure</button></FieldRow>
      <FieldRow label="Audit log" hint="Export the last 90 days of workspace events."><button className="sf-btn sf-btn--sm"><window.Icons.Download size={11} /> Export</button></FieldRow>
    </>
  );
}

function Toggle({ on }) {
  return (
    <div style={{
      width: 30, height: 18, borderRadius: 999,
      background: on ? 'var(--sf-text)' : 'rgba(255,255,255,0.10)',
      position: 'relative', cursor: 'pointer',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 14 : 2,
        width: 14, height: 14, borderRadius: 999,
        background: on ? 'var(--sf-bg)' : 'var(--sf-text)',
        transition: 'left .15s',
      }} />
    </div>
  );
}

window.Settings = Settings;
