"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Play,
  Sparkles,
  ChevronRight,
  Box,
  Globe,
  Cloud,
  Server,
  Lock,
  Zap,
  Database,
  Layers as Layers3,
  HardDrive,
  File,
  Bell,
  Terminal,
  PlayCircle,
  Code,
  Rocket
} from "lucide-react";

import { Brand } from "@/features/shell";
import { architectureNodes, architectureEdges } from "@/lib/demo-data";

// Token helpers for code highlighting
const T = {
  kw: (s: string) => `<span class="tok-kw">${s}</span>`,
  fn: (s: string) => `<span class="tok-fn">${s}</span>`,
  str: (s: string) => `<span class="tok-str">${s}</span>`,
  num: (s: string) => `<span class="tok-num">${s}</span>`,
  cmt: (s: string) => `<span class="tok-cmt">${s}</span>`,
  type: (s: string) => `<span class="tok-type">${s}</span>`,
  prop: (s: string) => `<span class="tok-prop">${s}</span>`,
};

const SF_CODE_ROUTES = [
  `${T.cmt('// apps/api/src/modules/exams/routes.ts')}`,
  `${T.kw('import')} { ${T.fn('Hono')} } ${T.kw('from')} ${T.str("'hono'")}`,
  `${T.kw('import')} { ${T.fn('z')} } ${T.kw('from')} ${T.str("'zod'")}`,
  `${T.kw('import')} { ${T.fn('requireAuth')} } ${T.kw('from')} ${T.str("'@/middleware/auth'")}`,
  `${T.kw('import')} { examService } ${T.kw('from')} ${T.str("'./service'")}`,
  ``,
  `${T.kw('export const')} ${T.prop('router')} = ${T.kw('new')} ${T.fn('Hono')}()`,
  ``,
  `${T.prop('router')}.${T.fn('post')}(${T.str("'/'")}, ${T.fn('requireAuth')}(${T.str("'instructor'")}), ${T.kw('async')} (c) => {`,
  `  ${T.kw('const')} ${T.prop('body')} = ${T.kw('await')} c.${T.fn('req')}.${T.fn('json')}()`,
  `  ${T.kw('const')} ${T.prop('parsed')} = ${T.prop('CreateExam')}.${T.fn('parse')}(${T.prop('body')})`,
  `  ${T.kw('const')} ${T.prop('exam')} = ${T.kw('await')} examService.${T.fn('create')}(${T.prop('parsed')})`,
  `  ${T.kw('return')} c.${T.fn('json')}({ ${T.prop('exam')} }, ${T.num('201')})`,
  `})`,
];

interface CodeBlockProps {
  language?: string;
  lines: string[];
  showLineNumbers?: boolean;
  scroll?: boolean;
  height?: number | string;
  title?: string;
  actions?: ReactNode;
}

function CodeBlock({
  language = "ts",
  lines = [],
  showLineNumbers = true,
  scroll = false,
  height,
  title,
  actions
}: CodeBlockProps) {
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

interface ArchNodeProps {
  x: number;
  y: number;
  w?: number;
  h?: number;
  kind?: string;
  title: string;
  subtitle?: string;
  status?: boolean;
  accent?: string;
  icon?: string;
}

function ArchNode({ x, y, w = 160, h = 64, kind = 'service', title, subtitle, status, accent = 'blue', icon }: ArchNodeProps) {
  const IconMap: Record<string, any> = {
    Globe, Cloud, Server, Lock, Zap, Layers: Layers3, Database
  };
  const Ic = icon ? IconMap[icon] : null;
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
      <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2, color: 'var(--sf-text)' }}>{title}</div>
      {subtitle && <div className="mono" style={{ fontSize: 10.5, color: 'var(--sf-text-muted)' }}>{subtitle}</div>}
    </div>
  );
}

interface ArchEdgeProps {
  from: { x: number; y: number };
  to: { x: number; y: number };
  label?: string;
  dashed?: boolean;
  animated?: boolean;
}

function ArchEdge({ from, to, label, dashed = false, animated = false }: ArchEdgeProps) {
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

function SectionEyebrow({ label, centered }: { label: string; centered?: boolean }) {
  return (
    <div className="sf-row" style={{ justifyContent: centered ? 'center' : 'flex-start', marginBottom: 14 }}>
      <span className="mono" style={{ fontSize: 11, letterSpacing: '0.16em', textTransform: 'uppercase', color: 'var(--sf-text-faint)' }}>
        {label}
      </span>
    </div>
  );
}

function SectionTitle({ title, subtitle, centered }: { title: string; subtitle?: string; centered?: boolean }) {
  return (
    <div style={{ textAlign: centered ? 'center' : 'left', maxWidth: centered ? 720 : 760, margin: centered ? '0 auto' : '0' }}>
      <h2 style={{ fontSize: 40, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.1, margin: 0, color: 'var(--sf-text)' }}>{title}</h2>
      {subtitle && <p className="sf-muted" style={{ fontSize: 16, marginTop: 12 }}>{subtitle}</p>}
    </div>
  );
}

interface FeatureSplitProps {
  eyebrow: string;
  title: string;
  body: string;
  bullets: string[];
  visual: ReactNode;
  flip?: boolean;
}

function FeatureSplit({ eyebrow, title, body, bullets, visual, flip }: FeatureSplitProps) {
  return (
    <section style={{ padding: '100px 24px', borderTop: '1px solid var(--sf-border)' }}>
      <div style={{
        maxWidth: 1240, margin: '0 auto',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center',
      }}>
        <div style={{ order: flip ? 2 : 1 }}>
          <SectionEyebrow label={eyebrow} />
          <h2 style={{ fontSize: 36, fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 16px', color: 'var(--sf-text)' }}>{title}</h2>
          <p className="sf-muted" style={{ fontSize: 15.5, lineHeight: 1.55 }}>{body}</p>
          <div className="sf-col" style={{ gap: 10, marginTop: 24 }}>
            {bullets.map(b => (
              <div key={b} className="sf-row" style={{ gap: 10 }}>
                <Check size={14} className="sf-muted" />
                <span style={{ fontSize: 14, color: 'var(--sf-text-muted)' }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
        <div style={{ order: flip ? 1 : 2 }}>{visual}</div>
      </div>
    </section>
  );
}

export function LandingPage() {
  const fullPrompt = "Build backend for an online marketplace with seller onboarding, escrow payments, search, reviews, and a moderation queue.";
  const [typed, setTyped] = useState('');

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i += 2;
      setTyped(fullPrompt.slice(0, i));
      if (i >= fullPrompt.length) clearInterval(id);
    }, 35);
    return () => clearInterval(id);
  }, []);

  const navLinkStyle = { fontSize: 13, color: 'var(--sf-text-muted)', cursor: 'pointer', textDecoration: 'none' };

  return (
    <div className="sf-app" style={{ width: '100%', minHeight: '100%', background: 'var(--sf-bg)', overflow: 'hidden' }}>
      {/* Background dot grid + radial fade */}
      <div className="sf-dotgrid" style={{
        position: 'absolute', inset: 0, opacity: 0.5, pointerEvents: 'none',
        maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 0%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 0%, transparent 70%)',
      }} />

      {/* ============ NAV ============ */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(10,10,11,0.65)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--sf-border)',
      }}>
        <div className="sf-row" style={{ maxWidth: 1240, margin: '0 auto', height: 60, padding: '0 24px', gap: 14 }}>
          <Brand />
          <span className="sf-chip sf-chip-mono" style={{ height: 19, padding: '0 6px', fontSize: 9.5 }}>beta</span>
          <span className="sf-grow" />
          <nav className="sf-row" style={{ gap: 22 }}>
            <a style={navLinkStyle} href="#">Product</a>
            <Link style={navLinkStyle} href="/terms">Terms</Link>
            <a style={navLinkStyle} href="#stack">Stack</a>
            <Link style={navLinkStyle} href="/docs">Docs</Link>
            <a style={navLinkStyle} href="#">Pricing</a>
            <a style={navLinkStyle} href="#">Changelog</a>
          </nav>
          <span className="sf-grow" />
          <span className="sf-row" style={{ gap: 8 }}>
            <Link href="/sign-in" className="sf-btn sf-btn--ghost sf-btn--sm">Sign in</Link>
            <Link href="/workspace" className="sf-btn sf-btn--primary sf-btn--sm">
              Start building <ChevronRight size={11} style={{ marginLeft: 4 }} />
            </Link>
          </span>
        </div>
      </header>

      {/* ============ HERO ============ */}
      <section style={{ position: 'relative', padding: '90px 24px 60px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', position: 'relative' }}>
          <div style={{ textAlign: 'center', maxWidth: 860, margin: '0 auto' }}>
            <Link href="/workspace" className="sf-chip" style={{ height: 28, padding: '0 12px', marginBottom: 28, fontSize: 12, textDecoration: 'none' }}>
              <span className="sf-dot sf-dot--green" />
              New · Architect agents now reason in real time
              <ChevronRight size={11} className="sf-muted" style={{ marginLeft: 4 }} />
            </Link>
            <h1 style={{
              fontSize: 68, lineHeight: 1.03, letterSpacing: '-0.035em',
              fontWeight: 500, margin: '0 0 22px', color: 'var(--sf-text)'
            }}>
              From idea to production backend
              <br/>
              <span style={{ color: 'var(--sf-text-dim)' }}>in minutes, not weeks.</span>
            </h1>
            <p style={{ fontSize: 18, lineHeight: 1.5, color: 'var(--sf-text-muted)', maxWidth: 620, margin: '0 auto 36px' }}>
              Simplicit helps developers go from idea → production-ready backend foundation using AI.
              Schema, auth, APIs, jobs, IaC — all yours, all code, all real.
            </p>
            <div className="sf-row" style={{ gap: 12, justifyContent: 'center' }}>
              <Link href="/workspace" className="sf-btn sf-btn--primary sf-btn--lg">
                <Sparkles size={14} style={{ marginRight: 6 }} /> Start building free
              </Link>
              <button className="sf-btn sf-btn--lg" style={{ background: 'var(--sf-surface)' }} type="button">
                <Play size={13} style={{ marginRight: 6 }} /> Watch 90s demo
              </button>
            </div>
            <div className="sf-row" style={{ gap: 18, justifyContent: 'center', marginTop: 22, fontSize: 12, color: 'var(--sf-text-dim)' }}>
              <span className="sf-row" style={{ gap: 6 }}><Check size={12} className="sf-muted" /> No credit card</span>
              <span className="sf-row" style={{ gap: 6 }}><Check size={12} className="sf-muted" /> Self-host the output</span>
              <span className="sf-row" style={{ gap: 6 }}><Check size={12} className="sf-muted" /> MIT-licensed exports</span>
            </div>
          </div>

          {/* ============ HERO PRODUCT MOCK ============ */}
          <div style={{ marginTop: 72, position: 'relative' }}>
            {/* Soft accent glow */}
            <div aria-hidden style={{
              position: 'absolute', left: '50%', top: -40, width: 700, height: 320,
              transform: 'translateX(-50%)',
              background: 'radial-gradient(ellipse, oklch(0.55 0.14 250 / 0.18), transparent 60%)',
              pointerEvents: 'none', filter: 'blur(20px)',
            }} />
            <div className="sf-card-elev" style={{
              overflow: 'hidden', position: 'relative',
              boxShadow: '0 60px 160px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06) inset',
            }}>
              {/* Mock topbar */}
              <div className="sf-row" style={{
                height: 36, padding: '0 14px', gap: 10,
                background: 'var(--sf-bg-2)', borderBottom: '1px solid var(--sf-border)',
              }}>
                <span className="sf-dot" style={{ background: '#3a3a3f' }} />
                <span className="sf-dot" style={{ background: '#3a3a3f' }} />
                <span className="sf-dot" style={{ background: '#3a3a3f' }} />
                <span className="sf-grow" />
                <span className="mono sf-faint" style={{ fontSize: 11 }}>simplicit.dev / generate</span>
                <span className="sf-grow" />
                <span style={{ width: 60 }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', minHeight: 540 }}>
                {/* Left: prompt + reasoning */}
                <div className="sf-col" style={{ padding: 28, gap: 22, borderRight: '1px solid var(--sf-border)' }}>
                  <div className="sf-card-elev" style={{ padding: 0, overflow: 'hidden', background: 'var(--sf-surface-2)' }}>
                    <div style={{ padding: '18px 18px 14px', minHeight: 100, fontSize: 15, lineHeight: 1.5, color: 'var(--sf-text)' }}>
                      {typed}<span className="sf-caret"/>
                    </div>
                    <div className="sf-row" style={{ padding: '10px 14px', gap: 8, borderTop: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)' }}>
                      <span className="sf-chip sf-chip-mono">Hono</span>
                      <span className="sf-chip sf-chip-mono">Postgres</span>
                      <span className="sf-chip sf-chip-mono">Stripe</span>
                      <span className="sf-grow" />
                      <Link href="/workspace" className="sf-btn sf-btn--primary sf-btn--sm">
                        <Sparkles size={11} style={{ marginRight: 4 }} /> Generate
                      </Link>
                    </div>
                  </div>

                  {/* Reasoning timeline */}
                  <div className="sf-col" style={{ gap: 6 }}>
                    {[
                      { l: 'Parsed 7 entities · 2 user roles', d: 'done' },
                      { l: 'Selected stack: Hono · Postgres · Stripe', d: 'done' },
                      { l: 'Designed schema (9 tables, 5 indexes)', d: 'done' },
                      { l: 'Mapping API surface — 31 routes', d: 'active' },
                      { l: 'Authoring auth flow', d: 'pending' },
                      { l: 'Wiring background jobs', d: 'pending' },
                    ].map((r, i) => (
                      <div key={i} className="sf-row" style={{ gap: 10, opacity: r.d === 'pending' ? 0.35 : 1 }}>
                        <div style={{
                          width: 14, height: 14, borderRadius: 999, flex: '0 0 auto',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          background: r.d === 'done' ? 'var(--sf-text)' : 'transparent',
                          border: r.d === 'active' ? '1.5px solid var(--sf-blue)' : 'none',
                        }}>
                          {r.d === 'done' && <Check size={9} />}
                          {r.d === 'active' && <span className="sf-dot sf-dot--blue sf-pulse" />}
                        </div>
                        <span style={{ fontSize: 13, color: r.d === 'done' ? 'var(--sf-text)' : 'var(--sf-text-muted)' }}>
                          {r.l}
                          {r.d === 'active' && <span className="sf-caret"/>}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right: architecture mini diagram */}
                <div style={{ position: 'relative', background: 'var(--sf-bg-2)', overflow: 'hidden' }}>
                  <div className="sf-linegrid" style={{ position: 'absolute', inset: 0, opacity: 0.6 }} />
                  <div className="sf-row" style={{ padding: '12px 14px', borderBottom: '1px solid var(--sf-border)', position: 'relative' }}>
                    <span className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Live architecture</span>
                    <span className="sf-grow" />
                    <span className="sf-dot sf-dot--blue sf-pulse" />
                  </div>
                  <div style={{ position: 'relative', height: 480, padding: 14 }}>
                    <div style={{ transform: 'scale(0.7)', transformOrigin: 'top left', position: 'relative', width: '143%', height: 600 }}>
                      <ArchNode x={0}   y={20}  kind="client"  title="Web Client"   subtitle="Next.js" icon="Globe" />
                      <ArchNode x={180} y={20}  kind="edge"    title="Edge / CDN"   subtitle="Cloudflare" icon="Cloud" />
                      <ArchNode x={0}   y={120} kind="service" title="API Gateway"  subtitle="Hono · /v1" icon="Server" status accent="purple" />
                      <ArchNode x={200} y={120} kind="service" title="Auth"         subtitle="Lucia" icon="Lock" status accent="purple" />
                      <ArchNode x={0}   y={220} kind="service" title="Payments"     subtitle="Stripe" icon="Zap" status accent="amber" />
                      <ArchNode x={200} y={220} kind="queue"   title="Workers"      subtitle="Layers" icon="Layers" status accent="blue" />
                      <ArchNode x={100} y={320} kind="data"    title="PostgreSQL"   subtitle="primary" icon="Database" status accent="green" />
                      <ArchNode x={290} y={320} kind="data"    title="Redis"        subtitle="cache" icon="Database" status accent="green" />
                      <svg style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }} width="600" height="600">
                        <ArchEdge from={{x:160,y:52}} to={{x:180,y:52}} />
                        <ArchEdge from={{x:80,y:84}} to={{x:80,y:120}} />
                        <ArchEdge from={{x:160,y:152}} to={{x:200,y:152}} animated />
                        <ArchEdge from={{x:80,y:184}} to={{x:80,y:220}} animated />
                        <ArchEdge from={{x:80,y:284}} to={{x:130,y:320}} animated />
                        <ArchEdge from={{x:280,y:184}} to={{x:280,y:220}} />
                        <ArchEdge from={{x:280,y:284}} to={{x:320,y:320}} />
                      </svg>
                    </div>
                  </div>
                  <div className="sf-row" style={{ position: 'absolute', bottom: 14, left: 14, right: 14, gap: 8 }}>
                    <span className="sf-chip sf-chip-mono">10 services</span>
                    <span className="sf-chip sf-chip-mono">38 routes</span>
                    <span className="sf-chip sf-chip-mono">11 tables</span>
                    <span className="sf-grow" />
                    <Link href="/workspace" className="sf-btn sf-btn--sm">
                      Open
                    </Link>
                  </div>
                </div>
              </div>

              {/* Mock bottom strip: file gen ticker */}
              <div className="sf-row" style={{
                padding: '10px 18px', borderTop: '1px solid var(--sf-border)',
                background: 'var(--sf-bg-2)', gap: 14, overflow: 'hidden',
              }}>
                <span className="sf-dot sf-dot--green" />
                <span className="mono sf-muted" style={{ fontSize: 11.5 }}>
                  <span className="sf-faint">writing</span> apps/api/src/modules/payments/webhook.ts <span className="tok-num">+128</span>
                </span>
                <span className="sf-grow" />
                <span className="mono sf-faint" style={{ fontSize: 11.5 }}>76 / 124 files · 4.2s elapsed</span>
              </div>
            </div>
          </div>

          {/* Trusted by strip */}
          <div style={{ marginTop: 64, textAlign: 'center' }}>
            <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.16em', textTransform: 'uppercase' }}>
              Trusted by engineering teams at
            </div>
            <div className="sf-row" style={{ gap: 40, justifyContent: 'center', marginTop: 18, opacity: 0.55, flexWrap: 'wrap' }}>
              {['Lumen', 'Northwind', 'Caldera', 'Helix', 'Brigade', 'Foundry', 'Anvil'].map(n => (
                <span key={n} style={{ fontSize: 17, fontWeight: 500, letterSpacing: '0.04em', color: 'var(--sf-text-muted)' }}>{n}</span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ HOW IT WORKS ============ */}
      <section style={{ position: 'relative', padding: '100px 24px 60px', borderTop: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <SectionEyebrow label="01 — Workflow" />
          <SectionTitle title="A backend, end to end." subtitle="Four steps. Real output. Drop it in your codebase and ship." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginTop: 48 }}>
            {[
              { n: '01', t: 'Describe',    d: 'Plain English. Paste a PRD, a doc, or just type.',  ic: Sparkles },
              { n: '02', t: 'Reason',      d: 'Simplicit reasons about entities, stack, and trade-offs in real time.', ic: Layers3 },
              { n: '03', t: 'Generate',    d: 'Schema, routes, auth, jobs, IaC. Every file production-grade.', ic: Code },
              { n: '04', t: 'Deploy',      d: 'One click to GitHub, Railway, Vercel, Fly. Or download the zip.', ic: Rocket },
            ].map(s => {
              const Ic = s.ic;
              return (
                <div key={s.n} className="sf-card" style={{ padding: 20, minHeight: 180 }}>
                  <div className="sf-row" style={{ marginBottom: 22 }}>
                    <span className="mono sf-faint" style={{ fontSize: 11 }}>{s.n}</span>
                    <span className="sf-grow" />
                    <Ic size={16} className="sf-muted" />
                  </div>
                  <div className="sf-h2" style={{ marginBottom: 6, margin: 0 }}>{s.t}</div>
                  <div className="sf-muted" style={{ fontSize: 13, marginTop: 4 }}>{s.d}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ FEATURE: ARCHITECTURE ============ */}
      <FeatureSplit
        eyebrow="02 — Architecture"
        title="An AI systems architect, not a chatbot."
        body="Simplicit reasons about your domain like a senior engineer would: bounded contexts, data ownership, failure modes. The output is a complete architecture you can defend in a review."
        bullets={[
          'Service & data-flow diagrams',
          'Auth, RBAC, and tenancy decisions',
          'Caching, queues, and rate-limit strategy',
          'Cost & latency annotations',
        ]}
        visual={
          <div className="sf-card sf-linegrid" style={{ height: 380, position: 'relative', overflow: 'hidden', background: 'var(--sf-bg-2)' }}>
            <div style={{ position: 'absolute', inset: 0, transform: 'scale(0.62)', transformOrigin: 'top left', width: '162%', height: '162%' }}>
              {architectureNodes.map(n => <ArchNode key={n.id} {...n} status />)}
              <svg style={{ position: 'absolute', inset: 0 }} width="1200" height="320">
                {architectureEdges.map(([f, t, l], i) => {
                  const nodeById = Object.fromEntries(architectureNodes.map(n => [n.id, n]));
                  const from = { x: nodeById[f].x + 160, y: nodeById[f].y + 32 };
                  const to   = { x: nodeById[t].x,        y: nodeById[t].y + 32 };
                  return <ArchEdge key={i} from={from} to={to} label={l} animated={i % 3 === 0} />;
                })}
              </svg>
            </div>
          </div>
        }
      />

      {/* ============ FEATURE: CODE PREVIEW ============ */}
      <FeatureSplit
        flip
        eyebrow="03 — Output"
        title="Real, opinionated, hand-readable code."
        body="No spaghetti. No leaky abstractions. Simplicit follows the conventions of the framework you pick, with named modules, typed boundaries, and tests where they matter."
        bullets={[
          'TypeScript end-to-end, with Zod or Valibot schemas',
          'Drizzle / Prisma migrations included',
          'OpenAPI spec + generated SDK package',
          'Pluggable: works with your linter, tests, CI',
        ]}
        visual={
          <div className="sf-card-elev" style={{ padding: 0, overflow: 'hidden', height: 380 }}>
            <div className="sf-row" style={{ padding: '8px 12px', borderBottom: '1px solid var(--sf-border)', gap: 8, background: 'var(--sf-bg-2)' }}>
              {['routes.ts','service.ts','schema.ts'].map((n, i) => (
                <span key={n} className="sf-row" style={{
                  height: 22, padding: '0 10px', gap: 6, borderRadius: 6, fontSize: 11.5,
                  background: i === 0 ? 'var(--sf-elevated)' : 'transparent',
                  color: i === 0 ? 'var(--sf-text)' : 'var(--sf-text-muted)',
                }}>
                  <File size={11} className="sf-faint" /> {n}
                </span>
              ))}
              <span className="sf-grow" />
              <span className="sf-chip sf-chip-mono" style={{ height: 19, padding: '0 6px', fontSize: 9.5 }}>ts</span>
            </div>
            <CodeBlock
              lines={SF_CODE_ROUTES}
              title=""
              language="ts"
              height={332}
              scroll
            />
          </div>
        }
      />

      {/* ============ STACK ============ */}
      <section id="stack" style={{ padding: '100px 24px 60px', borderTop: '1px solid var(--sf-border)', scrollMarginTop: 72 }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', textAlign: 'center' }}>
          <SectionEyebrow label="04 — Stack" centered />
          <SectionTitle centered title="Pick your stack. Or let us pick." subtitle="Simplicit supports the frameworks engineers actually ship with. No vendor lock-in." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 0, marginTop: 48, border: '1px solid var(--sf-border)', borderRadius: 16, overflow: 'hidden' }}>
            {[
              'Hono','Fastify','Express','Elysia','Nest.js','Encore',
              'PostgreSQL','MySQL','SQLite','Redis','ClickHouse','MongoDB',
              'Lucia','Clerk','Auth.js','WorkOS','Stripe','LemonSqueezy',
              'BullMQ','Inngest','Trigger.dev','Resend','S3 / R2','Cloudflare',
            ].map((n, i) => (
              <div key={n+i} className="sf-row" style={{
                height: 80, justifyContent: 'center', gap: 10,
                borderRight: (i % 6) === 5 ? 'none' : '1px solid var(--sf-border)',
                borderBottom: i < 18 ? '1px solid var(--sf-border)' : 'none',
                fontSize: 13, color: 'var(--sf-text)',
                background: 'var(--sf-surface)',
              }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: 'var(--sf-text-faint)' }} />
                {n}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============ FEATURES GRID ============ */}
      <section style={{ padding: '60px 24px 100px' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <SectionEyebrow label="05 — Capabilities" />
          <SectionTitle title="Everything you'd build yourself —" subtitle="just faster, and consistent across every project." />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 48 }}>
            {[
              { ic: Database, t: 'Schema & migrations',     d: 'Drizzle / Prisma migrations with indexes, foreign keys, and seed data.' },
              { ic: Lock,     t: 'Auth & RBAC',             d: 'Email, OAuth, magic links, sessions, role policies, audit logs.' },
              { ic: Server,   t: 'API routes & SDK',        d: 'Typed handlers, OpenAPI spec, generated client SDK.' },
              { ic: Layers3,  t: 'Background jobs',         d: 'BullMQ / Inngest jobs, retries, dead-letter queues.' },
              { ic: Zap,      t: 'Payments & webhooks',     d: 'Stripe checkout, webhook validation, idempotency.' },
              { ic: Cloud,    t: 'Storage & uploads',       d: 'Presigned URLs, S3 / R2 / Supabase storage adapters.' },
              { ic: Bell,     t: 'Notifications',           d: 'Email (Resend), in-app inbox, queued delivery.' },
              { ic: Terminal, t: 'CLI & dev environment',   d: 'docker-compose, .env templates, ready-to-run scripts.' },
              { ic: Rocket,   t: 'Deploy targets',          d: 'Railway, Fly, Vercel, AWS, or your own Docker host.' },
            ].map((f, fi) => {
              const Ic = f.ic;
              return (
                <div key={fi} className="sf-card" style={{ padding: 18 }}>
                  <Ic size={16} className="sf-muted" />
                  <div className="sf-h3" style={{ marginTop: 14, margin: 0 }}>{f.t}</div>
                  <div className="sf-muted" style={{ fontSize: 13, marginTop: 4 }}>{f.d}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============ CTA ============ */}
      <section style={{ padding: '120px 24px', borderTop: '1px solid var(--sf-border)' }}>
        <div className="sf-card-elev" style={{
          maxWidth: 1100, margin: '0 auto', padding: '60px 40px', textAlign: 'center',
          background: 'radial-gradient(ellipse at top, oklch(0.30 0.10 250 / 0.35), transparent 70%), var(--sf-surface-2)',
        }}>
          <span className="sf-chip" style={{ marginBottom: 22 }}>
            <span className="sf-dot sf-dot--blue sf-pulse" /> Public beta · free during preview
          </span>
          <h2 style={{ fontSize: 48, letterSpacing: '-0.03em', fontWeight: 500, lineHeight: 1.05, margin: '0 0 14px', color: 'var(--sf-text)' }}>
            Ship the boring 80%.<br/>
            <span className="sf-dim">Spend your time on the rest.</span>
          </h2>
          <p className="sf-muted" style={{ fontSize: 16, maxWidth: 520, margin: '0 auto 28px' }}>
            Generate your first backend in under a minute. No credit card, no commitment, no vendor lock-in.
          </p>
          <div className="sf-row" style={{ gap: 10, justifyContent: 'center' }}>
            <Link href="/workspace" className="sf-btn sf-btn--primary sf-btn--lg">Start building <ChevronRight size={13} style={{ marginLeft: 4 }} /></Link>
            <Link className="sf-btn sf-btn--lg" style={{ background: 'transparent' }} href="/docs">Read the docs</Link>
          </div>
        </div>
      </section>

      {/* ============ FOOTER ============ */}
      <footer style={{ padding: '60px 24px 40px', borderTop: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)' }}>
        <div style={{ maxWidth: 1240, margin: '0 auto' }}>
          <div className="sf-row" style={{ alignItems: 'flex-start', gap: 60 }}>
            <div style={{ maxWidth: 280 }}>
              <Brand />
              <p className="sf-muted" style={{ fontSize: 12.5, marginTop: 14, lineHeight: 1.55 }}>
                Backend foundations, generated by an AI architect. From idea to production in minutes.
              </p>
              <div className="sf-row" style={{ gap: 6, marginTop: 16 }}>
                <a className="sf-btn sf-btn--sm sf-btn--ghost" style={{ padding: '0 8px' }} href="#"><Check size={12} /></a>
                <a className="sf-btn sf-btn--sm sf-btn--ghost" style={{ padding: '0 8px' }} href="#">X</a>
                <a className="sf-btn sf-btn--sm sf-btn--ghost" style={{ padding: '0 8px' }} href="#">Discord</a>
              </div>
            </div>
            <span className="sf-grow" />
            {[
              { h: 'Product', l: ['Workspace','Templates','Pricing','Changelog','Roadmap'] },
              { h: 'Stack',   l: ['Hono','Postgres','Stripe','Lucia','All integrations'] },
              { h: 'Resources', l: ['Docs','Examples','Blog','Status','Security'] },
              { h: 'Company', l: ['About','Customers','Careers','Contact','Press kit'] },
            ].map(c => (
              <div key={c.h} className="sf-col" style={{ gap: 7, minWidth: 120 }}>
                <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>{c.h}</div>
                {c.l.map(x => (
                  <a key={x} style={{ fontSize: 13, color: 'var(--sf-text-muted)', textDecoration: 'none' }} href={x === 'Docs' ? '/docs' : '#'}>{x}</a>
                ))}
              </div>
            ))}
          </div>
          <div className="sf-row" style={{ marginTop: 50, paddingTop: 22, borderTop: '1px solid var(--sf-border)' }}>
            <span className="mono sf-faint" style={{ fontSize: 11 }}>© 2026 Simplicit Labs, Inc.</span>
            <span className="sf-grow" />
            <span className="sf-row" style={{ gap: 18, fontSize: 11.5, color: 'var(--sf-text-faint)' }}>
              <Link href="/privacy" style={{ textDecoration: 'none', color: 'inherit' }}>Privacy</Link>
              <Link href="/terms" style={{ textDecoration: 'none', color: 'inherit' }}>Terms</Link>
              <a href="#" style={{ textDecoration: 'none' }}>SOC 2</a>
              <a href="#" style={{ textDecoration: 'none' }}>DPA</a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
