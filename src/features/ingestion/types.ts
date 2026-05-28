// ─── Simplicit Context Specification ───────────────────────────────

export interface ContextProjectOverview {
  name: string;
  purpose: string;
  category: string;
  description: string;
  goals: string[];
}

export interface ContextBusinessRule {
  id: string;
  rule: string;
  impact: string;
}

export interface ContextValidationRule {
  field: string;
  rule: string;
  errorMessage: string;
  source?: string; // e.g. "zod", "business"
}

export interface ContextUserJourney {
  name: string;
  steps: string[];
}

export interface ContextWorkflow {
  name: string;
  normalizedId?: string;
  description: string;
  trigger: string;
  outcome: string;
  evidence?: string[];
}

export interface ContextRole {
  name: string;
  normalizedId?: string;
  permissions: string[];
  visibilityRules: string[];
}

export interface ContextEndpoint {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "UNKNOWN";
  path: string;
  normalizedId?: string;
  description: string;
  isProtected?: boolean;
}

export interface ContextDataModel {
  name: string;
  normalizedId?: string;
  fields: string[];
  relations: string[];
  evidence?: string[];
  capabilities?: string[];
  lifecycle?: string[];
  confidence?: string;
  type?: string;
  description?: string;
  businessRules?: string[];
}

export interface ContextIntegration {
  name: string;
  normalizedId?: string;
  purpose: string;
  category?: string;
}

export interface ContextRelationship {
  source: string;
  target: string;
  type: string;
  evidence: string[];
  confidence: string;
  normalizedId?: string;
}

export interface ContextCapability {
  name: string;
  entity: string;
  category: string;
  evidence: string[];
  validationRules?: string[];
  permissions?: string[];
  confidence: string;
  normalizedId?: string;
}

export interface ContextInfrastructure {
  database: string;
  caching: string;
  storage: string;
  compute: string;
  services: string[];
}

export interface ContextFrontendStack {
  framework: string;
  bundler: string;
  runtime: string;
  language: string;
  uiLibraries: string[];
  routingLibraries: string[];
  stateLibraries: string[];
  animationLibraries: string[];
}

export interface ContextAuthModel {
  provider: string;
  loginMethods: string[];
  roleModel: string;
  visibilityRules: string[];
}

export interface SimplicitContext {
  overview: ContextProjectOverview;
  frontendStack: ContextFrontendStack;
  auth: ContextAuthModel;
  businessRules: ContextBusinessRule[];
  validationRules: ContextValidationRule[];
  userJourneys: ContextUserJourney[];
  workflows: ContextWorkflow[];
  roles: ContextRole[];
  endpoints: ContextEndpoint[];
  dataModels: ContextDataModel[];
  relationships: ContextRelationship[];
  capabilities: ContextCapability[];
  entitiesConfidence: string;
  relationshipsConfidence: string;
  infrastructureConfidence: string;
  metadata?: {
    version?: string;
    tool?: string;
    schema?: string;
    promptHash?: string;
  };
  envVars: string[];
  fileUploads: string;
  realtime: string;
  integrations: ContextIntegration[];
  infrastructure: ContextInfrastructure;
  errorFormat: string;
  rawMarkdown: string;
  metrics: {
    routeCount: number;
    pageCount: number;
    protectedRouteCount: number;
    publicRouteCount: number;
    entityCount: number;
    workflowCount: number;
    integrationCount: number;
  };
  validation: {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  };
}

// ─── Ingestion Mode & State ─────────────────────────────────────────
export type IngestionMode = "zip" | "github" | "context" | "prompt" | "none";
export type IngestionState =
  | "idle"
  | "uploading"
  | "analyzing"
  | "selection"
  | "review"
  | "ready"
  | "error";

export type AnalysisStage =
  | "Mapping filesystem..."
  | "Detecting framework..."
  | "Reconstructing route hierarchy..."
  | "Mapping application workflows..."
  | "Analyzing application domains..."
  | "Inferring relational entities..."
  | "Detecting administrative systems..."
  | "Building backend dependency graph..."
  | "Inferring backend requirements..."
  | "Reconstructing API expectations..."
  | "Done";
// ─── Confidence Scoring ─────────────────────────────────────────────
export type ConfidenceLevel = 
  | "Deterministic"
  | "Multi-source confirmation" 
  | "Strong evidence" 
  | "Partial evidence" 
  | "Heuristic inference";

export interface Confident<T> {
  value: T;
  confidence: ConfidenceLevel;
  reason?: string;
}

// ─── Framework Detection ────────────────────────────────────────────
export interface FrameworkInfo {
  name: string;
  confidence: ConfidenceLevel;
  evidence: string[];
  version: string | null;
  router: string | null;
  cssFramework: string | null;
  stateManagement: string | null;
  language: "typescript" | "javascript";
}

// ─── Route Detection ────────────────────────────────────────────────
export type RouteCategory = "auth" | "admin" | "public" | "dashboard" | "settings" | "onboarding" | "unknown";

export interface DetectedRoute {
  path: string;
  component: string | null;
  isDynamic: boolean;
  isProtected?: boolean; 
  category: RouteCategory;
  params: string[];
  kind: "page" | "api" | "layout" | "loading" | "error" | "middleware";
  confidence: ConfidenceLevel;
  evidence: string[];
}

// ─── Semantic Architecture ──────────────────────────────────────────

export interface FeatureModule {
  name: string;
  description: string;
  routes: string[];
  entities: string[];
  confidence: ConfidenceLevel;
  normalizedId?: string;
}

export interface InferredRole {
  name: string;
  description: string;
  confidence: ConfidenceLevel;
  evidence: string[];
  normalizedId?: string;
}

export interface InferredWorkflow {
  name: string;
  description: string;
  routes: string[];
  entities: string[];
  confidence: ConfidenceLevel;
  evidence: string[];
  normalizedId?: string;
}

export interface CRUDSystem {
  entity: string;
  operations: ("Create" | "Read" | "Update" | "Delete" | "List")[];
  routes: string[];
  confidence: ConfidenceLevel;
  evidence: string[];
}

export interface StateAnalysis {
  libraries: string[];
  cachingRequired: boolean;
  realtimeRequired: boolean;
  optimisticUpdates: boolean;
}

export interface SemanticNode {
  id: string;
  type: "route" | "entity" | "feature" | "form" | "api" | "system" | "role" | "workflow";
  label: string;
  metadata?: any;
}

export interface SemanticEdge {
  from: string;
  to: string;
  relation: "owns" | "uses" | "depends_on" | "triggers" | "requires" | "transitions_to" | "manages";
}

export interface SemanticGraph {
  nodes: SemanticNode[];
  edges: SemanticEdge[];
}

// ─── Inferred Business Entities ─────────────────────────────────────
export interface InferredEntity {
  name: string;
  confidence: ConfidenceLevel;
  hints: string[];
  normalizedId?: string;
}

// ─── Inferred API Expectations ──────────────────────────────────────
export interface InferredAPI {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "UNKNOWN";
  path: string;
  purpose: string;
  confidence: ConfidenceLevel;
  normalizedId?: string;
}

// ─── JSX Intent / Component Graph ───────────────────────────────────
export interface ComponentIntent {
  hasForms: boolean;
  hasDashboards: boolean;
  hasDataTables: boolean;
  hasAuthScreens: boolean;
  hasAnalytics: boolean;
  hasUploads: boolean;
  hasSettings: boolean;
  hasOnboarding: boolean;
  hasManagement: boolean;
}

// ─── Project Metadata ───────────────────────────────────────────────
export interface ProjectMetadata {
  name: string | null;
  description: string | null;
  totalFiles: number;
  totalComponents: number;
  totalPages: number;
  totalApiRoutes: number;
  envVars: string[];
  existingBackendIntegrations: string[];
  
  // Source Priority (Requirement 8)
  primarySource: "context" | "frontend" | "prompt";
  
  // Semantic Architecture Intelligence
  appType: string;
  complexityScore?: string;
  architecturalSummary?: string;
  featureModules: FeatureModule[];
  roles: InferredRole[];
  workflows: InferredWorkflow[];
  crudSystems: CRUDSystem[];
  stateAnalysis: StateAnalysis;
  semanticGraph: SemanticGraph;
  inferredEntities: InferredEntity[];
  apiExpectations: InferredAPI[];
  intent: ComponentIntent;
  authFlows: string[];
  missingBackendSystems: string[];
}

// ─── Dependency Info ────────────────────────────────────────────────
export interface DependencyInfo {
  name: string;
  version: string;
  isDev: boolean;
}

// ─── Clarification Session ──────────────────────────────────────────
export type ClarificationCategory =
  | "Authentication"
  | "User Roles"
  | "Permissions"
  | "Payments"
  | "File Storage"
  | "Notifications"
  | "AI Features"
  | "Analytics"
  | "Team Collaboration"
  | "Approval Workflows"
  | "Audit Logs"
  | "Public Sharing"
  | "Integrations"
  | "Multi-tenancy"
  | "Database"
  | "Deployment";

export type QuestionType = "single-choice" | "multi-choice" | "free-text";

export interface QuestionOption {
  label: string;
  value: string;
  description?: string;
  isCustom?: boolean;
}

export interface ClarificationQuestion {
  id: string;
  category: ClarificationCategory;
  type: QuestionType;
  text: string;
  options?: QuestionOption[];
  reason: string;
  confidence: ConfidenceLevel;
  dependsOn?: {
    questionId: string;
    value: string | string[];
  };
}

// ─── Full Ingestion Result ──────────────────────────────────────────
export interface IngestionResult {
  mode: IngestionMode;
  framework: FrameworkInfo;
  routes: DetectedRoute[];
  metadata: ProjectMetadata;
  dependencies: DependencyInfo[];
  fileTree: string[];
  keyFiles: Map<string, string>;
  documentation: Array<{ path: string; content: string }>;
  analyzedAt: string;
  rootPath?: string;
  rootCandidates?: string[];
  analysisLogs?: string[];
  simplicitContext?: SimplicitContext;
  clarificationQuestions?: ClarificationQuestion[];
}

// ─── Serializable version for API payloads ──────────────────────────
export interface SerializableIngestionResult {
  mode: IngestionMode;
  framework: FrameworkInfo;
  routes: DetectedRoute[];
  metadata: ProjectMetadata;
  dependencies: DependencyInfo[];
  fileTree: string[];
  documentation: Array<{ path: string; content: string }>;
  analyzedAt: string;
  rootPath?: string;
  rootCandidates?: string[];
  analysisLogs?: string[];
  simplicitContext?: SimplicitContext;
  clarificationQuestions?: ClarificationQuestion[];
}

// ─── Project Context (combined ingestion + prompt for generation) ───
export interface ProjectContext {
  prompt: string;
  stack: string;
  ingestion: SerializableIngestionResult | null;
}

// ─── Helper: serialize result for API transmission ──────────────────
export function serializeIngestionResult(
  result: IngestionResult
): SerializableIngestionResult {
  return {
    mode: result.mode,
    framework: result.framework,
    routes: result.routes,
    metadata: result.metadata,
    dependencies: result.dependencies,
    fileTree: result.fileTree,
    documentation: result.documentation,
    analyzedAt: result.analyzedAt,
    rootPath: result.rootPath,
    rootCandidates: result.rootCandidates,
    simplicitContext: result.simplicitContext,
    clarificationQuestions: result.clarificationQuestions,
    analysisLogs: result.analysisLogs,
  };
}
