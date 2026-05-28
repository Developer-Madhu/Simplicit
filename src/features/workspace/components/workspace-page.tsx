"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useCreateProject, useUpdateProject } from "@/features/dashboard";
import { useToast } from "@/features/auth/context/toast-context";
import { useAuth } from "@/features/auth/context/auth-context";
import { useWorkspace } from "@/features/workspace/context/workspace-context";
import type { IngestionResult, ClarificationQuestion } from "@/features/ingestion/types";
import { serializeIngestionResult } from "@/features/ingestion/types";
import { IngestionPanel } from "@/features/ingestion/components/ingestion-panel";
import { AnalysisSummary } from "@/features/ingestion/components/analysis-summary";
import { ContextGeneratorHub } from "@/features/generation";
import { ClarificationQuestions } from "@/features/ingestion/components/clarification-questions";
import { generateClarificationQuestions, mapAnswersToArchitecture } from "@/features/ingestion/analyzers/question-generator";
import { ArchitectureReview, BackendSpecification, BackendBlueprint, BlueprintReview, generateBackendBlueprint } from "@/features/architecture";
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
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const createMutation = useCreateProject();
  const updateMutation = useUpdateProject();

  const [stage, setStage] = useState<'idle' | 'composing' | 'analyzing' | 'clarifying' | 'reviewing' | 'blueprinting' | 'streaming' | 'done' | 'failed'>('idle');
  const [prompt, setPrompt] = useState('');
  const [streamStep, setStreamStep] = useState(0); 
  const [previewTab, setPreviewTab] = useState<'arch' | 'schema' | 'routes' | 'files'>('arch');
  const [stack, setStack] = useState('Hono');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [failureDetails, setFailureDetails] = useState<{
    message: string;
    isConflict: boolean;
    isKeyMissing: boolean;
    prompt: string;
    stack: string;
    projectId: string;
  } | null>(null);

  // Ingestion state
  const [showIngestionPanel, setShowIngestionPanel] = useState(false);
  const [ingestionResult, setIngestionResult] = useState<IngestionResult | null>(null);
  const [clarificationQuestions, setClarificationQuestions] = useState<ClarificationQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [backendSpec, setBackendSpec] = useState<BackendSpecification | null>(null);
  const [blueprint, setBlueprint] = useState<BackendBlueprint | null>(null);
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

  // Autosave draft as user types
  useEffect(() => {
    if (stage === 'idle' || stage === 'composing') {
      saveDraft(prompt);
    }
  }, [prompt, stage]);

  useEffect(() => {
    if (stage === 'streaming' || stage === 'done') {
      setIsPanelOpen(true);
    }
  }, [stage]);

  // Run the streaming animation
  useEffect(() => {
    if (stage !== 'streaming') return;
    if (streamStep >= reasoning.length) {
      const t = setTimeout(() => {
        setStage('done');
        // Update project to deployed on completion
        if (activeProjectId) {
          updateMutation.mutate({
            id: activeProjectId,
            status: 'deployed',
            dot: 'green',
            health: 100,
          });
          toast('Generation complete! Your backend is ready.', 'success');
        }
      }, 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStreamStep(s => s + 1), reasoning[streamStep].dur);
    return () => clearTimeout(t);
  }, [stage, streamStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cmd+K palette
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(o => !o); }
      if (e.key === 'Escape') { setPaletteOpen(false); setShowHistory(false); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const executeGeneration = useCallback(async (isLocalRun?: boolean, finalAnswers?: Record<string, string | string[]>, spec?: BackendSpecification, bprint?: BackendBlueprint) => {
    if (!activeWorkspace) return;
    const finalPrompt = prompt.trim() || heroPrompt;
    let createdId = "";

    setStage('streaming');
    setStreamStep(0);

    const mappedRequirements = finalAnswers ? mapAnswersToArchitecture(finalAnswers) : mapAnswersToArchitecture(answers);

    // Create project in Supabase with "building" status
    const fullStack = stackMap[stack] || `${stack} \u00b7 PG \u00b7 Redis`;
    try {
      const project = await createMutation.mutateAsync({
        name: finalPrompt.split(' ').slice(0, 4).join(' ').replace(/[^\w\s]/g, '').trim() || 'New Project',
        prompt: finalPrompt,
        stack: fullStack,
        workspace_id: activeWorkspace.id,
        status: 'building',
        dot: 'amber',
        health: 50,
        generation_metadata: {
          ingestion: ingestionResult ? serializeIngestionResult(ingestionResult) : null,
          clarification: finalAnswers || answers,
          requirements: mappedRequirements,
          specification: spec || backendSpec,
          blueprint: bprint || blueprint,
        },
        simplicit_context: ingestionResult?.simplicitContext || null
      });
      createdId = project.id;
      setActiveProjectId(project.id);
    } catch (e) {
      toast('Failed to initialize project in database.', 'error');
      setStage('idle');
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: createdId,
          prompt: finalPrompt,
          stack: stack,
          localMode: isLocalRun || false,
          context: ingestionResult ? serializeIngestionResult(ingestionResult) : null,
          clarification: finalAnswers || answers,
          requirements: mappedRequirements,
          specification: spec || backendSpec,
          blueprint: bprint || blueprint,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let textErr = `Generation API returned status ${response.status}`;
        try {
          const jsonErr = await response.json();
          textErr = jsonErr.error || textErr;
        } catch {}
        throw new Error(textErr);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('ReadableStream is not supported.');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              if (data.stage === 'done') {
                setStreamStep(reasoning.length);
                setStage('done');
                toast('Generation complete! Your backend is ready.', 'success');

                // Priority 4: Invalidate projects to ensure the new one exists in next view
                queryClient.invalidateQueries({ queryKey: ["projects"] });

                setTimeout(() => {
                  router.push(`/generations/${createdId}`);
                }, 800);
              }
 else if (data.stage === 'error') {
                throw new Error(data.error || 'Pipeline execution failed');
              } else {
                const stageIdx = ['analyzing', 'architecture', 'schema', 'routes', 'files'].indexOf(data.stage);
                if (stageIdx !== -1) setStreamStep(stageIdx);
              }
            } catch (err) {
              // Error parsing SSE event
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setFailureDetails({
        message: err.message || 'Generation failed.',
        isConflict: err.message?.includes('ConflictError'),
        isKeyMissing: err.message?.includes('KeyMissingError'),
        prompt: finalPrompt,
        stack: stack,
        projectId: createdId,
      });
      setStage('failed');
      toast(err.message, 'error');
    } finally {
      abortControllerRef.current = null;
    }
  }, [prompt, stack, createMutation, router, toast, ingestionResult, answers]);

  const startGeneration = useCallback(async (isLocalRun?: boolean | React.MouseEvent) => {
    const finalPrompt = prompt.trim() || heroPrompt;
    if (!prompt.trim()) setPrompt(finalPrompt);

    setFailureDetails(null);
    pushHistory(finalPrompt);
    setHistory(loadHistory());
    saveDraft('');

    const realLocalMode = typeof isLocalRun === 'boolean' ? isLocalRun : false;

    // Trigger clarification flow if ingestion result exists and we haven't asked yet
    if (ingestionResult && clarificationQuestions.length === 0) {
      const questions = generateClarificationQuestions(ingestionResult, finalPrompt);
      if (questions.length > 0) {
        setClarificationQuestions(questions);
        setStage('clarifying');
        return;
      }
    }

    // NEW: If we have ingestion result but haven't reviewed yet, go to architecture review
    if (ingestionResult && !backendSpec && stage !== 'reviewing') {
      setStage('reviewing');
      return;
    }

    // NEW: If we have spec but no blueprint, go to blueprinting
    if (backendSpec && !blueprint && stage !== 'blueprinting') {
      setStage('blueprinting');
      return;
    }

    executeGeneration(realLocalMode);
  }, [prompt, ingestionResult, clarificationQuestions.length, executeGeneration]);

  const stopGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    // Update project to paused if we have an active one
    if (activeProjectId) {
      updateMutation.mutate({
        id: activeProjectId,
        status: 'paused',
        dot: 'gray',
        health: null,
      });
      toast('Generation stopped. Project saved as paused.', 'info');
    }
    setStage('idle');
    setStreamStep(0);
    setActiveProjectId(null);
  }, [activeProjectId, updateMutation, toast]);

  const resetAll = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStage('idle');
    setStreamStep(0);
    setPrompt('');
    setActiveProjectId(null);
    setIngestionResult(null);
    setClarificationQuestions([]);
    setAnswers({});
    setBackendSpec(null);
    setBlueprint(null);
    saveDraft('');
  };

  const handleHistorySelect = (historyPrompt: string) => {
    setPrompt(historyPrompt);
    setStage('composing');
    setShowHistory(false);
  };

  // Reveal nodes progressively while streaming
  const visibleIds = useMemo(() => {
    if (stage === 'idle' || stage === 'composing') return ['web', 'edge'];
    if (stage === 'done') return SF_ARCH.nodes.map(n => n.id);
    // streaming
    const order = ['web', 'edge', 'api', 'auth', 'exam', 'pg', 'redis', 'pay', 'queue', 's3'];
    return order.slice(0, Math.min(order.length, Math.ceil(streamStep * 1.5)));
  }, [stage, streamStep]);

  const nodeById = Object.fromEntries(SF_ARCH.nodes.map(n => [n.id, n]));
  const W = 1080, H = 320;

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
                  {stage === 'streaming' ? (
                     <div className="sf-spin"><RefreshCw size={24} style={{ color: 'var(--sf-text-muted)' }} /></div>
                  ) : (
                     <Layers3 size={24} style={{ color: 'var(--sf-text-faint)' }} />
                  )}
                  <span className="sf-muted">Generating architecture...</span>
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
            <button className="sf-btn sf-btn--sm" type="button">
              <Github size={12} /> Connect repo
            </button>
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
            {stage === 'streaming' ? (
              <div style={{ width: '100%', maxWidth: 760 }}>
                <div className="sf-row" style={{ gap: 10, marginBottom: 18 }}>
                  <span className="sf-chip" style={{ height: 24, padding: '0 10px', color: 'var(--sf-blue)', borderColor: 'oklch(0.4 0.12 250 / 0.4)' }}>
                    <span className="sf-dot sf-dot--blue sf-pulse" /> Generating · {streamStep}/{reasoning.length}
                  </span>
                  <button onClick={stopGeneration} className="sf-btn sf-btn--sm sf-btn--ghost" type="button">
                    <StopCircle size={11} /> Stop
                  </button>
                  <span className="sf-grow" />
                  <span className="mono sf-faint" style={{ fontSize: 11 }}>est. 24s remaining</span>
                </div>

                <h2 className="sf-h1" style={{ marginBottom: 8, fontSize: 26, margin: 0 }}>
                  Designing your backend
                </h2>
                <p className="sf-muted" style={{ marginBottom: 24, fontSize: 13.5, marginTop: 4 }}>
                  Streaming the architecture — each step is reasoned and verified.
                </p>

                <div className="sf-card-elev" style={{ padding: 0, overflow: 'hidden' }}>
                  {/* Quoted prompt header */}
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--sf-border)', background: 'var(--sf-bg-2)' }}>
                    <div className="sf-row" style={{ gap: 8, marginBottom: 6 }}>
                      <Sparkles size={11} />
                      <span className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Prompt</span>
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--sf-text-muted)', lineHeight: 1.5 }}>
                      {prompt || heroPrompt}
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
                            {done && <Check size={10} />}
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
            ) : stage === 'clarifying' ? (
              <div style={{ width: '100%', maxWidth: 760 }}>
                <ClarificationQuestions
                  questions={clarificationQuestions}
                  onComplete={(finalAnswers) => {
                    setAnswers(finalAnswers);
                    setStage('reviewing');
                  }}
                />
              </div>
            ) : stage === 'reviewing' ? (
              <div style={{ width: '100%', maxWidth: 860 }}>
                <ArchitectureReview
                  ingestionResult={ingestionResult!}
                  answers={answers}
                  prompt={prompt || heroPrompt}
                  onApprove={(spec) => {
                    setBackendSpec(spec);
                    const bprint = generateBackendBlueprint(spec, ingestionResult!, answers, prompt || heroPrompt);
                    setBlueprint(bprint);
                    setStage('blueprinting');
                  }}
                  onEdit={() => {
                    setStage('composing');
                  }}
                />
              </div>
            ) : stage === 'blueprinting' ? (
              <div style={{ width: '100%', maxWidth: 860 }}>
                <BlueprintReview
                  blueprint={blueprint!}
                  onApprove={(bprint) => {
                    setBlueprint(bprint);
                    executeGeneration(false, answers, backendSpec!, bprint);
                  }}
                  onEdit={() => {
                    setStage('reviewing');
                  }}
                />
              </div>
            ) : stage === 'failed' ? (
              <div style={{ width: '100%', maxWidth: 760 }}>
                <div className="sf-row" style={{ gap: 10, marginBottom: 18 }}>
                  <span className="sf-chip" style={{ height: 24, padding: '0 10px', color: 'var(--sf-red)', borderColor: 'rgba(255,90,90,0.15)' }}>
                    <span className="sf-dot sf-dot--red" /> Generation failed
                  </span>
                  <button onClick={resetAll} className="sf-btn sf-btn--sm sf-btn--ghost" type="button">
                    <RefreshCw size={11} /> Reset
                  </button>
                  <span className="sf-grow" />
                </div>

                <h2 className="sf-h1" style={{ marginBottom: 8, fontSize: 26, margin: 0, color: 'var(--sf-text)' }}>
                  {failureDetails?.isConflict ? "Authentication System Conflict" : failureDetails?.isKeyMissing ? "OpenAI API Key Required" : "Generation Failure"}
                </h2>
                <p className="sf-muted" style={{ marginBottom: 24, fontSize: 13.5, marginTop: 4 }}>
                  {failureDetails?.isConflict 
                    ? "Simplicit identified architectural incompatibilities in your prompt. Learn more about the conflicts below."
                    : failureDetails?.isKeyMissing 
                    ? "To use the full AI architect features, configure an OpenAI API key. Or run in fallback local mode immediately."
                    : "An error occurred while compiling code files and preparing database schemas."
                  }
                </p>

                {failureDetails?.isConflict && (
                  <div className="sf-card-elev" style={{ padding: 18, marginBottom: 20, border: '1px solid rgba(255,180,80,0.2)', background: 'var(--sf-surface-2)' }}>
                    <div className="sf-row" style={{ gap: 8, marginBottom: 10 }}>
                      <AlertTriangle size={13} style={{ color: 'var(--sf-amber)' }} />
                      <span className="mono" style={{ fontSize: 11, color: 'var(--sf-amber)', fontWeight: 600 }}>RECONCILIATION CONFLICT DETECTED</span>
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--sf-text)', lineHeight: 1.5, marginBottom: 12 }}>
                      You requested both <strong>Supabase Auth</strong> and <strong>Lucia Auth</strong>.
                      These two authentication frameworks serve identical purposes but require distinct database adapters, session managers, and middleware patterns. Running both leads to duplicate auth tables and middleware collisions.
                    </div>
                    <div className="sf-col" style={{ gap: 6 }}>
                      <div className="sf-card" style={{ padding: 10, background: 'var(--sf-bg)', display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span className="sf-dot sf-dot--green" />
                        <span style={{ fontSize: 12, color: 'var(--sf-text-muted)' }}>
                          <strong>Resolution A:</strong> Edit prompt to use only one (e.g. &quot;Use Supabase Auth&quot;).
                        </span>
                      </div>
                      <div className="sf-card" style={{ padding: 10, background: 'var(--sf-bg)', display: 'flex', gap: 10, alignItems: 'center' }}>
                        <span className="sf-dot sf-dot--green" />
                        <span style={{ fontSize: 12, color: 'var(--sf-text-muted)' }}>
                          <strong>Resolution B:</strong> Select a standard template from the dashboard presets.
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {failureDetails?.isKeyMissing && (
                  <div className="sf-card-elev" style={{ padding: 18, marginBottom: 20, border: '1px solid rgba(255,255,255,0.08)', background: 'var(--sf-surface-2)' }}>
                    <div className="sf-row" style={{ gap: 8, marginBottom: 10 }}>
                      <Key size={13} style={{ color: 'var(--sf-blue)' }} />
                      <span className="mono" style={{ fontSize: 11, color: 'var(--sf-blue)', fontWeight: 600 }}>KEY MISSING</span>
                    </div>
                    <div style={{ fontSize: 13.5, color: 'var(--sf-text)', lineHeight: 1.5, marginBottom: 12 }}>
                      No <code>OPENAI_API_KEY</code> detected in your environment. You can add it to your <code>.env.local</code> file, or you can bypass it and use the local code generator.
                    </div>
                    <div className="sf-row" style={{ gap: 8 }}>
                      <button 
                        onClick={() => {
                          if (failureDetails) {
                            startGeneration(true);
                          }
                        }} 
                        className="sf-btn sf-btn--primary sf-btn--sm"
                        type="button"
                      >
                        <Zap size={11} style={{ marginRight: 6 }} /> Run in local mode (Offline fallback)
                      </button>
                    </div>
                  </div>
                )}

                {!failureDetails?.isConflict && !failureDetails?.isKeyMissing && (
                  <div className="sf-card-elev" style={{ padding: 18, marginBottom: 20, border: '1px solid rgba(255,90,90,0.15)', background: 'var(--sf-surface-2)' }}>
                    <div className="sf-row" style={{ gap: 8, marginBottom: 10 }}>
                      <AlertTriangle size={13} style={{ color: 'var(--sf-red)' }} />
                      <span className="mono" style={{ fontSize: 11, color: 'var(--sf-red)', fontWeight: 600 }}>PIPELINE ERROR LOG</span>
                    </div>
                    <pre style={{
                      margin: 0, padding: 12, background: 'var(--sf-bg)', borderRadius: 6,
                      fontSize: 12, color: 'var(--sf-text-muted)', border: '1px solid var(--sf-border)',
                      fontFamily: 'var(--sf-font-mono)', whiteSpace: 'pre-wrap', wordBreak: 'break-all'
                    }}>
                      {failureDetails?.message}
                    </pre>
                  </div>
                )}

                {/* General Recovery Actions */}
                <div className="sf-row" style={{ gap: 8 }}>
                  <button 
                    onClick={() => {
                      if (failureDetails) {
                        setPrompt(failureDetails.prompt);
                        setStage('composing');
                      }
                    }} 
                    className="sf-btn"
                    type="button"
                  >
                    <Edit size={11} style={{ marginRight: 6 }} /> Edit prompt
                  </button>
                  <button 
                    onClick={() => {
                      if (failureDetails) {
                        startGeneration();
                      }
                    }} 
                    className="sf-btn sf-btn--primary"
                    type="button"
                  >
                    <RefreshCw size={11} style={{ marginRight: 6 }} /> Retry generation
                  </button>
                  <button 
                    onClick={() => {
                      toast(failureDetails?.message || "Unknown pipeline error occurred.", "error");
                    }} 
                    className="sf-btn sf-btn--ghost"
                    type="button"
                  >
                    <Eye size={11} style={{ marginRight: 6 }} /> View log details
                  </button>
                </div>
              </div>
            ) : stage === 'done' ? (
              <div style={{ width: '100%', maxWidth: 760 }}>
                <div className="sf-row" style={{ gap: 10, marginBottom: 18 }}>
                  <span className="sf-chip" style={{ height: 24, padding: '0 10px', color: 'var(--sf-green)', borderColor: 'oklch(0.4 0.10 145 / 0.3)' }}>
                    <span className="sf-dot sf-dot--green" /> Generation complete · 6.4s
                  </span>
                  <button onClick={resetAll} className="sf-btn sf-btn--sm sf-btn--ghost" type="button">
                    <RefreshCw size={11} /> New
                  </button>
                  <span className="sf-grow" />
                  <button onClick={() => { if (activeProjectId) router.push(`/generations/${activeProjectId}`); }} className="sf-btn sf-btn--sm" type="button">
                    <Eye size={11} /> Open architecture
                  </button>
                  <button onClick={() => { if (activeProjectId) router.push(`/generations/${activeProjectId}`); }} className="sf-btn sf-btn--primary sf-btn--sm" type="button">
                    <Download size={11} /> Export project
                  </button>
                </div>

                <h2 className="sf-h1" style={{ marginBottom: 8, fontSize: 26, margin: 0 }}>
                  Generation complete
                </h2>
                <p className="sf-muted" style={{ marginBottom: 24, fontSize: 13.5, marginTop: 4 }}>
                  Your project has been successfully initialized. Redirecting to workspace...
                </p>

                {/* Summary stat row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 22 }}>
                  {[
                    { l: 'Status', v: 'Ready' },
                    { l: 'Stack',  v: stack },
                    { l: 'Routes', v: 'Generated' },
                    { l: 'Schema', v: 'Generated' },
                  ].map(s => (
                    <div key={s.l} className="sf-card" style={{ padding: '14px 14px 12px' }}>
                      <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{s.l}</div>
                      <div style={{ fontSize: 18, fontWeight: 500, letterSpacing: '-0.02em', marginTop: 6, color: 'var(--sf-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.v}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ width: '100%', maxWidth: 760 }}>
                <div className="sf-row" style={{ gap: 8, marginBottom: 18, justifyContent: 'center' }}>
                  <span className="sf-chip" style={{ height: 24, padding: '0 10px' }}>
                    <Sparkles size={11} /> Simplicit · v2.4
                  </span>
                  <span className="sf-chip sf-chip-mono" style={{ height: 24, padding: '0 10px' }}>
                    claude-architect
                  </span>
                </div>
                <h1 className="sf-h1" style={{ textAlign: 'center', marginBottom: 10, fontSize: 32, margin: 0, color: 'var(--sf-text)' }}>
                  What are you shipping?
                </h1>
                <p className="sf-muted" style={{ textAlign: 'center', marginBottom: 28, fontSize: 14, marginTop: 8 }}>
                  Describe your product in plain English. Simplicit will design a production-ready backend.
                </p>

                {/* Ingestion panel */}
                {showIngestionPanel && !ingestionResult && (
                  <IngestionPanel
                    onComplete={(result) => {
                      setIngestionResult(result);
                      setShowIngestionPanel(false);
                      // Auto-populate prompt hint from ingested project
                      if (result.metadata.name && !prompt) {
                        const hint = `Build a production-ready backend for ${result.metadata.name}` +
                          (result.metadata.description ? ` — ${result.metadata.description}` : '') +
                          (result.framework.name !== 'Unknown' ? `. Frontend uses ${result.framework.name}.` : '.');
                        setPrompt(hint);
                        setStage('composing');
                      }
                    }}
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
                          }} type="button">{s}</button>
                        ))}
                      </div>
                    </div>
                    <div className="sf-vdivider" style={{ height: 18, margin: '0 2px' }} />
                    <button className="sf-btn sf-btn--sm sf-btn--ghost" style={{ padding: '0 8px' }} type="button">
                      Postgres
                    </button>
                    <button className="sf-btn sf-btn--sm sf-btn--ghost" style={{ padding: '0 8px' }} type="button">
                      <Lock size={12} /> Lucia
                    </button>

                    <span className="sf-grow" />

                    <span className="sf-faint mono" style={{ fontSize: 10.5, marginRight: 8 }}>
                      {prompt.length} · ⌘↵ to run
                    </span>
                    <button
                      disabled={(stage as any) === 'streaming'}
                      onClick={startGeneration}
                      className="sf-btn sf-btn--primary sf-btn--sm"
                      style={{ paddingRight: 10, opacity: (stage as any) === 'streaming' ? 0.6 : 1 }}
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

                {/* Suggestion chips */}
                <div style={{ marginTop: 20 }}>
                  <div className="sf-row" style={{ marginBottom: 10 }}>
                    <span className="mono" style={{ fontSize: 10.5, color: 'var(--sf-text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Smart suggestions
                    </span>
                  </div>
                  <div className="sf-row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    {promptSuggestions.map(s => (
                      <button key={s} onClick={() => { setPrompt(p => p + (p ? ' ' : '') + s + '.'); setStage('composing'); }} className="sf-chip" style={{
                        height: 26, padding: '0 10px', fontSize: 11.5, cursor: 'pointer', background: 'transparent',
                      }} type="button">
                        <Plus size={10} style={{ marginRight: 4 }} /> {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
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
              {stage === 'done' ? 'verified · 0 errors' : stage === 'streaming' ? 'streaming' : 'idle'}
            </span>
            <span className="sf-grow" />
            <span className="mono sf-faint" style={{ fontSize: 10.5 }}>v2.4 · {stack}</span>
          </div>
        </CollapsiblePanel>
      </div>

      {paletteOpen && <CommandPalette onClose={() => setPaletteOpen(false)} />}
    </div>
  );
}
