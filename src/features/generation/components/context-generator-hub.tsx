"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ChevronRight, Copy, Check, Star,
  Info, ArrowRight, Code2, Terminal,
  Cpu, Zap, Layout, TerminalSquare,
  Wand2, Globe, Command, X, Import
} from "lucide-react";
import { SiClaude, SiVercel, SiWindsurf, SiReplit } from "react-icons/si";
import { CONTEXT_TOOLS, ContextTool } from "../lib/context-tools";
import { getSystemPrompt } from "../../prompts/prompt-loader";

interface ContextGeneratorHubProps {
  onClose?: () => void;
}

const TOOL_ICONS: Record<string, any> = {
  "claude-code": TerminalSquare,
  "cursor": Command,
  "lovable": Wand2,
  "bolt": Zap,
  "v0": Layout,
  "windsurf": Globe,
  "replit": Code2,
  "custom": Import,
};

// Inline brand glyphs for tools not present in Simple Icons.
type ToolGlyph = React.ComponentType<{ size?: number; style?: React.CSSProperties }>;

// Cursor — grayscale isometric cube.
const CursorGlyph: ToolGlyph = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden>
    <path d="M12 2 22 7.5 12 13 2 7.5 12 2Z" fill="#f4f4f6" />
    <path d="M2 7.5 12 13v9L2 16.5V7.5Z" fill="#8c8c95" />
    <path d="M22 7.5 12 13v9l10-5.5V7.5Z" fill="#c4c4cc" />
  </svg>
);

// Lovable — heart with the orange→pink→purple brand gradient.
const LovableGlyph: ToolGlyph = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden>
    <defs>
      <linearGradient id="sf-lovable-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#FF7A28" />
        <stop offset="0.55" stopColor="#F2469A" />
        <stop offset="1" stopColor="#7C5CFF" />
      </linearGradient>
    </defs>
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35Z" fill="url(#sf-lovable-grad)" />
  </svg>
);

// Bolt — slanted bold "b" mark.
const BoltGlyph: ToolGlyph = ({ size = 16, style }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" style={style} aria-hidden>
    <text
      x="12" y="19" textAnchor="middle"
      fontSize="22" fontWeight={800} fontStyle="italic"
      fontFamily="var(--sf-font-sans), system-ui, sans-serif"
      fill="currentColor"
    >b</text>
  </svg>
);

// Real brand icons for AI coding tools, with brand colors. Tools without an
// official Simple Icon use a faithful inline glyph matching the brand mark.
const BRAND_TOOL_ICONS: Record<string, { icon: ToolGlyph; color: string }> = {
  "claude-code": { icon: SiClaude, color: "#D97757" },
  "cursor": { icon: CursorGlyph, color: "#E8E8F0" },
  "lovable": { icon: LovableGlyph, color: "#FF6692" },
  "bolt": { icon: BoltGlyph, color: "#E8E8F0" },
  "v0": { icon: SiVercel, color: "#E8E8F0" },
  "windsurf": { icon: SiWindsurf, color: "#19C37D" },
  "replit": { icon: SiReplit, color: "#F26207" },
};

// Real PNG logos for these tools (place files in public/icons/). Rendered at
// the same 13px as the other tab icons. If a file is missing, the inline glyph
// above is used as a graceful fallback so nothing ever breaks.
const TOOL_PNGS: Record<string, string> = {
  "cursor": "/icons/cursor.png",
  "lovable": "/icons/lovable.png",
  "bolt": "/icons/bolt.png",
};

function ToolTabIcon({ toolId, color, Glyph }: { toolId: string; color: string; Glyph: ToolGlyph }) {
  const src = TOOL_PNGS[toolId];
  const [imgOk, setImgOk] = useState(true);
  if (src && imgOk) {
    return (
      <img
        src={src}
        alt=""
        width={13}
        height={13}
        style={{ width: 13, height: 13, objectFit: "contain", borderRadius: 3, flex: "0 0 auto" }}
        onError={() => setImgOk(false)}
      />
    );
  }
  return <Glyph size={13} style={{ color }} />;
}

export function ContextGeneratorHub() {
  const [selectedTool, setSelectedTool] = useState<ContextTool | null>(null);

  return (
    <div style={{ marginTop: 28 }}>
      {/* Hub Header */}
      <div className="sf-row" style={{ marginBottom: 12 }}>
        <div className="sf-col" style={{ gap: 2 }}>
          <span style={{
            fontSize: 14,
            color: 'var(--sf-text)',
            fontWeight: 600,
            fontFamily: 'var(--sf-font-sans)',
            letterSpacing: '-0.01em'
          }}>
            Generate Simplicit Context File
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--sf-text-faint)' }}>
            Using an AI coding tool? Generate a Simplicit context file first for higher backend accuracy.
          </span>
        </div>
      </div>

      {/* Tool Grid — single responsive line; tabs shrink to fit. */}
      <div className="sf-row" style={{ gap: 6, flexWrap: 'nowrap', width: '100%' }}>
        {CONTEXT_TOOLS.map(tool => {
          const brand = BRAND_TOOL_ICONS[tool.id];
          const Icon = brand?.icon || TOOL_ICONS[tool.id] || Code2;
          const active = selectedTool?.id === tool.id;
          const iconColor = brand?.color ?? (active ? 'var(--sf-blue)' : 'inherit');

          return (
            <button
              key={tool.id}
              onClick={() => setSelectedTool(tool)}
              className="sf-row"
              title={tool.name}
              style={{
                gap: 6, height: 34, padding: '0 8px',
                flex: '1 1 0', minWidth: 0, justifyContent: 'center',
                background: active ? 'var(--sf-surface-2)' : 'var(--sf-surface)',
                border: '1px solid', borderColor: active ? 'var(--sf-blue)' : 'var(--sf-border)',
                borderRadius: 8, color: active ? 'var(--sf-text)' : 'var(--sf-text-muted)',
                fontFamily: 'inherit', fontSize: 12.5, cursor: 'pointer',
                transition: 'all 0.1s ease',
              }}
              type="button"
            >
              <span style={{ flex: '0 0 auto', display: 'inline-flex' }}>
                <ToolTabIcon toolId={tool.id} color={iconColor} Glyph={Icon} />
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tool.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tool Detail Panel (Overlay) */}
      {selectedTool && (
        <div 
          style={{
            position: 'fixed', top: 0, right: 0, bottom: 0, left: 0,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20
          }}
          onClick={() => setSelectedTool(null)}
        >
          <div 
            style={{
              width: '100%', maxWidth: 640, background: 'var(--sf-surface-2)',
              borderRadius: 16, border: '1px solid var(--sf-border-strong)',
              boxShadow: '0 20px 80px rgba(0,0,0,0.5)', overflow: 'hidden',
              display: 'flex', flexDirection: 'column', maxHeight: '90vh'
            }}
            onClick={e => e.stopPropagation()}
          >
            <ContextToolDetail tool={selectedTool} onClose={() => setSelectedTool(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

function ContextToolDetail({ tool, onClose }: { tool: ContextTool; onClose: () => void }) {
  const [prompt, setPrompt] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setSetCopied] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getSystemPrompt(tool.id)
      .then((p) => {
        if (active) {
          setPrompt(p);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (active) {
          setError(err.message || "Failed to load system prompt.");
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [tool.id]);

  const handleCopy = useCallback(() => {
    if (prompt) {
      navigator.clipboard.writeText(prompt.raw);
      setSetCopied(true);
      setTimeout(() => setSetCopied(false), 2000);
    }
  }, [prompt]);

  return (
    <>
      {/* Panel Header */}
      <div className="sf-row" style={{ 
        padding: '16px 20px', background: 'var(--sf-bg-2)', 
        borderBottom: '1px solid var(--sf-border)', gap: 12
      }}>
        <div style={{ 
          width: 32, height: 32, borderRadius: 8, background: 'var(--sf-bg)', 
          border: '1px solid var(--sf-border)', display: 'flex', 
          alignItems: 'center', justifyContent: 'center' 
        }}>
          {TOOL_ICONS[tool.id] ? (
            React.createElement(TOOL_ICONS[tool.id], { size: 16, className: 'sf-blue' })
          ) : <Code2 size={16} />}
        </div>
        <div className="sf-col" style={{ gap: 2 }}>
          <span style={{ fontSize: 15, fontWeight: 600, color: 'var(--sf-text)' }}>
            {tool.name} Context Generator
          </span>
          <span className="mono" style={{ fontSize: 10, color: 'var(--sf-text-faint)', textTransform: 'uppercase' }}>
            OPTIMIZED PROMPT TEMPLATE
          </span>
        </div>
        <span className="sf-grow" />
        <button onClick={onClose} className="sf-btn sf-btn--ghost sf-btn--sm" style={{ padding: '0 4px' }}>
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="sf-scroll" style={{ padding: 20, overflowY: 'auto', flex: 1 }}>
        <div className="sf-col" style={{ gap: 20 }}>
          
          {/* Instructions */}
          <div className="sf-col" style={{ gap: 10 }}>
            <div className="sf-row" style={{ gap: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--sf-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>1</div>
              <span style={{ fontSize: 13, color: 'var(--sf-text)' }}>Copy the prompt below into <strong>{tool.name}</strong>.</span>
            </div>
            <div className="sf-row" style={{ gap: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--sf-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>2</div>
              <span style={{ fontSize: 13, color: 'var(--sf-text)' }}>The tool will generate a <code>simplicit.context.md</code> file describing your project.</span>
            </div>
            <div className="sf-row" style={{ gap: 8 }}>
              <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'var(--sf-blue)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700 }}>3</div>
              <span style={{ fontSize: 13, color: 'var(--sf-text)' }}>Upload that file back into Simplicit for improved backend generation.</span>
            </div>
          </div>

          {/* Quality Indicator */}
          <div className="sf-row" style={{ 
            padding: '10px 14px', background: 'rgba(255,255,255,0.03)', 
            borderRadius: 10, border: '1px solid var(--sf-border)', gap: 12
          }}>
            <div className="sf-col" style={{ gap: 2 }}>
              <span className="mono" style={{ fontSize: 9, color: 'var(--sf-text-faint)', textTransform: 'uppercase' }}>Expected Context Quality</span>
              <div className="sf-row" style={{ gap: 2 }}>
                {[1, 2, 3, 4, 5].map(i => (
                  <Star 
                    key={i} 
                    size={11} 
                    fill={i <= tool.qualityScore ? 'var(--sf-amber)' : 'transparent'} 
                    color={i <= tool.qualityScore ? 'var(--sf-amber)' : 'var(--sf-text-faint)'} 
                  />
                ))}
                <span style={{ fontSize: 11, color: 'var(--sf-text-muted)', marginLeft: 6 }}>
                  {tool.qualityScore >= 5 ? 'Exceptional' : tool.qualityScore >= 4 ? 'High' : 'Medium'}
                </span>
              </div>
            </div>
            <div className="sf-vdivider" style={{ height: 24 }} />
            <div className="sf-col" style={{ gap: 2 }}>
              <span className="mono" style={{ fontSize: 9, color: 'var(--sf-text-faint)', textTransform: 'uppercase' }}>Recommended</span>
              <span style={{ fontSize: 11, color: tool.recommended ? 'oklch(0.78 0.16 145)' : 'var(--sf-text-muted)' }}>
                {tool.recommended ? 'Yes' : 'Compatible'}
              </span>
            </div>
          </div>

          {/* Prompt Editor */}
          <div className="sf-col" style={{ gap: 8 }}>
            <div className="sf-row" style={{ justifyContent: 'space-between' }}>
              <span className="mono" style={{ fontSize: 10, color: 'var(--sf-text-faint)', textTransform: 'uppercase' }}>Prompt Template</span>
              <button 
                onClick={handleCopy}
                disabled={loading || !!error}
                className={`sf-btn sf-btn--sm ${copied ? 'sf-btn--ghost' : 'sf-btn--primary'}`}
                style={{ height: 26, fontSize: 11 }}
              >
                {copied ? <><Check size={11} style={{ marginRight: 4 }} /> Copied</> : <><Copy size={11} style={{ marginRight: 4 }} /> Copy Prompt</>}
              </button>
            </div>
            {loading ? (
              <div className="sf-row" style={{ justifyContent: 'center', padding: 24, color: 'var(--sf-text-muted)' }}>
                <span>Loading prompt template...</span>
              </div>
            ) : error ? (
              <div className="sf-row" style={{ padding: '14px 16px', background: 'rgba(239, 68, 68, 0.1)', color: 'rgb(239, 68, 68)', borderRadius: 10, fontSize: 12 }}>
                <span>Error: {error}</span>
              </div>
            ) : (
              <pre 
                style={{
                  padding: '14px 16px', background: 'var(--sf-bg)', 
                  border: '1px solid var(--sf-border-strong)', borderRadius: 10,
                  fontSize: 12, lineHeight: 1.6, color: 'var(--sf-text-muted)',
                  whiteSpace: 'pre-wrap', fontFamily: 'var(--sf-font-mono)',
                  maxHeight: 240, overflowY: 'auto', margin: 0
                }}
              >
                {prompt?.raw}
              </pre>
            )}
          </div>

          {/* Debug Panel */}
          {!loading && !error && prompt && (
            <div className="sf-col" style={{ borderTop: '1px solid var(--sf-border)', paddingTop: 16, gap: 8 }}>
              <div className="sf-row" style={{ gap: 6 }}>
                <Terminal size={14} className="sf-blue" />
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--sf-text)' }}>Prompt Registry Debug Panel</span>
              </div>
              <div className="sf-col" style={{ 
                padding: '10px 12px', background: 'rgba(255,255,255,0.015)', 
                borderRadius: 8, border: '1px solid var(--sf-border)', gap: 6 
              }}>
                <div className="sf-row" style={{ justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--sf-text-faint)' }}>Prompt Source:</span>
                  <span className="mono" style={{ color: 'var(--sf-text-muted)' }}>{prompt.filename}</span>
                </div>
                <div className="sf-row" style={{ justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--sf-text-faint)' }}>Prompt Version:</span>
                  <span className="mono" style={{ color: 'var(--sf-text-muted)' }}>{prompt.metadata.version}</span>
                </div>
                <div className="sf-row" style={{ justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--sf-text-faint)' }}>Schema:</span>
                  <span className="mono" style={{ color: 'var(--sf-text-muted)' }}>{prompt.metadata.schema}</span>
                </div>
                <div className="sf-row" style={{ justifyContent: 'space-between', fontSize: 11 }}>
                  <span style={{ color: 'var(--sf-text-faint)' }}>Prompt Hash:</span>
                  <span className="mono" style={{ color: 'var(--sf-blue)' }}>{prompt.metadata.promptHash}</span>
                </div>
              </div>
            </div>
          )}

          {/* Educational Panel */}
          <div style={{ borderTop: '1px solid var(--sf-border)', paddingTop: 20 }}>
            <div className="sf-row" style={{ gap: 8, marginBottom: 8 }}>
              <Info size={14} className="sf-blue" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sf-text)' }}>Why generate a context file?</span>
            </div>
            <p style={{ fontSize: 12.5, color: 'var(--sf-text-muted)', lineHeight: 1.5, margin: 0 }}>
              Frontend code tells Simplicit <strong>what</strong> exists. A context file tells Simplicit <strong>why</strong> it exists. 
              Combining both produces more accurate backend architecture and fewer clarification questions.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

// Global React import for JSX/React.createElement support if needed, though Next.js handles it.
import React from "react";
