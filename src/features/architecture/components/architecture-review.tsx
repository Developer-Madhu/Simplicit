"use client";

import { useState, useMemo } from "react";
import { 
  Check, 
  AlertTriangle, 
  Edit3, 
  Info,
  Users,
  GitBranch,
  Shield,
  Database,
  Cloud,
  Zap,
  Activity,
  Layers
} from "lucide-react";
import { ArchitectureReviewState, BackendSpecification, ResolvedArchitectureState } from "../types";
import { generateArchitectureReview, calculateReadinessScore, checkGenerationGate, createBackendSpecification } from "../utils";

interface ArchitectureReviewProps {
  resolvedArchitecture: ResolvedArchitectureState;
  onApprove: (spec: BackendSpecification) => void;
  onEdit?: () => void;
}

export function ArchitectureReview({
  resolvedArchitecture,
  onApprove,
  onEdit
}: ArchitectureReviewProps) {
  // Pure projection from canonical state
  const state = useMemo(() => generateArchitectureReview(resolvedArchitecture), [resolvedArchitecture]);

  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [showScoreWarning, setShowScoreWarning] = useState(false);

  const readinessScore = useMemo(() => calculateReadinessScore(state), [state]);
  const gateErrors = useMemo(() => checkGenerationGate(state), [state]);

  const handleApprove = () => {
    const spec = createBackendSpecification(state);
    onApprove(spec);
  };

  const renderSectionHeader = (title: string, icon: any, sectionId: string, editable: boolean = true) => (
    <div className="sf-row" style={{ gap: 10, marginBottom: 12, alignItems: 'center' }}>
      {icon}
      <span className="sf-h3" style={{ margin: 0, fontSize: 15 }}>{title}</span>
      <span className="sf-grow" />
      {/* Editing disabled in pure projection mode for this sprint to ensure synchronization */}
    </div>
  );

  return (
    <div className="sf-col" style={{ gap: 24, paddingBottom: 40 }}>
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
                <h3 className="sf-h2" style={{ margin: 0, fontSize: 18 }}>Low Readiness Score</h3>
                <span className="mono" style={{ fontSize: 11, color: 'var(--sf-amber)' }}>{readinessScore}% COMPLETENESS</span>
              </div>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.6, color: 'var(--sf-text-muted)', margin: 0 }}>
              Are you willing to continue as your threshold score is less than 80%? Proceeding with a low score may result in an incomplete or inaccurate backend architecture.
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
                  const spec = createBackendSpecification(state);
                  onApprove(spec);
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
            <h2 className="sf-h1" style={{ margin: 0, fontSize: 24 }}>Verified Architecture Summary</h2>
            <p className="sf-muted" style={{ marginTop: 4, fontSize: 14 }}>
              Review the inferred system architecture and backend requirements before generation.
            </p>
          </div>
          <div style={{ width: 100, height: 100, borderRadius: 50, border: '4px solid var(--sf-border)', position: 'relative', flex: '0 0 auto', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
             <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, color: readinessScore > 80 ? 'var(--sf-green)' : 'var(--sf-amber)' }}>{readinessScore}%</div>
             <div className="mono" style={{ fontSize: 9, color: 'var(--sf-text-faint)', textTransform: 'uppercase', marginTop: 2 }}>Readiness</div>
             <svg viewBox="0 0 108 108" style={{ position: 'absolute', inset: -4, width: 108, height: 108, transform: 'rotate(-90deg)', overflow: 'visible' }}>
                <circle
                  cx="54" cy="54" r="50"
                  fill="none" stroke="var(--sf-blue)" strokeWidth="4"
                  strokeDasharray={`${(readinessScore / 100) * 314} 314`}
                  style={{ transition: 'stroke-dasharray 0.5s ease' }}
                />
             </svg>
          </div>
        </div>
      </div>

      {/* Grid Content */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        
        {/* Project Overview */}
        <div className="sf-card" style={{ padding: 18 }}>
          {renderSectionHeader("Project Overview", <Info size={16} className="sf-blue" />, "overview", false)}
          <div className="sf-col" style={{ gap: 12 }}>
            <div className="sf-row" style={{ justifyContent: 'space-between' }}>
              <span className="sf-muted" style={{ fontSize: 12 }}>Application Type</span>
              <span className="mono" style={{ fontSize: 12 }}>{state.overview.type}</span>
            </div>
            <div className="sf-row" style={{ justifyContent: 'space-between' }}>
              <span className="sf-muted" style={{ fontSize: 12 }}>Complexity Score</span>
              <span className="sf-chip sf-chip--sm" style={{ height: 20 }}>{state.overview.complexity}/100</span>
            </div>
            <div className="sf-col" style={{ gap: 4 }}>
              <span className="sf-muted" style={{ fontSize: 12 }}>Description</span>
              <p style={{ fontSize: 13, margin: 0, lineHeight: 1.4 }}>{state.overview.description}</p>
            </div>
          </div>
        </div>

        {/* Confidence Levels */}
        <div className="sf-card" style={{ padding: 18 }}>
          {renderSectionHeader("Architecture Confidence", <Activity size={16} className="sf-purple" />, "confidence", false)}
          <div className="sf-col" style={{ gap: 10 }}>
            {Object.entries(state.confidenceLevels).map(([key, value]) => (
              <div key={key} className="sf-col" style={{ gap: 4 }}>
                <div className="sf-row" style={{ justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12 }}>{key}</span>
                  <span className="mono" style={{ fontSize: 11, color: value > 80 ? 'var(--sf-green)' : 'var(--sf-amber)' }}>{value}%</span>
                </div>
                <div style={{ height: 4, background: 'var(--sf-border)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${value}%`, background: value > 80 ? 'var(--sf-green)' : 'var(--sf-amber)', opacity: 0.6 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Users & Roles */}
        <div className="sf-card" style={{ padding: 18 }}>
          {renderSectionHeader("Users & Roles", <Users size={16} className="sf-green" />, "roles", false)}
          <div className="sf-col" style={{ gap: 8 }}>
            {state.roles.map((role, i) => (
                <div key={i} className="sf-row" style={{ gap: 10, padding: '6px 10px', background: 'var(--sf-surface)', borderRadius: 6, border: '1px solid var(--sf-border)' }}>
                  <span className="mono" style={{ fontSize: 12, fontWeight: 600 }}>{role.name}</span>
                  <span className="sf-muted" style={{ fontSize: 11 }}>— {role.description}</span>
                </div>
              ))
            }
          </div>
        </div>

        {/* Business Capabilities */}
        <div className="sf-card" style={{ padding: 18 }}>
          {renderSectionHeader("Business Capabilities", <GitBranch size={16} className="sf-amber" />, "capabilities", false)}
          <div className="sf-col" style={{ gap: 10 }}>
            {state.capabilities.map((cap, i) => (
              <div key={i} className="sf-col" style={{ padding: '8px 10px', background: 'var(--sf-surface)', borderRadius: 6, border: '1px solid var(--sf-border)', gap: 4 }}>
                <div className="sf-row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{cap.name}</span>
                    <span className="sf-chip sf-chip--sm" style={{ fontSize: 9 }}>{cap.category.replace('_MANAGEMENT', '')}</span>
                </div>
                <p style={{ fontSize: 11, color: 'var(--sf-text-muted)', margin: 0 }}>{cap.description}</p>
                <div className="sf-row" style={{ gap: 4, marginTop: 2 }}>
                    <span className="mono" style={{ fontSize: 9, color: 'var(--sf-text-faint)' }}>{cap.evidence.length} signals</span>
                    <span className="mono" style={{ fontSize: 9, color: cap.confidence > 80 ? 'var(--sf-green)' : 'var(--sf-amber)' }}>{cap.confidence}% conf.</span>
                </div>
              </div>
            ))}
            {state.capabilities.length === 0 && <span className="sf-muted" style={{ fontSize: 12 }}>No capabilities reconstructed.</span>}
          </div>
        </div>

        {/* Business Rules */}
        <div className="sf-card" style={{ padding: 18 }}>
          {renderSectionHeader("Business Rules", <Shield size={16} className="sf-red" />, "businessRules", false)}
          <div className="sf-col" style={{ gap: 8 }}>
            {state.businessRules.map((rule, i) => (
                <div key={i} className="sf-row" style={{ gap: 10, padding: '6px 10px', background: 'var(--sf-surface)', borderRadius: 6, border: '1px solid var(--sf-border)' }}>
                  <span style={{ fontSize: 12 }}>{rule.rule}</span>
                </div>
              ))
            }
            {state.businessRules.length === 0 && <span className="sf-muted" style={{ fontSize: 12 }}>No business rules identified.</span>}
          </div>
        </div>

        {/* Data Models */}
        <div className="sf-card" style={{ padding: 18 }}>
          {renderSectionHeader("Entities / Data Models", <Database size={16} className="sf-blue" />, "entities", false)}
          <div className="sf-row" style={{ flexWrap: 'wrap', gap: 6 }}>
            {state.entities.map((ent, i) => (
                <span key={i} className="sf-chip" style={{ fontSize: 11, padding: '4px 8px' }}>
                  {ent.name}
                </span>
              ))
            }
          </div>
        </div>

        {/* Integrations */}
        <div className="sf-card" style={{ padding: 18 }}>
          {renderSectionHeader("Integrations", <Layers size={16} className="sf-purple" />, "integrations", false)}
          <div className="sf-col" style={{ gap: 8 }}>
            {state.integrations.map((int, i) => (
              <div key={i} className="sf-row" style={{ gap: 8, alignItems: 'center' }}>
                <div style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--sf-purple)' }} />
                <span style={{ fontSize: 12.5 }}>{int.name}</span>
                {int.provider && <span className="sf-chip sf-chip--sm" style={{ fontSize: 10 }}>{int.provider}</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Backend Requirements */}
        <div className="sf-card" style={{ padding: 18 }}>
          {renderSectionHeader("Backend Requirements", <Shield size={16} className="sf-red" />, "requirements", false)}
          <div className="sf-col" style={{ gap: 8 }}>
            {state.requirements.map((req, i) => (
              <div key={i} className="sf-row" style={{ gap: 10, alignItems: 'center' }}>
                <div style={{ 
                  width: 14, height: 14, borderRadius: 7, 
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: req.status === 'required' ? 'var(--sf-green)' : 'var(--sf-surface-2)',
                  color: 'white'
                }}>
                  {req.status === 'required' ? <Check size={8} /> : null}
                </div>
                <div className="sf-col">
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>{req.name}</span>
                  <span style={{ fontSize: 11, color: 'var(--sf-text-muted)' }}>{req.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Infrastructure */}
        <div className="sf-card" style={{ padding: 18 }}>
          {renderSectionHeader("Infrastructure", <Cloud size={16} className="sf-blue" />, "infrastructure", false)}
          <div className="sf-col" style={{ gap: 10 }}>
            {[
              { label: "Database", value: state.infrastructure.database },
              { label: "Storage", value: state.infrastructure.storage },
              { label: "Hosting", value: state.infrastructure.hosting },
            ].map((inf, i) => (
              <div key={i} className="sf-row" style={{ justifyContent: 'space-between' }}>
                <span className="sf-muted" style={{ fontSize: 12 }}>{inf.label}</span>
                <span className="mono" style={{ fontSize: 11.5 }}>{inf.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Architecture Gaps */}
      {state.gaps && state.gaps.length > 0 && (
        <div className="sf-card" style={{ padding: 20, border: '1px solid var(--sf-amber-faint)', background: 'rgba(255,180,0,0.03)' }}>
          <div className="sf-row" style={{ gap: 10, marginBottom: 16, alignItems: 'center' }}>
            <AlertTriangle size={18} className="sf-amber" />
            <span className="sf-h3" style={{ margin: 0 }}>Architecture Gaps Detected</span>
          </div>
          <div className="sf-col" style={{ gap: 12 }}>
            {state.gaps.map((gap, i) => (
              <div key={i} className="sf-row" style={{ gap: 12, padding: 12, background: 'var(--sf-surface)', borderRadius: 8, border: '1px solid var(--sf-border)' }}>
                <div className={`sf-chip sf-chip--sm ${gap.severity === 'critical' ? 'sf-chip--red' : 'sf-chip--amber'}`} style={{ height: 20 }}>
                  {gap.severity}
                </div>
                <div className="sf-col sf-grow">
                  <span style={{ fontSize: 13, fontWeight: 500 }}>{gap.description}</span>
                  <span className="sf-muted" style={{ fontSize: 11 }}>Impact: {gap.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gate / Errors */}
      {gateErrors.length > 0 && (
        <div className="sf-card" style={{ padding: 16, border: '1px solid rgba(255,90,90,0.2)', background: 'rgba(255,90,90,0.05)' }}>
          <div className="sf-row" style={{ gap: 8, marginBottom: 12 }}>
            <AlertTriangle size={16} style={{ color: 'var(--sf-red)' }} />
            <span style={{ fontWeight: 600, color: 'var(--sf-red)', fontSize: 14 }}>Missing Requirements</span>
          </div>
          <div className="sf-col" style={{ gap: 8 }}>
            {gateErrors.map((err, i) => (
              <div key={i} className="sf-row" style={{ gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--sf-text)' }}>{err}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Actions */}
      <div className="sf-row" style={{ gap: 12, justifyContent: 'flex-end', paddingTop: 10, borderTop: '1px solid var(--sf-border)' }}>
        <button 
          onClick={onEdit}
          className="sf-btn sf-btn--ghost" 
          style={{ padding: '0 20px', height: 40 }}
        >
          Return to Prompt
        </button>
        <button 
          onClick={handleApprove}
          className="sf-btn sf-btn--primary" 
          style={{ padding: '0 24px', height: 40, gap: 8 }}
        >
          {readinessScore >= 90 ? <Zap size={14} /> : <Check size={14} />}
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
