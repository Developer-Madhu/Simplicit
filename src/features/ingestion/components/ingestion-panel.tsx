"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Upload,
  MessageSquare,
  X,
  FileArchive,
  CheckCircle2,
  AlertCircle,
  Loader2,
  FolderOpen,
  ArrowRight,
  ChevronRight,
  Search,
  Check,
  FileText,
  Code2,
} from "lucide-react";
import type { IngestionMode, IngestionState, IngestionResult } from "../types";
import { processZipFile } from "../providers/zip-provider";
import type { ZipProcessProgress } from "../providers/zip-provider";
import { analyzeProject } from "../analyzers";

// ZIP upload size guards (Phase X). Processing is entirely client-side
// (processZipFile/JSZip in the browser), so these are the only size gates.
const ZIP_SOFT_WARN_BYTES = 50 * 1024 * 1024; // 50MB — soft warning
const ZIP_HARD_LIMIT_BYTES = 100 * 1024 * 1024; // 100MB — hard reject

interface IngestionPanelProps {
  onComplete: (result: IngestionResult) => void;
  onClose: () => void;
  onFocusPrompt: () => void;
}

export function IngestionPanel({
  onComplete,
  onClose,
  onFocusPrompt,
}: IngestionPanelProps) {
  const [activeTab, setActiveTab] = useState<IngestionMode>("zip");
  const [state, setState] = useState<IngestionState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [progressMessage, setProgressMessage] = useState("");
  const [progressPercent, setProgressPercent] = useState(0);

  // ZIP state
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [sizeWarning, setSizeWarning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Optional Graphify graph.json (higher-accuracy extraction)
  const [graphifyText, setGraphifyText] = useState<string | null>(null);
  const [graphifyFileName, setGraphifyFileName] = useState<string | null>(null);
  const graphifyInputRef = useRef<HTMLInputElement>(null);

  // Monorepo selection state
  const [pendingFiles, setPendingFiles] = useState<Map<string, string> | null>(null);
  const [pendingMode, setPendingMode] = useState<IngestionMode | null>(null);
  const [rootCandidates, setRootCandidates] = useState<string[]>([]);

  // Context state
  const [selectedContextFile, setSelectedContextFile] = useState<File | null>(null);
  const contextInputRef = useRef<HTMLInputElement>(null);

  // Handle keyboard escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const runAnalysis = useCallback(async (files: Map<string, string>, mode: IngestionMode, targetRoot?: string) => {
    setState("analyzing");
    setProgressMessage("Initializing analysis engine...");
    setProgressPercent(70);

    try {
      const result = await analyzeProject(files, mode === "none" ? "zip" : mode as any, (stage) => {
        setProgressMessage(stage);
        if (stage.startsWith("Detecting framework")) setProgressPercent(75);
        else if (stage.startsWith("Mapping filesystem")) setProgressPercent(80);
        else if (stage.startsWith("Reconstructing route hierarchy")) setProgressPercent(85);
        else if (stage.startsWith("Analyzing application domains")) setProgressPercent(90);
        else if (stage.startsWith("Inferring backend requirements")) setProgressPercent(95);
        else if (stage.startsWith("Building application graph")) setProgressPercent(98);
      }, targetRoot);

      // If multiple candidates found and we haven't forced a root, let user choose
      if (!targetRoot && result.rootCandidates && result.rootCandidates.length > 1) {
        setPendingFiles(files);
        setPendingMode(mode);
        setRootCandidates(result.rootCandidates);
        setState("selection");
        return;
      }

      setProgressPercent(100);
      setProgressMessage("Analysis complete");
      setState("ready");

      setTimeout(() => {
        onComplete(result);
      }, 400);
    } catch (err: any) {
      setState("error");
      setError(err.message || "Analysis failed");
    }
  }, [onComplete]);

  // ─── ZIP Handlers ───────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (
        file.name.endsWith(".zip") ||
        file.type === "application/zip" ||
        file.type === "application/x-zip-compressed"
      ) {
        if (file.size > ZIP_HARD_LIMIT_BYTES) {
          setError(
            'ZIP file exceeds the 100MB limit. ' +
            'Make sure to exclude node_modules, .next, dist, and build folders before zipping.'
          );
          return;
        }
        setSelectedFile(file);
        setError(null);
        setSizeWarning(file.size > ZIP_SOFT_WARN_BYTES);
      } else {
        setError("Please upload a ZIP file. Other formats are not supported yet.");
      }
    }
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        if (
          file.name.endsWith(".zip") ||
          file.type === "application/zip" ||
          file.type === "application/x-zip-compressed"
        ) {
          if (file.size > ZIP_HARD_LIMIT_BYTES) {
            setError(
              'ZIP file exceeds the 100MB limit. ' +
              'Make sure to exclude node_modules, .next, dist, and build folders before zipping.'
            );
            return;
          }
          setSelectedFile(file);
          setError(null);
          setSizeWarning(file.size > ZIP_SOFT_WARN_BYTES);
        } else {
          setError("Please select a ZIP file.");
        }
      }
    },
    []
  );

  const handleGraphifySelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".json")) {
        setError("Please select a graph.json file from your graphify-out folder.");
        return;
      }
      const text = await file.text();
      setGraphifyText(text);
      setGraphifyFileName(file.name);
      setError(null);
    },
    []
  );

  const processZip = useCallback(async () => {
    if (!selectedFile) return;

    setState("uploading");
    setError(null);
    setSizeWarning(false);
    setProgressMessage("Extracting ZIP archive...");
    setProgressPercent(0);

    try {
      const files = await processZipFile(
        selectedFile,
        (progress: ZipProcessProgress) => {
          if (progress.phase === "extracting") {
            setProgressMessage("Extracting ZIP archive...");
            setProgressPercent(10);
          } else if (progress.phase === "reading") {
            const pct = progress.total > 0
              ? 10 + Math.round((progress.current / progress.total) * 50)
              : 30;
            setProgressMessage(
              `Reading files... ${progress.current}/${progress.total}`
            );
            setProgressPercent(pct);
          }
        }
      );

      if (files.size === 0) {
        throw new Error(
          "No analyzable files found in the ZIP. Make sure it contains a frontend project."
        );
      }

      // Optional: inject a user-supplied Graphify graph.json so the pipeline
      // imports it for higher-accuracy extraction (detected automatically in index.ts).
      if (graphifyText) {
        files.set("graphify-out/graph.json", graphifyText);
      }

      await runAnalysis(files, "zip");
    } catch (err: any) {
      setState("error");
      setError(err.message || "Failed to process ZIP file");
      setProgressPercent(0);
    }
  }, [selectedFile, graphifyText, runAnalysis]);

  // ─── Context Handlers ──────────────────────────────────────────
  const handleContextSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.name.toLowerCase().endsWith(".md") || file.name.toLowerCase().endsWith(".markdown")) {
        setSelectedContextFile(file);
        setError(null);
      } else {
        setError("Please select a Markdown (.md) file.");
      }
    }
  }, []);

  const processContext = useCallback(async () => {
    if (!selectedContextFile) return;

    setState("uploading");
    setError(null);
    setProgressMessage("Reading specification file...");
    setProgressPercent(20);

    try {
      const text = await selectedContextFile.text();
      const files = new Map<string, string>();
      files.set("simplicit.context.md", text);

      await runAnalysis(files, "context");
    } catch (err: any) {
      setState("error");
      setError(err.message || "Failed to read context file");
    }
  }, [selectedContextFile, runAnalysis]);

  // ─── Prompt-only Handler ────────────────────────────────────────
  const handlePromptOnly = useCallback(() => {
    onClose();
    onFocusPrompt();
  }, [onClose, onFocusPrompt]);

  const isProcessing = state === "uploading" || state === "analyzing";

  const tabs: Array<{
    id: IngestionMode;
    label: string;
    icon: typeof Upload;
    badge?: string;
  }> = [
    { id: "context", label: "Context File", icon: FileText, badge: "Recommended" },
    { id: "zip", label: "ZIP Upload", icon: FileArchive },
    { id: "prompt", label: "Prompt Only", icon: MessageSquare },
  ];

  return (
    <div
      className="sf-card-elev"
      style={{
        padding: 0,
        overflow: "hidden",
        marginBottom: 16,
        boxShadow:
          "0 16px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06) inset",
      }}
    >
      {/* Header */}
      <div
        className="sf-row"
        style={{
          padding: "10px 14px",
          gap: 8,
          borderBottom: "1px solid var(--sf-border)",
          background: "var(--sf-bg-2)",
        }}
      >
        <FolderOpen size={13} style={{ color: "var(--sf-text-muted)" }} />
        <span
          className="mono"
          style={{
            fontSize: 11,
            color: "var(--sf-text)",
            fontWeight: 500,
          }}
        >
          {state === "selection" ? "Select application" : "Import frontend project"}
        </span>
        <span className="sf-grow" />
        <button
          onClick={onClose}
          className="sf-btn sf-btn--ghost sf-btn--sm"
          style={{ padding: "0 4px" }}
          type="button"
        >
          <X size={13} />
        </button>
      </div>

      {/* Tabs (Hidden during selection) */}
      {state !== "selection" && (
        <div
          className="sf-row"
          style={{
            padding: "0 14px",
            gap: 2,
            borderBottom: "1px solid var(--sf-border)",
            background: "var(--sf-surface)",
          }}
        >
          {tabs.map((tab) => {
            const Ic = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  if (!isProcessing) {
                    setActiveTab(tab.id);
                    setError(null);
                  }
                }}
                className="sf-row"
                style={{
                  gap: 6,
                  padding: "8px 12px 10px",
                  background: "transparent",
                  border: "none",
                  fontFamily: "inherit",
                  fontSize: 12,
                  color: active ? "var(--sf-text)" : "var(--sf-text-muted)",
                  cursor: isProcessing ? "default" : "pointer",
                  position: "relative",
                  opacity: isProcessing && !active ? 0.4 : 1,
                }}
                type="button"
                disabled={isProcessing}
              >
                <Ic size={12} />
                {tab.label}
                {tab.badge && (
                  <span className="mono" style={{ 
                    fontSize: 8.5, padding: "1px 4px", borderRadius: 4, 
                    background: "oklch(0.78 0.16 145 / 0.15)", color: "oklch(0.78 0.16 145)",
                    marginLeft: 4, textTransform: "uppercase", fontWeight: 600,
                    border: "1px solid oklch(0.78 0.16 145 / 0.2)"
                  }}>
                    {tab.badge}
                  </span>
                )}
                {active && (

                  <span
                    style={{
                      position: "absolute",
                      left: 10,
                      right: 10,
                      bottom: -1,
                      height: 1.5,
                      background: "var(--sf-text)",
                      borderRadius: 1,
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      <div style={{ padding: "16px 18px" }}>
        {state === "selection" && pendingFiles && pendingMode && (
          <SelectionContent 
            candidates={rootCandidates} 
            onSelect={(root) => runAnalysis(pendingFiles, pendingMode, root)} 
            onCancel={() => setState("idle")}
          />
        )}

        {state !== "selection" && activeTab === "context" && (
          <ContextContent
            selectedFile={selectedContextFile}
            isProcessing={isProcessing}
            state={state}
            progressMessage={progressMessage}
            progressPercent={progressPercent}
            error={error}
            onFileSelect={handleContextSelect}
            onProcess={processContext}
            fileInputRef={contextInputRef}
          />
        )}

        {state !== "selection" && activeTab === "zip" && (
          <ZipContent
            dragOver={dragOver}
            selectedFile={selectedFile}
            isProcessing={isProcessing}
            state={state}
            progressMessage={progressMessage}
            progressPercent={progressPercent}
            error={error}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onFileSelect={handleFileSelect}
            onProcess={processZip}
            fileInputRef={fileInputRef}
            sizeWarning={sizeWarning}
            graphifyFileName={graphifyFileName}
            onGraphifySelect={handleGraphifySelect}
            graphifyInputRef={graphifyInputRef}
          />
        )}

        {state !== "selection" && activeTab === "prompt" && (
          <PromptOnlyContent onContinue={handlePromptOnly} />
        )}
      </div>
    </div>
  );
}

// ─── Context Tab Content ──────────────────────────────────────────

function ContextContent({
  selectedFile,
  isProcessing,
  state,
  progressMessage,
  progressPercent,
  error,
  onFileSelect,
  onProcess,
  fileInputRef,
}: {
  selectedFile: File | null;
  isProcessing: boolean;
  state: IngestionState;
  progressMessage: string;
  progressPercent: number;
  error: string | null;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onProcess: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="sf-col" style={{ gap: 12 }}>
      <div
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        style={{
          padding: "24px 20px",
          border: `1.5px dashed ${selectedFile ? "oklch(0.78 0.16 145 / 0.4)" : "var(--sf-border)"}`,
          borderRadius: 10,
          background: selectedFile ? "oklch(0.78 0.16 145 / 0.03)" : "transparent",
          cursor: isProcessing ? "default" : "pointer",
          textAlign: "center",
          opacity: isProcessing ? 0.6 : 1,
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".md,.markdown"
          onChange={onFileSelect}
          style={{ display: "none" }}
        />

        {selectedFile ? (
          <div className="sf-col" style={{ gap: 6, alignItems: "center" }}>
            <FileArchive size={24} style={{ color: "oklch(0.78 0.16 145)" }} />
            <span style={{ fontSize: 13, color: "var(--sf-text)", fontWeight: 500 }}>{selectedFile.name}</span>
            <span className="mono" style={{ fontSize: 11, color: "var(--sf-text-muted)" }}>Project Context Specification</span>
          </div>
        ) : (
          <div className="sf-col" style={{ gap: 6, alignItems: "center" }}>
            <div style={{ padding: 8, background: 'var(--sf-bg)', borderRadius: '50%', marginBottom: 4 }}>
               <Code2 size={20} style={{ color: "var(--sf-blue)" }} />
            </div>
            <span style={{ fontSize: 13, color: "var(--sf-text)", fontWeight: 500 }}>Upload simplicit.context.md</span>
            <span style={{ fontSize: 12, color: "var(--sf-text-muted)", maxWidth: 300, lineHeight: 1.4 }}>
              Highest accuracy method. Declare rules, entities, and requirements directly.
            </span>
          </div>
        )}
      </div>

      {isProcessing && (
        <div className="sf-col" style={{ gap: 6 }}>
          <div className="sf-row" style={{ gap: 8 }}>
            <Loader2 size={12} className="sf-spin" style={{ color: "var(--sf-blue)" }} />
            <span className="mono" style={{ fontSize: 11, color: "var(--sf-text-muted)" }}>{progressMessage}</span>
            <span className="sf-grow" />
            <span className="mono" style={{ fontSize: 10.5, color: "var(--sf-text-faint)" }}>{progressPercent}%</span>
          </div>
          <div style={{ height: 3, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${progressPercent}%`, height: "100%", background: "oklch(0.78 0.14 250)", borderRadius: 999 }} />
          </div>
        </div>
      )}

      {error && (
        <div className="sf-col" style={{ gap: 8, padding: "10px 12px", background: "rgba(255,90,90,0.06)", borderRadius: 8, border: "1px solid rgba(255,90,90,0.15)" }}>
          <div className="sf-row" style={{ gap: 8 }}>
            <AlertCircle size={13} style={{ color: "var(--sf-red)", flex: "0 0 auto" }} />
            <span style={{ fontSize: 12, color: "var(--sf-text)", fontWeight: 500 }}>Validation Failed</span>
          </div>
          <span style={{ fontSize: 12, color: "var(--sf-text-muted)", lineHeight: 1.4 }}>{error}</span>
        </div>
      )}

      {selectedFile && !isProcessing && state !== "ready" && (
        <div className="sf-row" style={{ gap: 8, justifyContent: "flex-end" }}>
          <button onClick={onProcess} className="sf-btn sf-btn--primary sf-btn--sm">
            <CheckCircle2 size={11} style={{ marginRight: 6 }} />
            Parse Specification
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Selection Tab Content ──────────────────────────────────────────

function SelectionContent({
  candidates,
  onSelect,
  onCancel,
}: {
  candidates: string[];
  onSelect: (root: string) => void;
  onCancel: () => void;
}) {
  const [selected, setSelected] = useState(candidates[0]);

  return (
    <div className="sf-col" style={{ gap: 14 }}>
      <div className="sf-row" style={{ gap: 10 }}>
        <div style={{ padding: 8, background: 'var(--sf-bg)', borderRadius: 8, border: '1px solid var(--sf-border)' }}>
          <Search size={16} style={{ color: 'var(--sf-blue)' }} />
        </div>
        <div className="sf-col" style={{ gap: 2 }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--sf-text)' }}>Multiple applications found</span>
          <span style={{ fontSize: 11.5, color: 'var(--sf-text-muted)' }}>We detected several frontend projects. Select one to proceed.</span>
        </div>
      </div>

      <div className="sf-col" style={{ gap: 6 }}>
        {candidates.map((root) => {
          const isSelected = selected === root;
          const displayPath = root === "" ? "./ (root)" : root.replace(/\/$/, "");
          return (
            <button
              key={root}
              onClick={() => setSelected(root)}
              className="sf-row"
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8,
                background: isSelected ? 'rgba(255,255,255,0.03)' : 'transparent',
                border: `1px solid ${isSelected ? 'var(--sf-blue)' : 'var(--sf-border)'}`,
                cursor: 'pointer', textAlign: 'left', gap: 12, transition: 'all 0.1s ease'
              }}
              type="button"
            >
              <div style={{
                width: 16, height: 16, borderRadius: '50%', border: `1px solid ${isSelected ? 'var(--sf-blue)' : 'var(--sf-text-faint)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', background: isSelected ? 'var(--sf-blue)' : 'transparent'
              }}>
                {isSelected && <Check size={10} color="#fff" strokeWidth={3} />}
              </div>
              <span className="mono" style={{ fontSize: 12, color: isSelected ? 'var(--sf-text)' : 'var(--sf-text-muted)', flex: 1 }}>
                {displayPath}
              </span>
              <ChevronRight size={12} style={{ color: 'var(--sf-text-faint)' }} />
            </button>
          );
        })}
      </div>

      <p style={{ fontSize: 11.5, color: 'var(--sf-text-muted)', margin: '2px 0 0', lineHeight: 1.5 }}>
        For monorepos, select the main web application (usually{' '}
        <span className="mono" style={{ color: 'var(--sf-text)' }}>apps/web</span> or{' '}
        <span className="mono" style={{ color: 'var(--sf-text)' }}>apps/app</span>) rather than the root for best results.
      </p>

      <div className="sf-row" style={{ gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
        <button onClick={onCancel} className="sf-btn sf-btn--ghost sf-btn--sm" type="button">Cancel</button>
        <button onClick={() => onSelect(selected)} className="sf-btn sf-btn--primary sf-btn--sm" type="button">Analyze selected</button>
      </div>
    </div>
  );
}

// ─── ZIP Tab Content ────────────────────────────────────────────────

function ZipContent({
  dragOver,
  selectedFile,
  isProcessing,
  state,
  progressMessage,
  progressPercent,
  error,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onProcess,
  fileInputRef,
  sizeWarning,
  graphifyFileName,
  onGraphifySelect,
  graphifyInputRef,
}: {
  dragOver: boolean;
  selectedFile: File | null;
  isProcessing: boolean;
  state: IngestionState;
  progressMessage: string;
  progressPercent: number;
  error: string | null;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onProcess: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  sizeWarning: boolean;
  graphifyFileName: string | null;
  onGraphifySelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  graphifyInputRef: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <div className="sf-col" style={{ gap: 12 }}>
      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          padding: "28px 20px",
          border: `1.5px dashed ${
            dragOver
              ? "oklch(0.78 0.14 250)"
              : selectedFile
              ? "oklch(0.78 0.16 145 / 0.4)"
              : "var(--sf-border)"
          }`,
          borderRadius: 10,
          background: dragOver
            ? "oklch(0.78 0.14 250 / 0.04)"
            : selectedFile
            ? "oklch(0.78 0.16 145 / 0.03)"
            : "transparent",
          cursor: isProcessing ? "default" : "pointer",
          transition: "all .2s ease",
          textAlign: "center",
          opacity: isProcessing ? 0.6 : 1,
          pointerEvents: isProcessing ? "none" : "auto",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,application/zip,application/x-zip-compressed"
          onChange={onFileSelect}
          style={{ display: "none" }}
        />

        {selectedFile ? (
          <div className="sf-col" style={{ gap: 6, alignItems: "center" }}>
            <FileArchive
              size={24}
              style={{ color: "oklch(0.78 0.16 145)" }}
            />
            <span
              style={{
                fontSize: 13,
                color: "var(--sf-text)",
                fontWeight: 500,
              }}
            >
              {selectedFile.name}
            </span>
            <span
              className="mono"
              style={{ fontSize: 11, color: "var(--sf-text-muted)" }}
            >
              {formatFileSize(selectedFile.size)}
            </span>
          </div>
        ) : (
          <div className="sf-col" style={{ gap: 6, alignItems: "center" }}>
            <Upload
              size={24}
              style={{
                color: dragOver
                  ? "oklch(0.78 0.14 250)"
                  : "var(--sf-text-faint)",
              }}
            />
            <span
              style={{
                fontSize: 13,
                color: dragOver
                  ? "var(--sf-text)"
                  : "var(--sf-text-muted)",
              }}
            >
              Drop a ZIP file here, or click to browse
            </span>
            <span
              className="mono"
              style={{ fontSize: 11, color: "var(--sf-text-faint)" }}
            >
              React · Next.js · Vue · Svelte · Angular
            </span>
          </div>
        )}
      </div>

      {sizeWarning && (
        <p
          style={{
            fontSize: "12px",
            fontFamily: "var(--sf-font-sans)",
            color: "var(--sf-warning, #f59e0b)",
            marginTop: "6px",
          }}
        >
          ⚠ Large file — ensure node_modules, .next, dist, and build folders are excluded to speed up analysis.
        </p>
      )}

      {/* Permanent note — always visible when a file is selected */}
      {selectedFile && !sizeWarning && (
        <p
          style={{
            fontSize: "11px",
            fontFamily: "var(--sf-font-sans)",
            opacity: 0.45,
            marginTop: "4px",
          }}
        >
          node_modules and build folders are automatically excluded.
        </p>
      )}

      {/* Optional: Graphify graph.json for higher-accuracy extraction */}
      {!isProcessing && (
        <div className="sf-row" style={{ gap: 6, fontSize: 12, color: "var(--sf-text-muted)" }}>
          <input
            ref={graphifyInputRef}
            type="file"
            accept=".json,application/json"
            onChange={onGraphifySelect}
            style={{ display: "none" }}
          />
          {graphifyFileName ? (
            <span className="sf-row" style={{ gap: 6, color: "oklch(0.78 0.16 145)" }}>
              <CheckCircle2 size={12} />
              <span className="mono" style={{ fontSize: 11 }}>{graphifyFileName} attached</span>
            </span>
          ) : (
            <span>
              Have a graphify-out folder?{" "}
              <span
                onClick={() => graphifyInputRef.current?.click()}
                style={{ color: "var(--sf-blue)", cursor: "pointer", textDecoration: "underline" }}
              >
                Upload graph.json for higher accuracy ↗
              </span>
            </span>
          )}
        </div>
      )}

      {/* Progress bar */}
      {isProcessing && (
        <div className="sf-col" style={{ gap: 6 }}>
          <div
            className="sf-row"
            style={{ gap: 8 }}
          >
            <Loader2
              size={12}
              className="sf-spin"
              style={{ color: "var(--sf-blue)" }}
            />
            <span
              className="mono"
              style={{ fontSize: 11, color: "var(--sf-text-muted)" }}
            >
              {progressMessage}
            </span>
            <span className="sf-grow" />
            <span
              className="mono"
              style={{ fontSize: 10.5, color: "var(--sf-text-faint)" }}
            >
              {progressPercent}%
            </span>
          </div>
          <div
            style={{
              height: 3,
              background: "rgba(255,255,255,0.05)",
              borderRadius: 999,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progressPercent}%`,
                height: "100%",
                background: "oklch(0.78 0.14 250)",
                borderRadius: 999,
                transition: "width .4s cubic-bezier(.2,.7,.3,1)",
              }}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="sf-row"
          style={{
            gap: 8,
            padding: "8px 12px",
            background: "rgba(255,90,90,0.06)",
            borderRadius: 6,
            border: "1px solid rgba(255,90,90,0.15)",
          }}
        >
          <AlertCircle
            size={13}
            style={{ color: "var(--sf-red)", flex: "0 0 auto" }}
          />
          <span style={{ fontSize: 12, color: "var(--sf-text-muted)" }}>
            {error}
          </span>
        </div>
      )}

      {/* Action */}
      {selectedFile && !isProcessing && state !== "ready" && (
        <div className="sf-row" style={{ gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onProcess}
            className="sf-btn sf-btn--primary sf-btn--sm"
            type="button"
          >
            <CheckCircle2 size={11} style={{ marginRight: 6 }} />
            Analyze project
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Prompt Only Tab Content ────────────────────────────────────────

function PromptOnlyContent({
  onContinue,
}: {
  onContinue: () => void;
}) {
  return (
    <div
      className="sf-col"
      style={{ gap: 12, padding: "8px 0", alignItems: "center" }}
    >
      <MessageSquare
        size={28}
        style={{ color: "var(--sf-text-faint)", marginBottom: 4 }}
      />
      <span
        style={{
          fontSize: 14,
          color: "var(--sf-text)",
          fontWeight: 500,
          textAlign: "center",
        }}
      >
        Describe your product directly
      </span>
      <span
        style={{
          fontSize: 12.5,
          color: "var(--sf-text-muted)",
          textAlign: "center",
          lineHeight: 1.5,
          maxWidth: 400,
        }}
      >
        No frontend codebase needed. Write a detailed prompt and Simplicit will
        design a complete backend from scratch.
      </span>
      <button
        onClick={onContinue}
        className="sf-btn sf-btn--primary sf-btn--sm"
        style={{ marginTop: 4 }}
        type="button"
      >
        Continue to prompt
        <ArrowRight size={11} style={{ marginLeft: 6 }} />
      </button>
    </div>
  );
}

// ─── Utilities ──────────────────────────────────────────────────────

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
