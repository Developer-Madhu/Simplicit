// StackForge Project Dashboard — list of projects with filters, search, stats.

const Dashboard = () => {
  const Icons = window.Icons;
  const { useState } = React;
  const [view, setView] = useState('grid');
  const [filter, setFilter] = useState('all');

  const STATUS = {
    deployed: { dot: 'green', label: 'Deployed' },
    building: { dot: 'amber', label: 'Building' },
    draft:    { dot: 'gray',  label: 'Draft' },
    paused:   { dot: 'gray',  label: 'Paused' },
  };

  const activity = [
    { t: 'Examly API',         a: 'deployed to production',     by: 'Alex Chen',  when: '12m ago', dot: 'green' },
    { t: 'Loop Marketplace',   a: 'regenerated payments module', by: 'StackForge', when: '47m ago', dot: 'blue' },
    { t: 'Nova LMS',           a: 'pushed to acme/nova-lms',     by: 'Priya O.',   when: '2h ago',  dot: 'gray' },
    { t: 'Brief AI',           a: 'created from prompt',         by: 'Sam V.',     when: '5h ago',  dot: 'purple' },
    { t: 'Tessera Billing',    a: 'failed env validation',       by: 'StackForge', when: '1d ago',  dot: 'amber' },
  ];

  return (
    <div className="sf-app" style={{ width: '100%', height: '100%', display: 'flex', background: 'var(--sf-bg)' }}>
      <window.Sidebar active="projects" projects={window.SF_PROJECTS.slice(0,4)} />
      <div className="sf-col sf-grow" style={{ minWidth: 0 }}>
        <window.Topbar
          breadcrumbs={['Acme Studio', 'Projects']}
          right={<>
            <button className="sf-btn sf-btn--sm"><Icons.Filter size={11} /> Filters</button>
            <button className="sf-btn sf-btn--primary sf-btn--sm"><Icons.Plus size={11} /> New project</button>
          </>}
        />
        <main className="sf-scroll" style={{ flex: 1, overflow: 'auto', padding: 28 }}>
          <div style={{ maxWidth: 1280, margin: '0 auto' }}>
            {/* Page head */}
            <div className="sf-row" style={{ marginBottom: 24 }}>
              <div>
                <div className="sf-row" style={{ gap: 10, marginBottom: 6 }}>
                  <h1 style={{ fontSize: 24, fontWeight: 500, letterSpacing: '-0.02em', margin: 0 }}>Projects</h1>
                  <span className="sf-chip">{window.SF_PROJECTS.length}</span>
                </div>
                <p className="sf-muted" style={{ fontSize: 13.5, margin: 0 }}>Backend projects across this workspace.</p>
              </div>
            </div>

            {/* Stat row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
              <window.StatTile label="Active projects" value="6" delta="+2" sparkline={<window.Spark data={[2,3,3,4,5,5,6]} />} />
              <window.StatTile label="Generations this month" value="42" delta="+18%" sparkline={<window.Spark data={[8,11,9,14,18,22,42]} color="oklch(0.74 0.16 250)" />} />
              <window.StatTile label="Deployments" value="14" delta="+4" sparkline={<window.Spark data={[1,2,3,4,5,7,14]} color="oklch(0.78 0.18 145)" />} />
              <window.StatTile label="Avg. uptime" value="99.7%" delta="0.1%" sparkline={<window.Spark data={[98,99,99.4,99.5,99.7,99.7,99.7]} />} />
            </div>

            {/* Filters + view */}
            <div className="sf-row" style={{ marginBottom: 16, gap: 8 }}>
              <div className="sf-row" style={{ background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', borderRadius: 8, padding: 2 }}>
                {['all', 'deployed', 'building', 'draft'].map(f => (
                  <button key={f} onClick={() => setFilter(f)} className="sf-row" style={{
                    height: 26, padding: '0 12px', borderRadius: 6, border: 'none', fontFamily: 'inherit',
                    background: filter === f ? 'var(--sf-elevated)' : 'transparent',
                    color: filter === f ? 'var(--sf-text)' : 'var(--sf-text-muted)',
                    fontSize: 12, textTransform: 'capitalize', cursor: 'pointer',
                  }}>{f}</button>
                ))}
              </div>
              <div className="sf-row" style={{ gap: 8, height: 30, background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', borderRadius: 8, padding: '0 10px', minWidth: 240, color: 'var(--sf-text-dim)' }}>
                <Icons.Search size={12} />
                <input style={{ background: 'transparent', border: 'none', outline: 'none', fontFamily: 'inherit', fontSize: 12.5, color: 'var(--sf-text)', flex: 1 }} placeholder="Search projects, prompts, stacks…" />
              </div>
              <span className="sf-grow" />
              <button className="sf-btn sf-btn--sm" style={{ padding: '0 8px' }}>
                <Icons.Filter size={11} /> Stack: any
              </button>
              <button className="sf-btn sf-btn--sm" style={{ padding: '0 8px' }}>
                Sort: Updated <Icons.ChevD size={11} />
              </button>
              <div className="sf-row" style={{ background: 'var(--sf-surface)', border: '1px solid var(--sf-border)', borderRadius: 8, padding: 2 }}>
                <button onClick={() => setView('grid')} className="sf-row" style={{ height: 26, padding: '0 8px', border: 'none', background: view==='grid'?'var(--sf-elevated)':'transparent', color: view==='grid'?'var(--sf-text)':'var(--sf-text-muted)', borderRadius: 6, cursor: 'pointer' }}><Icons.Grid size={12} /></button>
                <button onClick={() => setView('list')} className="sf-row" style={{ height: 26, padding: '0 8px', border: 'none', background: view==='list'?'var(--sf-elevated)':'transparent', color: view==='list'?'var(--sf-text)':'var(--sf-text-muted)', borderRadius: 6, cursor: 'pointer' }}><Icons.List size={12} /></button>
              </div>
            </div>

            {/* Project grid */}
            {view === 'grid' ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
                {/* Create card */}
                <div className="sf-card" style={{
                  padding: 18, minHeight: 168,
                  border: '1px dashed rgba(255,255,255,0.10)',
                  background: 'transparent',
                  display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
                  gap: 8, cursor: 'pointer',
                }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'var(--sf-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icons.Plus size={16} />
                  </div>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>New project</div>
                  <div className="sf-faint" style={{ fontSize: 12 }}>Generate from a prompt</div>
                </div>

                {window.SF_PROJECTS.map(p => (
                  <ProjectCard key={p.id} p={p} STATUS={STATUS} />
                ))}
              </div>
            ) : (
              <div className="sf-card" style={{ padding: 0, marginBottom: 28, overflow: 'hidden' }}>
                <div className="sf-row" style={{ padding: '8px 14px', borderBottom: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)', fontSize: 11, color: 'var(--sf-text-faint)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                  <span style={{ flex: '0 0 36%' }}>Project</span>
                  <span style={{ flex: '0 0 22%' }}>Stack</span>
                  <span style={{ flex: '0 0 16%' }}>Status</span>
                  <span style={{ flex: '0 0 14%' }}>Health</span>
                  <span className="sf-grow">Updated</span>
                </div>
                {window.SF_PROJECTS.map((p, i) => (
                  <div key={p.id} className="sf-row" style={{ padding: '12px 14px', borderBottom: i < window.SF_PROJECTS.length-1 ? '1px solid var(--sf-border)' : 'none', fontSize: 13, gap: 8 }}>
                    <div className="sf-row" style={{ flex: '0 0 36%', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--sf-surface-2)', border: '1px solid var(--sf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icons.Box size={12} />
                      </div>
                      <div>
                        <div>{p.name}</div>
                        <div className="sf-faint" style={{ fontSize: 11 }}>{p.prompt}</div>
                      </div>
                    </div>
                    <span className="mono" style={{ flex: '0 0 22%', fontSize: 11.5, color: 'var(--sf-text-muted)' }}>{p.stack}</span>
                    <span style={{ flex: '0 0 16%' }} className="sf-row">
                      <span className={`sf-dot sf-dot--${p.dot}`} style={{ marginRight: 6 }} />
                      <span style={{ fontSize: 12.5 }}>{STATUS[p.status].label}</span>
                    </span>
                    <span style={{ flex: '0 0 14%' }} className="mono sf-muted">{p.health ? p.health + '%' : '—'}</span>
                    <span className="sf-grow sf-faint" style={{ fontSize: 12 }}>{p.updated}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Activity feed + usage */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 16 }}>
              <div className="sf-card" style={{ padding: 0, overflow: 'hidden' }}>
                <div className="sf-row" style={{ padding: '14px 18px', borderBottom: '1px solid var(--sf-border)' }}>
                  <span className="sf-h2 sf-grow">Activity</span>
                  <button className="sf-btn sf-btn--ghost sf-btn--sm">View all</button>
                </div>
                <div className="sf-col">
                  {activity.map((act, i) => (
                    <div key={i} className="sf-row" style={{ padding: '12px 18px', gap: 12, borderBottom: i < activity.length-1 ? '1px solid var(--sf-border)' : 'none' }}>
                      <span className={`sf-dot sf-dot--${act.dot}`} />
                      <div className="sf-grow">
                        <span style={{ fontSize: 13 }}><span style={{ fontWeight: 500 }}>{act.t}</span> {act.a}</span>
                        <div className="sf-faint" style={{ fontSize: 11.5, marginTop: 1 }}>{act.by}</div>
                      </div>
                      <span className="sf-faint" style={{ fontSize: 11.5 }}>{act.when}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="sf-card" style={{ padding: 18 }}>
                <div className="sf-h2" style={{ marginBottom: 6 }}>Usage</div>
                <p className="sf-faint" style={{ fontSize: 12, margin: '0 0 18px' }}>This billing cycle, resets Aug 1.</p>
                {[
                  { l: 'Generations', v: '42 / 100', pct: 42 },
                  { l: 'Build minutes', v: '184 / 500', pct: 36.8 },
                  { l: 'Storage', v: '1.2 / 5 GB', pct: 24 },
                  { l: 'Team seats', v: '3 / 5', pct: 60 },
                ].map(u => (
                  <div key={u.l} style={{ marginBottom: 12 }}>
                    <div className="sf-row" style={{ marginBottom: 6 }}>
                      <span style={{ fontSize: 12.5 }}>{u.l}</span>
                      <span className="sf-grow" />
                      <span className="mono sf-faint" style={{ fontSize: 11 }}>{u.v}</span>
                    </div>
                    <window.Progress value={u.pct} />
                  </div>
                ))}
                <button className="sf-btn sf-btn--sm" style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}>
                  Upgrade plan <Icons.ArrowR size={11} />
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

function ProjectCard({ p, STATUS }) {
  const Icons = window.Icons;
  return (
    <div className="sf-card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: 168 }}>
      <div style={{ padding: 18, flex: 1 }}>
        <div className="sf-row" style={{ marginBottom: 14 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--sf-surface-2)', border: '1px solid var(--sf-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icons.Box size={14} />
          </div>
          <span className="sf-grow" />
          <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: '0 5px' }}><Icons.More size={13} /></button>
        </div>
        <div className="sf-row" style={{ gap: 8, marginBottom: 4 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
          <span className={`sf-dot sf-dot--${p.dot}`} />
        </div>
        <p className="sf-muted" style={{ fontSize: 12.5, margin: '0 0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.prompt}</p>
        <div className="sf-row" style={{ gap: 6, flexWrap: 'wrap' }}>
          {p.stack.split(' · ').map(s => <span key={s} className="sf-chip sf-chip-mono">{s}</span>)}
        </div>
      </div>
      <div className="sf-row" style={{ padding: '10px 18px', borderTop: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)' }}>
        <span className="sf-faint" style={{ fontSize: 11.5 }}>{STATUS[p.status].label} · {p.updated}</span>
        <span className="sf-grow" />
        <span className="mono sf-faint" style={{ fontSize: 11 }}>{p.health ? p.health + '%' : '—'}</span>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
