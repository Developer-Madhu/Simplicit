"use client";

import { useState, useMemo } from "react";
import { 
  Box, 
  Database, 
  Globe, 
  Server, 
  HardDrive, 
  Layers, 
  Zap, 
  Lock,
  ChevronRight,
  ChevronDown,
  Code,
  FileText,
  Check,
  Edit3,
  X,
  Shield,
  Activity,
  AlertTriangle,
  Info,
  GitBranch,
  Settings,
  Webhook,
  Search,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  ChevronLeft
} from "lucide-react";
import { useRef, useEffect } from "react";
import { BackendBlueprint, BlueprintModule, BlueprintEntity, BlueprintAPI } from "../types";
import { ArchitectureGraph } from "./architecture-graph";

interface BlueprintReviewProps {
  blueprint: BackendBlueprint;
  onApprove: (blueprint: BackendBlueprint) => void;
  onEdit?: () => void;
}

export function BlueprintReview({
  blueprint: initialBlueprint,
  onApprove,
  onEdit
}: BlueprintReviewProps) {
  const [blueprint, setBlueprint] = useState<BackendBlueprint>(initialBlueprint);

  // Runtime assertion for UI consistency validation
  const renderedEntities = blueprint.entities;
  if (blueprint.entities.length > 0 && renderedEntities.length === 0) {
    throw new Error("UI entity desynchronization detected");
  }

  const [activeTab, setActiveTab] = useState<'summary' | 'modules' | 'entities' | 'apis' | 'infra' | 'rules' | 'security' | 'suggestions' | 'capabilities' | 'graph'>('summary');
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [showScoreWarning, setShowScoreWarning] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);

  const tabs = [
    { id: 'summary', label: 'Summary', icon: <FileText size={14} /> },
    { id: 'graph', label: 'Architecture Graph', icon: <GitBranch size={14} /> },
    { id: 'modules', label: 'Modules', icon: <Box size={14} /> },
    { id: 'capabilities', label: 'Capabilities', icon: <Zap size={14} /> },
    { id: 'entities', label: 'Database', icon: <Database size={14} /> },
    { id: 'apis', label: 'API Surface', icon: <Globe size={14} /> },
    { id: 'infra', label: 'Infrastructure', icon: <Layers size={14} /> },
    { id: 'suggestions', label: 'Suggestions', icon: <Lightbulb size={14} /> },
    { id: 'security', label: 'Security', icon: <Lock size={14} /> },
  ] as const;

  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 10);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = 200;
      scrollRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
    }
  };

  const isBlocked = blueprint.readinessScore < 80;

  const handleApprove = () => {
    if (blueprint.readinessScore < 80 && !showScoreWarning) {
      setShowScoreWarning(true);
      return;
    }
    onApprove(blueprint);
  };

  return (
    <div className="sf-col" style={{ gap: 20, paddingBottom: 40 }}>
      {showScoreWarning && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', 
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="sf-card-elev" style={{ width: 420, padding: 28, background: 'var(--sf-bg-2)', gap: 20, display: 'flex', flexDirection: 'column', border: '1px solid var(--sf-border)' }}>
            <div className="sf-row" style={{ gap: 14, alignItems: 'center' }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,180,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={24} className="sf-amber" />
              </div>
              <div className="sf-col">
                <h3 className="sf-h2" style={{ margin: 0, fontSize: 18 }}>Low Blueprint Score</h3>
                <span className="mono" style={{ fontSize: 11, color: 'var(--sf-amber)' }}>{blueprint.readinessScore}% COMPLETENESS</span>
              </div>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--sf-text-muted)', margin: 0 }}>
              Are you willing to continue as your threshold score is less than 80%? Proceeding with a low score may result in an incomplete backend architecture.
            </p>
            <div className="sf-row" style={{ gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
              <button 
                onClick={() => setShowScoreWarning(false)}
                className="sf-btn sf-btn--ghost"
                style={{ padding: '0 20px', height: 38 }}
              >
                Discard
              </button>
              <button 
                onClick={() => {
                  setShowScoreWarning(false);
                  onApprove(blueprint);
                }}
                className="sf-btn sf-btn--primary"
                style={{ padding: '0 24px', height: 38, gap: 8 }}
              >
                Continue <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header & Readiness */}
      <div className="sf-card-elev" style={{ padding: 24, background: 'var(--sf-bg-2)' }}>
        <div className="sf-row" style={{ gap: 20, alignItems: 'center' }}>
          <div className="sf-col sf-grow">
            <h2 className="sf-h1" style={{ margin: 0, fontSize: 24 }}>Deterministic Backend Blueprint</h2>
            <p className="sf-muted" style={{ marginTop: 4, fontSize: 14 }}>
              Evidence-first architecture derived from repository source code and structural signals.
            </p>
          </div>
          <div className="sf-col sf-center" style={{ width: 100, height: 100, borderRadius: 50, border: '4px solid var(--sf-border)', position: 'relative' }}>
             <div style={{ fontSize: 24, fontWeight: 700, color: isBlocked ? 'var(--sf-red)' : 'var(--sf-green)' }}>{blueprint.readinessScore}%</div>
             <div className="mono" style={{ fontSize: 9, color: 'var(--sf-text-faint)', textTransform: 'uppercase', marginTop: -2 }}>Score</div>
             <svg style={{ position: 'absolute', inset: -4, width: 108, height: 108, transform: 'rotate(-90deg)' }}>
                <circle 
                  cx="54" cy="54" r="50" 
                  fill="none" stroke={isBlocked ? 'var(--sf-red)' : 'var(--sf-green)'} strokeWidth="4" 
                  strokeDasharray={`${(blueprint.readinessScore / 100) * 314} 314`}
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
             </svg>
          </div>
        </div>
      </div>

      {/* Navigation with Arrow Buttons */}
      <div className="sf-row group" style={{ position: 'relative', alignItems: 'center' }}>
        {showLeftArrow && (
          <button 
            onClick={() => scroll('left')}
            className="sf-btn sf-btn--ghost"
            style={{ position: 'absolute', left: -12, zIndex: 10, background: 'var(--sf-bg)', borderRadius: '50%', width: 32, height: 32, padding: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', border: '1px solid var(--sf-border)' }}
          >
            <ChevronLeft size={16} />
          </button>
        )}
        
        <div 
          ref={scrollRef}
          onScroll={checkScroll}
          className="sf-row no-scrollbar" 
          style={{ gap: 8, overflowX: 'auto', paddingBottom: 4, scrollBehavior: 'smooth', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style dangerouslySetInnerHTML={{ __html: `.no-scrollbar::-webkit-scrollbar { display: none; }` }} />
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`sf-btn sf-btn--sm ${activeTab === tab.id ? 'sf-btn--primary' : 'sf-btn--ghost'}`}
              style={{ gap: 8, padding: '0 16px', height: 32, flexShrink: 0 }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {showRightArrow && (
          <button 
            onClick={() => scroll('right')}
            className="sf-btn sf-btn--ghost"
            style={{ position: 'absolute', right: -12, zIndex: 10, background: 'var(--sf-bg)', borderRadius: '50%', width: 32, height: 32, padding: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.5)', border: '1px solid var(--sf-border)' }}
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Main Content Area */}
      <div className="sf-card" style={{ padding: 0, minHeight: 500, display: 'flex', flexDirection: 'column' }}>
        <div className="sf-scroll sf-grow" style={{ padding: 24 }}>
          
          {/* Summary Tab */}
          {activeTab === 'summary' && (
            <div className="sf-col" style={{ gap: 24 }}>
              <div className="sf-col" style={{ gap: 8 }}>
                <span className="sf-h3">Executive Summary</span>
                <p className="sf-muted" style={{ fontSize: 14, lineHeight: 1.6 }}>{blueprint.summary}</p>
              </div>

              {blueprint.validationErrors.length > 0 && (
                <div className="sf-card" style={{ padding: 16, border: '1px solid rgba(255,90,90,0.2)', background: 'rgba(255,90,90,0.05)' }}>
                  <div className="sf-row" style={{ gap: 8, marginBottom: 12 }}>
                    <AlertTriangle size={16} style={{ color: 'var(--sf-red)' }} />
                    <span style={{ fontWeight: 600, color: 'var(--sf-red)', fontSize: 14 }}>Blueprint Quality Validation</span>
                  </div>
                  <ul className="sf-col" style={{ gap: 8, paddingLeft: 20, margin: 0 }}>
                    {blueprint.validationErrors.map((err, i) => (
                      <li key={i} style={{ fontSize: 13, color: 'var(--sf-text)' }}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Architecture Graph Tab (NEW) */}
          {activeTab === 'graph' && (
            <div className="sf-col sf-grow" style={{ minHeight: 600 }}>
              <ArchitectureGraph blueprint={blueprint} />
            </div>
          )}

          {/* Suggestions Tab (Rule #2) */}
          {activeTab === 'suggestions' && (
            <div className="sf-col" style={{ gap: 12 }}>
               <div className="sf-row" style={{ gap: 8, marginBottom: 10 }}>
                  <Lightbulb size={18} className="sf-amber" />
                  <span className="sf-h3" style={{ margin: 0 }}>Pattern Recommendations</span>
               </div>
               <p className="sf-muted" style={{ fontSize: 13, marginBottom: 16 }}>
                  Patterns are advisory recommendations based on structural signals. They do not modify your core domain architecture.
               </p>
               {(blueprint as any).suggestions?.map((s: any, i: number) => (
                 <div key={i} className="sf-card" style={{ padding: 20 }}>
                    <div className="sf-row" style={{ justifyContent: 'space-between', marginBottom: 12 }}>
                       <span style={{ fontWeight: 600, fontSize: 16 }}>{s.name}</span>
                       <span className="mono" style={{ fontSize: 11, color: 'var(--sf-amber)' }}>{s.confidence}% Match</span>
                    </div>
                    <p className="sf-muted" style={{ fontSize: 13, marginBottom: 16 }}>{s.description}</p>
                    <div className="sf-col" style={{ gap: 8 }}>
                       <span className="mono" style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--sf-text-faint)' }}>Pattern Evidence</span>
                       <div className="sf-row" style={{ flexWrap: 'wrap', gap: 6 }}>
                          {s.evidence.map((ev: any, ei: number) => (
                            <span key={ei} className="sf-chip sf-chip--sm">{ev.originalValue}</span>
                          ))}
                       </div>
                    </div>
                 </div>
               ))}
               {(!blueprint.suggestions || (blueprint as any).suggestions?.length === 0) && (
                 <div className="sf-center sf-muted" style={{ height: 200 }}>No strong architectural patterns detected.</div>
               )}
            </div>
          )}

          {/* Entities Tab (Rule #10 Explainability) */}
          {activeTab === 'entities' && (
            <div className="sf-col" style={{ gap: 12 }}>
              {blueprint.entities.map((ent, i) => (
                <div key={i} className="sf-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div 
                    onClick={() => setExpandedItem(expandedItem === ent.name ? null : ent.name)}
                    className="sf-row" 
                    style={{ padding: '12px 16px', cursor: 'pointer', background: 'var(--sf-surface)', borderBottom: expandedItem === ent.name ? '1px solid var(--sf-border)' : 'none' }}
                  >
                    <Database size={14} className="sf-blue" style={{ marginRight: 10 }} />
                    <span style={{ fontWeight: 600, fontSize: 14 }}>{ent.name}</span>
                    <span className="sf-grow" />
                    <span className="mono sf-faint" style={{ fontSize: 11 }}>table: {ent.table}</span>
                    {expandedItem === ent.name ? <ChevronDown size={14} style={{ marginLeft: 10 }} /> : <ChevronRight size={14} style={{ marginLeft: 10 }} />}
                  </div>
                  {expandedItem === ent.name && (
                    <div className="sf-col" style={{ padding: 20, gap: 16 }}>
                      
                      {/* Explainability Log (Rule #10) */}
                      <div className="sf-card" style={{ padding: 12, background: 'rgba(0,120,255,0.03)', border: '1px dashed var(--sf-blue)' }}>
                         <div className="sf-row" style={{ gap: 8, marginBottom: 8, alignItems: 'center' }}>
                            <Search size={14} className="sf-blue" />
                            <span style={{ fontWeight: 600, fontSize: 12, color: 'var(--sf-blue)' }}>Chain of Evidence</span>
                         </div>
                         <div className="sf-col" style={{ gap: 6 }}>
                            {ent.evidence?.map((ev, ei) => (
                              <div key={ei} className="sf-row" style={{ gap: 8, alignItems: 'center' }}>
                                <div style={{ width: 4, height: 4, borderRadius: 2, background: 'var(--sf-blue)' }} />
                                <span className="mono" style={{ fontSize: 11 }}>{ev.originalValue}</span>
                                <span className="sf-muted" style={{ fontSize: 10 }}>({ev.className})</span>
                                <span className="sf-grow" />
                                <span className="mono" style={{ fontSize: 10, color: 'var(--sf-text-faint)' }}>{Math.round(ev.confidence * 100)}% weight</span>
                              </div>
                            ))}
                         </div>
                      </div>

                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                          <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--sf-border)' }}>
                            <th className="mono" style={{ padding: '10px 0', fontSize: 10, color: 'var(--sf-text-faint)' }}>Column</th>
                            <th className="mono" style={{ padding: '10px 0', fontSize: 10, color: 'var(--sf-text-faint)' }}>Type</th>
                            <th className="mono" style={{ padding: '10px 0', fontSize: 10, color: 'var(--sf-text-faint)' }}>Attributes</th>
                          </tr>
                        </thead>
                        <tbody>
                          {ent.fields.map((f, fi) => (
                            <tr key={fi} style={{ borderBottom: '1px dashed var(--sf-border)' }}>
                              <td className="mono" style={{ padding: '10px 0', fontSize: 12.5 }}>{f.name}</td>
                              <td className="mono" style={{ padding: '10px 0', fontSize: 12.5, color: 'var(--sf-blue)' }}>{f.type}</td>
                              <td style={{ padding: '10px 0', fontSize: 11 }}>
                                {f.isPrimary && <span className="sf-chip sf-chip--sm" style={{ marginRight: 4, borderColor: 'var(--sf-amber)', color: 'var(--sf-amber)' }}>PK</span>}
                                {f.references && <span className="sf-chip sf-chip--sm" style={{ color: 'var(--sf-purple)', borderColor: 'var(--sf-purple)' }}>FK: {f.references}</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Capabilities Tab (NEW) */}
          {activeTab === 'capabilities' && (
            <div className="sf-col" style={{ gap: 20 }}>
               <div className="sf-row" style={{ gap: 8, marginBottom: 10 }}>
                  <Zap size={18} className="sf-amber" />
                  <span className="sf-h3" style={{ margin: 0 }}>Business Capabilities</span>
               </div>
               <p className="sf-muted" style={{ fontSize: 13, marginBottom: 16 }}>
                  Reconstructed business-level operations derived from code intent and structural signals.
               </p>
               
               {/* Group by Category */}
               {Array.from(new Set(blueprint.capabilities.map(c => c.category))).map((cat, ci) => (
                 <div key={ci} className="sf-col" style={{ gap: 10, marginBottom: 10 }}>
                    <span className="mono" style={{ fontSize: 10, textTransform: 'uppercase', color: 'var(--sf-text-faint)' }}>{cat.replace('_', ' ')}</span>
                    {blueprint.capabilities.filter(c => c.category === cat).map((cap, i) => (
                      <div key={i} className="sf-card" style={{ padding: 16 }}>
                         <div className="sf-row" style={{ justifyContent: 'space-between', marginBottom: 8, alignItems: 'center' }}>
                            <span style={{ fontWeight: 600, fontSize: 14 }}>{cap.name}</span>
                            <div className="sf-row" style={{ gap: 8, alignItems: 'center' }}>
                               <span className="sf-chip sf-chip--sm">{cap.evidence.length} signals</span>
                               <span className="mono" style={{ fontSize: 11, color: cap.confidence > 80 ? 'var(--sf-green)' : 'var(--sf-amber)' }}>{cap.confidence}%</span>
                            </div>
                         </div>
                         <p className="sf-muted" style={{ fontSize: 12.5, marginBottom: 12 }}>{cap.description}</p>
                         
                         {/* Explainability for Capability */}
                         <div className="sf-card" style={{ padding: 10, background: 'var(--sf-surface-2)', border: '1px dashed var(--sf-border)' }}>
                            <div className="sf-row" style={{ gap: 6, marginBottom: 6, alignItems: 'center' }}>
                               <Search size={12} className="sf-blue" />
                               <span style={{ fontWeight: 600, fontSize: 11, color: 'var(--sf-blue)' }}>Capability Evidence</span>
                            </div>
                            <div className="sf-col" style={{ gap: 4 }}>
                               {cap.evidence.slice(0, 3).map((ev: any, ei: number) => (
                                 <div key={ei} className="sf-row" style={{ gap: 6, alignItems: 'center' }}>
                                    <div style={{ width: 3, height: 3, borderRadius: 1.5, background: 'var(--sf-text-faint)' }} />
                                    <span className="mono" style={{ fontSize: 10.5 }}>{ev.originalValue}</span>
                                    <span className="sf-muted" style={{ fontSize: 9.5 }}>({ev.sourceType})</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                    ))}
                 </div>
               ))}

               {blueprint.capabilities.length === 0 && (
                 <div className="sf-center sf-muted" style={{ height: 200 }}>Insufficient evidence to reconstruct business capabilities.</div>
               )}
            </div>
          )}

          {/* Other tabs follow similar structure... */}

        </div>
      </div>

      {/* Footer Actions */}
      <div className="sf-row" style={{ gap: 12, justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--sf-border)' }}>
        <button 
          onClick={onEdit}
          className="sf-btn sf-btn--ghost" 
          style={{ padding: '0 20px', height: 40 }}
        >
          Adjust Architecture
        </button>
        <button 
          onClick={handleApprove}
          className="sf-btn sf-btn--primary" 
          style={{ padding: '0 24px', height: 40, gap: 8 }}
        >
          {blueprint.readinessScore >= 90 ? <Zap size={14} /> : <Check size={14} />}
          Approve & Generate Backend
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}

function ArrowRight({ size, style }: { size?: number, style?: any }) {
  return (
    <svg 
      width={size || 16} 
      height={size || 16} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      style={style}
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
