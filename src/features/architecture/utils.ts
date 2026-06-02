import { IngestionResult, ConfidenceLevel } from "@/features/ingestion/types";
import { 
  ArchitectureReviewState, 
  BackendRole, 
  BackendWorkflow, 
  BackendEntity, 
  BackendIntegration, 
  BackendRequirement, 
  BackendInfrastructure,
  BackendBusinessRule,
  BackendSpecification,
  BackendBlueprint,
  ArchitecturePreferences,
  ResolvedArchitectureState
} from "./types";
import { ArchitectureSynthesisEngine } from "./synthesis-engine";
import { DomainIntelligenceEngine } from "./domain-intelligence-engine";
import { GapResolutionAnswer, GapQuestion, applyGapResolutionsToGraph } from "./engines/gap-resolution-engine";
import { ArchitectureGapDetector } from "./engines/gap-detector";

/**
 * PHASE 1 & 2: Resolve Canonical Architecture State
 * Produced once after analysis and user decisions (stack/gaps).
 */
export function resolveArchitectureState(
  result: IngestionResult,
  answers: Record<string, string | string[]>,
  prompt: string,
  stackSelections: ArchitecturePreferences | null,
  gapAnswers: GapResolutionAnswer[] = [],
  gapQuestions: GapQuestion[] = []
): ResolvedArchitectureState {
  const engine = new DomainIntelligenceEngine(result, answers, prompt);
  const insight = engine.analyze();
  
  const gapDetector = new ArchitectureGapDetector();
  
  // Pass 1: Identify initial gaps on base graph
  const initialGaps = gapDetector.detect(insight.graph.entities, insight.graph.roles, insight.graph.evidence);

  let graph = insight.graph;
  
  // Apply Gap Resolutions (Phase 4 integration)
  if (gapAnswers.length > 0) {
    graph = applyGapResolutionsToGraph(graph, gapAnswers, gapQuestions);
  }

  // Pass 2: Re-detect gaps on patched graph (Functional validation)
  const remainingGapsFromDetector = gapDetector.detect(graph.entities, graph.roles, graph.evidence);

  // Mark gaps as resolved if they are no longer detected
  const finalGaps = initialGaps.map(gap => {
    const stillExists = remainingGapsFromDetector.some(g => g.id === gap.id);
    return {
      ...gap,
      isResolved: !stillExists
    };
  });

  // Phase 3: Integrate Stack Wizard selections (User choices ALWAYS win)
  const infrastructure: BackendInfrastructure = {
    database: stackSelections?.database || (result.simplicitContext?.infrastructure?.database as string) || (answers["database_type"] as string) || "PostgreSQL",
    storage: stackSelections?.storage || (result.simplicitContext?.infrastructure?.storage as string) || (answers["storage_strategy"] as string) || "S3 Compatible",
    hosting: stackSelections?.deployment || (answers["deployment_target"] as string) || "Railway / Fly.io",
    queue: stackSelections?.queue,
  };

  return {
    domainGraph: graph,
    entities: graph.entities,
    relationships: graph.relationships,
    capabilities: graph.capabilities,
    infrastructure,
    stackSelections: stackSelections || {},
    resolvedGapAnswers: Object.fromEntries(gapAnswers.map(a => [a.questionId, a.value])),
    remainingGaps: finalGaps,
    readinessScore: insight.readinessScore,
    confidenceLevels: {
      "Domain Model": insight.readinessScore,
      "Entities": Math.round(graph.entities.reduce((acc: number, e: any) => acc + e.confidence, 0) / (graph.entities.length || 1)),
      "Authentication": stackSelections?.authentication ? 100 : 95,
      "Workflows": 85,
    },
    overview: {
      name: result.simplicitContext?.overview?.name || result.metadata.name || "New Project",
      description: result.simplicitContext?.overview?.description || result.metadata.description || prompt,
      type: insight.domain,
      // complexityScore is a category string ("Low"|"Medium"|"High"|"Enterprise")
      // from the ingestion pipeline, so a plain parseInt yields NaN. Map the
      // category to a numeric score, accepting a raw number if one is provided.
      complexity: (() => {
        const raw = result.metadata.complexityScore;
        const direct = parseInt(String(raw ?? ""), 10);
        if (!isNaN(direct)) return direct;
        const map: Record<string, number> = { Low: 25, Medium: 50, High: 75, Enterprise: 95 };
        return map[String(raw)] ?? 50;
      })(),
    },
    roles: graph.roles,
    businessRules: graph.businessRules,
    suggestions: insight.suggestions || []
  };
}

/**
 * Phase 5: Architecture Review Refactor (Pure projection layer)
 */
export function generateArchitectureReview(
  resolvedState: ResolvedArchitectureState
): ArchitectureReviewState {
  const roles: BackendRole[] = resolvedState.roles.map((r: any) => ({
    name: r.name,
    description: r.description,
  }));

  const entities: BackendEntity[] = resolvedState.entities.map((e: any) => ({
    name: e.name,
    fields: e.fields.map((f: any) => f.name),
    relationships: e.relationships.map((r: any) => ({
      target: r.target,
      type: r.type,
    })),
  }));

  const requirements: BackendRequirement[] = [];
  const authProvider = resolvedState.stackSelections.authentication;
  requirements.push({
    name: "Authentication",
    description: authProvider ? `Using ${authProvider}` : "User authentication system",
    status: authProvider ? "required" : "optional",
  });

  return {
    overview: resolvedState.overview,
    roles,
    capabilities: resolvedState.capabilities,
    businessRules: resolvedState.businessRules.map((r: any) => ({ id: r.id, rule: r.rule, impact: "high" })),
    entities,
    integrations: [], // Map if needed
    requirements,
    infrastructure: resolvedState.infrastructure,
    confidenceLevels: resolvedState.confidenceLevels,
    gaps: resolvedState.remainingGaps.filter((g: any) => !g.isResolved),
    activePattern: resolvedState.suggestions?.[0],
  };
}

export function calculateReadinessScore(state: ArchitectureReviewState): number {
  return state.confidenceLevels["Domain Model"] || 0;
}

export function checkGenerationGate(state: ArchitectureReviewState): string[] {
  const errors: string[] = [];

  // Phase 7: Generation Rules
  const criticalGaps = state.gaps?.filter(g => g.severity === 'critical');
  if (criticalGaps && criticalGaps.length > 0) {
    errors.push(`Critical Gaps detected: ${criticalGaps.length}. Resolve before generation.`);
  }

  return errors;
}

export function createBackendSpecification(state: ArchitectureReviewState): BackendSpecification {
  return {
    projectType: state.overview.type,
    roles: state.roles,
    workflows: state.capabilities.map(c => ({ name: c.name, description: c.description, steps: [] })),
    entities: state.entities,
    integrations: state.integrations,
    backendRequirements: state.requirements,
    infrastructure: state.infrastructure,
    permissions: {}, 
    businessRules: state.businessRules,
    overview: state.overview
  };
}

/**
 * Phase 6: Blueprint Synchronization (Pure serialization)
 */
export function generateBackendBlueprint(
  spec: BackendSpecification,
  resolvedState: ResolvedArchitectureState
): BackendBlueprint {
  const graph = resolvedState.domainGraph;
  
  const blueprint: BackendBlueprint = {
    summary: `Verified business architecture. Reconstructed from ${graph.evidence.length} structured repository signals.`,
    modules: graph.modules.map((m: any) => ({
      name: m.name,
      description: m.description,
      entities: m.entities,
      services: m.services
    })),
    entities: graph.entities.map((e: any) => ({
      name: e.name,
      tableName: e.table,
      description: e.description,
      fields: e.fields.map((f: any) => ({ 
        name: f.name, 
        type: f.type, 
        isPrimary: f.isPrimary,
        isNullable: f.isNullable,
        isUnique: f.isUnique,
        references: f.references
      })),
      relationships: e.relationships,
      indexes: e.indexes,
      constraints: e.constraints,
      evidence: e.evidence 
    })),
    database: {
      type: resolvedState.infrastructure.database,
      tables: graph.entities.map((e: any) => e.table),
      schemas: ["public"]
    },
    apis: synthesizeBlueprintApis(graph.entities, graph.capabilities),
    services: graph.modules.map((m: any) => ({
      name: m.services[0],
      module: m.name,
      description: m.description,
      methods: m.workflows
    })),
    storage: resolvedState.infrastructure.storage !== "Unknown" ? [{ bucket: "uploads", purpose: "User assets", access: "private" }] : [],
    queues: resolvedState.infrastructure.queue ? [{ name: "default", purpose: "Background tasks", concurrency: 5 }] : [],
    events: [],
    permissions: graph.roles.flatMap((role: any) => 
      role.permissions.map((p: any) => ({ role: role.name, action: p.action, resource: p.resource }))
    ),
    businessRules: graph.entities.flatMap((e: any) => e.constraints.map((c: any, i: number) => ({
      id: `rule-${e.name}-${i}`,
      rule: c,
      type: "constraint" as const,
      logic: `Database-level constraint on ${e.name}`
    }))),
    infrastructure: {
       database: { provider: resolvedState.infrastructure.database, rationale: "User selected", confidence: 100 },
       auth: { provider: resolvedState.stackSelections.authentication || "Unknown", rationale: "User selected", confidence: 100 },
       storage: { provider: resolvedState.infrastructure.storage, rationale: "User selected", confidence: 100 },
       email: { provider: resolvedState.stackSelections.email || "Unknown", rationale: "User selected", confidence: 100 },
       payments: { provider: resolvedState.stackSelections.payments || "Unknown", rationale: "User selected", confidence: 100 },
       queue: { provider: resolvedState.infrastructure.queue || "Unknown", rationale: "User selected", confidence: 100 },
       monitoring: { provider: "Sentry", rationale: "Standard", confidence: 100 },
       analytics: { provider: "Posthog", rationale: "Standard", confidence: 100 },
    },
    integrations: spec.integrations.map(i => ({
      name: i.name,
      provider: i.provider || "Standard",
      requiredEnv: [`${i.name.toUpperCase()}_API_KEY`],
      webhooks: []
    })),
    capabilities: graph.capabilities,
    suggestions: resolvedState.suggestions,
    securityModel: `RBAC with Reconstructed Domain Ownership. Roles: ${graph.roles.map((r: any) => r.name).join(", ")}`,
    readinessScore: resolvedState.readinessScore,
    validationErrors: []
  };

  return blueprint;
}

function synthesizeBlueprintApis(entities: any[], capabilities: any[]): any[] {
  const apis: any[] = [];
  
  entities.forEach(ent => {
    const resource = ent.table.toLowerCase();
    const moduleName = `${ent.name}Module`;

    apis.push({
      module: moduleName,
      path: `/api/v1/${resource}`,
      method: "GET",
      description: `List ${ent.name} resources`,
      isProtected: true,
      requiredRoles: []
    });
    apis.push({
      module: moduleName,
      path: `/api/v1/${resource}`,
      method: "POST",
      description: `Create new ${ent.name}`,
      isProtected: true,
      requiredRoles: []
    });
  });

  capabilities.forEach(cap => {
    apis.push({
      module: `${cap.category.replace('_MANAGEMENT', '')}Module`,
      path: `/api/v1/actions/${cap.name.toLowerCase().replace(/\s+/g, "-")}`,
      method: "POST",
      description: cap.description,
      isProtected: true,
      requiredRoles: []
    });
  });

  return apis;
}

