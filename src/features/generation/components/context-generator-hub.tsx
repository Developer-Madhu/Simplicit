"use client";

import { useState, useCallback, useEffect } from "react";
import { 
  ChevronRight, Copy, Check, Star, 
  Info, ArrowRight, Code2, Terminal,
  Cpu, Zap, Layout, TerminalSquare,
  Wand2, Globe, Command, X
} from "lucide-react";
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
  "custom": Cpu,
};

export function ContextGeneratorHub() {
  const [selectedTool, setSelectedTool] = useState<ContextTool | null>(null);

  return (
    <div style={{ marginTop: 28 }}>
      {/* Hub Header */}
      <div className="sf-row" style={{ marginBottom: 12 }}>
        <div className="sf-col" style={{ gap: 2 }}>
          <span className="mono" style={{ 
            fontSize: 10.5, 
            color: 'var(--sf-blue)', 
            letterSpacing: '0.08em', 
            textTransform: 'uppercase',
            fontWeight: 600
          }}>
            Generate Simplicit Context File
          </span>
          <span style={{ fontSize: 11.5, color: 'var(--sf-text-faint)' }}>
            Using an AI coding tool? Generate a Simplicit context file first for higher backend accuracy.
          </span>
        </div>
      </div>

      {/* Tool Grid */}
      <div className="sf-row" style={{ gap: 8, flexWrap: 'wrap' }}>
        {CONTEXT_TOOLS.map(tool => {
          const Icon = TOOL_ICONS[tool.id] || Code2;
          const active = selectedTool?.id === tool.id;
          
          return (
            <button 
              key={tool.id} 
              onClick={() => setSelectedTool(tool)}
              className="sf-row" 
              style={{
                gap: 8, height: 34, padding: '0 12px',
                background: active ? 'var(--sf-surface-2)' : 'var(--sf-surface)',
                border: '1px solid', borderColor: active ? 'var(--sf-blue)' : 'var(--sf-border)',
                borderRadius: 8, color: active ? 'var(--sf-text)' : 'var(--sf-text-muted)',
                fontFamily: 'inherit', fontSize: 12.5, cursor: 'pointer',
                transition: 'all 0.1s ease',
              }} 
              type="button"
            >
              <Icon size={13} style={{ color: active ? 'var(--sf-blue)' : 'inherit' }} />
              {tool.name}
              {tool.recommended && (
                <span className="mono" style={{ 
                  fontSize: 8.5, marginLeft: 2, padding: '1px 4px', 
                  background: 'oklch(0.78 0.16 145 / 0.15)', color: 'oklch(0.78 0.16 145)',
                  borderRadius: 4, fontWeight: 700
                }}>REC</span>
              )}
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
