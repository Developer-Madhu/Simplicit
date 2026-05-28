"use client";

import { useState } from "react";
import { 
  CheckCircle2, AlertCircle, Info, Workflow, Users, 
  Database, Globe, Shield, Code2, ArrowRight, ChevronRight,
  ClipboardCheck, ListTodo, Route, Layout
} from "lucide-react";
import type { IngestionResult, SimplicitContext } from "../types";

interface ContextReviewProps {
  result: IngestionResult;
  onConfirm: () => void;
  onCancel: () => void;
}

function SummaryItem({ label, value }: { label: string, value: string }) {
  if (!value) return null;
  return (
    <div className="sf-col" style={{ gap: 2 }}>
       <span className="mono" style={{ fontSize: 10, color: 'var(--sf-text-faint)', textTransform: 'uppercase' }}>{label}</span>
       <span style={{ fontSize: 12.5, color: 'var(--sf-text)' }}>{value}</span>
    </div>
  );
}

export function ContextReview({ result, onConfirm, onCancel }: ContextReviewProps) {
  const [activeSection, setActiveSection] = useState<string>("overview");

  const ctx = result.simplicitContext;
  if (!ctx) return null;

  const sections = [
    { id: "overview", label: "Overview", icon: Info },
    { id: "frontend", label: "Frontend Stack", icon: Layout },
    { id: "rules", label: "Business Rules", icon: ListTodo },
    { id: "validation", label: "Validation Rules", icon: Shield },
    { id: "journeys", label: "User Journeys", icon: Workflow },
    { id: "workflows", label: "Workflows", icon: Workflow },
    { id: "models", label: "Data Models", icon: Database },
    { id: "roles", label: "Roles", icon: Users },
    { id: "endpoints", label: "Endpoints", icon: Route },
    { id: "infra", label: "Infrastructure", icon: Globe },
  ];

  return (
    <div className="sf-col" style={{ gap: 16 }}>
      {/* Header Info */}
      <div className="sf-row" style={{ gap: 10, paddingBottom: 12, borderBottom: '1px solid var(--sf-border)' }}>
        <div style={{ padding: 8, background: 'var(--sf-bg)', borderRadius: 8, border: '1px solid var(--sf-border)' }}>
          <ClipboardCheck size={18} style={{ color: 'oklch(0.78 0.16 145)' }} />
        </div>
        <div className="sf-col" style={{ gap: 2 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--sf-text)' }}>Specification Review</span>
          <span style={{ fontSize: 12, color: 'var(--sf-text-muted)' }}>Confirm the extracted requirements from simplicit.context.md</span>
        </div>
      </div>

      {/* Validation Status */}
      {(ctx.validation.errors.length > 0 || ctx.validation.warnings.length > 0) && (
        <div className="sf-col" style={{ gap: 6, padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, border: '1px solid var(--sf-border)' }}>
          {ctx.validation.errors.map((err, i) => (
            <div key={i} className="sf-row" style={{ gap: 8 }}>
              <AlertCircle size={12} style={{ color: 'var(--sf-red)' }} />
              <span style={{ fontSize: 11.5, color: 'var(--sf-text-muted)' }}>{err}</span>
            </div>
          ))}
          {ctx.validation.warnings.map((warn, i) => (
            <div key={i} className="sf-row" style={{ gap: 8 }}>
              <Info size={12} style={{ color: 'var(--sf-amber)' }} />
              <span style={{ fontSize: 11.5, color: 'var(--sf-text-muted)' }}>{warn}</span>
            </div>
          ))}
        </div>
      )}

      {/* Two Column Layout */}
      <div className="sf-row" style={{ gap: 20, alignItems: 'flex-start' }}>
        {/* Nav */}
        <div className="sf-col" style={{ width: 160, gap: 2 }}>
          {sections.map(s => {
            const Icon = s.icon;
            const active = activeSection === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className="sf-row"
                style={{
                  gap: 8, padding: '6px 10px', borderRadius: 6,
                  background: active ? 'var(--sf-surface)' : 'transparent',
                  color: active ? 'var(--sf-text)' : 'var(--sf-text-faint)',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                  fontSize: 12, transition: 'all 0.1s ease'
                }}
              >
                <Icon size={13} />
                {s.label}
              </button>
            );
          })}
        </div>

        {/* Content Area */}
        <div className="sf-grow sf-scroll" style={{ 
          height: 280, padding: '12px 14px', background: 'var(--sf-bg)', 
          borderRadius: 8, border: '1px solid var(--sf-border)',
          overflowY: 'auto'
        }}>
          {activeSection === "overview" && (
            <div className="sf-col" style={{ gap: 12 }}>
              <div className="sf-col" style={{ gap: 4 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--sf-text-faint)', textTransform: 'uppercase' }}>Project Name</span>
                <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--sf-text)' }}>{ctx.overview.name}</span>
              </div>
              <div className="sf-col" style={{ gap: 4 }}>
                <span className="mono" style={{ fontSize: 10, color: 'var(--sf-text-faint)', textTransform: 'uppercase' }}>Description</span>
                <span style={{ fontSize: 12.5, color: 'var(--sf-text-muted)', lineHeight: 1.5 }}>{ctx.overview.description}</span>
              </div>
              {ctx.overview.goals.length > 0 && (
                <div className="sf-col" style={{ gap: 6 }}>
                  <span className="mono" style={{ fontSize: 10, color: 'var(--sf-text-faint)', textTransform: 'uppercase' }}>Core Goals</span>
                  {ctx.overview.goals.map((g, i) => (
                    <div key={i} className="sf-row" style={{ gap: 8, fontSize: 12, color: 'var(--sf-text-muted)' }}>
                      <div style={{ width: 4, height: 4, borderRadius: '50%', background: 'var(--sf-blue)', marginTop: 6 }} />
                      {g}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeSection === "frontend" && (
            <div className="sf-col" style={{ gap: 12 }}>
               <SummaryItem label="Framework" value={ctx.frontendStack.framework} />
               <SummaryItem label="Runtime" value={ctx.frontendStack.runtime} />
               <SummaryItem label="UI Libraries" value={ctx.frontendStack.uiLibraries.join(", ")} />
               <SummaryItem label="State Management" value={ctx.frontendStack.stateLibraries.join(", ")} />
               <SummaryItem label="Language" value={ctx.frontendStack.language} />
            </div>
          )}

          {activeSection === "validation" && (
            <div className="sf-col" style={{ gap: 10 }}>
              {ctx.validationRules.length === 0 && <span style={{ fontSize: 12, color: 'var(--sf-text-faint)' }}>No validation rules defined.</span>}
              {ctx.validationRules.map((v, i) => (
                <div key={i} className="sf-col" style={{ gap: 4, paddingBottom: 8, borderBottom: '1px solid var(--sf-border)' }}>
                   <span className="mono" style={{ fontSize: 12, fontWeight: 600, color: 'var(--sf-text)' }}>{v.field}</span>
                   <div style={{ fontSize: 11.5, color: 'var(--sf-text-muted)' }}>Rule: {v.rule}</div>
                   <div style={{ fontSize: 11, color: 'var(--sf-red)', fontStyle: 'italic' }}>Error: {v.errorMessage}</div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "workflows" && (
            <div className="sf-col" style={{ gap: 12 }}>
              {ctx.workflows.length === 0 && <span style={{ fontSize: 12, color: 'var(--sf-text-faint)' }}>No workflows defined.</span>}
              {ctx.workflows.map((w, i) => (
                <div key={i} className="sf-col" style={{ gap: 6, paddingBottom: 10, borderBottom: '1px solid var(--sf-border)' }}>
                   <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--sf-text)' }}>{w.name}</span>
                   <span style={{ fontSize: 12, color: 'var(--sf-text-muted)' }}>{w.description}</span>
                   <div className="sf-col" style={{ gap: 2 }}>
                      <span className="mono" style={{ fontSize: 9, color: 'var(--sf-text-faint)' }}>TRIGGER: {w.trigger}</span>
                      <span className="mono" style={{ fontSize: 9, color: 'oklch(0.78 0.16 145)' }}>OUTCOME: {w.outcome}</span>
                   </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "rules" && (
            <div className="sf-col" style={{ gap: 10 }}>
              {ctx.businessRules.length === 0 && <span style={{ fontSize: 12, color: 'var(--sf-text-faint)' }}>No rules defined.</span>}
              {ctx.businessRules.map((rule, i) => (
                <div key={i} className="sf-col" style={{ gap: 4, paddingBottom: 8, borderBottom: i < ctx.businessRules.length -1 ? '1px solid var(--sf-border)' : 'none' }}>
                  <div className="sf-row" style={{ gap: 6 }}>
                    <span className="mono" style={{ fontSize: 10, color: 'var(--sf-blue)' }}>{rule.id}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--sf-text)' }}>{rule.rule}</span>
                  </div>
                  {rule.impact && <span style={{ fontSize: 11.5, color: 'var(--sf-text-muted)', paddingLeft: 34 }}>{rule.impact}</span>}
                </div>
              ))}
            </div>
          )}

          {activeSection === "journeys" && (
            <div className="sf-col" style={{ gap: 14 }}>
              {ctx.userJourneys.length === 0 && <span style={{ fontSize: 12, color: 'var(--sf-text-faint)' }}>No journeys defined.</span>}
              {ctx.userJourneys.map((j, i) => (
                <div key={i} className="sf-col" style={{ gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--sf-text)' }}>{j.name}</span>
                  <div className="sf-col" style={{ gap: 4, paddingLeft: 8 }}>
                    {j.steps.map((s, idx) => (
                      <div key={idx} className="sf-row" style={{ gap: 8, fontSize: 11.5, color: 'var(--sf-text-muted)' }}>
                        <span className="mono" style={{ color: 'var(--sf-text-faint)', width: 14 }}>{idx + 1}.</span>
                        {s}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "models" && (
            <div className="sf-col" style={{ gap: 14 }}>
              {ctx.dataModels.length === 0 && <span style={{ fontSize: 12, color: 'var(--sf-text-faint)' }}>No models defined.</span>}
              {ctx.dataModels.map((m, i) => (
                <div key={i} className="sf-col" style={{ gap: 6 }}>
                  <span className="mono" style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--sf-blue)' }}>{m.name}</span>
                  <div className="sf-row" style={{ gap: 6, flexWrap: 'wrap' }}>
                    {m.fields.map(f => (
                      <span key={f} className="sf-chip sf-chip-mono" style={{ fontSize: 10, height: 18 }}>{f}</span>
                    ))}
                  </div>
                  {m.relations.length > 0 && (
                    <div className="sf-col" style={{ gap: 2, marginTop: 4 }}>
                       {m.relations.map((r, idx) => (
                         <span key={idx} style={{ fontSize: 10, color: 'var(--sf-text-faint)' }}>↳ {r}</span>
                       ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeSection === "roles" && (
            <div className="sf-col" style={{ gap: 12 }}>
              {ctx.roles.length === 0 && <span style={{ fontSize: 12, color: 'var(--sf-text-faint)' }}>No roles defined.</span>}
              {ctx.roles.map((r, i) => (
                <div key={i} className="sf-col" style={{ gap: 6 }}>
                  <div className="sf-row" style={{ gap: 8 }}>
                    <Users size={12} style={{ color: 'var(--sf-blue)' }} />
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--sf-text)' }}>{r.name}</span>
                  </div>
                  <div className="sf-row" style={{ gap: 4, flexWrap: 'wrap', paddingLeft: 20 }}>
                    {r.permissions.map(p => (
                      <span key={p} className="sf-chip sf-chip-mono" style={{ fontSize: 9.5, height: 18, color: 'var(--sf-text-muted)' }}>{p}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "endpoints" && (
            <div className="sf-col" style={{ gap: 8 }}>
              {ctx.endpoints.length === 0 && <span style={{ fontSize: 12, color: 'var(--sf-text-faint)' }}>No endpoints defined.</span>}
              {ctx.endpoints.map((e, i) => (
                <div key={i} className="sf-row" style={{ gap: 10, alignItems: 'center' }}>
                  <span className="mono" style={{ fontSize: 9, width: 45, padding: '2px 4px', borderRadius: 4, background: 'var(--sf-bg-2)', textAlign: 'center', color: 'var(--sf-blue)' }}>{e.method}</span>
                  <div className="sf-col" style={{ gap: 1 }}>
                    <span className="mono" style={{ fontSize: 11.5, color: 'var(--sf-text)' }}>{e.path}</span>
                    <span style={{ fontSize: 10.5, color: 'var(--sf-text-muted)' }}>{e.description}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeSection === "infra" && (
            <div className="sf-col" style={{ gap: 12 }}>
               <SummaryItem label="Database" value={ctx.infrastructure.database} />
               <SummaryItem label="Caching" value={ctx.infrastructure.caching} />
               <SummaryItem label="Storage" value={ctx.infrastructure.storage} />
               <SummaryItem label="Compute" value={ctx.infrastructure.compute} />
               <SummaryItem label="Integrations" value={ctx.integrations.map(i => i.name).join(", ")} />
            </div>
          )}

        </div>
      </div>

      {/* Actions */}
      <div className="sf-row" style={{ gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
        <button onClick={onCancel} className="sf-btn sf-btn--ghost sf-btn--sm" type="button">Back to upload</button>
        <button onClick={onConfirm} className="sf-btn sf-btn--primary sf-btn--sm" type="button">
          Confirm Specification
          <ArrowRight size={11} style={{ marginLeft: 6 }} />
        </button>
      </div>
    </div>
  );
}
