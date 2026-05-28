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
  BackendBlueprint
} from "./types";
import { ArchitectureSynthesisEngine } from "./synthesis-engine";
import { DomainIntelligenceEngine } from "./domain-intelligence-engine";

export function generateArchitectureReview(
  result: IngestionResult,
  answers: Record<string, string | string[]>,
  prompt: string
): ArchitectureReviewState {
  const engine = new DomainIntelligenceEngine(result, answers, prompt);
  const insight = engine.analyze();

  const overview = {
    name: result.simplicitContext?.overview?.name || result.metadata.name || "New Project",
    description: result.simplicitContext?.overview?.description || result.metadata.description || prompt,
    type: insight.domain,
    complexity: parseInt(result.metadata.complexityScore || "50", 10),
  };

  const roles: BackendRole[] = insight.roles.map(r => ({
    name: r.name,
    description: r.description,
  }));

  const capabilities = insight.capabilities;

  const businessRules: BackendBusinessRule[] = (result.simplicitContext?.businessRules || []).map(r => ({
    id: r.id,
    rule: r.rule,
    impact: r.impact,
  }));

  const entities: BackendEntity[] = insight.entities.map(e => ({
    name: e.name,
    fields: e.fields.map(f => f.name),
    relationships: e.relationships.map(r => ({
      target: r.target,
      type: r.type,
    })),
  }));

  const integrations: BackendIntegration[] = (result.simplicitContext?.integrations || []).map(i => ({
    name: i.name,
    purpose: i.purpose,
    provider: (i as any).provider,
  }));

  // Map Requirements based on answers and facts
  const requirements: BackendRequirement[] = [];
  
  // Auth
  const authProvider = answers["auth_provider"];
  requirements.push({
    name: "Authentication",
    description: authProvider ? `Using ${authProvider}` : "User authentication system",
    status: authProvider ? "required" : "optional",
  });

  // Infrastructure
  const infrastructure: BackendInfrastructure = {
    database: (result.simplicitContext?.infrastructure?.database as string) || (answers["database_type"] as string) || "PostgreSQL",
    storage: (result.simplicitContext?.infrastructure?.storage as string) || (answers["storage_strategy"] as string) || "S3 Compatible",
    hosting: (answers["deployment_target"] as string) || "Railway / Fly.io",
  };

  // Confidence Levels derived from Insight
  const confidenceLevels: Record<string, number> = {
    "Domain Model": insight.readinessScore,
    "Entities": Math.round(insight.entities.reduce((acc, e) => acc + e.confidence, 0) / (insight.entities.length || 1)),
    "Authentication": 95,
    "Workflows": 85,
  };

  return {
    overview,
    roles,
    capabilities,
    businessRules,
    entities,
    integrations,
    requirements,
    infrastructure,
    confidenceLevels,
    gaps: insight.gaps,
    activePattern: insight.suggestions?.[0], // use best suggestion as active pattern
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

  if (state.activePattern && state.activePattern.confidence < 60) {
    errors.push(`Pattern match confidence too low (${state.activePattern.confidence}%). Threshold is 60%.`);
  }

  // Legacy gates
  const hasAuth = state.requirements.find(r => r.name === "Authentication" && r.description.includes("Using"));
  if (!hasAuth && state.requirements.find(r => r.name === "Authentication" && r.status === "required")) {
    errors.push("Authentication required but undefined.");
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
    permissions: {}, // To be populated if needed
    businessRules: state.businessRules,
    overview: state.overview
  };
}

export function generateBackendBlueprint(
  spec: BackendSpecification,
  result: IngestionResult,
  answers: Record<string, string | string[]>,
  prompt: string
): BackendBlueprint {
  const engine = new ArchitectureSynthesisEngine(result, answers, prompt);
  return engine.generate(spec);
}
