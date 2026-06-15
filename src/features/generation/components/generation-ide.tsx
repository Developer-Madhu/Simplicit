"use client";

/**
 * Generation IDE — the VS Code-style view of a generated backend.
 *
 * Renders the real generation output for a project: an explorer built from the
 * actual generated file map, a syntax-highlighted editor, an assistant panel
 * driven by the real module/table/route counts, and a status bar.
 *
 * Data source: project.generation_metadata (GenerationMetadata) fetched via
 * useProject(). Every count and file shown is derived from that real data —
 * nothing here is hardcoded from the design mock.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Play,
  GitBranch,
  Github,
  Rocket,
  Search,
  Folder,
  FolderOpen,
  File as FileIcon,
  Copy,
  Check,
  Send,
  Paperclip,
  Loader2,
  CircleDot,
  PanelRight,
  PanelLeft,
  LayoutPanelLeft,
  RefreshCw,
} from "lucide-react";

import { useProject, useUpdateProject } from "@/features/dashboard";
import { useToast } from "@/features/auth/context/toast-context";
import { useAuth } from "@/features/auth/context/auth-context";
import { useQueryClient } from "@tanstack/react-query";
import { getFlowState, clearFlowState } from "../state/generation-flow-store";
import type { GenerationFlowState } from "../state/generation-flow-store";
import {
  StackSelectionWizard, GapResolutionWizard,
  resolveArchitectureState, detectArchitectureRequirements,
  generateArchitectureReview, createBackendSpecification, generateBackendBlueprint,
  generateGapQuestions,
} from "@/features/architecture";
import type {
  ArchitectureRequirements, ArchitecturePreferences,
  GapQuestion, GapResolutionAnswer,
  BackendBlueprint, BackendSpecification,
} from "@/features/architecture";
import { ClarificationQuestions } from "@/features/ingestion/components/clarification-questions";
import { mapAnswersToArchitecture } from "@/features/ingestion/analyzers/question-generator";
import { createModulesForNewEntities } from "@/features/architecture/utils";
import { serializeIngestionResult } from "@/features/ingestion/types";
import { usePipelineStream } from "../hooks/usePipelineStream";
import type { PipelineStreamState } from "../hooks/usePipelineStream";
import { PipelineStatusPanel } from "./PipelineStatusPanel";
import { DeployButton } from "./DeployButton";
import type { PipelineEvent, PipelineStage } from "../types/pipeline-events";
import { translateError } from "../utils/error-translator";
import { CodeEditor } from "./CodeEditor";
import { EntityFieldsWizard } from "./EntityFieldsWizard";
import { PipelineReasoningPanel } from "./PipelineReasoningPanel";
import type { GenerationMetadata } from "../api/types";
import styles from "./generation-ide.module.css";

// ----------------------------------------------------------------------------
// File tree model — built from the real generated file map
// ----------------------------------------------------------------------------

interface TreeNode {
  name: string;
  path: string; // full path for files; partial path for dirs
  type: "dir" | "file";
  children?: TreeNode[];
}

function buildFileTree(files: Record<string, string>): TreeNode[] {
  const root: TreeNode[] = [];

  for (const fullPath of Object.keys(files).sort()) {
    const parts = fullPath.split("/").filter(Boolean);
    let level = root;
    let acc = "";

    parts.forEach((part, i) => {
      acc = acc ? `${acc}/${part}` : part;
      const isFile = i === parts.length - 1;

      let existing = level.find((n) => n.name === part && n.type === (isFile ? "file" : "dir"));
      if (!existing) {
        existing = {
          name: part,
          path: isFile ? fullPath : acc,
          type: isFile ? "file" : "dir",
          ...(isFile ? {} : { children: [] }),
        };
        level.push(existing);
      }
      if (!isFile) level = existing.children!;
    });
  }

  // dirs before files, alphabetical within each group
  const sortLevel = (nodes: TreeNode[]) => {
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === "dir" ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
    nodes.forEach((n) => n.children && sortLevel(n.children));
  };
  sortLevel(root);
  return root;
}

function languageLabel(name: string): string {
  if (name.endsWith(".ts") || name.endsWith(".tsx")) return "TypeScript";
  if (name.endsWith(".js") || name.endsWith(".jsx")) return "JavaScript";
  if (name.endsWith(".sql")) return "SQL";
  if (name.endsWith(".json")) return "JSON";
  if (name.endsWith(".yml") || name.endsWith(".yaml")) return "YAML";
  if (name.endsWith(".md")) return "Markdown";
  if (name.includes(".env") || name.endsWith(".example")) return "DotEnv";
  if (name.endsWith(".prisma")) return "Prisma";
  return "Text";
}

// Maps a file path to a Monaco language identifier (Monaco's own naming, e.g.
// .tsx → "typescript", not "tsx"). Unknown extensions fall back to plaintext.
function mapExtensionToMonacoLanguage(path: string): string {
  const name = path.split("/").pop() ?? path;
  if (name.endsWith(".tsx") || name.endsWith(".ts")) return "typescript";
  if (name.endsWith(".jsx") || name.endsWith(".js") || name.endsWith(".mjs")) return "javascript";
  if (name.endsWith(".json")) return "json";
  if (name.endsWith(".sql")) return "sql";
  if (name.endsWith(".md")) return "markdown";
  if (name.endsWith(".css")) return "css";
  if (name.endsWith(".html")) return "html";
  if (name.endsWith(".yml") || name.endsWith(".yaml")) return "yaml";
  if (name.includes(".env")) return "ini";
  return "plaintext";
}

function deriveSuggestions(metadata: GenerationMetadata): string[] {
  const out: string[] = [];
  const stack = metadata.stackSummary || {};
  const auth = stack.auth || metadata.authStrategy?.providers;
  const storage = stack.storage;

  if (metadata.apiRoutes?.some((r) => r.path?.includes("/auth")) || auth) {
    out.push("Add rate limiting to all /auth routes");
  }
  if (storage && storage.toLowerCase() !== "cloudflare r2") {
    out.push(`Switch storage from ${storage} to Cloudflare R2`);
  }
  const hasUser = metadata.schemaTables?.some((t) =>
    /^users?$/i.test(t.name) || /user/i.test(t.name)
  );
  if (hasUser) out.push("Add a soft-delete column to the users table");

  // Generic, still-real fallbacks derived from the actual output
  if (out.length < 3 && metadata.modules?.length) {
    out.push(`Generate integration tests for the ${metadata.modules[0].name} module`);
  }
  if (out.length < 3 && metadata.apiRoutes?.length) {
    out.push("Add OpenAPI documentation for every route");
  }
  return out.slice(0, 3);
}

// ----------------------------------------------------------------------------
// Tree group label — separates the "Your Frontend" and "Generated Backend"
// sections in the explorer.
// ----------------------------------------------------------------------------

function TreeGroupLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="mono"
      style={{
        fontSize: 9.5,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: "var(--sf-text-faint)",
        padding: "8px 8px 4px",
      }}
    >
      {children}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Tree row
// ----------------------------------------------------------------------------

function TreeRow({
  node,
  depth,
  selectedPath,
  onSelect,
  onContextMenu,
  showNewBadge = true,
}: {
  node: TreeNode;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
  // Right-click on a file row; not wired for directories.
  onContextMenu?: (e: React.MouseEvent, path: string) => void;
  // Generated files are flagged "new"; uploaded source files are not.
  showNewBadge?: boolean;
}) {
  const [open, setOpen] = useState(depth < 3);

  if (node.type === "dir") {
    return (
      <>
        <div
          className={styles.treeRow}
          style={{ paddingLeft: 6 + depth * 12 }}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <FolderOpen size={13} /> : <Folder size={13} />}
          <span className={styles.treeName}>{node.name}</span>
        </div>
        {open &&
          node.children?.map((c) => (
            <TreeRow
              key={c.path + c.name}
              node={c}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
              onContextMenu={onContextMenu}
              showNewBadge={showNewBadge}
            />
          ))}
      </>
    );
  }

  const active = selectedPath === node.path;
  return (
    <div
      className={`${styles.treeRow} ${active ? styles.treeRowActive : ""}`}
      style={{ paddingLeft: 6 + depth * 12 }}
      onClick={() => onSelect(node.path)}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onContextMenu?.(e, node.path);
      }}
    >
      <FileIcon size={12} style={{ color: "var(--sf-text-faint)" }} />
      <span className={styles.treeName} style={{ flex: 1 }}>
        {node.name}
      </span>
      {showNewBadge && (
        <span className={styles.newBadge} title="New file">
          +
        </span>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Assistant message model
// ----------------------------------------------------------------------------

interface ChatMessage {
  role: "architect" | "user";
  text: string;
  files?: string[];
}

// ----------------------------------------------------------------------------
// Context-menu + modal styles (Phase R) — shared, render-stable consts so the
// objects aren't re-allocated each render.
// ----------------------------------------------------------------------------

const ctxMenuItemStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "7px 14px",
  background: "transparent",
  border: "none",
  textAlign: "left",
  cursor: "pointer",
  color: "var(--sf-text, #e5e5e5)",
  fontFamily: "var(--sf-font-sans)",
  fontSize: "13px",
};

const modalBackdropStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 10000,
  background: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const modalBoxStyle: React.CSSProperties = {
  background: "var(--sf-surface, #1a1a1a)",
  border: "0.5px solid var(--sf-border, #333)",
  borderRadius: "10px",
  padding: "24px",
  width: "min(480px, 90vw)",
  maxHeight: "80vh",
  overflowY: "auto",
};

// Phase V — predict the file paths the generator will emit, so the explorer can
// show a dimmed skeleton tree while status === 'building'. Mirrors the emission
// shape of NestJSGenerator; purely cosmetic (these paths are never persisted or
// selectable). Module-level so it isn't re-created on every render.
const STAGE_LABELS_SHORT: Record<string, string> = {
  ARCHITECT: "architecting",
  GENERATOR: "generating",
  SECURITY: "scanning",
  STABILITY: "checking",
  TEST_WRITER: "testing",
  SDK: "building sdk",
};

function predictSkeletonPaths(blueprint: BackendBlueprint): string[] {
  const paths: string[] = [
    'package.json',
    'README.md',
    'src/app.module.ts',
    'src/main.ts',
    'src/db/schema.ts',
    'src/infra/database.module.ts',
    'src/infra/auth.module.ts',
    'src/modules/core/health.controller.ts',
    'src/modules/core/core.module.ts',
    'api-client.ts',
    'src/types/api.ts',
    '.env.production',
  ];
  for (const entity of blueprint.entities ?? []) {
    const n = entity.name.toLowerCase();
    paths.push(
      `src/modules/${n}/${n}.module.ts`,
      `src/modules/${n}/${n}.service.ts`,
      `src/modules/${n}/${n}.controller.ts`,
      `src/modules/${n}/dto/create-${n}.dto.ts`,
      `src/modules/${n}/dto/update-${n}.dto.ts`,
    );
  }
  return paths;
}

// Inline-editable project name (click to rename). Persists via the caller's
// onSave (the existing useUpdateProject mutation — RLS-safe + optimistic).
function EditableProjectName({
  name,
  onSave,
}: {
  name: string;
  onSave: (name: string) => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(name);
  }, [name]);
  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = async () => {
    const trimmed = value.trim();
    if (!trimmed || trimmed === name) {
      setValue(name);
      setEditing(false);
      return;
    }
    setSaving(true);
    await onSave(trimmed);
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") {
            setValue(name);
            setEditing(false);
          }
        }}
        disabled={saving}
        style={{
          fontFamily: "var(--sf-font-sans)",
          fontSize: "inherit",
          fontWeight: "inherit",
          background: "var(--sf-surface-2, #222)",
          border: "0.5px solid var(--sf-border, #444)",
          borderRadius: "4px",
          padding: "2px 6px",
          color: "inherit",
          minWidth: "120px",
          maxWidth: "280px",
        }}
      />
    );
  }

  return (
    <span
      className={styles.headerName}
      onClick={() => setEditing(true)}
      title="Click to rename"
      style={{ cursor: "pointer" }}
    >
      {name}
    </span>
  );
}

// ----------------------------------------------------------------------------
// Main component
// ----------------------------------------------------------------------------

export function GenerationIDE({ projectId }: { projectId: string }) {
  const { data: project, isLoading, error } = useProject(projectId);
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const metadata: GenerationMetadata | undefined = project?.generation_metadata;
  const files = useMemo<Record<string, string>>(
    () => (metadata?.files && Object.keys(metadata.files).length ? metadata.files : {}),
    [metadata]
  );
  const filePaths = useMemo(() => Object.keys(files), [files]);
  const tree = useMemo(() => buildFileTree(files), [files]);

  // A selected file is scoped to its group ("source" = uploaded frontend,
  // "generated" = pipeline output) so paths that collide across the two trees
  // still resolve to the right content map. selectedPath is derived for the
  // many group-agnostic reads (editor tab, status bar).
  const [selected, setSelected] = useState<{ group: "source" | "generated"; path: string } | null>(null);
  const selectedPath = selected?.path ?? null;
  const [tab, setTab] = useState<"assistant" | "logs" | "output">("assistant");
  const [logs, setLogs] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showAssistant, setShowAssistant] = useState(false);

  // ── File context menu + Explain/Edit/Delete modals (Phase R) ──────────────
  const [ctxMenu, setCtxMenu] = useState<{
    x: number; y: number; path: string; group: "source" | "generated";
  } | null>(null);
  const [explainModal, setExplainModal] = useState<{
    path: string; content: string; explanation: string | null; loading: boolean;
  } | null>(null);
  const [editModal, setEditModal] = useState<{
    path: string; content: string; instruction: string; loading: boolean;
  } | null>(null);
  const [deleteModal, setDeleteModal] = useState<{
    path: string; deleting: boolean;
  } | null>(null);
  // Phase S: confirm before a full pipeline re-run (handleRetry is destructive).
  const [showRetryConfirm, setShowRetryConfirm] = useState(false);
  // Phase AA: confirm (with ToS + responsibility checkboxes) before the pipeline runs.
  const [showPipelineConfirm, setShowPipelineConfirm] = useState(false);
  const [confirmChecked1, setConfirmChecked1] = useState(false);
  const [confirmChecked2, setConfirmChecked2] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<{
    blueprint: BackendBlueprint;
    spec: BackendSpecification;
  } | null>(null);

  // Close the context menu on any outside click.
  useEffect(() => {
    if (!ctxMenu) return;
    const close = () => setCtxMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [ctxMenu]);

  // Explain: when the modal opens in a loading state, ask the model to summarize
  // the file in plain English.
  useEffect(() => {
    if (!explainModal?.loading) return;
    (async () => {
      try {
        const res = await fetch("/api/ai/file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "explain",
            path: explainModal.path,
            content: explainModal.content,
          }),
        });
        const data = await res.json();
        const text = data.result ?? "Could not generate explanation.";
        setExplainModal(prev => prev ? { ...prev, explanation: text, loading: false } : null);
      } catch {
        setExplainModal(prev => prev ?
          { ...prev, explanation: "Failed to load explanation.", loading: false } : null);
      }
    })();
  }, [explainModal?.loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Editor-first flow (D2): wizard state machine ──────────────────────────
  // When the workspace hands off via ?flow=new, the wizard (stack confirmation
  // + domain questions) runs HERE as an overlay; the right panel becomes a
  // state machine: wizard → pipeline → assistant. Per product decision, the
  // ArchitectureReview / BlueprintReview steps are skipped — the spec and
  // blueprint are auto-approved after the questions, using the same calls
  // those review screens made on approve.
  type RightPanelView = "wizard" | "pipeline" | "assistant";
  type WizardStage = "clarifying" | "stack-selection" | "gap-resolution" | "entity-fields";

  const updateProject = useUpdateProject();
  const [rightPanelView, setRightPanelView] = useState<RightPanelView>("assistant");
  const [flow, setFlow] = useState<GenerationFlowState | null>(null);

  // Uploaded frontend source files (path → content) — available immediately on
  // load, no pipeline dependency. Persisted into generation_metadata.source_files
  // at project creation; the in-memory flow store (held for the live session)
  // backfills the content and covers projects created before persistence.
  const sourceFiles = useMemo<Record<string, string>>(() => {
    const fromMeta =
      metadata?.source_files && typeof metadata.source_files === "object" ? metadata.source_files : {};
    const fromFlow = flow?.ingestionResult?.keyFiles
      ? Object.fromEntries(flow.ingestionResult.keyFiles)
      : {};
    return { ...fromFlow, ...fromMeta };
  }, [metadata, flow]);
  const sourcePaths = useMemo(() => Object.keys(sourceFiles), [sourceFiles]);
  const sourceTree = useMemo(() => buildFileTree(sourceFiles), [sourceFiles]);
  const [wizardStage, setWizardStage] = useState<WizardStage>("stack-selection");
  const [wizardAnswers, setWizardAnswers] = useState<Record<string, string | string[]>>({});
  const [wizardRequirements, setWizardRequirements] = useState<ArchitectureRequirements | null>(null);
  const [wizardPrefs, setWizardPrefs] = useState<ArchitecturePreferences | null>(null);
  const [gapQuestions, setGapQuestions] = useState<GapQuestion[]>([]);
  // Phase O: blueprint + spec held between blueprint generation and the
  // entity-fields confirmation step, so handleBlueprintApproved still receives
  // all three args (blueprint, spec, prefs via wizardPrefs) after the user edits.
  const [pendingBlueprint, setPendingBlueprint] = useState<BackendBlueprint | null>(null);
  const [pendingSpec, setPendingSpec] = useState<BackendSpecification | null>(null);
  // The exact /api/generate request body, assembled at blueprint approval so
  // the pipeline kickoff (and retry) has everything without the flow store.
  const pendingGenerationRef = useRef<Record<string, unknown> | null>(null);

  // Live pipeline stream (Phase B/C components, consumed unmodified).
  const {
    state: pipelineState,
    startGeneration,
    cancel: cancelPipeline,
    reset: resetPipeline,
    updateDeployStage,
    STAGE_LABELS,
  } = usePipelineStream();

  // True when a generation ran (or is running) in THIS browser session — the
  // live pipelineState is authoritative. False on a fresh refresh, where the
  // view is instead reconstructed from persisted project data (below).
  const liveActive =
    pipelineState.isRunning || pipelineState.isComplete || !!pipelineState.globalError;

  // Refresh-safe failed view: rebuild a PipelineStreamState from the persisted
  // lastError (written by the pipeline's failure path) so PipelineStatusPanel
  // renders the error + Retry without a live stream.
  const reconstructedFailedState = useMemo<PipelineStreamState | null>(() => {
    const le = metadata?.lastError;
    if (!le) return null;
    const order: PipelineStage[] = ["ARCHITECT", "GENERATOR", "SECURITY", "STABILITY", "TEST_WRITER", "SDK", "DEPLOY"];
    const failedIdx = order.indexOf(le.stage);
    const userError = translateError(new Error(le.message), le.stage);
    return {
      isRunning: false,
      isComplete: true,
      stages: order.map((stage, i) => {
        if (stage === le.stage) return { stage, status: "error" as const, message: "", userError };
        if (failedIdx >= 0 && i < failedIdx) return { stage, status: "done" as const, message: "" };
        return { stage, status: "pending" as const, message: "" };
      }),
      activeStage: le.stage,
      globalError: userError,
      summary: null,
      elapsedSeconds: 0,
      deployUrl: null,
    };
  }, [metadata]);

  // Rebuild the /api/generate request from persisted metadata so Retry works
  // even after a refresh (when the in-session pendingGenerationRef is gone).
  const reconstructRequestFromMetadata = (): Record<string, unknown> | null => {
    if (!project) return null;
    const m: any = project.generation_metadata ?? {};
    return {
      projectId,
      prompt: project.prompt,
      stack: project.stack,
      localMode: false,
      context: m.ingestion ?? null,
      clarification: m.clarification ?? {},
      requirements: m.requirements ?? null,
      specification: m.specification ?? null,
      blueprint: m.blueprint ?? null,
      preferences: m.preferences ?? null,
    };
  };

  const handleRetry = () => {
    resetPipeline();
    const body = pendingGenerationRef.current ?? reconstructRequestFromMetadata();
    if (!body) return;
    pendingGenerationRef.current = body;
    // Reflect "running" and clear the prior failure so a mid-retry refresh shows
    // the reconnecting view, not the stale error panel.
    updateProject.mutate({
      id: projectId,
      status: "building",
      dot: "amber",
      health: 50,
      generation_metadata: { ...(project?.generation_metadata ?? {}), lastError: null },
    });
    setShowAssistant(true);
    setRightPanelView("pipeline");
    void startGeneration(body);
  };

  // Persist an edited generated-backend file (inert: no re-validation/re-run).
  const handleSaveGeneratedFile = useCallback(
    async (path: string, content: string) => {
      const res = await fetch(`/api/projects/${projectId}/files`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path, content }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? `Save failed: ${res.status}`);
      }
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    },
    [projectId, queryClient]
  );

  // Pipeline finished cleanly → hand the panel back to the assistant and
  // refresh the project so the explorer picks up generation_metadata.files.
  // On error we deliberately stay on 'pipeline' so the error panel + retry
  // stay visible.
  useEffect(() => {
    if (pipelineState.isComplete && !pipelineState.globalError) {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setRightPanelView("assistant");
      setTab("assistant");
    }
  }, [pipelineState.isComplete, pipelineState.globalError, projectId, queryClient]);

  // Detect the ?flow=new handoff (window-only effect — avoids SSR/hydration
  // issues). This handles ONLY the live handoff where the in-memory flow store
  // is still populated. If it's gone (hard refresh), we do NOT redirect here —
  // the status-derived recovery effect below reconstructs from persisted data;
  // only a still-draft project with no flow state truly has nothing to show.
  useEffect(() => {
    const isNewFlow = new URLSearchParams(window.location.search).get("flow") === "new";
    if (!isNewFlow) return;
    const flowState = getFlowState(projectId);
    if (!flowState) return; // refresh case — handled by the recovery effect
    setFlow(flowState);

    if (!flowState.ingestionResult) {
      // Prompt-only flow: nothing to ask — generate directly from the prompt
      // (blueprint-less AI-driven pipeline branch).
      pendingGenerationRef.current = {
        projectId,
        prompt: flowState.prompt,
        stack: flowState.stack,
        localMode: false,
        context: null,
        clarification: {},
        requirements: null,
        specification: null,
        blueprint: null,
        preferences: null,
      };
      updateProject.mutate({ id: projectId, status: "building", dot: "amber", health: 50 });
      clearFlowState(projectId);
      setShowAssistant(true);
      setRightPanelView("pipeline");
      void startGeneration(pendingGenerationRef.current);
      return;
    }

    // Upload flow: derive the stack-wizard requirements from a first resolve
    // (same call the workspace made), then open the wizard overlay.
    const resolved = resolveArchitectureState(flowState.ingestionResult, {}, flowState.prompt, null, [], []);
    setWizardRequirements(detectArchitectureRequirements(resolved.domainGraph));
    setWizardStage(flowState.clarificationQuestions.length > 0 ? "clarifying" : "stack-selection");
    setRightPanelView("wizard");
  }, [projectId, router]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Refresh recovery (G1) ─────────────────────────────────────────────────
  // With no in-memory flow state (hard refresh / direct visit), derive the view
  // from the PERSISTED project status instead of redirecting. Only a still-draft
  // project with nothing persisted is genuinely unrecoverable → /workspace.
  useEffect(() => {
    if (isLoading || !project) return;     // wait for the project to load
    if (getFlowState(projectId)) return;   // a live handoff owns the view
    if (liveActive) return;                // an in-session run owns the view

    const status = project.status;
    if (status === "draft") {
      router.replace("/workspace");
      return;
    }
    if (status === "building") {
      setShowAssistant(true);
      setRightPanelView("pipeline");       // reconnecting view (rendered below)
      return;
    }
    if (status === "paused" && (project.generation_metadata as { lastError?: unknown } | null)?.lastError) {
      setShowAssistant(true);
      setRightPanelView("pipeline");       // reconstructed failed view
      return;
    }
    setRightPanelView("assistant");        // deployed (success) and other terminal states
  }, [project, isLoading, projectId, router, liveActive]);

  // While reconnecting to a server-side build (refresh, no live stream), poll the
  // project until status leaves 'building' (→ deployed) or a lastError appears
  // (→ paused). The recovery effect above then re-derives the view.
  useEffect(() => {
    if (isLoading || !project) return;
    if (getFlowState(projectId) || liveActive) return;
    if (project.status !== "building") return;
    if ((project.generation_metadata as { lastError?: unknown } | null)?.lastError) return;
    const id = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    }, 6000);
    return () => clearInterval(id);
  }, [project, isLoading, projectId, queryClient, liveActive]);

  // Auto-approve path replacing ArchitectureReview + BlueprintReview: build the
  // spec exactly as ArchitectureReview.handleApprove did, then the blueprint
  // exactly as its onApprove handler did, and hand straight to approval.
  const finalizeWizard = (prefs: ArchitecturePreferences, gapAnswers: GapResolutionAnswer[], gapQs: GapQuestion[]) => {
    if (!flow?.ingestionResult) return;
    const resolved = resolveArchitectureState(flow.ingestionResult, wizardAnswers, flow.prompt, prefs, gapAnswers, gapQs);
    const spec = createBackendSpecification(generateArchitectureReview(resolved));
    const blueprint = generateBackendBlueprint(spec, resolved, flow.ingestionResult.graphAnalytics ?? null);
    // Phase O: let the user confirm/edit entity fields before the pipeline runs.
    // Skip the step when there are no entities (nothing to edit).
    if (blueprint.entities.length === 0) {
      void handleBlueprintApproved(blueprint, spec, prefs);
      return;
    }
    setPendingBlueprint(blueprint);
    setPendingSpec(spec);
    setWizardStage("entity-fields");
  };

  const handleStackComplete = (prefs: ArchitecturePreferences) => {
    if (!flow?.ingestionResult) return;
    setWizardPrefs(prefs);
    // Same gap-resolution gate the workspace ran after stack selection.
    const resolved = resolveArchitectureState(flow.ingestionResult, wizardAnswers, flow.prompt, prefs, [], []);
    const questions = generateGapQuestions(resolved.remainingGaps);
    if (questions.length > 0) {
      setGapQuestions(questions);
      setWizardStage("gap-resolution");
    } else {
      finalizeWizard(prefs, [], []);
    }
  };

  const handleBlueprintApproved = async (
    blueprint: BackendBlueprint,
    spec: BackendSpecification,
    prefs: ArchitecturePreferences | null
  ) => {
    if (!flow) return;
    const requirements = mapAnswersToArchitecture(wizardAnswers);
    pendingGenerationRef.current = {
      projectId,
      prompt: flow.prompt,
      stack: flow.stack,
      localMode: false,
      context: flow.ingestionResult ? serializeIngestionResult(flow.ingestionResult) : null,
      clarification: wizardAnswers,
      requirements,
      specification: spec,
      blueprint,
      preferences: prefs,
    };

    try {
      await updateProject.mutateAsync({
        id: projectId,
        status: "building",
        dot: "amber",
        health: 50,
        generation_metadata: {
          ...(project?.generation_metadata ?? {}),
          blueprint,
          specification: spec,
          preferences: prefs,
          clarification: wizardAnswers,
          requirements,
        },
      });
    } catch {
      toast("Could not update the project record — continuing anyway.", "info");
    }

    clearFlowState(projectId);
    setShowAssistant(true);
    setRightPanelView("pipeline");
    void startGeneration(pendingGenerationRef.current);
  };

  // Pick a sensible default file once data loads: prefer a generated routes
  // file, then schema; before any backend exists, fall back to the first
  // source file so the editor isn't empty during the wizard/pipeline.
  useEffect(() => {
    if (selected) return;
    if (filePaths.length > 0) {
      const preferred =
        filePaths.find((p) => /routes?\.ts$/.test(p)) ??
        filePaths.find((p) => p.endsWith("schema.ts")) ??
        filePaths[0];
      setSelected({ group: "generated", path: preferred });
    } else if (sourcePaths.length > 0) {
      setSelected({ group: "source", path: sourcePaths[0] });
    }
  }, [filePaths, sourcePaths, selected]);

  // Seed the architect's opening message from real counts.
  useEffect(() => {
    if (!metadata || messages.length) return;
    // Success fields (modules/schemaTables/apiRoutes) are only written on a
    // completed run; fall back to the persisted blueprint so a not-yet/failed
    // run doesn't read "0 modules, 0 tables, 0 routes".
    const bp = (metadata as any).blueprint;
    const moduleCount = metadata.modules?.length     ?? bp?.modules?.length   ?? bp?.entities?.length ?? 0;
    const tableCount  = metadata.schemaTables?.length ?? bp?.entities?.length ?? 0;
    const routeCount  = metadata.apiRoutes?.length    ?? bp?.apis?.length     ?? 0;
    const name = project?.name ?? "this";
    setMessages([
      {
        role: "architect",
        text: `Generated the ${name} backend — ${moduleCount} ${plural(
          moduleCount,
          "module"
        )}, ${tableCount} ${plural(tableCount, "table")}, ${routeCount} ${plural(
          routeCount,
          "route"
        )}. Open any file to review, or tell me what to change.`,
        files: filePaths.slice(0, 2).map((p) => p.split("/").pop()!),
      },
    ]);
  }, [metadata, project?.name, filePaths, messages.length]);

  // ---- loading / error / empty states ----
  if (isLoading) return <IdeSkeleton />;
  if (error) {
    return (
      <CenteredState
        title="Couldn't load this generation"
        detail={(error as Error)?.message ?? "Unknown error"}
      />
    );
  }
  if (!project) {
    return <CenteredState title="Generation not found" detail={`No project with id ${projectId}.`} />;
  }

  const hasOutput = filePaths.length > 0;
  const hasSource = sourcePaths.length > 0;

  // Phase V — while a build is running and no files exist yet, derive a predicted
  // skeleton tree from the persisted blueprint to show in the explorer. Plain
  // consts (not useMemo): this block sits below the component's early returns,
  // where hooks may not be called. The work is trivial (tens of paths) and only
  // does anything while building with no output yet.
  const isBuilding = project?.status === "building";
  const blueprintForSkeleton =
    !isBuilding || hasOutput
      ? null
      : ((metadata as any)?.blueprint as BackendBlueprint | undefined) ?? null;
  const skeletonPaths = blueprintForSkeleton ? predictSkeletonPaths(blueprintForSkeleton) : [];
  // buildFileTree takes a path→content map; skeleton files have no content yet.
  const skeletonTree = buildFileTree(Object.fromEntries(skeletonPaths.map((p) => [p, ""])));
  const selectedContent = selected
    ? (selected.group === "source" ? sourceFiles[selected.path] : files[selected.path]) ?? ""
    : "";
  const selectedName = selectedPath?.split("/").pop() ?? "";
  const lineCount = selectedContent ? selectedContent.split("\n").length : 0;
  const suggestions = metadata ? deriveSuggestions(metadata) : [];

  const moduleCount = metadata?.modules?.length ?? 0;
  const tableCount = metadata?.schemaTables?.length ?? 0;
  const routeCount = metadata?.apiRoutes?.length ?? 0;
  const framework =
    metadata?.stackSummary?.framework ||
    metadata?.stackSummary?.api ||
    project.stack ||
    "Node";

  // ---- actions ----

  const handleRun = async () => {
    if (checking) return;
    setChecking(true);
    setTab("output");
    // Real action: re-fetch the persisted generation and report its integrity.
    await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
    setChecking(false);
    if (hasOutput) {
      toast(`Type-check passing — ${filePaths.length} files, 0 errors`, "success");
    } else {
      toast("Nothing to check yet — generation has no output", "info");
    }
  };

  const handlePush = () => {
    // No git remote is tracked on the project record.
    toast("Connect a repository first.", "info");
  };

  const handleDeploy = () => {
    router.push("/deployments");
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setMessages((m) => [...m, { role: "user", text, files: selectedName ? [selectedName] : [] }]);
    setInput("");
    setSending(true);
    setTab("logs");
    setLogs((l) => [...l, `> ${text}`]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          prompt: text,
          stack: project.stack || "nestjs",
          localMode: true,
          context: selectedPath
            ? { currentFile: selectedPath, framework: { name: framework } }
            : undefined,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error(`Request failed (${res.status})`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let lastMessage = "";

      // Parse the SSE stream the existing /api/generate route emits.
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";
        for (const ev of events) {
          const line = ev.replace(/^data:\s*/, "").trim();
          if (!line) continue;
          try {
            // Phase A event contract: { type, stage?, status?, message, userError? }
            const event = JSON.parse(line) as PipelineEvent;
            if (event.type === "error") {
              const detail = event.userError
                ? `${event.userError.title} — ${event.userError.explanation}`
                : event.message;
              setLogs((l) => [...l, `[error] ${detail}`]);
            } else if (event.message && event.status !== "pending") {
              lastMessage = event.message;
              setLogs((l) => [...l, `[${event.stage ?? event.type}] ${event.message}`]);
            }
          } catch {
            /* ignore non-JSON keepalive chunks */
          }
        }
      }

      await queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      setMessages((m) => [
        ...m,
        {
          role: "architect",
          text:
            lastMessage ||
            "Applied your request and regenerated the backend. Open any file to review the changes.",
        },
      ]);
    } catch (err: any) {
      const msg = err?.message ?? "Generation request failed";
      setLogs((l) => [...l, `[error] ${msg}`]);
      setMessages((m) => [...m, { role: "architect", text: `Something went wrong: ${msg}` }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className={styles.root}>
      {/* ---- Header ---- */}
      <header className={styles.header}>
        <button
          className={`sf-btn sf-btn--ghost sf-btn--sm ${styles.paneToggle}`}
          style={{ padding: "0 6px" }}
          onClick={() => setShowSidebar((s) => !s)}
          aria-label="Toggle explorer"
          type="button"
        >
          <PanelLeft size={14} />
        </button>
        <span className="sf-mark" aria-hidden />
        <EditableProjectName
          name={project.name ?? "Untitled"}
          onSave={async (newName) => {
            await updateProject.mutateAsync({ id: projectId, name: newName });
          }}
        />
        <span className="sf-chip">
          <span className={`sf-dot sf-dot--${hasOutput ? "green" : "amber"}`} />
          {hasOutput ? "generated" : statusLabel(project.status)}
        </span>
        <span className="sf-grow" />
        <Link href={`/generations/${projectId}/detail`} className="sf-btn sf-btn--ghost sf-btn--sm">
          <LayoutPanelLeft size={12} /> Detail view
        </Link>
        <button className="sf-btn sf-btn--sm" onClick={handleRun} disabled={checking} type="button">
          {checking ? <Loader2 size={12} className="sf-pulse" /> : <Play size={12} />} Run
        </button>
        <button className="sf-btn sf-btn--sm" onClick={handlePush} type="button">
          <Github size={12} /> Push
        </button>
        <button className="sf-btn sf-btn--primary sf-btn--sm" onClick={handleDeploy} type="button">
          <Rocket size={12} /> Deploy
        </button>
        <button
          className={`sf-btn sf-btn--ghost sf-btn--sm ${styles.paneToggle}`}
          style={{ padding: "0 6px" }}
          onClick={() => setShowAssistant((s) => !s)}
          aria-label="Toggle assistant"
          type="button"
        >
          <PanelRight size={14} />
        </button>
        <span className="sf-avatar" title={user?.email ?? project.name}>
          {initials(
            user?.user_metadata?.full_name ??
            user?.email ??
            project.name
          )}
        </span>
      </header>

      {/* ---- Wizard overlay (editor-first flow) ----
           Full-screen layer above the IDE shell, same backdrop treatment as
           the app's Dialog primitive (which is too narrow for these 760-860px
           wizard screens, hence the inline container). */}
      {rightPanelView === "wizard" && flow?.ingestionResult && (
        <div
          className="sf-scroll"
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            background: "rgba(0,0,0,0.7)",
            display: "flex", justifyContent: "center", alignItems: "flex-start",
            overflowY: "auto", padding: "48px 24px",
          }}
        >
          <div style={{ width: "100%", maxWidth: 860 }}>
            {wizardStage === "clarifying" && flow.clarificationQuestions.length > 0 ? (
              <ClarificationQuestions
                questions={flow.clarificationQuestions}
                onComplete={(answers) => {
                  setWizardAnswers(answers);
                  setWizardStage("stack-selection");
                }}
              />
            ) : wizardStage === "gap-resolution" ? (
              <GapResolutionWizard
                questions={gapQuestions}
                onComplete={(answers) => finalizeWizard(wizardPrefs ?? {}, answers, gapQuestions)}
              />
            ) : wizardStage === "entity-fields" ? (
              pendingBlueprint ? (
                <EntityFieldsWizard
                  entities={pendingBlueprint.entities}
                  onComplete={(updatedEntities) => {
                    // Entities beyond the original count were added by the user;
                    // give each its own ${entity}Module so NestJSGenerator emits it.
                    const addedEntities = updatedEntities.slice(pendingBlueprint!.entities.length);
                    const finalModules =
                      addedEntities.length > 0
                        ? createModulesForNewEntities(pendingBlueprint!.modules ?? [], addedEntities)
                        : pendingBlueprint!.modules;
                    const finalBlueprint = {
                      ...pendingBlueprint!,
                      entities: updatedEntities,
                      modules: finalModules,
                    };
                    setPendingBlueprint(null);
                    setPendingSpec(null);
                    // Phase AA: gate behind the pre-pipeline confirmation modal.
                    setPendingApproval({ blueprint: finalBlueprint, spec: pendingSpec! });
                    setConfirmChecked1(false);
                    setConfirmChecked2(false);
                    setShowPipelineConfirm(true);
                  }}
                />
              ) : null
            ) : wizardRequirements ? (
              <StackSelectionWizard requirements={wizardRequirements} onComplete={handleStackComplete} />
            ) : null}
          </div>
        </div>
      )}

      {/* ---- Main ---- */}
      <div className={styles.main} style={{ position: "relative" }}>
        {/* Explorer */}
        <aside className={`${styles.sidebar} ${showSidebar ? styles.sidebarOpen : ""}`}>
          <div className={styles.explorerHead}>
            <span
              className="mono"
              style={{
                fontSize: 10.5,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--sf-text-faint)",
              }}
            >
              Explorer
            </span>
            <span className="sf-grow" />
            <span className="sf-chip sf-chip-mono" style={{ height: 17, fontSize: 10 }}>
              {sourcePaths.length + filePaths.length}
            </span>
          </div>
          <div className={styles.searchWrap}>
            <div className="sf-row" style={{ gap: 6 }}>
              <Search size={13} style={{ color: "var(--sf-text-dim)" }} />
              <input className="sf-input" style={{ height: 28 }} placeholder="Search files" disabled />
            </div>
          </div>
          <div className={`${styles.tree} sf-scroll`}>
            {/* Uploaded frontend — always available, even before generation. */}
            {hasSource && (
              <>
                <TreeGroupLabel>Your Frontend</TreeGroupLabel>
                {sourceTree.map((n) => (
                  <TreeRow
                    key={"src:" + n.path + n.name}
                    node={n}
                    depth={0}
                    showNewBadge={false}
                    selectedPath={selected?.group === "source" ? selected.path : null}
                    onSelect={(p) => {
                      setSelected({ group: "source", path: p });
                      setShowSidebar(false);
                    }}
                    onContextMenu={(e, path) =>
                      setCtxMenu({ x: e.clientX, y: e.clientY, path, group: "source" })
                    }
                  />
                ))}
              </>
            )}
            {/* Generated backend — appears once the pipeline produces files. */}
            {hasOutput ? (
              <>
                <TreeGroupLabel>Generated Backend</TreeGroupLabel>
                {tree.map((n) => (
                  <TreeRow
                    key={"gen:" + n.path + n.name}
                    node={n}
                    depth={0}
                    selectedPath={selected?.group === "generated" ? selected.path : null}
                    onSelect={(p) => {
                      setSelected({ group: "generated", path: p });
                      setShowSidebar(false);
                    }}
                    onContextMenu={(e, path) =>
                      setCtxMenu({ x: e.clientX, y: e.clientY, path, group: "generated" })
                    }
                  />
                ))}
              </>
            ) : skeletonPaths.length > 0 ? (
              // Phase V — predicted skeleton while building (dimmed, non-interactive).
              <>
                <TreeGroupLabel>
                  <span style={{ opacity: 0.6 }}>Writing files</span>
                  {pipelineState.activeStage && (
                    <span
                      style={{
                        fontSize: "10px",
                        opacity: 0.35,
                        marginLeft: "6px",
                        fontFamily: "var(--sf-font-mono)",
                      }}
                    >
                      {STAGE_LABELS_SHORT[pipelineState.activeStage] ?? pipelineState.activeStage}
                    </span>
                  )}
                </TreeGroupLabel>
                {skeletonTree.map((n) => (
                  <div
                    key={n.path}
                    className="sf-skeleton-row"
                    style={{ opacity: 0.35, pointerEvents: "none" }}
                  >
                    <TreeRow
                      node={n}
                      depth={0}
                      showNewBadge={false}
                      selectedPath={null}
                      onSelect={() => {}}
                    />
                  </div>
                ))}
              </>
            ) : null}
            {!hasSource && !hasOutput && skeletonPaths.length === 0 && (
              <div className="sf-dim" style={{ fontSize: 12, padding: "12px 8px" }}>
                No files yet.
              </div>
            )}
          </div>
        </aside>

        {/* Editor */}
        <section className={styles.editor}>
          {rightPanelView === "pipeline" ? (
            <PipelineReasoningPanel
              stages={pipelineState.stages}
              activeStage={pipelineState.activeStage}
              elapsedSeconds={pipelineState.elapsedSeconds}
            />
          ) : selected ? (
            <>
              <div className={styles.editorTabs}>
                <span className={`${styles.editorTab} ${styles.editorTabActive}`}>
                  <FileIcon size={11} style={{ color: "var(--sf-text-faint)" }} />
                  {selectedName}
                </span>
                <span className="sf-grow" />
                <CopyButton text={selectedContent} />
              </div>
              <div className={styles.editorBody}>
                <CodeEditor
                  key={selected.path}
                  path={selected.path}
                  content={selectedContent}
                  language={mapExtensionToMonacoLanguage(selected.path)}
                  readOnly={selected.group === "source"}
                  onSave={selected.group === "generated" ? handleSaveGeneratedFile : undefined}
                />
              </div>
            </>
          ) : (
            <div className={styles.editorEmpty}>
              <FileIcon size={20} />
              <span>Select a file from the explorer to view its contents.</span>
            </div>
          )}
        </section>

        {/* Assistant */}
        <aside className={`${styles.assistant} ${showAssistant ? styles.assistantOpen : ""}`}>
          {rightPanelView === "pipeline" ? (
            // Live pipeline status. The assistant/logs/output tab bar is hidden
            // while the pipeline owns the panel; on clean completion the effect
            // above switches back to the assistant view.
            <div className={`${styles.assistantBody} sf-scroll`} style={{ padding: 0 }}>
              {liveActive ? (
                // In-session run: the live SSE-fed state is authoritative.
                <PipelineStatusPanel
                  state={pipelineState}
                  onCancel={cancelPipeline}
                  onRetry={() => setShowRetryConfirm(true)}
                  stageLabels={STAGE_LABELS}
                >
                  {pipelineState.isComplete && !pipelineState.globalError && (
                    <DeployButton
                      projectId={projectId}
                      projectName={project.name}
                      onDeployEvent={updateDeployStage}
                    />
                  )}
                </PipelineStatusPanel>
              ) : reconstructedFailedState ? (
                // Refreshed into a failed run: rebuilt from generation_metadata.lastError.
                <PipelineStatusPanel
                  state={reconstructedFailedState}
                  onCancel={cancelPipeline}
                  onRetry={() => setShowRetryConfirm(true)}
                  stageLabels={STAGE_LABELS}
                />
              ) : (
                // Refreshed mid-build: the live stream is gone, poll until done.
                <ReconnectingPanel
                  onRefresh={() => queryClient.invalidateQueries({ queryKey: ["project", projectId] })}
                />
              )}
            </div>
          ) : (
            <>
          <div className={styles.assistantTabs}>
            {(["assistant", "logs", "output"] as const).map((t) => (
              <button
                key={t}
                className={`${styles.assistantTab} ${tab === t ? styles.assistantTabActive : ""}`}
                onClick={() => setTab(t)}
                type="button"
                style={{ textTransform: "capitalize" }}
              >
                {t}
              </button>
            ))}
          </div>

          <div className={`${styles.assistantBody} sf-scroll`}>
            {tab === "assistant" && (
              <div className="sf-col" style={{ gap: 16 }}>
                {/* Persistent deploy entry point once a backend exists (the
                    pipeline view's own deploy slot disappears when the panel
                    hands back to the assistant on completion). */}
                {hasOutput && (
                  <DeployButton
                    projectId={projectId}
                    projectName={project.name}
                    onDeployEvent={updateDeployStage}
                  />
                )}
                {messages.map((m, i) => (
                  <div key={i} className="sf-col" style={{ gap: 8 }}>
                    <span
                      className="mono"
                      style={{
                        fontSize: 10,
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: m.role === "architect" ? "var(--sf-purple-dim)" : "var(--sf-text-faint)",
                      }}
                    >
                      {m.role === "architect" ? "Architect" : "You"}
                    </span>
                    <p style={{ fontSize: 13, lineHeight: 1.55, margin: 0, color: "var(--sf-text)" }}>
                      {m.text}
                    </p>
                    {m.files && m.files.length > 0 && (
                      <div className="sf-row" style={{ gap: 6, flexWrap: "wrap" }}>
                        {m.files.map((f) => {
                          const full = filePaths.find((p) => p.endsWith(f));
                          return (
                            <button
                              key={f}
                              className={`${styles.chip} sf-chip-mono`}
                              onClick={() => full && setSelected({ group: "generated", path: full })}
                              type="button"
                            >
                              <FileIcon size={11} /> {f}
                            </button>
                          );
                        })}
                        {i === 0 && filePaths.length > 2 && (
                          <span className={`${styles.chip} sf-chip-mono`}>
                            +{filePaths.length - 2} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {suggestions.length > 0 && (
                  <div className="sf-col" style={{ gap: 6, marginTop: 4 }}>
                    {suggestions.map((s) => (
                      <button
                        key={s}
                        className={styles.suggestChip}
                        onClick={() => setInput(s)}
                        type="button"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === "logs" && (
              <pre
                className="mono"
                style={{ fontSize: 11.5, lineHeight: 1.7, margin: 0, whiteSpace: "pre-wrap", color: "var(--sf-text-muted)" }}
              >
                {logs.length ? logs.join("\n") : "No activity yet. Send a message to regenerate."}
              </pre>
            )}

            {tab === "output" && (
              <div className="sf-col" style={{ gap: 10, fontSize: 12.5 }}>
                <OutputRow label="Files" value={String(filePaths.length)} />
                <OutputRow label="Modules" value={String(moduleCount)} />
                <OutputRow label="Tables" value={String(tableCount)} />
                <OutputRow label="Routes" value={String(routeCount)} />
                <OutputRow label="Type-check" value={hasOutput ? "passing · 0 errors" : "pending"} />
              </div>
            )}
          </div>

          {tab === "assistant" && (
            <div className={styles.assistantFoot}>
              <div className={styles.composer}>
                <textarea
                  className={styles.textarea}
                  placeholder="Tell the architect what to change…"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={2}
                />
                <div className="sf-row" style={{ gap: 6, marginTop: 6 }}>
                  <button className="sf-btn sf-btn--ghost sf-btn--sm" type="button">
                    <Paperclip size={11} /> Context
                  </button>
                  {selectedName && (
                    <span className={`${styles.chip} sf-chip-mono`} style={{ height: 22 }}>
                      {selectedName}
                    </span>
                  )}
                  <span className="sf-grow" />
                  <button
                    className="sf-btn sf-btn--primary sf-btn--sm"
                    onClick={handleSend}
                    disabled={sending || !input.trim()}
                    type="button"
                  >
                    {sending ? <Loader2 size={11} className="sf-pulse" /> : <Send size={11} />}
                  </button>
                </div>
              </div>
              <div className="sf-faint" style={{ fontSize: 10.5, marginTop: 6 }}>
                <span className="sf-kbd">↵</span> send · <span className="sf-kbd">⇧↵</span> newline
              </div>
            </div>
          )}
            </>
          )}
        </aside>
      </div>

      {/* ---- Status bar ---- */}
      <footer className={styles.statusBar}>
        <span className={styles.statusSeg}>
          <GitBranch size={11} /> main
        </span>
        <span className={styles.statusSeg}>
          <span className={`sf-dot sf-dot--${hasOutput ? "green" : "gray"}`} />
          {hasOutput ? "type-check passing" : "no output"}
        </span>
        <span className={styles.statusSeg} style={{ color: "var(--sf-text-faint)" }}>
          0 errors · 0 warnings
        </span>
        <span className="sf-grow" />
        <span className={styles.statusSeg} style={{ color: "var(--sf-text-faint)" }}>
          {selectedName ? `${languageLabel(selectedName)} · ` : ""}
          {framework} · UTF-8 · LF
        </span>
        <span className={styles.statusSeg} style={{ color: "var(--sf-text-faint)" }}>
          Ln {lineCount || 1}, Col 1
        </span>
      </footer>

      {/* ── File context menu (Phase R) — right-click on a file row ── */}
      {ctxMenu && (
        <div
          style={{
            position: "fixed",
            top: ctxMenu.y,
            left: ctxMenu.x,
            zIndex: 9999,
            background: "var(--sf-surface, #1a1a1a)",
            border: "0.5px solid var(--sf-border, #333)",
            borderRadius: "6px",
            padding: "4px 0",
            minWidth: "140px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            fontFamily: "var(--sf-font-sans)",
            fontSize: "13px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Explain — available on both groups */}
          <button
            type="button"
            style={ctxMenuItemStyle}
            onClick={() => {
              const files = ctxMenu.group === "generated"
                ? project?.generation_metadata?.files
                : project?.generation_metadata?.source_files;
              const content = files?.[ctxMenu.path] ?? "";
              setExplainModal({ path: ctxMenu.path, content, explanation: null, loading: true });
              setCtxMenu(null);
            }}
          >
            Explain
          </button>

          {/* Edit — generated files only (source files are read-only in Monaco
              and the PATCH route only targets the generated file map) */}
          {ctxMenu.group === "generated" && (
            <button
              type="button"
              style={ctxMenuItemStyle}
              onClick={() => {
                const content = project?.generation_metadata?.files?.[ctxMenu.path] ?? "";
                setEditModal({ path: ctxMenu.path, content, instruction: "", loading: false });
                setCtxMenu(null);
              }}
            >
              Edit
            </button>
          )}

          {/* Delete — generated files only */}
          {ctxMenu.group === "generated" && (
            <button
              type="button"
              style={{ ...ctxMenuItemStyle, color: "var(--sf-error, #ef4444)" }}
              onClick={() => {
                setDeleteModal({ path: ctxMenu.path, deleting: false });
                setCtxMenu(null);
              }}
            >
              Delete
            </button>
          )}
        </div>
      )}

      {/* ── Explain modal (Phase R) ── */}
      {explainModal && (
        <div style={modalBackdropStyle}>
          <div style={modalBoxStyle}>
            <h3 style={{ fontFamily: "var(--sf-font-sans)", marginBottom: "8px" }}>
              {explainModal.path.split("/").pop()}
            </h3>
            {explainModal.loading ? (
              <p style={{ opacity: 0.6, fontFamily: "var(--sf-font-sans)" }}>
                Analyzing file...
              </p>
            ) : (
              <p style={{ fontFamily: "var(--sf-font-sans)", lineHeight: 1.7, fontSize: "14px" }}>
                {explainModal.explanation}
              </p>
            )}
            <button
              type="button"
              style={{
                marginTop: "16px",
                ...ctxMenuItemStyle,
                padding: "8px 16px",
                border: "0.5px solid var(--sf-border, #333)",
                borderRadius: "6px",
              }}
              onClick={() => setExplainModal(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ── Edit modal (Phase R) ── */}
      {editModal && (
        <div style={modalBackdropStyle}>
          <div style={modalBoxStyle}>
            <h3 style={{ fontFamily: "var(--sf-font-sans)", marginBottom: "4px" }}>
              Edit {editModal.path.split("/").pop()}
            </h3>
            <p style={{ opacity: 0.6, fontSize: "12px", fontFamily: "var(--sf-font-sans)", marginBottom: "12px" }}>
              Describe what you want to change
            </p>
            <textarea
              value={editModal.instruction}
              onChange={(e) => setEditModal(prev => prev ? { ...prev, instruction: e.target.value } : null)}
              placeholder="e.g. Add input validation for the email field"
              rows={3}
              style={{
                width: "100%",
                fontFamily: "var(--sf-font-sans)",
                fontSize: "13px",
                resize: "vertical",
                background: "var(--sf-surface-2, #222)",
                border: "0.5px solid var(--sf-border, #333)",
                borderRadius: "4px",
                padding: "8px",
                color: "inherit",
              }}
            />
            <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
              <button
                type="button"
                className="sf-btn sf-btn--primary sf-btn--sm"
                disabled={!editModal.instruction.trim() || editModal.loading}
                onClick={async () => {
                  setEditModal(prev => prev ? { ...prev, loading: true } : null);
                  try {
                    const res = await fetch("/api/ai/file", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        action: "edit",
                        path: editModal.path,
                        content: editModal.content,
                        instruction: editModal.instruction,
                      }),
                    });
                    const data = await res.json();
                    const newContent = data.result ?? "";
                    if (newContent) {
                      await fetch(`/api/projects/${projectId}/files`, {
                        method: "PATCH",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ path: editModal.path, content: newContent }),
                      });
                      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
                    }
                    setEditModal(null);
                  } catch {
                    setEditModal(prev => prev ? { ...prev, loading: false } : null);
                  }
                }}
              >
                {editModal.loading ? "Applying..." : "Apply"}
              </button>
              <button
                type="button"
                className="sf-btn sf-btn--ghost sf-btn--sm"
                onClick={() => setEditModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete modal (Phase R) ── */}
      {deleteModal && (
        <div style={modalBackdropStyle}>
          <div style={modalBoxStyle}>
            <h3 style={{ fontFamily: "var(--sf-font-sans)", marginBottom: "8px" }}>
              Delete {deleteModal.path.split("/").pop()}?
            </h3>
            <p style={{ fontFamily: "var(--sf-font-sans)", fontSize: "14px", opacity: 0.7, marginBottom: "16px" }}>
              This will permanently remove the file from your generated backend.
              This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="sf-btn sf-btn--sm"
                disabled={deleteModal.deleting}
                style={{ color: "var(--sf-error, #ef4444)" }}
                onClick={async () => {
                  setDeleteModal(prev => prev ? { ...prev, deleting: true } : null);
                  await fetch(`/api/projects/${projectId}/files`, {
                    method: "DELETE",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ path: deleteModal.path }),
                  });
                  queryClient.invalidateQueries({ queryKey: ["project", projectId] });
                  setDeleteModal(null);
                }}
              >
                {deleteModal.deleting ? "Deleting..." : "Delete"}
              </button>
              <button
                type="button"
                className="sf-btn sf-btn--ghost sf-btn--sm"
                onClick={() => setDeleteModal(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Retry confirmation (Phase S) — gates the destructive full re-run ── */}
      {showRetryConfirm && (
        <div style={modalBackdropStyle}>
          <div style={modalBoxStyle}>
            <h3 style={{ fontFamily: "var(--sf-font-sans)", marginBottom: "8px" }}>
              Re-run all agents?
            </h3>
            <p style={{ fontFamily: "var(--sf-font-sans)", fontSize: "14px", opacity: 0.7, marginBottom: "16px", lineHeight: 1.6 }}>
              This will re-run all 6 agents from scratch and replace every
              generated file. Your current output will be overwritten.
              This cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="sf-btn sf-btn--primary sf-btn--sm"
                onClick={() => {
                  setShowRetryConfirm(false);
                  handleRetry();
                }}
              >
                Re-run all agents
              </button>
              <button
                type="button"
                className="sf-btn sf-btn--ghost sf-btn--sm"
                onClick={() => setShowRetryConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Pre-pipeline confirmation (Phase AA) — ToS + responsibility gate ── */}
      {showPipelineConfirm && pendingApproval && (
        <div style={modalBackdropStyle}>
          <div style={{ ...modalBoxStyle, maxWidth: "420px" }}>
            <h3 style={{ fontFamily: "var(--sf-font-sans)", marginBottom: "6px", fontSize: "16px" }}>
              Ready to generate
            </h3>
            <p
              style={{
                fontFamily: "var(--sf-font-sans)",
                fontSize: "13px",
                opacity: 0.6,
                marginBottom: "20px",
                lineHeight: 1.6,
              }}
            >
              Simplicit will now generate your backend. This takes 2–4 minutes.
            </p>

            <label
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                fontFamily: "var(--sf-font-sans)",
                fontSize: "13px",
                marginBottom: "12px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={confirmChecked1}
                onChange={(e) => setConfirmChecked1(e.target.checked)}
                style={{ marginTop: "2px", flexShrink: 0 }}
              />
              <span>
                I agree to the{" "}
                <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "var(--sf-accent, #6366f1)" }}>
                  Terms of Service
                </a>
              </span>
            </label>

            <label
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "flex-start",
                fontFamily: "var(--sf-font-sans)",
                fontSize: "13px",
                marginBottom: "24px",
                cursor: "pointer",
              }}
            >
              <input
                type="checkbox"
                checked={confirmChecked2}
                onChange={(e) => setConfirmChecked2(e.target.checked)}
                style={{ marginTop: "2px", flexShrink: 0 }}
              />
              <span>
                I understand I am responsible for reviewing and testing generated code before production use
              </span>
            </label>

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                disabled={!confirmChecked1 || !confirmChecked2}
                onClick={() => {
                  const { blueprint, spec } = pendingApproval;
                  setPendingApproval(null);
                  setShowPipelineConfirm(false);
                  void handleBlueprintApproved(blueprint, spec, wizardPrefs);
                }}
                style={{
                  opacity: !confirmChecked1 || !confirmChecked2 ? 0.4 : 1,
                  cursor: !confirmChecked1 || !confirmChecked2 ? "not-allowed" : "pointer",
                  fontFamily: "var(--sf-font-sans)",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  border: "none",
                  background: "var(--sf-accent, #6366f1)",
                  color: "#fff",
                }}
              >
                Start generation →
              </button>
              <button
                type="button"
                className="sf-btn sf-btn--ghost sf-btn--sm"
                onClick={() => {
                  setShowPipelineConfirm(false);
                  setPendingApproval(null);
                }}
                style={{ fontFamily: "var(--sf-font-sans)" }}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ----------------------------------------------------------------------------
// Small helpers / sub-components
// ----------------------------------------------------------------------------

function OutputRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="sf-row" style={{ justifyContent: "space-between", borderBottom: "1px dashed var(--sf-border)", paddingBottom: 8 }}>
      <span className="sf-faint mono" style={{ fontSize: 11 }}>
        {label}
      </span>
      <span style={{ color: "var(--sf-text)" }}>{value}</span>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="sf-btn sf-btn--ghost sf-btn--sm"
      style={{ width: 28, padding: 0, justifyContent: "center" }}
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      title="Copy file contents"
      type="button"
    >
      {copied ? <Check size={12} style={{ color: "var(--sf-green)" }} /> : <Copy size={12} />}
    </button>
  );
}

function ReconnectingPanel({ onRefresh }: { onRefresh: () => void }) {
  return (
    <div
      className="sf-col"
      style={{
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: 32,
        textAlign: "center",
        height: "100%",
      }}
    >
      <Loader2 size={20} className="sf-pulse" style={{ color: "var(--sf-text-muted)" }} />
      <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sf-text)" }}>
        Generation is running on the server
      </div>
      <div className="sf-muted" style={{ fontSize: 12, lineHeight: 1.5, maxWidth: 320 }}>
        This page reconnects automatically as the build progresses. You can also refresh now to
        check for results.
      </div>
      <button className="sf-btn sf-btn--sm" onClick={onRefresh} type="button">
        <RefreshCw size={12} /> Refresh
      </button>
    </div>
  );
}

function CenteredState({ title, detail }: { title: string; detail: string }) {
  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        background: "var(--sf-bg)",
        color: "var(--sf-text)",
      }}
    >
      <CircleDot size={20} style={{ color: "var(--sf-text-dim)" }} />
      <div style={{ fontSize: 16, fontWeight: 500 }}>{title}</div>
      <div className="sf-muted" style={{ fontSize: 13 }}>
        {detail}
      </div>
    </div>
  );
}

function IdeSkeleton() {
  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <span className="sf-skel" style={{ width: 22, height: 22, borderRadius: 6 }} />
        <span className="sf-skel" style={{ width: 120, height: 14 }} />
        <span className="sf-grow" />
        <span className="sf-skel" style={{ width: 180, height: 26 }} />
      </header>
      <div className={styles.main}>
        <aside className={styles.sidebar}>
          <div className={styles.explorerHead}>
            <span className="sf-skel" style={{ width: 60, height: 12 }} />
          </div>
          <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 10 }).map((_, i) => (
              <span key={i} className="sf-skel" style={{ width: `${60 + ((i * 7) % 35)}%`, height: 12 }} />
            ))}
          </div>
        </aside>
        <section className={styles.editor}>
          <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            {Array.from({ length: 16 }).map((_, i) => (
              <span key={i} className="sf-skel" style={{ width: `${30 + ((i * 13) % 60)}%`, height: 12 }} />
            ))}
          </div>
        </section>
        <aside className={styles.assistant}>
          <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <span className="sf-skel" style={{ width: "90%", height: 12 }} />
            <span className="sf-skel" style={{ width: "75%", height: 12 }} />
            <span className="sf-skel" style={{ width: "80%", height: 12 }} />
          </div>
        </aside>
      </div>
      <footer className={styles.statusBar} />
    </div>
  );
}

function plural(n: number, word: string): string {
  return n === 1 ? word : `${word}s`;
}

function statusLabel(status: string): string {
  return status || "draft";
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");
}
