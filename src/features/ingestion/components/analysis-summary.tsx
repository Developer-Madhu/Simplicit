"use client";

import { useState } from "react";
import { 
  RefreshCw, X, Layers, FileText, Globe, Database, Package, 
  Code2, Shield, Info, Workflow, Network, Users, ChevronDown, 
  ChevronRight, CheckCircle2, Search, FileJson, ListTodo, Activity
} from "lucide-react";
import type { IngestionResult } from "../types";
import { ContextReview } from "./context-review";

interface AnalysisSummaryProps {
  result: IngestionResult;
  onClear: () => void;
  onReanalyze: () => void;
}

const FEATURE_ICONS: Record<string, typeof Globe> = {
  supabase: Database,
  firebase: Database,
  prisma: Database,
  drizzle: Database,
  stripe: Globe,
  convex: Database,
  appwrite: Database,
  amplify: Globe,
  pocketbase: Database,
};

export function AnalysisSummary({ result, onClear, onReanalyze }: AnalysisSummaryProps) {
  const { framework, routes, metadata, dependencies } = result;
  const [showEvidence, setShowEvidence] = useState(false);

  const pageRoutes = routes.filter((r) => r.kind === "page");
  const apiRoutes = routes.filter((r) => r.kind === "api");

  // Mode Detection (Sprint Objective 1)
  const isContextMode = result.mode === "context";
  const hasContext = !!result.simplicitContext;
  const hasFrontend = result.mode === "zip" || result.mode === "github";
  const isCombinedMode = hasContext && hasFrontend;

  // Confidence Calculation
  const getConfidence = () => {
    if (isCombinedMode) return { label: "Combined Intelligence", value: "High", color: "oklch(0.78 0.16 145)" };
    if (isContextMode) return { label: "Business Specification", value: "High", color: "var(--sf-blue)" };
    return { label: "Frontend Reconstruction", value: "High", color: "var(--sf-blue)" };
  };
  const confidence = getConfidence();

  // ── Unified counts: read from AST extraction OR context parser, whichever has data ──
  const roleCount =
    (result.metadata.roles?.length ?? 0) > 0
      ? (result.metadata.roles?.length ?? 0)
      : (result.simplicitContext?.roles?.length ?? 0);

  const workflowCount =
    (result.metadata.workflows?.length ?? 0) > 0
      ? (result.metadata.workflows?.length ?? 0)
      : (result.simplicitContext?.workflows?.length ?? 0);

  const ruleCount =
    (result.simplicitContext?.validationRules?.length ?? 0) > 0
      ? (result.simplicitContext?.validationRules?.length ?? 0)
      : (result.simplicitContext?.businessRules?.length ?? 0);

  // Filtered integrations — drops markdown noise lines ("### Integration", "Name:", etc.)
  const cleanIntegrations = (result.simplicitContext?.integrations ?? []).filter(
    (i) =>
      i.name &&
      !i.name.startsWith("#") &&
      !i.name.toLowerCase().startsWith("integration") &&
      i.name.length > 2 &&
      i.name.length < 50
  );
  const integrationCount = cleanIntegrations.length;

  const entityCount =
    (result.metadata.inferredEntities?.length ?? 0) > 0
      ? (result.metadata.inferredEntities?.length ?? 0)
      : (result.simplicitContext?.dataModels?.length ?? 0);

  const apiCount =
    (result.metadata.apiExpectations?.length ?? 0) > 0
      ? (result.metadata.apiExpectations?.length ?? 0)
      : (result.simplicitContext?.endpoints?.length ?? 0);

  // High-confidence entities for the "Detected Entities" panel (code-ingestion mode)
  const strongEntities = (result.metadata.inferredEntities ?? []).filter(
    (e) =>
      e.confidence === "Deterministic" ||
      e.confidence === "Strong evidence" ||
      e.confidence === "Multi-source confirmation"
  );

  return (
    <div
      className="sf-card"
      style={{
        padding: 0,
        overflow: "hidden",
        marginBottom: 16,
        border: "1px solid oklch(0.4 0.12 250 / 0.3)",
        background: "var(--sf-surface)",
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
        <Network size={12} style={{ color: confidence.color }} />
        <span
          className="mono"
          style={{
            fontSize: 10.5,
            color: confidence.color,
            fontWeight: 600,
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
        >
          {isContextMode ? "Product Specification Analysis" : "Architectural Reconstruction"}
        </span>
        <span className="sf-grow" />
        
        {/* Confidence Indicator (Sprint Objective 1) */}
        <div className="sf-row" style={{ gap: 6, marginRight: 12 }}>
           <span className="mono" style={{ fontSize: 9, color: 'var(--sf-text-faint)' }}>{confidence.label}</span>
           <div style={{ width: 6, height: 6, borderRadius: '50%', background: confidence.color }} />
        </div>

        <button
          onClick={onReanalyze}
          className="sf-btn sf-btn--ghost sf-btn--sm"
          style={{ padding: "0 4px" }}
          type="button"
          title="Re-analyze"
        >
          <RefreshCw size={11} />
        </button>
        <button
          onClick={onClear}
          className="sf-btn sf-btn--ghost sf-btn--sm"
          style={{ padding: "0 4px" }}
          type="button"
          title="Clear analysis"
        >
          <X size={11} />
        </button>
      </div>

      {/* Structured Summary (Priority 3 & 11) */}
      <div style={{ padding: "16px", background: "var(--sf-bg-2)", borderBottom: "1px solid var(--sf-border)" }}>
        <div className="sf-row" style={{ gap: 8, marginBottom: 12 }}>
          <Search size={12} style={{ color: "var(--sf-blue)" }} />
          <span className="mono" style={{ fontSize: 10, color: "var(--sf-text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Application Understanding</span>
        </div>
        
        <div className="sf-col" style={{ gap: 14 }}>
          {result.simplicitContext && (
            <div className="sf-row" style={{ gap: 8, marginBottom: -4 }}>
               <span className="mono" style={{ fontSize: 9, color: 'var(--sf-blue)', fontWeight: 600, textTransform: 'uppercase' }}>Specification Source</span>
               <span className="mono" style={{ 
                  fontSize: 8.5, padding: "1px 4px", borderRadius: 4, 
                  background: "oklch(0.78 0.16 145 / 0.15)", color: "oklch(0.78 0.16 145)",
                  textTransform: "uppercase", fontWeight: 600,
                  border: "1px solid oklch(0.78 0.16 145 / 0.2)"
                }}>Recommended</span>
                <span className="mono" style={{ fontSize: 10, color: 'var(--sf-text-muted)' }}>simplicit.context.md</span>
            </div>
          )}
          
          <SummaryRow label="APPLICATION TYPE" value={metadata.appType} />

          {/* Hide Framework in pure Context Mode unless provided */}
          {(!isContextMode || (result.simplicitContext?.frontendStack?.framework && result.simplicitContext.frontendStack.framework !== "Unknown")) && (
            <SummaryRow label="FRAMEWORK" value={`${framework.name} ${framework.version || ""}`} evidence={framework.evidence} />
          )}

          {metadata.roles.length > 0 && (
            <SummaryRow label={isContextMode ? "TARGET USERS" : "PRIMARY USERS"} value={metadata.roles.map(r => r.name).join(", ")} />
          )}
          
          {metadata.workflows.length > 0 && (
            <SummaryRow 
              label="CORE WORKFLOWS" 
              value={metadata.workflows.slice(0, 4).map(w => w.name).join(", ")} 
              sub={metadata.workflows.length > 4 ? `+ ${metadata.workflows.length - 4} more` : undefined}
            />
          )}

          {/* Business Rules (Context Mode Only) */}
          {isContextMode && result.simplicitContext && result.simplicitContext.businessRules.length > 0 && (
             <SummaryRow label="BUSINESS RULES" value={`${result.simplicitContext.businessRules.length} declared functional rules`} />
          )}

          {hasContext && result.simplicitContext?.auth.provider && (
             <SummaryRow label="AUTHENTICATION" value={result.simplicitContext.auth.provider} sub={result.simplicitContext.auth.loginMethods.join(", ")} />
          )}

          {hasContext && cleanIntegrations.length > 0 && (
             <div className="sf-col" style={{ gap: 4 }}>
               <div className="mono" style={{ fontSize: 9, color: "var(--sf-text-faint)", letterSpacing: "0.05em" }}>INTEGRATIONS</div>
               <div className="sf-row" style={{ gap: 6, flexWrap: "wrap" }}>
                 {cleanIntegrations.map((integration, idx) => (
                   <span key={idx} className="sf-chip sf-chip-mono" style={{ height: 20, fontSize: 10 }}>
                     {integration.name}
                     {integration.purpose && (
                       <span className="sf-faint" style={{ marginLeft: 4 }}>· {integration.purpose}</span>
                     )}
                   </span>
                 ))}
               </div>
             </div>
          )}

          {/* Infrastructure (Context/Combined Mode) */}
          {hasContext && result.simplicitContext && (
             <SummaryRow label="INFRASTRUCTURE" value={result.simplicitContext.infrastructure.database} sub={result.simplicitContext.infrastructure.compute} />
          )}

          {metadata.missingBackendSystems.length > 0 && (
            <SummaryRow label="BACKEND REQUIREMENTS" value={metadata.missingBackendSystems.join(", ")} />
          )}
        </div>
      </div>

      {/* Stats grid (Mode Sensitive) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 0,
          borderBottom: "1px solid var(--sf-border)",
        }}
      >
        {isContextMode ? (
          // Context Mode Metrics (Roles, Workflows, Rules, Integrations)
          <>
            <StatCell
              icon={<Users size={12} />}
              label="Roles"
              value={String(roleCount)}
              sub="Defined"
            />
            <StatCell
              icon={<Activity size={12} />}
              label="Workflows"
              value={String(workflowCount)}
              sub="Business"
            />
            <StatCell
              icon={<ListTodo size={12} />}
              label="Rules"
              value={String(ruleCount)}
              sub="Functional"
            />
            <StatCell
              icon={<Globe size={12} />}
              label="Integrations"
              value={String(integrationCount)}
              sub="External"
            />
          </>
        ) : (
          // Frontend / Combined Metrics (Pages, Workflows, Data Models, Dependencies)
          <>
            <StatCell
              icon={<FileText size={12} />}
              label="Pages"
              value={String(pageRoutes.length)}
              sub={`${apiRoutes.length} API`}
            />
            <StatCell
              icon={<Workflow size={12} />}
              label="Workflows"
              value={String(workflowCount)}
              sub={`${metadata.crudSystems?.length || 0} CRUD`}
            />
            <StatCell
              icon={<Database size={12} />}
              label="Data Models"
              value={String(entityCount)}
              sub="Relational"
            />
            <StatCell
              icon={<Package size={12} />}
              label="Dependencies"
              value={String(dependencies.length)}
              sub="Resolved"
            />
          </>
        )}
      </div>

      {/* Deep Intelligence Visualizations */}
      <div style={{ padding: "0 14px 14px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* Feature tags (Only if frontend data exists) */}
        {!isContextMode && (
          <div
            className="sf-row"
            style={{
              marginTop: 14,
              gap: 6,
              flexWrap: "wrap",
            }}
          >
            {framework.router && <FeatureChip label={framework.router} />}
            {framework.cssFramework && <FeatureChip label={framework.cssFramework} />}
            {metadata.stateAnalysis?.libraries.map(lib => <FeatureChip key={lib} label={lib} />)}
            {framework.language === "typescript" && <FeatureChip label="TypeScript" accent />}  
            {result.documentation.length > 0 && <FeatureChip label={`${result.documentation.length} docs`} />}            {metadata.existingBackendIntegrations.map((integration) => (
              <FeatureChip
                key={integration}
                label={integration}
                icon={FEATURE_ICONS[integration] ? <Shield size={9} /> : undefined}
              />
            ))}
          </div>
        )}

        {/* AST-detected domain intelligence (code-ingestion mode) */}
        {!isContextMode &&
          (strongEntities.length > 0 ||
            (metadata.roles?.length ?? 0) > 0 ||
            (metadata.apiExpectations?.length ?? 0) > 0) && (
            <div className="sf-col" style={{ gap: 16 }}>
              {/* Detected Entities */}
              {metadata.inferredEntities && metadata.inferredEntities.length > 0 && (
                <div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--sf-text-faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    Detected Entities
                  </div>
                  <div className="sf-row" style={{ gap: 6, flexWrap: "wrap" }}>
                    {strongEntities.slice(0, 12).map((entity, idx) => {
                      const color =
                        entity.confidence === "Deterministic"
                          ? "oklch(0.78 0.16 145)"
                          : entity.confidence === "Strong evidence"
                          ? "var(--sf-blue)"
                          : "var(--sf-text-muted)";
                      return (
                        <span key={idx} className="sf-chip sf-chip-mono" style={{ height: 20, fontSize: 10, color }}>
                          {entity.name}
                        </span>
                      );
                    })}
                    {strongEntities.length === 0 && (
                      <span style={{ fontSize: 11, color: "var(--sf-text-faint)" }}>No high-confidence entities detected</span>
                    )}
                  </div>
                </div>
              )}

              {/* Detected Roles */}
              {metadata.roles && metadata.roles.length > 0 && (
                <div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--sf-text-faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    Detected Roles
                  </div>
                  <div className="sf-row" style={{ gap: 6, flexWrap: "wrap" }}>
                    {metadata.roles.map((role, idx) => (
                      <span key={idx} className="sf-chip sf-chip-mono" style={{ height: 20, fontSize: 10, color: "var(--sf-purple)" }}>
                        {role.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detected API Surface */}
              {metadata.apiExpectations && metadata.apiExpectations.length > 0 && (
                <div>
                  <div className="mono" style={{ fontSize: 10, color: "var(--sf-text-faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
                    Detected API Surface
                  </div>
                  <div className="sf-col" style={{ gap: 4 }}>
                    {metadata.apiExpectations.slice(0, 8).map((api, idx) => {
                      const mc =
                        api.method === "GET"
                          ? "oklch(0.78 0.16 145)"
                          : api.method === "POST"
                          ? "var(--sf-blue)"
                          : api.method === "PUT" || api.method === "PATCH"
                          ? "var(--sf-amber)"
                          : "var(--sf-red)";
                      return (
                        <div key={idx} className="sf-row" style={{ gap: 8, fontSize: 11 }}>
                          <span className="mono" style={{ fontSize: 9, fontWeight: 600, width: 46, textAlign: "center", padding: "2px 4px", borderRadius: 4, background: "var(--sf-bg)", color: mc }}>
                            {api.method}
                          </span>
                          <span className="mono" style={{ color: "var(--sf-text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {api.path}
                          </span>
                        </div>
                      );
                    })}
                    {metadata.apiExpectations.length > 8 && (
                      <span style={{ fontSize: 11, color: "var(--sf-text-faint)" }}>
                        +{metadata.apiExpectations.length - 8} more
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

        {/* Structured specification review (context-ingestion mode) */}
        {isContextMode && result.simplicitContext && (
          <div style={{ marginTop: 4 }}>
            <ContextReview result={result} onConfirm={() => {}} onCancel={onClear} />
          </div>
        )}

        {/* Workflows */}
        {metadata.workflows && metadata.workflows.length > 0 && (
          <div>
            <div className="mono" style={{ fontSize: 10, color: "var(--sf-text-faint)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>
              Identified Workflows
            </div>
            <div className="sf-col" style={{ gap: 8 }}>
              {metadata.workflows.map(wf => (
                <div key={wf.name} className="sf-card" style={{ padding: "10px 12px", background: "var(--sf-bg)", border: "1px solid var(--sf-border)" }}>
                   <div className="sf-row" style={{ gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 11.5, fontWeight: 600, color: "var(--sf-text)" }}>{wf.name}</span>
                      <span className="sf-grow" />
                      <span className="mono" style={{ fontSize: 9, color: "var(--sf-text-faint)" }}>{wf.confidence}</span>
                   </div>
                   <div style={{ fontSize: 11, color: "var(--sf-text-muted)", marginBottom: 8, lineHeight: 1.4 }}>{wf.description}</div>
                   <div className="sf-row" style={{ gap: 4, flexWrap: "wrap" }}>
                      {wf.entities.map(e => (
                        <span key={e} className="sf-chip sf-chip-mono" style={{ fontSize: 9, height: 16, padding: "0 5px" }}>Entity: {e}</span>
                      ))}
                      {!isContextMode && <span style={{ fontSize: 9, color: "var(--sf-text-faint)", marginLeft: 4 }}>{wf.routes.length} routes detected</span>}
                   </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analysis Evidence (Priority 9) */}
        <div style={{ borderTop: "1px solid var(--sf-border)", paddingTop: 12 }}>
          <button 
            onClick={() => setShowEvidence(!showEvidence)}
            className="sf-row"
            style={{ 
              width: '100%', gap: 6, background: 'transparent', border: 'none', 
              cursor: 'pointer', padding: 0, color: 'var(--sf-text-faint)'
            }}
          >
            {showEvidence ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            <span className="mono" style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>Analysis Evidence & Signals</span>
          </button>

          {showEvidence && (
            <div className="sf-col" style={{ gap: 12, marginTop: 12, paddingLeft: 18 }}>
              {result.simplicitContext && (
                 <EvidenceGroup 
                    label="Specification Signals" 
                    items={[
                      `Project Name: ${result.simplicitContext.overview.name}`,
                      `Business Rules: ${result.simplicitContext.businessRules.length}`,
                      `User Journeys: ${result.simplicitContext.userJourneys.length}`,
                      `Roles: ${result.simplicitContext.roles.length}`,
                      `Endpoints: ${result.simplicitContext.endpoints.length}`,
                      `Data Models: ${result.simplicitContext.dataModels.length}`
                    ]} 
                 />
              )}

              {/* Only show framework signals if not in pure context mode or if stack was provided */}
              {(!isContextMode || (result.simplicitContext?.frontendStack?.framework && result.simplicitContext.frontendStack.framework !== "Unknown")) && (
                <EvidenceGroup label="Framework Signals" items={framework.evidence} />
              )}
              
              {metadata.workflows.length > 0 && (
                <EvidenceGroup 
                  label="Workflow Signals" 
                  items={metadata.workflows.flatMap(w => w.evidence).filter((v, i, a) => a.indexOf(v) === i)} 
                />
              )}

              <EvidenceGroup 
                label="Infrastructure Signals" 
                items={[
                  ...metadata.existingBackendIntegrations.map(i => `Existing integration: ${i}`),
                  ...(metadata.stateAnalysis?.libraries.map(l => `State library: ${l}`) || []),
                  ...(result.documentation.length > 0 ? [`Found documentation: ${result.documentation.length} files`] : []),
                  ...(result.rootPath ? [`Detected project root: ${result.rootPath}`] : [])
                ]} 
              />

              {/* Diagnostics logs */}
              {result.analysisLogs && (
                 <div>
                    <div className="mono" style={{ fontSize: 9, color: "var(--sf-text-faint)", marginBottom: 6 }}>Process Logs</div>
                    <div className="sf-scroll" style={{ 
                      padding: "8px 10px", 
                      background: "var(--sf-bg)", 
                      borderRadius: 6, 
                      border: "1px solid var(--sf-border)",
                      maxHeight: 120,
                      overflowY: "auto"
                    }}>
                      {result.analysisLogs.map((log, i) => (
                        <div key={i} className="mono" style={{ fontSize: 9, color: "var(--sf-text-muted)", marginBottom: 2, whiteSpace: "nowrap" }}>
                          {log}
                        </div>
                      ))}
                    </div>
                 </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

function SummaryRow({ label, value, sub, evidence }: { label: string; value: string; sub?: string; evidence?: string[] }) {
  return (
    <div className="sf-col" style={{ gap: 4 }}>
      <div className="mono" style={{ fontSize: 9, color: "var(--sf-text-faint)", letterSpacing: "0.05em" }}>{label}</div>
      <div className="sf-row" style={{ gap: 8, alignItems: 'baseline' }}>
        <span style={{ fontSize: 13.5, fontWeight: 500, color: "var(--sf-text)" }}>{value}</span>
        {sub && <span className="mono" style={{ fontSize: 10, color: "var(--sf-text-muted)" }}>{sub}</span>}
        {evidence && evidence.length > 0 && (
          <span title={evidence.join('\n')} style={{ cursor: 'help' }}>
            <CheckCircle2 size={11} style={{ color: "oklch(0.78 0.16 145)" }} />
          </span>
        )}
      </div>
    </div>
  );
}

function EvidenceGroup({ label, items }: { label: string; items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div>
      <div className="mono" style={{ fontSize: 9, color: "var(--sf-text-faint)", marginBottom: 6 }}>{label}</div>
      <div className="sf-col" style={{ gap: 4 }}>
        {items.map((item, i) => (
          <div key={i} className="sf-row" style={{ gap: 6 }}>
            <div style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--sf-blue)', marginTop: 6 }} />
            <span style={{ fontSize: 11, color: "var(--sf-text-muted)" }}>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCell({
  icon,
  label,
  value,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub?: string;
}) {
  return (
    <div
      style={{
        padding: "10px 14px",
        borderRight: "1px solid var(--sf-border)",
      }}
    >
      <div
        className="sf-row"
        style={{ gap: 4, marginBottom: 4 }}
      >
        <span style={{ color: "var(--sf-text-faint)" }}>{icon}</span>
        <span
          className="mono"
          style={{
            fontSize: 9,
            color: "var(--sf-text-faint)",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "var(--sf-text)",
          letterSpacing: "-0.01em",
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          className="mono"
          style={{ fontSize: 9.5, color: "var(--sf-text-muted)", marginTop: 1 }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function FeatureChip({
  label,
  accent,
  icon,
}: {
  label: string;
  accent?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <span
      className="sf-chip sf-chip-mono"
      style={{
        height: 20,
        padding: "0 7px",
        fontSize: 10,
        gap: 4,
        color: accent ? "var(--sf-blue)" : "var(--sf-text-muted)",
        borderColor: accent ? "oklch(0.4 0.12 250 / 0.3)" : undefined,
      }}
    >
      {icon}
      {label}
    </span>
  );
}
