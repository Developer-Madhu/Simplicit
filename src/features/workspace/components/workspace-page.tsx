"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useCreateProject } from "@/features/dashboard";
import { useToast } from "@/features/auth/context/toast-context";
import { sanitizePrompt } from "@/lib/prompt-sanitizer";
import { useAuth } from "@/features/auth/context/auth-context";
import { useWorkspace } from "@/features/workspace/context/workspace-context";
import type { IngestionResult } from "@/features/ingestion/types";
import { serializeIngestionResult } from "@/features/ingestion/types";
// Editor-first flow (Phase D): analysis completion creates a draft project and
// hands the in-memory result to the IDE via the flow store. The wizard, the
// pipeline status panel, and deployment all live in /generations/{id} now.
import { setFlowState } from "@/features/generation/state/generation-flow-store";
import { IngestionPanel } from "@/features/ingestion/components/ingestion-panel";
import { GitHubRepoSelector } from "@/features/ingestion/components/github-repo-selector";
import { processZipFile } from "@/features/ingestion/providers/zip-provider";
import { analyzeProject } from "@/features/ingestion/analyzers";
import { AnalysisSummary } from "@/features/ingestion/components/analysis-summary";
import { ContextGeneratorHub } from "@/features/generation";
import {
  Check,
  Download,
  Eye,
  Github,
  Lock,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Sparkles,
  StopCircle,
  ChevronRight,
  Database,
  Layers as Layers3,
  File,
  Search,
  Box,
  Key,
  Server,
  Cloud,
  Zap,
  HardDrive,
  Globe,
  Rocket,
  Edit,
  AlertTriangle
} from "lucide-react";

import { AppTopbar } from "@/features/shell";
import { InteractiveViewport } from "@/features/generation/components/interactive-viewport";
import { CommandPalette } from "./command-palette";
import { heroPrompt } from "@/lib/demo-data";
import { CollapsiblePanel, PanelToggleButton } from "@/components/ui/collapsible-panel";
import { CodeBlock } from "@/components/ui/code-block";

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

const SF_ARCH = {
  nodes: [
    { id: 'web',     kind: 'client',  title: 'Web Client',          subtitle: 'Next.js · iOS',   icon: 'Globe',    accent: 'blue',   x: 40,   y: 60 },
    { id: 'edge',    kind: 'edge',    title: 'Edge / CDN',          subtitle: 'Cloudflare',      icon: 'Cloud',    accent: 'blue',   x: 250,  y: 60 },
    { id: 'api',     kind: 'service', title: 'API Gateway',         subtitle: 'Hono · /v1',      icon: 'Server',   accent: 'purple', x: 470,  y: 60 },
    { id: 'auth',    kind: 'service', title: 'Auth Service',        subtitle: 'Lucia',           icon: 'Lock',     accent: 'purple', x: 700,  y: 0 },
    { id: 'exam',    kind: 'service', title: 'Exam Service',        subtitle: 'sessions',        icon: 'File',     accent: 'purple', x: 700,  y: 80 },
    { id: 'pay',     kind: 'service', title: 'Payments',            subtitle: 'Stripe',          icon: 'Zap',      accent: 'amber',  x: 700,  y: 160 },
    { id: 'queue',   kind: 'queue',   title: 'Job Queue',           subtitle: 'BullMQ',          icon: 'Layers',   accent: 'blue',   x: 700,  y: 240 },
    { id: 'pg',      kind: 'data',    title: 'PostgreSQL',          subtitle: 'primary',         icon: 'Database', accent: 'green',  x: 930,  y: 40 },
    { id: 'redis',   kind: 'data',    title: 'Redis',               subtitle: 'cache · sessions',icon: 'Database', accent: 'green',  x: 930,  y: 130 },
    { id: 's3',      kind: 'data',    title: 'Object Storage',      subtitle: 'S3 / R2',         icon: 'Cloud',    accent: 'green',  x: 930,  y: 220 },
  ],
  edges: [
    ['web','edge','HTTPS'], ['edge','api','REST'],
    ['api','auth','RPC'], ['api','exam','RPC'], ['api','pay','RPC'], ['api','queue','enqueue'],
    ['auth','pg',''], ['auth','redis',''],
    ['exam','pg',''], ['exam','queue',''],
    ['pay','pg',''],
    ['queue','pg',''], ['queue','s3',''],
  ],
};

const stackMap: Record<string, string> = {
  Hono: 'Hono \u00b7 PG \u00b7 Redis',
  Fastify: 'Fastify \u00b7 PG \u00b7 S3',
  Express: 'Express \u00b7 PG \u00b7 Stripe',
};

const DRAFT_KEY = 'simplicit_draft_prompt';
const HISTORY_KEY = 'simplicit_prompt_history';
const MAX_HISTORY = 10;

function loadDraft(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(DRAFT_KEY) || '';
}

function saveDraft(text: string) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(DRAFT_KEY, text);
}

function loadHistory(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function pushHistory(prompt: string) {
  if (typeof window === 'undefined') return;
  const list = loadHistory().filter(p => p !== prompt);
  list.unshift(prompt);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, MAX_HISTORY)));
}

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
    Globe, Cloud, Server, Lock, Zap, Layers: Layers3, Database, File
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

interface SchemaColumn {
  name: string;
  type: string;
  pk?: boolean;
  fk?: boolean;
}
interface SchemaTableProps {
  name: string;
  columns: SchemaColumn[];
  accent?: string;
  x?: number;
  y?: number;
  width?: number;
}
function SchemaTable({ name, columns = [], accent = 'blue', x, y, width = 220 }: SchemaTableProps) {
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

const METHOD_COLOR: Record<string, { bg: string; fg: string; label: string }> = {
  GET:    { bg: 'rgba(46,160,255,0.10)', fg: 'oklch(0.78 0.14 250)', label: 'GET' },
  POST:   { bg: 'rgba(120,200,120,0.10)', fg: 'oklch(0.78 0.16 145)', label: 'POST' },
  PUT:    { bg: 'rgba(255,180,80,0.10)', fg: 'oklch(0.80 0.13 75)', label: 'PUT' },
  PATCH:  { bg: 'rgba(180,140,255,0.10)', fg: 'oklch(0.76 0.14 290)', label: 'PATCH' },
  DELETE: { bg: 'rgba(255,90,90,0.10)', fg: 'oklch(0.74 0.18 25)', label: 'DEL' },
};

function MethodPill({ method }: { method: string }) {
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

function RouteRow({ method, path, auth, note }: { method: string; path: string; auth?: string | null; note?: string }) {
  return (
    <div className="sf-row" style={{ padding: '7px 12px', gap: 10, borderBottom: '1px solid var(--sf-border)' }}>
      <MethodPill method={method} />
      <span className="mono sf-grow" style={{ fontSize: 12, color: 'var(--sf-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{path}</span>
      {auth && <span className="sf-chip" style={{ height: 18, padding: '0 6px', fontSize: 10 }}>
        <Lock size={9} style={{ marginRight: 4 }} /> {auth}
      </span>}
      {note && <span className="sf-faint" style={{ fontSize: 11 }}>{note}</span>}
    </div>
  );
}

interface FileNode {
  name: string;
  type: 'dir' | 'file';
  status?: string;
  badge?: string;
  children?: FileNode[];
  path?: string;
}

function FileTree({ nodes, openByDefault = true, selected, onSelect, depth = 0 }: {
  nodes: FileNode[];
  openByDefault?: boolean;
  selected?: string;
  onSelect?: (node: FileNode) => void;
  depth?: number;
}) {
  return (
    <div className="sf-col" style={{ gap: 0 }}>
      {nodes.map((n, i) => (
        <FileTreeRow key={`${n.name}-${i}`} node={n} depth={depth} openByDefault={openByDefault} selected={selected} onSelect={onSelect} />
      ))}
    </div>
  );
}

function FileTreeRow({ node, depth, openByDefault, selected, onSelect }: {
  node: FileNode;
  depth: number;
  openByDefault: boolean;
  selected?: string;
  onSelect?: (node: FileNode) => void;
}) {
  const [open, setOpen] = useState(openByDefault);
  const isSel = selected === node.path;
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <button
        onClick={() => { if (node.type === 'dir') setOpen(o => !o); else onSelect?.(node); }}
        className="sf-row"
        style={{
          gap: 6, padding: '4px 10px', paddingLeft: 10 + depth * 14,
          width: '100%', background: isSel ? 'rgba(255,255,255,0.05)' : (hovered ? 'rgba(255,255,255,0.025)' : 'transparent'),
          border: 'none', borderRadius: 4,
          color: isSel ? 'var(--sf-text)' : 'var(--sf-text-muted)',
          cursor: 'pointer', textAlign: 'left',
          fontFamily: 'inherit', fontSize: 12.5,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        type="button"
      >
        {node.type === 'dir' ? (
          <ChevronRight size={10} className="sf-faint" style={{ transform: open ? 'rotate(90deg)' : 'none', transition: 'transform .12s' }} />
        ) : <span style={{ width: 10 }} />}
        
        <span className="sf-faint" style={{ display: 'inline-flex', alignItems: 'center' }}>
          {node.type === 'dir' ? <Box size={13} /> : <File size={13} />}
        </span>

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

interface ProgressProps {
  value?: number;
  height?: number;
  color?: string;
}

function Progress({ value = 0, height = 4, color = 'var(--sf-text)' }: ProgressProps) {
  return (
    <div style={{ height, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden' }}>
      <div style={{
        width: `${value}%`, height: '100%', background: color, borderRadius: 999,
        transition: 'width .4s cubic-bezier(.2,.7,.3,1)',
      }} />
    </div>
  );
}

export function WorkspacePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const createMutation = useCreateProject();

  // Editor-first flow: the workspace only composes/uploads/analyzes. The
  // wizard, pipeline, and deploy views live in the IDE (/generations/{id}).
  const [stage, setStage] = useState<'idle' | 'composing'>('idle');
  const [prompt, setPrompt] = useState('');
  const [previewTab, setPreviewTab] = useState<'arch' | 'schema' | 'routes' | 'files'>('arch');
  const [stack] = useState('Hono');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([]);

  // Ingestion state
  const [showIngestionPanel, setShowIngestionPanel] = useState(false);
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const [ingestionResult, setIngestionResult] = useState<IngestionResult | null>(null);
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  // Restore draft and history on mount
  useEffect(() => {
    const draft = loadDraft();
    if (draft) {
      setPrompt(draft);
      setStage('composing');
    }
    setHistory(loadHistory());
  }, []);

  // GitHub: connection status (for the toolbar button) + post-OAuth return handling.
  useEffect(() => {
    // Reflect connection status in the toolbar so returning users don't re-auth.
    fetch('/api/auth/github/token')
      .then((r) => r.json())
      .then((data) => {
        if (data?.connected) {
          setGithubConnected(true);
          setGithubUsername(data.username ?? null);
        }
      })
      .catch(() => {});

    // If we just came back from the OAuth flow, drop the user straight into the
    // repo picker, confirm with a toast, and strip the query param (no reload).
    if (typeof window !== 'undefined' && window.location.search.includes('github_connected=true')) {
      toast('GitHub connected — select a repository to import.', 'success');
      setShowRepoSelector(true);
      const url = new URL(window.location.href);
      url.searchParams.delete('github_connected');
      window.history.replaceState({}, '', url.toString());
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave draft as user types
  useEffect(() => {
    if (stage === 'idle' || stage === 'composing') {
      saveDraft(prompt);
    }
  }, [prompt, stage]);

  // Cmd+K palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(o => !o); }
      if (e.key === 'Escape') { setPaletteOpen(false); setShowHistory(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);


  const handleHistorySelect = (historyPrompt: string) => {
    setPrompt(historyPrompt);
    setStage('composing');
    setShowHistory(false);
  };

  // Editor-first flow: create the project row immediately (status 'draft'),
  // stash the in-memory analysis in the flow store — the full IngestionResult
  // cannot survive serialization — and hand off to the IDE, which runs the
  // wizard and the pipeline. `result` is absent for the prompt-only flow.
  const handleAnalysisCompleteAndNavigate = useCallback(async (result?: IngestionResult) => {
    if (!activeWorkspace) {
      toast('No active workspace — cannot create a project.', 'error');
      return;
    }

    const finalPrompt = prompt.trim() ||
      (result?.metadata.name
        ? `Build a production-ready backend for ${result.metadata.name}` +
          (result.metadata.description ? ` — ${result.metadata.description}` : '') +
          (result.framework.name !== 'Unknown' ? `. Frontend uses ${result.framework.name}.` : '.')
        : 'New backend project');

    const derivedName = finalPrompt
      .trim()
      .split(/\s+/)
      .slice(0, 4)
      .join(' ')
      .replace(/[^\w\s-]/g, '')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();

    try {
      const project = await createMutation.mutateAsync({
        name: derivedName || 'New Project',
        prompt: finalPrompt,
        stack,
        workspace_id: activeWorkspace.id,
        status: 'draft',
        dot: 'gray',
        health: null,
        generation_metadata: {
          ingestion: result ? serializeIngestionResult(result) : null,
          // Persist the analyzed frontend source (path → content) so the IDE
          // explorer can show it immediately — serializeIngestionResult drops
          // keyFiles, and the in-memory flow store is lost on hard refresh.
          source_files: result ? Object.fromEntries(result.keyFiles) : undefined,
        },
        simplicit_context: result?.simplicitContext || null,
      });

      setFlowState(project.id, {
        ingestionResult: result,
        prompt: finalPrompt,
        stack,
        answers: {},
        clarificationQuestions: result?.clarificationQuestions ?? [],
        createdAt: Date.now(),
      });

      router.push(`/generations/${project.id}?flow=new`);
    } catch {
      toast('Failed to initialize project — staying in the workspace.', 'error');
    }
  }, [activeWorkspace, prompt, stack, createMutation, router, toast]);

  // Generate button (prompt-only or with an attached analysis): validate the
  // prompt, then hand off to the IDE the same way analysis completion does.
  const startGeneration = useCallback(async () => {
    const finalPrompt = prompt.trim();
    if (!finalPrompt) {
      toast('Please describe what you want to build before generating.', 'error');
      promptRef.current?.focus();
      return;
    }

    // Client-side prompt safety check (blocks credential paste / injection early;
    // the API route re-validates server-side as the source of truth).
    const sanitized = sanitizePrompt(finalPrompt);
    if (sanitized.blocked) {
      toast(sanitized.reason ?? 'Invalid prompt', 'error');
      return;
    }
    sanitized.warnings.forEach(w => toast(w, 'info'));

    pushHistory(finalPrompt);
    setHistory(loadHistory());
    saveDraft('');

    await handleAnalysisCompleteAndNavigate(ingestionResult ?? undefined);
  }, [prompt, ingestionResult, handleAnalysisCompleteAndNavigate, toast]);

  // Shared completion handler — used by both the IngestionPanel (ZIP/context) and
  // the GitHub repo import below, so the analysis-result wiring isn't duplicated.
  const handleIngestionComplete = useCallback((result: IngestionResult) => {
    setIngestionResult(result);
    setShowIngestionPanel(false);
    void handleAnalysisCompleteAndNavigate(result);
  }, [handleAnalysisCompleteAndNavigate]);

  // GitHub "Connect repo": download the repo zipball via our server route (the
  // token stays server-side), then reuse the SAME processZipFile → analyzeProject
  // path that ZIP upload uses — nothing in the analysis pipeline changes.
  const handleRepoSelected = useCallback(async (sel: { owner: string; repo: string; branch: string }) => {
    setShowRepoSelector(false);
    try {
      toast(`Importing ${sel.owner}/${sel.repo}…`, "info");
      const res = await fetch("/api/github/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sel),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Download failed (${res.status})`);
      }
      const buf = await res.arrayBuffer();
      // NB: `File` is shadowed by the lucide-react `File` icon import in this
      // module, so reach the DOM File constructor via globalThis.
      const file = new globalThis.File([buf], `${sel.repo}.zip`, { type: "application/zip" });
      const files = await processZipFile(file);
      if (files.size === 0) throw new Error("No analyzable files found in the repository.");
      const result = await analyzeProject(files, "github");
      handleIngestionComplete(result);
      toast("Repository analyzed successfully.", "success");
    } catch (e: any) {
      toast(e?.message || "Failed to import repository.", "error");
    }
  }, [toast, handleIngestionComplete]);

  // Render components based on tab
  const renderTabContent = () => {
    switch (previewTab) {
      case 'arch':
        return (
          <div>
            <div className="sf-row" style={{ marginBottom: 10 }}>
              <span className="sf-h3 sf-grow" style={{ margin: 0 }}>System architecture</span>
            </div>
            <div className="sf-card" style={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <div className="sf-col sf-center" style={{ gap: 12 }}>
                  <Layers3 size={24} style={{ color: 'var(--sf-text-faint)' }} />
                  <span className="sf-muted">Architecture preview appears in the editor.</span>
               </div>
            </div>
            <div className="sf-h3" style={{ marginTop: 18, marginBottom: 10, margin: 0 }}>Stack</div>
            <div className="sf-card" style={{ padding: 14, marginTop: 10 }}>
              <div className="sf-row" style={{ gap: 8 }}>
                 <span className="mono sf-muted" style={{ fontSize: 11.5 }}>{stack}</span>
              </div>
            </div>
          </div>
        );
      case 'schema':
        return (
          <div>
            <div className="sf-row" style={{ marginBottom: 10 }}>
              <span className="sf-h3 sf-grow" style={{ margin: 0 }}>Database schema</span>
            </div>
            <div className="sf-card" style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <span className="sf-muted">Generating schema...</span>
            </div>
          </div>
        );
      case 'routes':
        return (
          <div>
            <div className="sf-row" style={{ marginBottom: 10 }}>
              <span className="sf-h3 sf-grow" style={{ margin: 0 }}>API routes</span>
            </div>
            <div className="sf-card" style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
               <span className="sf-muted">Generating routes...</span>
            </div>
          </div>
        );
      case 'files':
        return (
          <div>
            <div className="sf-row" style={{ marginBottom: 10 }}>
              <span className="sf-h3 sf-grow" style={{ margin: 0 }}>Files</span>
            </div>
            <div className="sf-card" style={{ padding: '20px', textAlign: 'center' }}>
               <span className="sf-muted">Generating file tree...</span>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="sf-app" style={{ height: '100vh', width: '100%', display: 'flex', overflow: 'hidden', background: 'var(--sf-bg)', flexDirection: 'column' }}>
      <AppTopbar
        breadcrumbs={[activeWorkspace?.name || 'Workspace', 'New generation']}
        actions={
          <div className="sf-row" style={{ gap: 8 }}>
            <PanelToggleButton isOpen={isPanelOpen} onClick={() => setIsPanelOpen(!isPanelOpen)} />
          </div>
        }
      />

      <div className="sf-row sf-grow" style={{ minHeight: 0, flex: 1 }}>
        {/* Main canvas */}
        <main className="sf-scroll" style={{
          flex: '1 1 auto', overflow: 'auto', position: 'relative',
          background: 'var(--sf-bg)', height: '100%',
          transition: 'margin-right 0.3s ease',
        }}>
          <div className="sf-dotgrid" style={{ position: 'absolute', inset: 0, opacity: 0.4, pointerEvents: 'none' }} />
          <div style={{
            position: 'relative', padding: '56px 56px 80px',
            display: 'flex', justifyContent: 'center',
            minHeight: '100%',
          }}>
              <div style={{ width: '100%', maxWidth: 760 }}>
                <h1 className="sf-h1" style={{ textAlign: 'center', marginBottom: 10, fontSize: 32, margin: 0, color: 'var(--sf-text)' }}>
                  What are you shipping?
                </h1>
                <p className="sf-muted" style={{ textAlign: 'center', marginBottom: 28, fontSize: 14, marginTop: 8 }}>
                  Describe your product in plain English. Simplicit will design a production-ready backend.
                </p>

                {/* Ingestion panel */}
                {showIngestionPanel && !ingestionResult && (
                  <IngestionPanel
                    onComplete={handleIngestionComplete}
                    onClose={() => setShowIngestionPanel(false)}
                    onFocusPrompt={() => promptRef.current?.focus()}
                  />
                )}

                {/* Analysis summary (shown after ingestion) */}
                {ingestionResult && (
                  <AnalysisSummary
                    result={ingestionResult}
                    onClear={() => { setIngestionResult(null); }}
                    onReanalyze={() => { setIngestionResult(null); setShowIngestionPanel(true); }}
                  />
                )}

                {/* Clarification questions are answered in the editor wizard now. */}

                {/* Big prompt card */}
                <div className="sf-card-elev" style={{
                  padding: 0, overflow: 'hidden',
                  boxShadow: '0 24px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.06) inset',
                }}>
                  <textarea
                    ref={promptRef}
                    value={prompt}
                    onChange={e => { setPrompt(e.target.value); setStage(e.target.value ? 'composing' : 'idle'); }}
                    onKeyDown={e => { if ((e.metaKey||e.ctrlKey) && e.key === 'Enter') startGeneration(); }}
                    placeholder="Build backend for an online exam platform with student auth, instructor dashboard, analytics, payments, and test management."
                    rows={4}
                    maxLength={2000}
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
                    <button
                      onClick={() => { setShowIngestionPanel(p => !p); }}
                      className="sf-btn sf-btn--sm sf-btn--ghost"
                      style={{
                        padding: '0 8px',
                        color: ingestionResult ? 'var(--sf-blue)' : undefined,
                      }}
                      type="button"
                    >
                      <Plus size={12} /> {ingestionResult ? 'Attached' : 'Attach'}
                    </button>
                    <button
                      className="sf-btn sf-btn--sm sf-btn--ghost"
                      style={{ padding: '0 8px' }}
                      type="button"
                      onClick={() => setShowRepoSelector(true)}
                      title={githubConnected && githubUsername ? `Connected as @${githubUsername}` : undefined}
                    >
                      {githubConnected && <span className="sf-dot sf-dot--green" style={{ marginRight: 2 }} />}
                      <Github size={12} /> {githubConnected ? 'Import from GitHub' : 'Connect repo'}
                    </button>
                    {githubConnected && githubUsername && (
                      <span className="mono" style={{ fontSize: 10.5, color: 'var(--sf-text-faint)' }}>
                        @{githubUsername}
                      </span>
                    )}
                    <span className="sf-grow" />

                    <span className="mono" style={{ fontSize: 10.5, marginRight: 8, color: prompt.length > 1800 ? 'var(--sf-red)' : 'var(--sf-text-faint)' }}>
                      {prompt.length}/2000 · ⌘↵ to run
                    </span>
                    <button
                      disabled={!prompt.trim()}
                      onClick={startGeneration}
                      className="sf-btn sf-btn--primary sf-btn--sm"
                      style={{ paddingRight: 10, opacity: !prompt.trim() ? 0.6 : 1 }}
                      type="button"
                    >
                      <Sparkles size={12} style={{ marginRight: 6 }} /> Generate
                      <span className="sf-kbd" style={{ background: 'rgba(0,0,0,0.10)', color: 'rgba(0,0,0,0.6)', borderColor: 'rgba(0,0,0,0.10)', marginLeft: 6 }}>⌘↵</span>
                    </button>
                  </div>
                </div>

                {/* Context Generator Hub */}
                <ContextGeneratorHub />

                {/* Prompt history */}
                {history.length > 0 && (
                  <div style={{ marginTop: 20 }}>
                    <div className="sf-row" style={{ marginBottom: 10 }}>
                      <span className="mono" style={{ fontSize: 10.5, color: 'var(--sf-text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                        Recent prompts
                      </span>
                      <span className="sf-grow" />
                      <button
                        onClick={() => setShowHistory(h => !h)}
                        className="sf-btn sf-btn--ghost sf-btn--sm"
                        style={{ fontSize: 11 }}
                        type="button"
                      >
                        {showHistory ? 'Hide' : 'Show'} ({history.length})
                      </button>
                    </div>
                    {showHistory && (
                      <div className="sf-col" style={{ gap: 4, marginBottom: 8 }}>
                        {history.map((h, i) => (
                          <button
                            key={i}
                            onClick={() => handleHistorySelect(h)}
                            className="sf-row"
                            style={{
                              width: '100%', gap: 8, padding: '8px 12px',
                              background: 'var(--sf-surface)', border: '1px solid var(--sf-border)',
                              borderRadius: 8, cursor: 'pointer', textAlign: 'left',
                              fontFamily: 'inherit', fontSize: 12, color: 'var(--sf-text-muted)',
                            }}
                            type="button"
                          >
                            <Sparkles size={11} style={{ flex: '0 0 auto', color: 'var(--sf-text-faint)' }} />
                            <span className="sf-grow" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {h}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

              </div>
          </div>
        </main>

        <CollapsiblePanel
          isOpen={isPanelOpen}
          onOpenChange={setIsPanelOpen}
          width={460}
          className="hidden xl:flex"
        >
          {/* Tabs */}
          <div className="sf-row" style={{ padding: '10px 14px 0', gap: 2, borderBottom: '1px solid var(--sf-border)' }}>
            {([
              ['arch',   'Architecture', Layers3],
              ['schema', 'Schema',       Database],
              ['routes', 'API',          Server],
              ['files',  'Files',        File],
            ] as const).map(t => {
              const Ic = t[2];
              const active = previewTab === t[0];
              return (
                <button key={t[0]} onClick={() => setPreviewTab(t[0])} className="sf-row" style={{
                  gap: 6, padding: '8px 12px 10px', background: 'transparent',
                  border: 'none', fontFamily: 'inherit', fontSize: 12.5,
                  color: active ? 'var(--sf-text)' : 'var(--sf-text-muted)',
                  cursor: 'pointer', position: 'relative',
                }} type="button">
                  <Ic size={12} /> {t[1]}
                  {active && <span style={{ position: 'absolute', left: 10, right: 10, bottom: -1, height: 1.5, background: 'var(--sf-text)', borderRadius: 1 }} />}
                </button>
              );
            })}
            <span className="sf-grow" />
            <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ marginBottom: 6, padding: '0 6px' }} type="button">
              <MoreHorizontal size={14} />
            </button>
          </div>

          <div className="sf-scroll sf-grow" style={{ overflow: 'auto', padding: 16 }}>
            {renderTabContent()}
          </div>

          {/* Footer status */}
          <div className="sf-row" style={{ padding: '8px 14px', borderTop: '1px solid var(--sf-border)', gap: 10, background: 'var(--sf-bg)' }}>
            <span className="sf-dot sf-dot--green" />
            <span className="mono sf-faint" style={{ fontSize: 10.5 }}>
              idle
            </span>
            <span className="sf-grow" />
            <span className="mono sf-faint" style={{ fontSize: 10.5 }}>v2.4 · {stack}</span>
          </div>
        </CollapsiblePanel>
      </div>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}

      {showRepoSelector && (
        <div
          onClick={() => setShowRepoSelector(false)}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.55)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="sf-card-elev"
            style={{
              width: "min(520px, 92vw)", maxHeight: "80vh", overflow: "hidden",
              padding: 16, background: "var(--sf-surface-2)",
              border: "1px solid var(--sf-border-strong)", borderRadius: 12,
            }}
          >
            <GitHubRepoSelector
              onRepoSelected={handleRepoSelected}
              onClose={() => setShowRepoSelector(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
