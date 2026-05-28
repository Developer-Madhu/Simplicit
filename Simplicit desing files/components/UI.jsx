// Reusable UI primitives: code block, file tree, schema mini, route list, etc.

const { useState: uState, useEffect: uEffect, useMemo: uMemo, useRef: uRef } = React;

// ---- Syntax-tokenized code block (cheap pseudo-highlighter) ----
function CodeBlock({ language = 'ts', lines = [], showLineNumbers = true, scroll = false, height, title, actions }) {
  return (
    <div className="sf-code" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {(title || actions) && (
        <div className="sf-row" style={{ padding: '8px 12px', borderBottom: '1px solid var(--sf-border)', gap: 8, background: 'var(--sf-surface)', flex: '0 0 auto' }}>
          {title && <span className="mono" style={{ fontSize: 11, color: 'var(--sf-text-muted)' }}>{title}</span>}
          <span className="sf-chip sf-chip-mono" style={{ height: 18, padding: '0 6px', fontSize: 10 }}>{language}</span>
          <span className="sf-grow" />
          {actions}
        </div>
      )}
      <pre className="sf-scroll" style={{
        margin: 0, padding: '12px 14px', overflow: scroll ? 'auto' : 'hidden',
        height: height, flex: '1 1 auto', whiteSpace: 'pre',
      }}>
        {lines.map((ln, i) => (
          <div key={i} style={{ minHeight: '1.65em' }}>
            {showLineNumbers && <span className="ln">{i + 1}</span>}
            <span dangerouslySetInnerHTML={{ __html: ln }} />
          </div>
        ))}
      </pre>
    </div>
  );
}

// Token helpers for code highlighting
const T = {
  kw: s => `<span class="tok-kw">${s}</span>`,
  fn: s => `<span class="tok-fn">${s}</span>`,
  str: s => `<span class="tok-str">${s}</span>`,
  num: s => `<span class="tok-num">${s}</span>`,
  cmt: s => `<span class="tok-cmt">${s}</span>`,
  type: s => `<span class="tok-type">${s}</span>`,
  prop: s => `<span class="tok-prop">${s}</span>`,
};

// ---- File tree ----
// nodes: [{name, type:'dir'|'file', icon?, lang?, children?, badge?, status?}]
function FileTree({ nodes, openByDefault = true, selected, onSelect, depth = 0 }) {
  return (
    <div className="sf-col" style={{ gap: 0 }}>
      {nodes.map((n, i) => (
        <FileTreeRow key={`${n.name}-${i}`} node={n} depth={depth} openByDefault={openByDefault} selected={selected} onSelect={onSelect} />
      ))}
    </div>
  );
}
function FileTreeRow({ node, depth, openByDefault, selected, onSelect }) {
  const Icons = window.Icons;
  const [open, setOpen] = uState(openByDefault);
  const isSel = selected === node.path;
  const Ic = node.type === 'dir' ? (open ? Icons.FolderO : Icons.Folder) : Icons.File;
  return (
    <>
      <button
        onClick={() => { if (node.type === 'dir') setOpen(o => !o); else onSelect?.(node); }}
        className="sf-row"
        style={{
          gap: 6, padding: '4px 10px', paddingLeft: 10 + depth * 14,
          width: '100%', background: isSel ? 'rgba(255,255,255,0.05)' : 'transparent',
          border: 'none', borderRadius: 4,
          color: isSel ? 'var(--sf-text)' : 'var(--sf-text-muted)',
          cursor: 'pointer', textAlign: 'left',
          fontFamily: 'inherit', fontSize: 12.5,
        }}
        onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
        onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = 'transparent'; }}
      >
        {node.type === 'dir' ? (
          <Icons.ArrowR size={10} cls="sf-faint" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .12s' }} />
        ) : <span style={{ width: 10 }} />}
        <Ic size={13} cls={node.type === 'dir' ? '' : 'sf-faint'} />
        <span className="sf-grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{node.name}</span>
        {node.status === 'new' && <span className="mono" style={{ fontSize: 10, color: 'var(--sf-green)' }}>+</span>}
        {node.badge && <span className="sf-chip sf-chip-mono" style={{ height: 16, padding: '0 5px', fontSize: 9.5 }}>{node.badge}</span>}
      </button>
      {node.type === 'dir' && open && node.children && (
        <FileTree nodes={node.children} depth={depth + 1} openByDefault={openByDefault} selected={selected} onSelect={onSelect} />
      )}
    </>
  );
}

// ---- DB schema mini card ----
function SchemaTable({ name, columns = [], accent = 'blue', x, y, width = 220 }) {
  const positioned = typeof x === 'number';
  return (
    <div className="sf-card" style={{
      width, position: positioned ? 'absolute' : 'relative',
      left: x, top: y,
      background: 'var(--sf-surface)',
      overflow: 'hidden',
    }}>
      <div className="sf-row" style={{
        padding: '6px 10px', gap: 8,
        borderBottom: '1px solid var(--sf-border)',
        background: 'var(--sf-surface-2)',
      }}>
        <span className={`sf-dot sf-dot--${accent}`} />
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--sf-text)', fontWeight: 500 }}>{name}</span>
      </div>
      <div className="sf-col">
        {columns.map((c, i) => (
          <div key={i} className="sf-row" style={{
            padding: '4px 10px', gap: 8, fontSize: 11,
            borderBottom: i < columns.length - 1 ? '1px solid rgba(255,255,255,0.03)' : 'none',
          }}>
            <span className="mono sf-grow" style={{ color: c.pk ? 'var(--sf-text)' : 'var(--sf-text-muted)' }}>
              {c.name}{c.pk && <span style={{ color: 'var(--sf-amber)', marginLeft: 4 }}>★</span>}
              {c.fk && <span style={{ color: 'var(--sf-blue)', marginLeft: 4 }}>→</span>}
            </span>
            <span className="mono sf-faint" style={{ fontSize: 10.5 }}>{c.type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- HTTP route row ----
const METHOD_COLOR = {
  GET:    { bg: 'rgba(46,160,255,0.10)', fg: 'oklch(0.78 0.14 250)', label: 'GET' },
  POST:   { bg: 'rgba(120,200,120,0.10)', fg: 'oklch(0.78 0.16 145)', label: 'POST' },
  PUT:    { bg: 'rgba(255,180,80,0.10)', fg: 'oklch(0.80 0.13 75)', label: 'PUT' },
  PATCH:  { bg: 'rgba(180,140,255,0.10)', fg: 'oklch(0.76 0.14 290)', label: 'PATCH' },
  DELETE: { bg: 'rgba(255,90,90,0.10)', fg: 'oklch(0.74 0.18 25)', label: 'DEL' },
};
function MethodPill({ method }) {
  const c = METHOD_COLOR[method] || METHOD_COLOR.GET;
  return (
    <span className="mono" style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      width: 38, height: 18, borderRadius: 4, fontSize: 9.5, fontWeight: 600,
      letterSpacing: '0.03em',
      background: c.bg, color: c.fg,
    }}>{c.label}</span>
  );
}
function RouteRow({ method, path, auth, note }) {
  return (
    <div className="sf-row" style={{ padding: '7px 12px', gap: 10, borderBottom: '1px solid var(--sf-border)' }}>
      <MethodPill method={method} />
      <span className="mono sf-grow" style={{ fontSize: 12, color: 'var(--sf-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{path}</span>
      {auth && <span className="sf-chip" style={{ height: 18, padding: '0 6px', fontSize: 10 }}>
        <window.Icons.Lock size={9} /> {auth}
      </span>}
      {note && <span className="sf-faint" style={{ fontSize: 11 }}>{note}</span>}
    </div>
  );
}

// ---- Toast ----
function Toast({ kind = 'info', title, body, actions }) {
  const Icons = window.Icons;
  const colors = {
    info:    { dot: 'var(--sf-blue)' },
    success: { dot: 'var(--sf-green)' },
    warn:    { dot: 'var(--sf-amber)' },
    error:   { dot: 'var(--sf-red)' },
  }[kind];
  return (
    <div className="sf-card-elev" style={{
      padding: '12px 14px', minWidth: 320, boxShadow: 'var(--sf-shadow-lg)',
      background: 'var(--sf-surface-2)',
    }}>
      <div className="sf-row" style={{ gap: 10, alignItems: 'flex-start' }}>
        <span className="sf-dot" style={{ background: colors.dot, marginTop: 6, boxShadow: `0 0 8px ${colors.dot}` }} />
        <div className="sf-grow">
          <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
          {body && <div style={{ fontSize: 12, color: 'var(--sf-text-muted)', marginTop: 2 }}>{body}</div>}
          {actions && <div className="sf-row" style={{ gap: 6, marginTop: 8 }}>{actions}</div>}
        </div>
        <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: '0 4px', height: 20 }}>
          <Icons.X size={11} />
        </button>
      </div>
    </div>
  );
}

// ---- Architecture node (for diagrams) ----
function ArchNode({ x, y, w = 160, h = 64, kind = 'service', title, subtitle, status, accent = 'blue', icon }) {
  const Icons = window.Icons;
  const Ic = icon ? Icons[icon] : null;
  return (
    <div style={{
      position: 'absolute', left: x, top: y, width: w, height: h,
      background: 'var(--sf-surface)',
      border: '1px solid var(--sf-border-strong)',
      borderRadius: 10,
      padding: '8px 10px',
      display: 'flex', flexDirection: 'column', gap: 4,
      boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
    }}>
      <div className="sf-row" style={{ gap: 6 }}>
        {Ic && <Ic size={12} />}
        <span className="mono" style={{ fontSize: 10, color: 'var(--sf-text-faint)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          {kind}
        </span>
        <span className="sf-grow" />
        {status && <span className={`sf-dot sf-dot--${accent}`} />}
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2 }}>{title}</div>
      {subtitle && <div className="mono" style={{ fontSize: 10.5, color: 'var(--sf-text-muted)' }}>{subtitle}</div>}
    </div>
  );
}

// ---- Connector path between two nodes (simple right-angled, with an animated dot) ----
function ArchEdge({ from, to, label, dashed = false, animated = false }) {
  // from / to: { x, y }
  const midX = (from.x + to.x) / 2;
  const path = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
  return (
    <g>
      <path d={path} stroke="rgba(255,255,255,0.18)" strokeWidth="1" fill="none" strokeDasharray={dashed ? '4 4' : 'none'} />
      {animated && (
        <circle r="2.5" fill="oklch(0.78 0.16 250)">
          <animateMotion dur="2.4s" repeatCount="indefinite" path={path} />
        </circle>
      )}
      {label && (
        <text x={midX} y={(from.y + to.y) / 2 - 6} fill="rgba(255,255,255,0.5)" fontSize="9" textAnchor="middle"
          fontFamily="JetBrains Mono, monospace" letterSpacing="0.03em">{label}</text>
      )}
    </g>
  );
}

// ---- Progress bar ----
function Progress({ value = 0, height = 4, color = 'var(--sf-text)' }) {
  return (
    <div style={{ height, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{
        width: `${value}%`, height: '100%', background: color, borderRadius: 999,
        transition: 'width .4s cubic-bezier(.2,.7,.3,1)',
      }} />
    </div>
  );
}

// ---- Stat tile ----
function StatTile({ label, value, delta, deltaKind = 'up', sparkline }) {
  const Icons = window.Icons;
  return (
    <div className="sf-card" style={{ padding: 16, minHeight: 96, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div className="sf-row">
        <span className="sf-grow sf-muted" style={{ fontSize: 12 }}>{label}</span>
        {delta && (
          <span className="mono" style={{
            fontSize: 10.5, color: deltaKind === 'up' ? 'var(--sf-green)' : 'var(--sf-red)',
          }}>{deltaKind === 'up' ? '↑' : '↓'} {delta}</span>
        )}
      </div>
      <div className="sf-row" style={{ alignItems: 'flex-end', gap: 10 }}>
        <span style={{ fontSize: 26, fontWeight: 500, letterSpacing: '-0.02em' }}>{value}</span>
        {sparkline && <div className="sf-grow">{sparkline}</div>}
      </div>
    </div>
  );
}

// ---- Tiny sparkline ----
function Spark({ data = [4,6,5,8,7,9,8,11,10,13,12,15], width = 80, height = 24, color = 'var(--sf-text-muted)' }) {
  const max = Math.max(...data), min = Math.min(...data);
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / (max - min || 1)) * height;
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width={width} height={height} aria-hidden="true">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

Object.assign(window, {
  CodeBlock, T, FileTree, SchemaTable, MethodPill, RouteRow, Toast,
  ArchNode, ArchEdge, Progress, StatTile, Spark,
});
