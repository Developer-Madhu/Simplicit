"use client";

import { useMemo, useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useProject } from "@/features/dashboard";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/features/auth/context/toast-context";
import { Dialog } from "@/components/ui/dialog";
import { generateProjectFiles } from "../api/exporter";
import { SchemaParser } from "../api/schema-parser";
import { APIGenerator } from "../api/api-generator";

import {
  Compass,
  Layers as LayersIcon,
  Database,
  Code as CodeIcon,
  Lock,
  Key,
  Rocket,
  RefreshCw,
  Github,
  Download,
  Folder,
  FolderOpen,
  File,
  ChevronRight,
  Copy,
  Plus,
  Eye,
  MoreHorizontal,
  X as XIcon,
  Globe,
  Cloud,
  Server,
  FileText,
  Wallet,
  Layers3,
  Cylinder,
  HardDrive,
  Loader2,
  Check
} from "lucide-react";

import { AppTopbar } from "@/features/shell";
import { InteractiveViewport } from "./interactive-viewport";
import { highlightTypeScript } from "../api/syntax-highlighter";
import { CodeBlock } from "@/components/ui/code-block";
import { CollapsiblePanel, PanelToggleButton } from "@/components/ui/collapsible-panel";
import { heroPrompt } from "@/lib/demo-data";
import type { FileNode } from "@/lib/types";

const Icons = {
  Compass,
  Layers: LayersIcon,
  Database,
  Code: CodeIcon,
  Lock,
  Key,
  Rocket,
  Refresh: RefreshCw,
  Github,
  Download,
  Folder,
  FolderO: FolderOpen,
  File,
  ArrowR: ChevronRight,
  Copy,
  Plus,
  Eye,
  More: MoreHorizontal,
  X: XIcon,
  Globe,
  Cloud,
  Server,
  FileText,
  Wallet,
  Layers3,
  Cylinder,
  HardDrive,
  Spinner: Loader2,
  Check
} as const;

// Code Block Syntax Highlighter Helper
const T = {
  kw: (s: string) => `<span class="tok-kw">${s}</span>`,
  fn: (s: string) => `<span class="tok-fn">${s}</span>`,
  str: (s: string) => `<span class="tok-str">${s}</span>`,
  num: (s: string) => `<span class="tok-num">${s}</span>`,
  cmt: (s: string) => `<span class="tok-cmt">${s}</span>`,
  type: (s: string) => `<span class="tok-type">${s}</span>`,
  prop: (s: string) => `<span class="tok-prop">${s}</span>`
};

// ---- File tree component ----
function FileTreeComponent({
  nodes,
  openByDefault = true,
  selected,
  onSelect,
  depth = 0
}: {
  nodes: FileNode[];
  openByDefault?: boolean;
  selected?: string;
  onSelect?: (node: FileNode) => void;
  depth?: number;
}) {
  return (
    <div className="sf-col" style={{ gap: 0 }}>
      {nodes.map((n, i) => (
        <FileTreeRowComponent
          key={`${n.name}-${i}`}
          node={n}
          depth={depth}
          openByDefault={openByDefault}
          selected={selected}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

function FileTreeRowComponent({
  node,
  depth,
  openByDefault,
  selected,
  onSelect
}: {
  node: FileNode;
  depth: number;
  openByDefault: boolean;
  selected?: string;
  onSelect?: (node: FileNode) => void;
}) {
  const [open, setOpen] = useState(openByDefault);
  const isSel = selected === node.name || (node.children && node.children.some(c => c.name === selected));
  const Ic = node.type === "dir" ? (open ? Icons.FolderO : Icons.Folder) : Icons.File;

  return (
    <>
      <button
        onClick={() => {
          if (node.type === "dir") {
            setOpen((o) => !o);
          } else {
            onSelect?.(node);
          }
        }}
        className="sf-row"
        style={{
          gap: 6,
          padding: "4px 10px",
          paddingLeft: 10 + depth * 14,
          width: "100%",
          background: isSel ? "rgba(255,255,255,0.05)" : "transparent",
          border: "none",
          borderRadius: 4,
          color: isSel ? "var(--sf-text)" : "var(--sf-text-muted)",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
          fontSize: 12.5,
          alignItems: "center"
        }}
        type="button"
      >
        {node.type === "dir" ? (
          <Icons.ArrowR
            size={10}
            style={{
              transform: open ? "rotate(90deg)" : "none",
              transition: "transform .12s",
              color: "var(--sf-text-faint)"
            }}
          />
        ) : (
          <span style={{ width: 10 }} />
        )}
        <Ic size={13} style={{ color: node.type === "dir" ? "inherit" : "var(--sf-text-faint)" }} />
        <span className="sf-grow" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {node.name}
        </span>
      </button>
      {node.type === "dir" && open && node.children && (
        <FileTreeComponent
          nodes={node.children}
          depth={depth + 1}
          openByDefault={openByDefault}
          selected={selected}
          onSelect={onSelect}
        />
      )}
    </>
  );
}

// ---- DB schema mini card ----
function SchemaTable({
  name,
  columns = [],
  accent = "blue",
  x,
  y,
  width = 220,
  isSelected = false,
  isDimmed = false,
  onClick
}: {
  name: string;
  columns?: Array<{ name: string; type: string; pk?: boolean; fk?: boolean }>;
  accent?: string;
  x?: number;
  y?: number;
  width?: number;
  isSelected?: boolean;
  isDimmed?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const positioned = typeof x === "number";
  return (
    <div
      onClick={onClick}
      className="sf-card"
      style={{
        width,
        position: positioned ? "absolute" : "relative",
        left: x,
        top: y,
        background: "var(--sf-surface)",
        border: "1px solid",
        borderColor: isSelected ? "oklch(0.78 0.16 250 / 0.8)" : "var(--sf-border)",
        boxShadow: isSelected 
          ? "0 0 16px oklch(0.78 0.16 250 / 0.35), 0 4px 14px rgba(0,0,0,0.35)"
          : "0 4px 14px rgba(0,0,0,0.35)",
        overflow: "hidden",
        opacity: isDimmed ? 0.35 : 1,
        transition: "opacity 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease",
        cursor: "pointer",
        zIndex: isSelected ? 3 : 2
      }}
    >
      <div
        className="sf-row"
        style={{
          padding: "6px 10px",
          gap: 8,
          borderBottom: "1px solid var(--sf-border)",
          background: "var(--sf-surface-2)",
          alignItems: "center"
        }}
      >
        <span className={`sf-dot sf-dot--${accent}`} />
        <span className="mono" style={{ fontSize: 11.5, color: "var(--sf-text)", fontWeight: 500 }}>
          {name}
        </span>
      </div>
      <div className="sf-col" style={{ gap: 0 }}>
        {columns.map((c, i) => (
          <div
            key={i}
            className="sf-row"
            style={{
              padding: "4px 10px",
              gap: 8,
              fontSize: 11,
              borderBottom: i < columns.length - 1 ? "1px solid rgba(255,255,255,0.03)" : "none",
              alignItems: "center"
            }}
          >
            <span className="mono sf-grow" style={{ color: c.pk ? "var(--sf-text)" : "var(--sf-text-muted)" }}>
              {c.name}
              {c.pk && <span style={{ color: "var(--sf-amber)", marginLeft: 4 }}>★</span>}
              {c.fk && <span style={{ color: "var(--sf-blue)", marginLeft: 4 }}>→</span>}
            </span>
            <span className="mono sf-faint" style={{ fontSize: 10.5, color: "var(--sf-text-faint)" }}>
              {c.type}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ---- HTTP route row ----
const METHOD_COLOR = {
  GET: { bg: "rgba(46,160,255,0.10)", fg: "oklch(0.78 0.14 250)", label: "GET" },
  POST: { bg: "rgba(120,200,120,0.10)", fg: "oklch(0.78 0.16 145)", label: "POST" },
  PUT: { bg: "rgba(255,180,80,0.10)", fg: "oklch(0.80 0.13 75)", label: "PUT" },
  PATCH: { bg: "rgba(180,140,255,0.10)", fg: "oklch(0.76 0.14 290)", label: "PATCH" },
  DELETE: { bg: "rgba(255,90,90,0.10)", fg: "oklch(0.74 0.18 25)", label: "DEL" }
} as const;

function MethodPill({ method }: { method: string }) {
  const c = METHOD_COLOR[method as keyof typeof METHOD_COLOR] || METHOD_COLOR.GET;
  return (
    <span
      className="mono"
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: 38,
        height: 18,
        borderRadius: 4,
        fontSize: 9.5,
        fontWeight: 600,
        letterSpacing: "0.03em",
        background: c.bg,
        color: c.fg
      }}
    >
      {c.label}
    </span>
  );
}

function RouteRow({
  method,
  path,
  auth,
  note,
  name,
  group,
  requestPayload,
  responsePayload,
  validationRules
}: {
  method: string;
  path: string;
  auth?: string | null;
  note?: string;
  name?: string;
  group?: string;
  requestPayload?: string;
  responsePayload?: string;
  validationRules?: string[];
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        borderBottom: "1px solid var(--sf-border)",
        background: expanded ? "var(--sf-surface-2)" : "transparent",
        transition: "background 0.22s ease",
        cursor: "pointer"
      }}
      onClick={() => setExpanded(!expanded)}
    >
      <div
        className="sf-row"
        style={{
          padding: "9px 12px",
          gap: 10,
          alignItems: "center"
        }}
      >
        <MethodPill method={method} />
        <span
          className="mono sf-grow"
          style={{
            fontSize: 12,
            color: "var(--sf-text)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontWeight: expanded ? 500 : 400
          }}
        >
          {path}
        </span>
        {auth && (
          <span className="sf-chip" style={{ height: 18, padding: "0 6px", fontSize: 10 }}>
            <Icons.Lock size={9} style={{ marginRight: 4 }} /> {auth}
          </span>
        )}
      </div>

      {expanded && (
        <div
          style={{
            padding: "0 12px 12px 12px",
            fontSize: 12,
            color: "var(--sf-text-muted)",
            display: "flex",
            flexDirection: "column",
            gap: 10
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {name && (
            <div>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--sf-text-faint)", marginBottom: 2 }}>
                Action Name
              </div>
              <div style={{ color: "var(--sf-text)", fontWeight: 500 }}>{name}</div>
            </div>
          )}

          {note && (
            <div>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--sf-text-faint)", marginBottom: 2 }}>
                Description
              </div>
              <div>{note}</div>
            </div>
          )}

          {validationRules && validationRules.length > 0 && (
            <div>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--sf-text-faint)", marginBottom: 4 }}>
                Validation Rules
              </div>
              <ul style={{ paddingLeft: 16, margin: 0, display: "flex", flexDirection: "column", gap: 3 }}>
                {validationRules.map((rule, idx) => (
                  <li key={idx} style={{ color: "var(--sf-text-muted)" }}>{rule}</li>
                ))}
              </ul>
            </div>
          )}

          {requestPayload && requestPayload !== "None" && (
            <div>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--sf-text-faint)", marginBottom: 4 }}>
                Request Schema
              </div>
              <pre
                className="mono sf-scroll"
                style={{
                  background: "var(--sf-surface)",
                  border: "1px solid var(--sf-border)",
                  borderRadius: 6,
                  padding: 8,
                  fontSize: 11,
                  maxHeight: 150,
                  overflowY: "auto",
                  margin: 0,
                  color: "oklch(0.78 0.16 250)"
                }}
              >
                {requestPayload}
              </pre>
            </div>
          )}

          {responsePayload && (
            <div>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.04em", color: "var(--sf-text-faint)", marginBottom: 4 }}>
                Response Schema
              </div>
              <pre
                className="mono sf-scroll"
                style={{
                  background: "var(--sf-surface)",
                  border: "1px solid var(--sf-border)",
                  borderRadius: 6,
                  padding: 8,
                  fontSize: 11,
                  maxHeight: 150,
                  overflowY: "auto",
                  margin: 0,
                  color: "oklch(0.78 0.16 145)"
                }}
              >
                {responsePayload}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Architecture node (for diagrams) ----
function ArchNode({
  x,
  y,
  w = 160,
  h = 64,
  kind = "service",
  title,
  subtitle,
  accent = "blue",
  icon,
  isSelected = false,
  isDimmed = false,
  onClick
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  kind?: string;
  title: string;
  subtitle?: string;
  accent?: string;
  icon: keyof typeof Icons;
  isSelected?: boolean;
  isDimmed?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const Ic = Icons[icon] || Icons.Server;
  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: w,
        height: h,
        background: "var(--sf-surface)",
        border: "1px solid",
        borderColor: isSelected ? "oklch(0.78 0.16 250 / 0.8)" : "var(--sf-border-strong)",
        borderRadius: 10,
        padding: "8px 10px",
        display: "flex",
        flexDirection: "column",
        gap: 4,
        boxShadow: isSelected 
          ? "0 0 16px oklch(0.78 0.16 250 / 0.35), 0 4px 14px rgba(0,0,0,0.35)"
          : "0 4px 14px rgba(0,0,0,0.35)",
        zIndex: 2,
        opacity: isDimmed ? 0.35 : 1,
        transition: "opacity 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease",
        cursor: "pointer"
      }}
    >
      <div className="sf-row" style={{ gap: 6, alignItems: "center" }}>
        <Ic size={12} className="text-muted" style={{ color: "var(--sf-text-muted)" }} />
        <span className="mono" style={{ fontSize: 10, color: "var(--sf-text-faint)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
          {kind}
        </span>
        <span className="sf-grow" />
        <span className={`sf-dot sf-dot--${accent}`} />
      </div>
      <div style={{ fontSize: 13, fontWeight: 500, lineHeight: 1.2, color: "var(--sf-text)" }}>{title}</div>
      {subtitle && <div className="mono" style={{ fontSize: 10.5, color: "var(--sf-text-muted)" }}>{subtitle}</div>}
    </div>
  );
}

// ---- Connector path between two nodes ----
function ArchEdge({
  from,
  to,
  label,
  dashed = false,
  animated = false,
  isHighlighted = false,
  isDimmed = false
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  label?: string;
  dashed?: boolean;
  animated?: boolean;
  isHighlighted?: boolean;
  isDimmed?: boolean;
}) {
  const midX = (from.x + to.x) / 2;
  const path = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
  const strokeColor = isHighlighted 
    ? "oklch(0.78 0.16 250 / 0.85)" 
    : "rgba(255,255,255,0.18)";
  const strokeWidth = isHighlighted ? 2 : 1;

  return (
    <g style={{ opacity: isDimmed ? 0.25 : 1, transition: "opacity 0.22s ease" }}>
      <path
        d={path}
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={dashed ? "4 4" : "none"}
      />
      {(animated || isHighlighted) && (
        <circle r={isHighlighted ? 3 : 2.5} fill="oklch(0.78 0.16 250)">
          <animateMotion dur={isHighlighted ? "1.6s" : "2.4s"} repeatCount="indefinite" path={path} />
        </circle>
      )}
      {label && (
        <text
          x={midX}
          y={(from.y + to.y) / 2 - 6}
          fill={isHighlighted ? "oklch(0.78 0.16 250 / 0.9)" : "rgba(255,255,255,0.5)"}
          fontSize="9"
          textAnchor="middle"
          style={{ 
            fontFamily: "var(--sf-font-mono)", 
            letterSpacing: "0.03em",
            fontWeight: isHighlighted ? 500 : "normal"
          }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

// Skeletons for Loading & Regeneration States
function SkeletonOverview() {
  return (
    <div style={{ padding: 28, maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 22 }}>
        {/* Summary skeleton */}
        <div className="sf-card" style={{ padding: 22 }}>
          <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, color: "var(--sf-text-faint)" }}>
            Architecture summary
          </div>
          <div className="sf-col" style={{ gap: 8 }}>
            <div className="sf-skel" style={{ width: "100%", height: 14 }} />
            <div className="sf-skel" style={{ width: "95%", height: 14 }} />
            <div className="sf-skel" style={{ width: "70%", height: 14, marginBottom: 18 }} />
          </div>
          <div className="sf-row" style={{ gap: 6, flexWrap: "wrap" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="sf-skel" style={{ width: 80, height: 22, borderRadius: 999 }} />
            ))}
          </div>
        </div>
        {/* Stats skeletons */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="sf-card" style={{ padding: 16 }}>
              <div className="sf-skel" style={{ width: 60, height: 11, marginBottom: 8 }} />
              <div className="sf-skel" style={{ width: 40, height: 28, marginBottom: 6 }} />
              <div className="sf-skel" style={{ width: 70, height: 11 }} />
            </div>
          ))}
        </div>
      </div>

      {/* Modules skeletons */}
      <div className="sf-row" style={{ marginBottom: 12 }}>
        <div className="sf-skel" style={{ width: 120, height: 11 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <div key={i} className="sf-card" style={{ padding: 16, minHeight: 140 }}>
            <div className="sf-row" style={{ marginBottom: 12, alignItems: "center" }}>
              <div className="sf-skel" style={{ width: 30, height: 30, borderRadius: 8 }} />
              <span className="sf-grow" />
              <div className="sf-skel" style={{ width: 60, height: 18, borderRadius: 999 }} />
            </div>
            <div className="sf-skel" style={{ width: "60%", height: 13, marginBottom: 6 }} />
            <div className="sf-skel" style={{ width: "90%", height: 11, marginBottom: 4 }} />
            <div className="sf-skel" style={{ width: "40%", height: 11, marginBottom: 14 }} />
            <div className="sf-row" style={{ gap: 6, alignItems: "center" }}>
              <div className="sf-skel" style={{ width: 50, height: 11 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SkeletonArch() {
  const skelNodes = [
    { x: 100, y: 120, w: 160, h: 64 },
    { x: 340, y: 50, w: 160, h: 64 },
    { x: 340, y: 190, w: 160, h: 64 },
    { x: 580, y: 120, w: 160, h: 64 },
    { x: 820, y: 120, w: 160, h: 64 },
  ];
  return (
    <div style={{ padding: 28, maxWidth: 1280, margin: "0 auto" }}>
      <InteractiveViewport>
        <div style={{ position: "absolute", inset: 0, padding: 24 }}>
          {skelNodes.map((n, i) => (
            <div
              key={i}
              className="sf-card"
              style={{
                position: "absolute",
                left: n.x,
                top: n.y,
                width: n.w,
                height: n.h,
                background: "var(--sf-surface)",
                borderColor: "var(--sf-border-strong)",
                borderRadius: 10,
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                gap: 6,
                opacity: 0.75,
              }}
            >
              <div className="sf-row" style={{ gap: 6, alignItems: "center" }}>
                <div className="sf-skel" style={{ width: 12, height: 12, borderRadius: 2 }} />
                <div className="sf-skel" style={{ width: 50, height: 9 }} />
                <span className="sf-grow" />
                <div className="sf-skel" style={{ width: 6, height: 6, borderRadius: 999 }} />
              </div>
              <div className="sf-skel" style={{ width: "80%", height: 13, marginTop: 2 }} />
              <div className="sf-skel" style={{ width: "50%", height: 9 }} />
            </div>
          ))}
          <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} width="1200" height="320">
            {[
              [skelNodes[0], skelNodes[1]],
              [skelNodes[0], skelNodes[2]],
              [skelNodes[1], skelNodes[3]],
              [skelNodes[2], skelNodes[3]],
              [skelNodes[3], skelNodes[4]],
            ].map((edge, i) => {
              const from = { x: edge[0].x + 160, y: edge[0].y + 32 };
              const to = { x: edge[1].x, y: edge[1].y + 32 };
              const midX = (from.x + to.x) / 2;
              const path = `M ${from.x} ${from.y} C ${midX} ${from.y}, ${midX} ${to.y}, ${to.x} ${to.y}`;
              return (
                <g key={i} style={{ opacity: 0.25 }}>
                  <path d={path} stroke="rgba(255,255,255,0.12)" strokeWidth="1" fill="none" />
                  <circle r="2.5" fill="var(--sf-text-muted)">
                    <animateMotion dur="2.8s" repeatCount="indefinite" path={path} />
                  </circle>
                </g>
              );
            })}
          </svg>
        </div>
      </InteractiveViewport>
    </div>
  );
}

function SkeletonSchema() {
  const skelTables = [
    { name: "users", x: 60, y: 40 },
    { name: "sessions", x: 60, y: 190 },
    { name: "projects", x: 320, y: 80 },
  ];
  return (
    <div style={{ padding: 28, maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16 }}>
      <div>
        <div className="sf-row" style={{ marginBottom: 10, alignItems: "center" }}>
          <div className="sf-skel" style={{ width: 140, height: 16 }} />
          <span className="sf-grow" />
          <div className="sf-skel" style={{ width: 100, height: 18, borderRadius: 999 }} />
        </div>
        <InteractiveViewport>
          <div style={{ position: "absolute", inset: 0, padding: 24 }}>
            {skelTables.map((t, i) => (
              <div
                key={i}
                className="sf-card"
                style={{
                  width: 220,
                  position: "absolute",
                  left: t.x,
                  top: t.y,
                  background: "var(--sf-surface)",
                  border: "1px solid var(--sf-border)",
                  borderRadius: 12,
                  overflow: "hidden",
                  opacity: 0.75,
                }}
              >
                <div className="sf-row" style={{ padding: "6px 10px", gap: 8, borderBottom: "1px solid var(--sf-border)", background: "var(--sf-surface-2)" }}>
                  <div className="sf-skel" style={{ width: 6, height: 6, borderRadius: 999 }} />
                  <div className="sf-skel" style={{ width: 80, height: 11 }} />
                </div>
                <div className="sf-col" style={{ gap: 8, padding: 10 }}>
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="sf-row" style={{ gap: 8 }}>
                      <div className="sf-skel" style={{ width: 60, height: 10 }} />
                      <span className="sf-grow" />
                      <div className="sf-skel" style={{ width: 40, height: 10 }} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </InteractiveViewport>
      </div>
      <div>
        <div className="sf-skel" style={{ width: 100, height: 16, marginBottom: 10 }} />
        <div className="sf-code" style={{ height: 520, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
          <div className="sf-skel" style={{ width: "90%", height: 12 }} />
          <div className="sf-skel" style={{ width: "80%", height: 12 }} />
          <div className="sf-skel" style={{ width: "70%", height: 12 }} />
          <div className="sf-skel" style={{ width: "85%", height: 12 }} />
          <div className="sf-skel" style={{ width: "60%", height: 12 }} />
        </div>
      </div>
    </div>
  );
}

function SkeletonRoutes() {
  return (
    <div style={{ height: "calc(100vh - 150px)", display: "flex" }}>
      {/* File tree skeleton */}
      <div style={{ width: 280, flex: "0 0 auto", borderRight: "1px solid var(--sf-border)", padding: 12, background: "var(--sf-bg-2)" }}>
        <div className="sf-skel" style={{ width: 80, height: 12, marginBottom: 16 }} />
        <div className="sf-col" style={{ gap: 10 }}>
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="sf-row" style={{ gap: 8, paddingLeft: (i % 3) * 12 }}>
              <div className="sf-skel" style={{ width: 12, height: 12 }} />
              <div className="sf-skel" style={{ width: 100, height: 11 }} />
            </div>
          ))}
        </div>
      </div>
      {/* Center code skeleton */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div className="sf-row" style={{ padding: "8px 14px", borderBottom: "1px solid var(--sf-border)", gap: 8, background: "var(--sf-bg-2)" }}>
          <div className="sf-skel" style={{ width: 80, height: 16, borderRadius: 6 }} />
          <div className="sf-skel" style={{ width: 80, height: 16, borderRadius: 6 }} />
          <span className="sf-grow" />
          <div className="sf-skel" style={{ width: 140, height: 11 }} />
        </div>
        <div style={{ flex: 1, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
            <div key={i} className="sf-row" style={{ gap: 12 }}>
              <div className="sf-skel" style={{ width: 20, height: 10 }} />
              <div className="sf-skel" style={{ width: `${Math.floor(Math.random() * 50) + 30}%`, height: 10 }} />
            </div>
          ))}
        </div>
      </div>
      {/* Right routes surface skeleton */}
      <div style={{ width: 340, flex: "0 0 auto", borderLeft: "1px solid var(--sf-border)", padding: 12, background: "var(--sf-bg-2)" }}>
        <div className="sf-skel" style={{ width: 100, height: 12, marginBottom: 16 }} />
        <div className="sf-col" style={{ gap: 12 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="sf-row" style={{ gap: 8, padding: "8px 0", borderBottom: "1px solid var(--sf-border)" }}>
              <div className="sf-skel" style={{ width: 36, height: 16, borderRadius: 4 }} />
              <div className="sf-skel" style={{ width: 140, height: 12 }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonAuth() {
  return (
    <div style={{ padding: 28, maxWidth: 1280, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <div className="sf-card" style={{ padding: 22 }}>
        <div className="sf-skel" style={{ width: 16, height: 16 }} />
        <div className="sf-skel" style={{ width: 120, height: 16, marginTop: 12 }} />
        <div className="sf-skel" style={{ width: "90%", height: 12, marginTop: 6 }} />
        <div className="sf-col" style={{ marginTop: 16, gap: 12 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="sf-row" style={{ gap: 8, padding: "8px 0", borderBottom: "1px dashed var(--sf-border)" }}>
              <div className="sf-skel" style={{ width: 80, height: 11 }} />
              <span className="sf-grow" />
              <div className="sf-skel" style={{ width: 120, height: 11 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="sf-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="sf-row" style={{ padding: "14px 18px", borderBottom: "1px solid var(--sf-border)" }}>
          <div className="sf-skel" style={{ width: 100, height: 16 }} />
        </div>
        <div className="sf-col" style={{ padding: 22, gap: 16 }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="sf-row" style={{ gap: 12 }}>
              <div className="sf-skel" style={{ width: 24, height: 24, borderRadius: 999 }} />
              <div className="sf-grow sf-col" style={{ gap: 6 }}>
                <div className="sf-skel" style={{ width: 150, height: 12 }} />
                <div className="sf-skel" style={{ width: 250, height: 10 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TABS = [
  { id: "overview", label: "Overview", icon: "Compass" as const },
  { id: "arch", label: "Architecture", icon: "Layers" as const },
  { id: "schema", label: "Schema", icon: "Database" as const },
  { id: "routes", label: "API", icon: "Code" as const },
  { id: "auth", label: "Auth", icon: "Lock" as const },
  { id: "env", label: "Env", icon: "Key" as const },
  { id: "deploy", label: "Deploy", icon: "Rocket" as const }
];

export function GenerationPage() {
  const [tab, setTab] = useState<string>("overview");
  const params = useParams();
  const projectId = typeof params?.id === "string" ? params.id : "";
  
  const { data: project, isLoading, error: fetchError } = useProject(projectId);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const isDemo = projectId === "demo";

  const fallbackProject = {
    id: "demo",
    name: "Examly API",
    prompt: heroPrompt,
    stack: "Hono · PG · Redis",
    updated: "12m ago",
    status: "deployed" as const,
    health: 99.9,
    dot: "green" as const,
  };

  const activeProject = isDemo ? fallbackProject : project;

  const [isRegenerating, setIsRegenerating] = useState(false);
  const [regenStage, setRegenStage] = useState<string>("");
  const [regenMessage, setRegenMessage] = useState<string>("");
  const [elapsedTime, setElapsedTime] = useState<number>(0);

  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStage, setExportStage] = useState("");
  const [exportComplete, setExportComplete] = useState(false);

  const [githubDialogOpen, setGithubDialogOpen] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [branchName, setBranchName] = useState("main");
  const [pushProgress, setPushProgress] = useState(0);
  const [pushStage, setPushStage] = useState("");
  const [pushComplete, setPushComplete] = useState(false);
  const [pushedRepoUrl, setPushedRepoUrl] = useState("");
  const [isPushing, setIsPushing] = useState(false);
  const [githubPat, setGithubPat] = useState("");
  const [savePat, setSavePat] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRegenerating) {
      setElapsedTime(0);
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRegenerating]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPat = localStorage.getItem("simplicit_github_pat");
      if (savedPat) {
        setGithubPat(savedPat);
      }
    }
  }, []);

  // Objective 7: Production Route Contract
  if (!activeProject && !isLoading && !isDemo) {
    return (
      <div className="sf-app sf-col sf-center" style={{ height: '100vh', gap: 20 }}>
         <Icons.X size={48} className="sf-red" />
         <div className="sf-col sf-center" style={{ gap: 8 }}>
            <h1 className="sf-h2">Project not found</h1>
            <p className="sf-muted">The project ID &quot;{projectId}&quot; does not exist or access was denied.</p>
         </div>
         <button onClick={() => window.location.href = '/dashboard'} className="sf-btn sf-btn--primary">Back to dashboard</button>
      </div>
    );
  }

  if (isLoading && !isDemo) {
    return (
      <div className="sf-app" style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: "var(--sf-bg)" }}>
        <AppTopbar breadcrumbs={["Projects", "Loading..."]} />
        <SkeletonOverview />
      </div>
    );
  }

  if (!activeProject) return null;

  const handleRegenerate = async () => {
    if (isRegenerating) return;
    setIsRegenerating(true);
    setRegenStage("analyzing");
    setRegenMessage("Analyzing system requirements...");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          projectId: activeProject.id,
          prompt: activeProject.prompt,
          stack: activeProject.stack,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start generation");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error("No readable stream");
      }

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const update = JSON.parse(line.slice(6));
              setRegenStage(update.stage);
              setRegenMessage(update.message);
              if (update.stage === "done") {
                toast("Generation completed successfully!", "success");
                queryClient.invalidateQueries({ queryKey: ["project", activeProject.id] });
              } else if (update.stage === "error") {
                toast(`Generation failed: ${update.error || update.message}`, "error");
              }
            } catch (err) {
              console.error("Failed to parse event stream line", err);
            }
          }
        }
      }
    } catch (err: any) {
      toast(err.message || "An unexpected error occurred during generation.", "error");
    } finally {
      setIsRegenerating(false);
    }
  };

  const slugify = (text: string) =>
    text
      .toString()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^\w\-]+/g, "")
      .replace(/\-\-+/g, "-")
      .replace(/^-+/, "")
      .replace(/-+$/, "");

  const handleExportZip = async () => {
    setExportDialogOpen(true);
    setExportComplete(false);
    setExportProgress(5);
    setExportStage("Initializing codebase exporter...");

    await new Promise((resolve) => setTimeout(resolve, 600));
    setExportProgress(25);
    setExportStage("Validating codebase structure...");

    await new Promise((resolve) => setTimeout(resolve, 800));
    setExportProgress(55);
    setExportStage("Compiling database schema and API definitions...");

    const fileMap = generateProjectFiles(activeProject as any);

    await new Promise((resolve) => setTimeout(resolve, 700));
    setExportProgress(80);
    setExportStage("Writing README documentation and environment templates...");

    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    // Add files to zip
    Object.entries(fileMap).forEach(([filePath, content]) => {
      zip.file(filePath, content);
    });

    await new Promise((resolve) => setTimeout(resolve, 600));
    setExportProgress(95);
    setExportStage("Assembling ZIP archive...");

    const blob = await zip.generateAsync({ type: "blob" });

    // Download zip file in browser
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${slugify(activeProject.name || "simplicit-backend")}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportProgress(100);
    setExportStage("Export completed successfully!");
    setExportComplete(true);
    toast("Project exported as ZIP successfully!", "success");
  };

  const handlePushToGitHub = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoName || !githubPat) {
      toast("Please provide both a repository name and a Personal Access Token.", "error");
      return;
    }

    setIsPushing(true);
    setPushComplete(false);
    setPushProgress(5);
    setPushStage("Verifying GitHub Personal Access Token...");

    try {
      // 1. Verify PAT
      const userRes = await fetch("https://api.github.com/user", {
        headers: {
          Authorization: `token ${githubPat}`,
          Accept: "application/vnd.github.v3+json",
        },
      });

      if (!userRes.ok) {
        throw new Error("Invalid GitHub Personal Access Token. Please verify permissions (repo, write).");
      }

      const userData = await userRes.json();
      const username = userData.login;

      if (savePat) {
        localStorage.setItem("simplicit_github_pat", githubPat);
      } else {
        localStorage.removeItem("simplicit_github_pat");
      }

      setPushProgress(15);
      setPushStage(`Authenticated as @${username}. Preparing repository...`);
      await new Promise((resolve) => setTimeout(resolve, 600));

      let owner = username;
      let name = repoName;
      if (repoName.includes("/")) {
        const parts = repoName.split("/");
        owner = parts[0].trim();
        name = parts[1].trim();
      }

      // 2. Create Repository (if owner equals authenticated user, create personal; otherwise attempt org)
      setPushProgress(25);
      setPushStage(`Creating repository "${owner}/${name}" on GitHub...`);

      try {
        const createUrl = owner === username
          ? "https://api.github.com/user/repos"
          : `https://api.github.com/orgs/${owner}/repos`;

        const createRes = await fetch(createUrl, {
          method: "POST",
          headers: {
            Authorization: `token ${githubPat}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description: `Generated backend codebase via Simplicit AI. Built with ${activeProject.stack}.`,
            private: false,
            auto_init: false,
          }),
        });

        if (createRes.ok) {
          setPushProgress(40);
          setPushStage("Repository created successfully! Preparing file commit...");
          await new Promise((resolve) => setTimeout(resolve, 600));
        } else {
          const errData = await createRes.json().catch(() => ({}));
          // If 422 because repo already exists, we print a warning and continue
          if (createRes.status === 422 && errData.errors?.some((err: any) => err.message?.includes("already exists"))) {
            setPushProgress(40);
            setPushStage("Repository already exists. Preparing file commits...");
            await new Promise((resolve) => setTimeout(resolve, 800));
          } else {
            throw new Error(`Failed to create repository: ${errData.message || createRes.statusText}`);
          }
        }
      } catch (err: any) {
        console.error("Repository creation step details:", err);
        throw err;
      }

      // 3. Sequentially upload files
      const fileMap = generateProjectFiles(activeProject as any);
      const files = Object.entries(fileMap);

      if (files.length === 0) {
        throw new Error("No files were generated for this project stack.");
      }

      let count = 0;
      for (const [path, content] of files) {
        count++;
        const percent = Math.round((count / files.length) * 100);
        setPushProgress(40 + Math.round(percent * 0.55)); // spans 40% to 95%
        setPushStage(`Pushing file ${count}/${files.length}: ${path}...`);

        const base64Content = btoa(unescape(encodeURIComponent(content)));
        const uploadUrl = `https://api.github.com/repos/${owner}/${name}/contents/${path}`;

        // Get file SHA if it exists (allows updating existing repositories)
        let sha: string | undefined;
        try {
          const checkRes = await fetch(uploadUrl, {
            headers: {
              Authorization: `token ${githubPat}`,
              Accept: "application/vnd.github.v3+json",
            },
          });
          if (checkRes.ok) {
            const fileInfo = await checkRes.json();
            sha = fileInfo.sha;
          }
        } catch (e) {
          console.warn("Could not check SHA for path", path, e);
        }

        const putRes = await fetch(uploadUrl, {
          method: "PUT",
          headers: {
            Authorization: `token ${githubPat}`,
            Accept: "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `feat: generate initial ${activeProject.stack} foundations`,
            content: base64Content,
            branch: branchName,
            ...(sha && { sha }),
          }),
        });

        if (!putRes.ok) {
          const errBody = await putRes.json().catch(() => ({}));
          throw new Error(`Failed to upload ${path}: ${errBody.message || putRes.statusText}`);
        }
      }

      setPushProgress(100);
      setPushStage("Codebase push and sync complete!");
      setPushedRepoUrl(`https://github.com/${owner}/${name}`);
      setPushComplete(true);
      toast("Project pushed to GitHub successfully!", "success");
    } catch (err: any) {
      console.error("GitHub integration error:", err);
      setPushStage(`Error: ${err.message}`);
      toast(`GitHub Push Failed: ${err.message}`, "error");
    } finally {
      setIsPushing(false);
    }
  };

  const isPending = isLoading || isRegenerating;

  return (
    <div className="sf-app" style={{ width: "100%", height: "100vh", display: "flex", flexDirection: "column", background: "var(--sf-bg)" }}>
      <AppTopbar
        breadcrumbs={["Acme Studio", "Projects", activeProject.name, "Generation #042"]}
        actions={
          <div className="sf-row" style={{ gap: 8 }}>
            <button 
              className="sf-btn sf-btn--sm"
              onClick={handleRegenerate}
              disabled={isPending}
            >
              {isRegenerating ? (
                <Icons.Spinner size={11} style={{ animation: "spin 1s linear infinite" }} />
              ) : (
                <Icons.Refresh size={11} />
              )}
              {isRegenerating ? "Regenerating..." : "Regenerate"}
            </button>
            <button 
              className="sf-btn sf-btn--sm"
              onClick={() => {
                setRepoName(slugify(`acme-studio/${activeProject.name}`));
                setBranchName("main");
                setGithubDialogOpen(true);
              }}
              disabled={isPending}
            >
              <Icons.Github size={11} /> Push to GitHub
            </button>
            <button 
              className="sf-btn sf-btn--primary sf-btn--sm"
              onClick={handleExportZip}
              disabled={isPending}
            >
              <Icons.Download size={11} /> Export
            </button>
          </div>
        }
      />

      {/* Page header */}
      <div style={{ padding: "20px 28px 0", borderBottom: "1px solid var(--sf-border)", background: "var(--sf-bg)" }}>
        <div className="sf-row" style={{ marginBottom: 14, alignItems: "center" }}>
          <div>
            <div className="sf-row" style={{ gap: 8, marginBottom: 4, alignItems: "center" }}>
              <h1 style={{ fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", margin: 0, color: "var(--sf-text)" }}>
                {activeProject.name}
              </h1>
              <span className="sf-chip">
                <span className={`sf-dot sf-dot--${activeProject.dot}`} style={{ marginRight: 6 }} /> Generated · 6.4s
              </span>
              <span className="sf-chip sf-chip-mono">v1 · 042</span>
            </div>
            <p className="sf-muted" style={{ fontSize: 13, margin: 0, maxWidth: 760, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "var(--sf-text-muted)" }}>
              &quot;{activeProject.prompt}&quot;
            </p>
          </div>
          <span className="sf-grow" />
          <div className="sf-row" style={{ gap: 16, fontSize: 12, color: "var(--sf-text-muted)" }}>
            <span>
              <span className="sf-faint">Stack</span> · <span className="mono">{activeProject.stack}</span>
            </span>
            <span>
              <span className="sf-faint">By</span> · Alex Chen
            </span>
            <span>
              <span className="sf-faint">Updated</span> · {activeProject.updated}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="sf-row" style={{ gap: 2 }}>
          {TABS.map((t) => {
            const Ic = Icons[t.icon];
            const active = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className="sf-row"
                style={{
                  gap: 7,
                  padding: "10px 14px",
                  background: "transparent",
                  border: "none",
                  fontFamily: "inherit",
                  fontSize: 13,
                  color: active ? "var(--sf-text)" : "var(--sf-text-muted)",
                  cursor: "pointer",
                  position: "relative",
                  alignItems: "center"
                }}
                type="button"
              >
                <Ic size={12.5} /> {t.label}
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      left: 12,
                      right: 12,
                      bottom: -1,
                      height: 1.5,
                      background: "var(--sf-text)",
                      borderRadius: 1
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Progress banner during regeneration */}
      {isRegenerating && (
        <div style={{ padding: "16px 28px", background: "var(--sf-surface-2)", borderBottom: "1px solid var(--sf-border)" }}>
          <div className="sf-row" style={{ gap: 12, marginBottom: 8, alignItems: "center" }}>
            <span className="sf-chip" style={{ height: 24, padding: "0 10px" }}>
              <span className="sf-dot sf-dot--blue sf-pulse" /> Architecting · {elapsedTime}s elapsed
            </span>
            <span className="sf-chip sf-chip-mono">claude-architect</span>
            <span className="sf-grow" style={{ fontSize: 13, color: "var(--sf-text)" }}>
              {regenMessage}
            </span>
            <span className="mono sf-faint" style={{ fontSize: 11, color: "var(--sf-text-faint)" }}>
              Stage: {regenStage}
            </span>
          </div>
          <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                width: `${
                  regenStage === "analyzing" ? 10 :
                  regenStage === "architecture" ? 35 :
                  regenStage === "schema" ? 60 :
                  regenStage === "routes" ? 80 :
                  regenStage === "files" ? 95 : 100
                }%`,
                height: "100%",
                background: "var(--sf-blue)",
                borderRadius: 999,
                transition: "width .4s cubic-bezier(.2,.7,.3,1)",
              }}
            />
          </div>
        </div>
      )}

      {/* Body */}
      <main className="sf-grow sf-scroll" style={{ overflowY: "auto", minHeight: 0 }}>
        {tab === "overview" && <OverviewTab project={activeProject} isLoading={isPending} />}
        {tab === "arch" && <ArchTab project={activeProject} isLoading={isPending} />}
        {tab === "schema" && <SchemaTabContent project={activeProject} isLoading={isPending} />}
        {tab === "routes" && <RoutesTabContent project={activeProject} isLoading={isPending} />}
        {tab === "auth" && <AuthTabContent project={activeProject} isLoading={isPending} />}
        {tab === "env" && <EnvTabContent project={activeProject} />}
        {tab === "deploy" && <DeployHint />}
      </main>

      {/* ZIP EXPORT DIALOG */}
      <Dialog
        open={exportDialogOpen}
        onClose={() => {
          if (!exportComplete && exportProgress > 0) return;
          setExportDialogOpen(false);
          setExportComplete(false);
        }}
        title="Export Codebase"
        description="Download your backend foundation files in a ZIP archive."
      >
        <div className="sf-col" style={{ gap: 16 }}>
          <div className="sf-row" style={{ gap: 12, alignItems: "center" }}>
            {exportComplete ? (
              <div style={{ width: 28, height: 28, borderRadius: 999, background: "rgba(120,200,120,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sf-green)" }}>
                <Check size={16} />
              </div>
            ) : (
              <Icons.Spinner size={16} style={{ animation: "spin 1s linear infinite", color: "var(--sf-blue)" }} />
            )}
            <span style={{ fontSize: 13, color: "var(--sf-text)" }}>{exportStage}</span>
          </div>

          <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
            <div
              style={{
                width: `${exportProgress}%`,
                height: "100%",
                background: exportComplete ? "var(--sf-green)" : "var(--sf-blue)",
                borderRadius: 999,
                transition: "width .3s ease-in-out",
              }}
            />
          </div>

          {exportComplete && (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button onClick={handleExportZip} className="sf-btn sf-btn--sm">
                Download Again
              </button>
              <button onClick={() => setExportDialogOpen(false)} className="sf-btn sf-btn--primary sf-btn--sm">
                Close
              </button>
            </div>
          )}
        </div>
      </Dialog>

      {/* GITHUB PUSH DIALOG */}
      <Dialog
        open={githubDialogOpen}
        onClose={() => {
          if (isPushing) return;
          setGithubDialogOpen(false);
          setPushComplete(false);
        }}
        title="Push to GitHub"
        description="Deploy this generation to a GitHub repository."
      >
        {!isPushing && !pushComplete ? (
          <form onSubmit={handlePushToGitHub} className="sf-col" style={{ gap: 16 }}>
            <div className="sf-col" style={{ gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--sf-text-muted)" }}>GitHub Personal Access Token (PAT)</label>
              <input
                type="password"
                className="sf-input"
                placeholder="ghp_..."
                value={githubPat}
                onChange={(e) => setGithubPat(e.target.value)}
                required
              />
              <span className="sf-faint" style={{ fontSize: 10.5 }}>
                Requires <code>repo</code> permissions. Token is stored only in your local browser storage.
              </span>
            </div>

            <div className="sf-col" style={{ gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--sf-text-muted)" }}>Repository Path</label>
              <input
                type="text"
                className="sf-input"
                placeholder="e.g. acme-studio/examly-api"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="sf-col" style={{ gap: 6 }}>
              <label style={{ fontSize: 12, color: "var(--sf-text-muted)" }}>Default Branch</label>
              <input
                type="text"
                className="sf-input"
                placeholder="main"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                required
              />
            </div>

            <label
              className="sf-row"
              style={{ gap: 8, fontSize: 12, color: "var(--sf-text-muted)", cursor: "pointer", alignItems: "center" }}
              onClick={() => setSavePat(!savePat)}
            >
              <span style={{
                width: 14,
                height: 14,
                borderRadius: 3,
                background: savePat ? "var(--sf-text)" : "transparent",
                border: savePat ? "none" : "1px solid var(--sf-border-strong)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--sf-bg)",
                transition: "background .15s, border-color .15s",
              }}>
                {savePat && <Icons.Check size={10} />}
              </span>
              Remember GitHub PAT in this browser
            </label>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 8 }}>
              <button type="button" onClick={() => setGithubDialogOpen(false)} className="sf-btn sf-btn--ghost sf-btn--sm">
                Cancel
              </button>
              <button type="submit" className="sf-btn sf-btn--primary sf-btn--sm">
                Push Code
              </button>
            </div>
          </form>
        ) : (
          <div className="sf-col" style={{ gap: 16 }}>
            <div className="sf-row" style={{ gap: 12, alignItems: "center" }}>
              {pushComplete ? (
                <div style={{ width: 28, height: 28, borderRadius: 999, background: "rgba(120,200,120,0.15)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--sf-green)" }}>
                  <Check size={16} />
                </div>
              ) : (
                <Icons.Spinner size={16} style={{ animation: "spin 1s linear infinite", color: "var(--sf-blue)" }} />
              )}
              <span style={{ fontSize: 13, color: "var(--sf-text)" }}>{pushStage}</span>
            </div>

            <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
              <div
                style={{
                  width: `${pushProgress}%`,
                  height: "100%",
                  background: pushComplete ? "var(--sf-green)" : "var(--sf-blue)",
                  borderRadius: 999,
                  transition: "width .3s ease-in-out",
                }}
              />
            </div>

            {pushComplete && (
              <div className="sf-col" style={{ gap: 12, marginTop: 8 }}>
                <div className="sf-row" style={{ gap: 8, padding: 12, background: "var(--sf-surface)", border: "1px solid var(--sf-border)", borderRadius: 8, alignItems: "center" }}>
                  <Icons.Github size={14} style={{ color: "var(--sf-text-muted)" }} />
                  <a href={pushedRepoUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: 13, color: "var(--sf-blue)", textDecoration: "underline" }}>
                    {repoName}
                  </a>
                  <span className="sf-grow" />
                  <span className="sf-chip sf-chip-mono">Branch: {branchName}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button onClick={() => setGithubDialogOpen(false)} className="sf-btn sf-btn--primary sf-btn--sm">
                    Done
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Dialog>
    </div>
  );
}

function OverviewTab({ project, isLoading }: { project?: any, isLoading?: boolean }) {
  if (isLoading) return <SkeletonOverview />;

  const metadata = project?.generation_metadata;
  const currentStackSummary = metadata?.stackSummary || {};
  const currentModules = metadata?.modules || [];
  
  const framework = currentStackSummary.framework || "Hono";
  const database = currentStackSummary.database || "PostgreSQL";
  const cache = currentStackSummary.cache || "Redis";
  const auth = currentStackSummary.auth || "Lucia";
  const payments = currentStackSummary.payments || "Stripe";

  const currentSummaryText = metadata?.architectureSummary || 
    `A modular monolith on ${framework}, fronted by a thin edge layer. ${database} is the primary store; ${cache} handles sessions and rate limits. Background work runs in BullMQ workers. Payments use ${payments} Checkout with signed webhooks. Auth is session-based via ${auth}, with role-gated middleware on every route.`;

  return (
    <div style={{ padding: 28, maxWidth: 1280, margin: "0 auto" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 22 }}>
        {/* Summary */}
        <div className="sf-card" style={{ padding: 22 }}>
          <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 10, color: "var(--sf-text-faint)" }}>
            Architecture summary
          </div>
          <p style={{ fontSize: 14.5, lineHeight: 1.55, margin: 0, color: "var(--sf-text)" }}>
            {currentSummaryText}
          </p>
          <div className="sf-row" style={{ gap: 6, marginTop: 18, flexWrap: "wrap" }}>
            {Object.entries(currentStackSummary).map(([k, v]) => (
              <span key={k} className="sf-chip sf-chip-mono">
                {k}: {v as string}
              </span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[
            { l: "Modules", v: String(currentModules.length), d: `+${currentModules.length}` },
            { l: "Tables", v: String(metadata?.schemaTables?.length || 0), d: `${metadata?.schemaTables?.length || 0} new` },
            { l: "Routes", v: String(metadata?.apiRoutes?.length || 0), d: `${metadata?.apiRoutes?.length || 0} new` },
            { l: "Files", v: String(metadata?.fileTree ? 124 : 0), d: `${metadata?.fileTree ? 124 : 0} · 3.4 MB` }
          ].map((s) => (
            <div key={s.l} className="sf-card" style={{ padding: 16 }}>
              <div className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8, color: "var(--sf-text-faint)" }}>
                {s.l}
              </div>
              <div style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--sf-text)" }}>{s.v}</div>
              <div className="sf-faint" style={{ fontSize: 11.5, marginTop: 4, color: "var(--sf-text-faint)" }}>
                {s.d}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modules grid */}
      <div className="sf-row" style={{ marginBottom: 12, alignItems: "center" }}>
        <span className="mono" style={{ fontSize: 11, color: "var(--sf-text-faint)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          Generated modules
        </span>
        <span className="sf-grow" />
        <button className="sf-btn sf-btn--ghost sf-btn--sm" type="button">
          Reorder
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {currentModules.map((m: any) => {
          const Ic = Icons[m.icon as keyof typeof Icons] || Icons.Server;
          return (
            <div key={m.id} className="sf-card" style={{ padding: 16, minHeight: 140 }}>
              <div className="sf-row" style={{ marginBottom: 12, alignItems: "center" }}>
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    background: "var(--sf-surface-2)",
                    border: "1px solid var(--sf-border)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  <Ic size={13} style={{ color: "var(--sf-text)" }} />
                </div>
                <span className="sf-grow" />
                <span className="sf-chip">
                  <span className={`sf-dot sf-dot--${m.status === "optional" ? "amber" : "green"}`} style={{ marginRight: 6 }} /> {m.status}
                </span>
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4, color: "var(--sf-text)" }}>{m.name}</div>
              <p className="sf-muted" style={{ fontSize: 12, lineHeight: 1.45, margin: 0, color: "var(--sf-text-muted)" }}>
                {m.desc}
              </p>
              <div className="sf-row" style={{ marginTop: 12, alignItems: "center" }}>
                <span className="mono sf-faint" style={{ fontSize: 11, color: "var(--sf-text-faint)" }}>
                  {m.files} files
                </span>
                <span className="sf-grow" />
                <Icons.ArrowR size={12} style={{ color: "var(--sf-text-faint)" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Next steps */}
      <div className="sf-card-elev" style={{ marginTop: 24, padding: 22 }}>
        <div className="sf-row" style={{ marginBottom: 14, alignItems: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 500, color: "var(--sf-text)", margin: 0 }} className="sf-grow">Next steps</h2>
          <span className="sf-chip">
            <span className="sf-dot sf-dot--blue" style={{ animation: "pulse 2s infinite", marginRight: 6 }} /> 3 suggestions
          </span>
        </div>
        <div className="sf-col" style={{ gap: 6 }}>
          {[
            { ic: "Github" as const, t: "Push this to a new GitHub repository", k: "⌘⇧G" },
            { ic: "Rocket" as const, t: "Deploy to Railway with one click", k: "⌘⇧D" },
            { ic: "Database" as const, t: "Provision a Postgres on Neon", k: "⌘⇧N" }
          ].map((s, i) => {
            const Ic = Icons[s.ic];
            return (
              <div
                key={i}
                className="sf-row"
                style={{ padding: "10px 12px", borderRadius: 8, gap: 12, background: "var(--sf-bg)", alignItems: "center" }}
              >
                <Ic size={14} style={{ color: "var(--sf-text-muted)" }} />
                <span className="sf-grow" style={{ fontSize: 13, color: "var(--sf-text)" }}>
                  {s.t}
                </span>
                <span className="sf-kbd" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--sf-border)", padding: "2px 6px", borderRadius: 4, fontFamily: "var(--sf-font-mono)", fontSize: 10 }}>{s.k}</span>
                <button className="sf-btn sf-btn--sm" type="button">Run</button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ArchTab({ project, isLoading }: { project?: any, isLoading?: boolean }) {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const metadata = project?.generation_metadata;
  const currentNodes = metadata?.architectureNodes || [];
  const currentEdges = metadata?.architectureEdges || [];

  const nodeById = useMemo(
    () => Object.fromEntries(currentNodes.map((n: any) => [n.id, n])),
    [currentNodes]
  );

  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const ids = new Set<string>([selectedNodeId]);
    for (const [f, t] of currentEdges) {
      if (f === selectedNodeId) ids.add(t);
      if (t === selectedNodeId) ids.add(f);
    }
    return ids;
  }, [selectedNodeId, currentEdges]);

  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNodeId((current) => (current === nodeId ? null : nodeId));
  };

  const handleCanvasClick = () => {
    setSelectedNodeId(null);
  };

  if (isLoading) return <SkeletonArch />;

  return (
    <div style={{ padding: 28, maxWidth: 1280, margin: "0 auto" }} onClick={handleCanvasClick}>
      <InteractiveViewport>
        <div style={{ position: "absolute", inset: 0, padding: 24 }}>
          {currentNodes.map((n: any) => {
            const isSelected = selectedNodeId === n.id;
            const isDimmed = !!selectedNodeId && !connectedNodeIds.has(n.id);
            return (
              <ArchNode
                key={n.id}
                x={n.x}
                y={n.y}
                kind={n.kind}
                title={n.title}
                subtitle={n.subtitle}
                accent={n.accent}
                icon={n.icon as keyof typeof Icons}
                isSelected={isSelected}
                isDimmed={isDimmed}
                onClick={(e) => handleNodeClick(n.id, e)}
              />
            );
          })}
          <svg style={{ position: "absolute", inset: 0, pointerEvents: "none" }} width="1200" height="320">
            {currentEdges.map(([f, t, l]: [string, string, string], i: number) => {
              const fromNode = nodeById[f];
              const toNode = nodeById[t];
              if (!fromNode || !toNode) return null;
              const from = { x: fromNode.x + 160, y: fromNode.y + 32 };
              const to = { x: toNode.x, y: toNode.y + 32 };

              const isEdgeHighlighted = selectedNodeId === f || selectedNodeId === t;
              const isEdgeDimmed = !!selectedNodeId && !isEdgeHighlighted;

              return (
                <ArchEdge
                  key={i}
                  from={from}
                  to={to}
                  label={l}
                  animated={i % 4 === 0 || isEdgeHighlighted}
                  isHighlighted={isEdgeHighlighted}
                  isDimmed={isEdgeDimmed}
                />
              );
            })}
          </svg>
        </div>
      </InteractiveViewport>
    </div>
  );
}

function SchemaDetailsPanel({
  normalizedSchema,
  selectedTable,
  tables
}: {
  normalizedSchema: any;
  selectedTable: string | null;
  tables: any[];
}) {
  if (!normalizedSchema) {
    return (
      <div
        className="sf-card"
        style={{
          height: 520,
          background: "var(--sf-surface)",
          border: "1px solid var(--sf-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--sf-text-muted)",
          fontSize: 13
        }}
      >
        No schema metadata available.
      </div>
    );
  }

  if (selectedTable) {
    const tableData = normalizedSchema.tables.find((t: any) => t.name === selectedTable);
    const tableRelationships = (normalizedSchema.relationships || []).filter(
      (r: any) => r.fromTable === selectedTable || r.toTable === selectedTable
    );

    return (
      <div
        className="sf-scroll sf-card"
        style={{
          height: 520,
          background: "var(--sf-surface)",
          border: "1px solid var(--sf-border)",
          padding: 20,
          display: "flex",
          flexDirection: "column",
          gap: 20,
          overflowY: "auto"
        }}
      >
        <div className="sf-row" style={{ alignItems: "center", gap: 10 }}>
          <Database size={18} style={{ color: "oklch(0.78 0.16 250)" }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--sf-text)" }}>
            Table: <span className="mono">{selectedTable}</span>
          </h3>
        </div>

        <div>
          <h4 style={{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--sf-text-faint)", marginBottom: 8, marginTop: 0 }}>
            Fields & Attributes
          </h4>
          <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--sf-border)", borderRadius: 6, overflow: "hidden" }}>
            {tableData?.fields.map((f: any, idx: number) => (
              <div
                key={idx}
                className="sf-row"
                style={{
                  padding: "8px 12px",
                  background: idx % 2 === 0 ? "var(--sf-surface-2)" : "transparent",
                  borderBottom: idx < tableData.fields.length - 1 ? "1px solid var(--sf-border)" : "none",
                  alignItems: "center",
                  fontSize: 12.5
                }}
              >
                <span className="mono sf-grow" style={{ fontWeight: 500, color: f.primaryKey ? "var(--sf-text)" : "var(--sf-text-muted)" }}>
                  {f.name}
                  {f.primaryKey && <span style={{ color: "var(--sf-amber)", marginLeft: 6, fontSize: 10 }}>★ PK</span>}
                  {f.fk && <span style={{ color: "var(--sf-blue)", marginLeft: 6, fontSize: 10 }}>→ FK</span>}
                </span>
                <span className="mono" style={{ color: "var(--sf-text-faint)", fontSize: 11.5 }}>
                  {f.type}
                  {f.nullable ? "" : " · NOT NULL"}
                  {f.defaultValue ? ` · default: ${f.defaultValue}` : ""}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 style={{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--sf-text-faint)", marginBottom: 8, marginTop: 0 }}>
            Foreign Key Relationships
          </h4>
          {tableRelationships.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--sf-text-faint)", fontStyle: "italic" }}>
              No relationships defined for this table.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {tableRelationships.map((r: any, idx: number) => {
                const isIncoming = r.toTable === selectedTable;
                return (
                  <div
                    key={idx}
                    className="sf-card"
                    style={{
                      padding: "8px 12px",
                      background: "var(--sf-surface-2)",
                      border: "1px solid var(--sf-border)",
                      borderRadius: 6,
                      fontSize: 12.5
                    }}
                  >
                    <div style={{ fontWeight: 500, color: "var(--sf-text)" }}>
                      {isIncoming ? "One-to-Many / Many-to-One Link" : "Foreign Reference"}
                    </div>
                    <div className="mono sf-faint" style={{ marginTop: 4, color: "var(--sf-text-muted)" }}>
                      {r.name}
                      <span className="sf-chip sf-chip-mono" style={{ marginLeft: 8, fontSize: 9.5 }}>
                        {r.type}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h4 style={{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--sf-text-faint)", marginBottom: 8, marginTop: 0 }}>
            Table Indexes
          </h4>
          {tableData?.indexes?.length === 0 ? (
            <div style={{ fontSize: 12.5, color: "var(--sf-text-faint)", fontStyle: "italic" }}>
              No indexes declared. Standard primary key index is implicitly created.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--sf-border)", borderRadius: 6, overflow: "hidden" }}>
              {tableData?.indexes.map((idx: any, idxNo: number) => (
                <div
                  key={idxNo}
                  className="sf-row"
                  style={{
                    padding: "8px 12px",
                    background: idxNo % 2 === 0 ? "var(--sf-surface-2)" : "transparent",
                    borderBottom: idxNo < tableData.indexes.length - 1 ? "1px solid var(--sf-border)" : "none",
                    alignItems: "center",
                    fontSize: 12.5
                  }}
                >
                  <span className="mono sf-grow" style={{ fontWeight: 500, color: "var(--sf-text)" }}>
                    {idx.name}
                  </span>
                  <span className="mono" style={{ color: "var(--sf-text-faint)", fontSize: 11.5 }}>
                    Columns: {idx.columns.join(", ")} {idx.unique && "· UNIQUE"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="sf-scroll sf-card"
      style={{
        height: 520,
        background: "var(--sf-surface)",
        border: "1px solid var(--sf-border)",
        padding: 20,
        display: "flex",
        flexDirection: "column",
        gap: 20,
        overflowY: "auto"
      }}
    >
      <div className="sf-row" style={{ alignItems: "center", gap: 10 }}>
        <Compass size={18} style={{ color: "oklch(0.78 0.16 250)" }} />
        <h3 style={{ fontSize: 16, fontWeight: 600, margin: 0, color: "var(--sf-text)" }}>
          Relational Model Details
        </h3>
      </div>
      <div style={{ fontSize: 12.5, color: "var(--sf-text-muted)", marginTop: -12 }}>
        Select a table card on the left viewport to inspect specific columns, indexes, and dependencies.
      </div>

      <div>
        <h4 style={{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--sf-text-faint)", marginBottom: 8, marginTop: 0 }}>
          Global Database Enums
        </h4>
        {(normalizedSchema.enums || []).length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--sf-text-faint)", fontStyle: "italic" }}>
            No custom enums defined.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {(normalizedSchema.enums || []).map((e: any, idx: number) => (
              <div
                key={idx}
                className="sf-card"
                style={{
                  padding: "8px 12px",
                  background: "var(--sf-surface-2)",
                  border: "1px solid var(--sf-border)",
                  borderRadius: 6
                }}
              >
                <div className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: "var(--sf-text)" }}>
                  {e.name}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                  {e.values.map((val: string, vidx: number) => (
                    <span
                      key={vidx}
                      className="mono sf-chip sf-chip-mono"
                      style={{ fontSize: 10.5, padding: "2px 6px" }}
                    >
                      &quot;{val}&quot;
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h4 style={{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--sf-text-faint)", marginBottom: 8, marginTop: 0 }}>
          Database Relationships
        </h4>
        {(normalizedSchema.relationships || []).length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--sf-text-faint)", fontStyle: "italic" }}>
            No relationships compiled.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {(() => {
              const seen = new Set<string>();
              const uniqueRels = (normalizedSchema.relationships || []).filter((r: any) => {
                const key = [r.fromTable, r.toTable].sort().join("-");
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
              });

              return uniqueRels.map((r: any, idx: number) => (
                <div
                  key={idx}
                  className="sf-row"
                  style={{
                    padding: "8px 12px",
                    background: "var(--sf-surface-2)",
                    border: "1px solid var(--sf-border)",
                    borderRadius: 6,
                    alignItems: "center",
                    fontSize: 12.5
                  }}
                >
                  <span className="mono sf-grow" style={{ color: "var(--sf-text)" }}>
                    <span style={{ color: "oklch(0.78 0.16 250)" }}>{r.fromTable}</span>
                    {" ↔ "}
                    <span style={{ color: "oklch(0.78 0.16 250)" }}>{r.toTable}</span>
                  </span>
                  <span className="mono sf-chip sf-chip-mono" style={{ fontSize: 10.5 }}>
                    {r.type === "many-to-one" || r.type === "one-to-many" ? "Foreign Key" : r.type}
                  </span>
                </div>
              ));
            })()}
          </div>
        )}
      </div>

      <div>
        <h4 style={{ fontSize: 12.5, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--sf-text-faint)", marginBottom: 8, marginTop: 0 }}>
          Indexes ({normalizedSchema.indexes?.length || 0})
        </h4>
        {(normalizedSchema.indexes || []).length === 0 ? (
          <div style={{ fontSize: 12.5, color: "var(--sf-text-faint)", fontStyle: "italic" }}>
            No indexes declared.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", border: "1px solid var(--sf-border)", borderRadius: 6, overflow: "hidden" }}>
            {(normalizedSchema.indexes || []).map((idx: any, idxNo: number) => (
              <div
                key={idxNo}
                className="sf-row"
                style={{
                  padding: "8px 12px",
                  background: idxNo % 2 === 0 ? "var(--sf-surface-2)" : "transparent",
                  borderBottom: idxNo < normalizedSchema.indexes.length - 1 ? "1px solid var(--sf-border)" : "none",
                  alignItems: "center",
                  fontSize: 12.5
                }}
              >
                <span className="mono sf-grow" style={{ fontWeight: 500, color: "var(--sf-text)" }}>
                  {idx.name}
                </span>
                <span className="mono sf-faint" style={{ fontSize: 11.5, color: "var(--sf-text-muted)" }}>
                  on {idx.table}({idx.columns.join(", ")}) {idx.unique && "· UNIQUE"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SchemaTabContent({ project, isLoading }: { project?: any, isLoading?: boolean }) {
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [rightTab, setRightTab] = useState<"code" | "inspector">("code");
  const [panelOpen, setPanelOpen] = useState(true);

  const metadata = project?.generation_metadata;
  const currentTables = metadata?.schemaTables || [];
  const currentCode = metadata?.schemaCode || [];

  const highlightedCode = useMemo(() => highlightTypeScript(currentCode), [currentCode]);

  const normalizedSchema = useMemo(() => {
    if (metadata?.normalizedSchema) return metadata.normalizedSchema;
    if (currentCode.length === 0) return null;
    try {
      return SchemaParser.parse(currentCode, currentTables);
    } catch (e) {
      console.error("Failed client-side schema parsing:", e);
      return null;
    }
  }, [metadata, currentCode, currentTables]);

  // Find connected tables based on foreign key relations
  const connectedTableNames = useMemo(() => {
    if (!selectedTable) return new Set<string>();
    const names = new Set<string>([selectedTable]);

    const getRelations = (tblName: string) => {
      const tbl = currentTables.find((t: any) => t.name === tblName);
      if (!tbl) return [];

      const related: string[] = [];
      if (tbl.columns) {
        tbl.columns.forEach((col: any) => {
          if (col.fk) {
            let target = col.name.replace("_id", "");
            if (target === "instructor" || target === "student" || target === "owner" || target === "seller" || target === "buyer") {
              target = "users";
            } else {
              // Pluralize target
              if (target === "course") target = "courses";
              else if (target === "exam") target = "exams";
              else if (target === "listing") target = "listings";
              else if (target === "workspace") target = "workspaces";
            }
            related.push(target);
          }
        });
      }

      currentTables.forEach((otherTbl: any) => {
        if (otherTbl.name === tblName) return;
        if (otherTbl.columns) {
          otherTbl.columns.forEach((col: any) => {
            if (col.fk) {
              let target = col.name.replace("_id", "");
              if (target === "instructor" || target === "student" || target === "owner" || target === "seller" || target === "buyer") {
                target = "users";
              } else {
                if (target === "course") target = "courses";
                else if (target === "exam") target = "exams";
                else if (target === "listing") target = "listings";
                else if (target === "workspace") target = "workspaces";
              }
              if (target === tblName) {
                related.push(otherTbl.name);
              }
            }
          });
        }
      });

      return related;
    };

    getRelations(selectedTable).forEach(name => names.add(name));
    return names;
  }, [selectedTable, currentTables]);

  const handleTableClick = (tableName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTable((current) => (current === tableName ? null : tableName));
  };

  const handleCanvasClick = () => {
    setSelectedTable(null);
  };

  if (isLoading) return <SkeletonSchema />;

  return (
    <div
      onClick={handleCanvasClick}
      style={{
        display: "flex",
        height: "calc(100vh - 150px)",
        width: "100%",
        overflow: "hidden",
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", padding: 28 }}>
        <div className="sf-row" style={{ marginBottom: 10, alignItems: "center" }}>
          <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0, color: "var(--sf-text)" }} className="sf-grow">Database schema</h2>
          <span className="sf-chip sf-chip-mono">{currentTables.length} tables · {normalizedSchema?.indexes?.length || currentTables.length * 2} indexes</span>
          <div style={{ marginLeft: 12 }}>
            <PanelToggleButton isOpen={panelOpen} onClick={() => setPanelOpen(!panelOpen)} side="right" />
          </div>
        </div>
        <div style={{ flex: 1, position: "relative" }}>
          <InteractiveViewport>
            <div style={{ position: "absolute", inset: 0, padding: 24 }}>
              {currentTables.map((t: any) => {
                const isSelected = selectedTable === t.name;
                const isDimmed = !!selectedTable && !connectedTableNames.has(t.name);
                return (
                  <SchemaTable
                    key={t.name}
                    name={t.name}
                    columns={t.columns}
                    accent={t.accent}
                    x={t.x}
                    y={t.y}
                    isSelected={isSelected}
                    isDimmed={isDimmed}
                    onClick={(e) => handleTableClick(t.name, e)}
                  />
                );
              })}
            </div>
          </InteractiveViewport>
        </div>
      </div>
      
      <CollapsiblePanel
        isOpen={panelOpen}
        onOpenChange={setPanelOpen}
        width={460}
        side="right"
      >
        <div style={{ padding: "28px 24px", display: "flex", flexDirection: "column", height: "100%" }}>
          <div className="sf-row" style={{ marginBottom: 10, alignItems: "center", gap: 12, flex: "0 0 auto" }}>
            <button
              onClick={(e) => { e.stopPropagation(); setRightTab("code"); }}
              style={{
                background: rightTab === "code" ? "var(--sf-surface-2)" : "transparent",
                color: rightTab === "code" ? "var(--sf-text)" : "var(--sf-text-muted)",
                border: "1px solid",
                borderColor: rightTab === "code" ? "var(--sf-border)" : "transparent",
                padding: "4px 12px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              schema.ts (Code)
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setRightTab("inspector"); }}
              style={{
                background: rightTab === "inspector" ? "var(--sf-surface-2)" : "transparent",
                color: rightTab === "inspector" ? "var(--sf-text)" : "var(--sf-text-muted)",
                border: "1px solid",
                borderColor: rightTab === "inspector" ? "var(--sf-border)" : "transparent",
                padding: "4px 12px",
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
            >
              Relational Model (Metadata)
            </button>
          </div>
          <div style={{ flex: "1 1 auto", minHeight: 0, position: "relative" }}>
            {rightTab === "code" ? (
              <CodeBlock language="ts" title="packages/db/schema.ts" lines={highlightedCode} height="100%" scroll />
            ) : (
              <SchemaDetailsPanel
                normalizedSchema={normalizedSchema}
                selectedTable={selectedTable}
                tables={currentTables}
              />
            )}
          </div>
        </div>
      </CollapsiblePanel>
    </div>
  );
}


function RoutesTabContent({ project, isLoading }: { project?: any, isLoading?: boolean }) {
  const [leftOpen, setLeftOpen] = useState(true);
  const [rightOpen, setRightOpen] = useState(true);

  const metadata = project?.generation_metadata;
  const currentTree = metadata?.fileTree || [];
  const currentCode = metadata?.routeCode || [];
  const currentTables = useMemo(() => metadata?.schemaTables || [], [metadata?.schemaTables]);
  const currentRoutes = metadata?.apiRoutes || [];

  const highlightedCode = useMemo(() => highlightTypeScript(currentCode), [currentCode]);

  const enrichedRoutes = useMemo(() => {
    if (currentRoutes && currentRoutes.length > 0 && currentRoutes[0].requestPayload) {
      return currentRoutes;
    }
    const normalizedSchema = (() => {
      if (metadata?.normalizedSchema) return metadata.normalizedSchema;
      try {
        return SchemaParser.parse(metadata?.schemaCode || [], currentTables);
      } catch (e) {
        return null;
      }
    })();
    try {
      return APIGenerator.enrich(currentRoutes, normalizedSchema || undefined);
    } catch (e) {
      // Failed client-side API enrichment
      return currentRoutes;
    }
  }, [currentRoutes, metadata, currentTables]);

  const firstFilename = currentTree?.[0]?.children?.[0]?.children?.[0]?.name || "routes.ts";
  const pathLabel = currentTree?.[0]?.children?.[0]?.children?.[0]?.path || "apps/api/src/modules/routes.ts";

  if (isLoading) return <SkeletonRoutes />;

  return (
    <div style={{ height: "calc(100vh - 150px)", display: "flex", width: "100%", overflow: "hidden" }}>
      {/* File tree */}
      <CollapsiblePanel
        isOpen={leftOpen}
        onOpenChange={setLeftOpen}
        width={280}
        side="left"
        className="sf-scroll"
      >
        <div className="sf-row" style={{ padding: "12px 14px", borderBottom: "1px solid var(--sf-border)", alignItems: "center" }}>
          <span className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--sf-text-faint)" }}>
            Files
          </span>
          <span className="sf-grow" />
          <span className="sf-chip sf-chip-mono" style={{ height: 17, fontSize: 10 }}>
            {currentRoutes.length + 10}
          </span>
        </div>
        <div style={{ padding: 10 }}>
          <FileTreeComponent nodes={currentTree} selected={firstFilename} />
        </div>
      </CollapsiblePanel>

      {/* Center: code */}
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <div
          className="sf-row"
          style={{
            padding: "8px 14px",
            borderBottom: "1px solid var(--sf-border)",
            gap: 8,
            background: "var(--sf-bg-2)",
            alignItems: "center"
          }}
        >
          <PanelToggleButton isOpen={leftOpen} onClick={() => setLeftOpen(!leftOpen)} side="left" />
          {[firstFilename, "service.ts", "utils.ts"].map((n, i) => (
            <span
              key={n}
              className="sf-row"
              style={{
                height: 24,
                padding: "0 10px",
                gap: 6,
                borderRadius: 6,
                fontSize: 12,
                background: i === 0 ? "var(--sf-elevated)" : "transparent",
                color: i === 0 ? "var(--sf-text)" : "var(--sf-text-muted)",
                border: i === 0 ? "1px solid var(--sf-border)" : "1px solid transparent",
                alignItems: "center"
              }}
            >
              <Icons.File size={11} style={{ color: "var(--sf-text-faint)" }} /> {n}
              {i === 0 && <Icons.X size={10} style={{ color: "var(--sf-text-faint)" }} />}
            </span>
          ))}
          <span className="sf-grow" />
          <span className="mono sf-faint" style={{ fontSize: 11, color: "var(--sf-text-faint)" }}>
            {pathLabel}
          </span>
          <PanelToggleButton isOpen={rightOpen} onClick={() => setRightOpen(!rightOpen)} side="right" />
        </div>
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }} className="sf-scroll">
          <CodeBlock language="ts" lines={highlightedCode} scroll height="100%" />
        </div>
      </div>

      {/* Right: route list */}
      <CollapsiblePanel
        isOpen={rightOpen}
        onOpenChange={setRightOpen}
        width={340}
        side="right"
        className="sf-scroll"
      >
        <div className="sf-row" style={{ padding: "12px 14px", borderBottom: "1px solid var(--sf-border)", alignItems: "center" }}>
          <span className="mono sf-faint" style={{ fontSize: 10.5, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--sf-text-faint)" }}>
            API surface
          </span>
          <span className="sf-grow" />
          <span className="sf-chip sf-chip-mono" style={{ height: 17, fontSize: 10 }}>
            {enrichedRoutes.length} routes
          </span>
        </div>
        {enrichedRoutes.map((r: any, i: number) => (
          <RouteRow
            key={i}
            method={r.method}
            path={r.path}
            auth={r.auth}
            note={r.note}
            name={r.name}
            group={r.group}
            requestPayload={r.requestPayload}
            responsePayload={r.responsePayload}
            validationRules={r.validationRules}
          />
        ))}
      </CollapsiblePanel>
    </div>
  );
}

function AuthTabContent({ project, isLoading }: { project?: any, isLoading?: boolean }) {
  if (isLoading) return <SkeletonAuth />;

  const metadata = project?.generation_metadata;
  const strategy = metadata?.authStrategy || {
    providers: "Email + OAuth (GitHub, Google)",
    sessions: "Lucia Session · Cookie-based rolling",
    roles: "user · admin",
    mfa: "TOTP (opt-in)",
    rateLimit: "60 / min / IP"
  };

  const flowSteps = metadata?.authFlowSteps || [
    { n: 1, t: "Signup / Login", d: "Standard secure authentication flow" },
    { n: 2, t: "Session creation", d: "Hashed tokens in HTTP-only cookies" },
    { n: 3, t: "Role Gating", d: "Middleware checks for required permissions" }
  ];

  return (
    <div
      style={{
        padding: 28,
        maxWidth: 1280,
        margin: "0 auto",
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 16
      }}
    >
      <div className="sf-card" style={{ padding: 22 }}>
        <Icons.Lock size={16} style={{ color: "var(--sf-text-muted)" }} />
        <h2 style={{ fontSize: 18, fontWeight: 500, margin: "12px 0 0", color: "var(--sf-text)" }}>Auth strategy</h2>
        <p className="sf-muted" style={{ fontSize: 13, marginTop: 6, color: "var(--sf-text-muted)", lineHeight: 1.45 }}>
          Session-based auth. Hashed tokens in HTTP-only cookies. Role checks happen
          in middleware on every protected route.
        </p>
        <div className="sf-col" style={{ marginTop: 16, gap: 8 }}>
          {[
            ["Providers", strategy.providers],
            ["Sessions", strategy.sessions],
            ["Roles", strategy.roles],
            ["MFA", strategy.mfa],
            ["Rate limit", strategy.rateLimit]
          ].map(([k, v]) => (
            <div
              key={k}
              className="sf-row"
              style={{ padding: "8px 0", borderBottom: "1px dashed var(--sf-border)", alignItems: "center" }}
            >
              <span className="mono sf-faint" style={{ fontSize: 11, width: 100, color: "var(--sf-text-faint)" }}>
                {k}
              </span>
              <span style={{ fontSize: 12.5, color: "var(--sf-text)" }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="sf-card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="sf-row" style={{ padding: "14px 18px", borderBottom: "1px solid var(--sf-border)" }}>
          <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0, color: "var(--sf-text)" }} className="sf-grow">Auth flow</h2>
        </div>
        <div style={{ padding: 22 }}>
          {flowSteps.map((s: any) => (
            <div key={s.n} className="sf-row" style={{ alignItems: "flex-start", gap: 12, paddingBottom: 14 }}>
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 999,
                  background: "var(--sf-surface-2)",
                  border: "1px solid var(--sf-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: "0 0 auto"
                }}
              >
                <span className="mono" style={{ fontSize: 10.5, color: "var(--sf-text)" }}>
                  {s.n}
                </span>
              </div>
              <div className="sf-grow">
                <div className="mono" style={{ fontSize: 12.5, color: "var(--sf-text)" }}>{s.t}</div>
                <div className="sf-faint" style={{ fontSize: 11.5, marginTop: 1, color: "var(--sf-text-faint)" }}>
                  {s.d}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EnvTabContent({ project }: { project?: any }) {
  const [copied, setCopied] = useState(false);

  const metadata = project?.generation_metadata;
  const currentEnv = metadata?.envVariables || [
    { k: "DATABASE_URL", v: "postgres://…", kind: "secret", note: "Primary Postgres" },
    { k: "REDIS_URL", v: "redis://…", kind: "secret", note: "Sessions + queues" },
    { k: "AUTH_SECRET", v: "••••••••••••••••", kind: "secret", note: "Session HMAC" },
    { k: "NODE_ENV", v: "production", kind: "public" },
    { k: "PORT", v: "8080", kind: "public" }
  ];

  const handleCopy = () => {
    const text = currentEnv.map((e: any) => `${e.k}=${e.v}`).join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ padding: 28, maxWidth: 1080, margin: "0 auto" }}>
      <div className="sf-row" style={{ marginBottom: 12, alignItems: "center" }}>
        <h2 style={{ fontSize: 18, fontWeight: 500, margin: 0, color: "var(--sf-text)" }} className="sf-grow">Environment variables</h2>
        <button onClick={handleCopy} className="sf-btn sf-btn--sm" type="button">
          {copied ? <Icons.Check size={11} /> : <Icons.Copy size={11} />} {copied ? "Copied" : "Copy .env.example"}
        </button>
        <button className="sf-btn sf-btn--sm" style={{ marginLeft: 8 }} type="button">
          <Icons.Plus size={11} /> Add variable
        </button>
      </div>
      <div className="sf-card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          className="sf-row"
          style={{
            padding: "8px 14px",
            borderBottom: "1px solid var(--sf-border)",
            background: "var(--sf-bg-2)",
            fontSize: 11,
            color: "var(--sf-text-faint)",
            letterSpacing: "0.04em",
            textTransform: "uppercase"
          }}
        >
          <span style={{ flex: "0 0 260px" }}>Key</span>
          <span style={{ flex: "0 0 80px" }}>Type</span>
          <span className="sf-grow">Value</span>
          <span style={{ flex: "0 0 24px" }} />
        </div>
        {currentEnv.map((e: any, i: number) => (
          <div
            key={e.k}
            className="sf-row"
            style={{
              padding: "10px 14px",
              borderBottom: i < currentEnv.length - 1 ? "1px solid var(--sf-border)" : "none",
              gap: 8,
              alignItems: "center"
            }}
          >
            <span className="mono" style={{ flex: "0 0 260px", fontSize: 12, color: "var(--sf-text)" }}>
              {e.k}
            </span>
            <span style={{ flex: "0 0 80px" }} className="sf-chip">
              {e.kind === "secret" ? (
                <Icons.Lock size={10} style={{ marginRight: 4 }} />
              ) : (
                <Icons.Eye size={10} style={{ marginRight: 4 }} />
              )}
              {e.kind}
            </span>
            <span
              className="mono sf-grow"
              style={{
                fontSize: 11.5,
                color: "var(--sf-text-muted)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}
            >
              {e.v}
            </span>
            {"note" in e && e.note && <span className="sf-faint" style={{ fontSize: 11.5, color: "var(--sf-text-faint)" }}>{e.note}</span>}
            <button className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: "0 4px" }} type="button">
              <Icons.More size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeployHint() {
  return (
    <div style={{ padding: 60, textAlign: "center", maxWidth: 520, margin: "0 auto" }}>
      <Icons.Rocket size={20} style={{ color: "var(--sf-text-muted)", margin: "0 auto" }} />
      <h2 style={{ fontSize: 18, fontWeight: 500, marginTop: 14, color: "var(--sf-text)" }}>Ready to deploy</h2>
      <p className="sf-muted" style={{ fontSize: 14, color: "var(--sf-text-muted)", marginBottom: 14 }}>
        Open the deployment wizard to push this generation to your infra.
      </p>
      <button className="sf-btn sf-btn--primary sf-btn--lg" type="button">
        Open wizard <Icons.ArrowR size={12} style={{ marginLeft: 4 }} />
      </button>
    </div>
  );
}
