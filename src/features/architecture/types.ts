import { ConfidenceLevel, SerializableIngestionResult } from "@/features/ingestion/types";

/**
 * Compact graph-analytics projection (god nodes + communities) persisted with
 * the ingestion result. Alias of `SerializableIngestionResult["graphAnalytics"]`
 * so the architect consumes exactly what the ingestion pipeline serializes.
 */
export type SerializedGraphAnalytics = NonNullable<
  SerializableIngestionResult["graphAnalytics"]
>;

export interface BackendSpecification {
  projectType: string;
  roles: BackendRole[];
  workflows: BackendWorkflow[];
  entities: BackendEntity[];
  integrations: BackendIntegration[];
  backendRequirements: BackendRequirement[];
  infrastructure: BackendInfrastructure;
  permissions: Record<string, string[]>;
  businessRules: BackendBusinessRule[];
  overview?: {
    name: string;
    description: string;
    type: string;
    complexity: number;
  };
}

export interface BackendRole {
  name: string;
  description: string;
}

export interface BackendWorkflow {
  name: string;
  description: string;
  steps: string[];
}

export interface BackendEntity {
  name: string;
  fields: string[];
  relationships: BackendRelationship[];
}

export interface BackendRelationship {
  target: string;
  type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
}

export interface BackendIntegration {
  name: string;
  purpose: string;
  provider?: string;
}

export interface BackendRequirement {
  name: string;
  description: string;
  status: "required" | "optional" | "not-applicable";
}

export interface BackendInfrastructure {
  database: string;
  storage: string;
  queue?: string;
  monitoring?: string;
  hosting: string;
}

export interface BackendBusinessRule {
  id: string;
  rule: string;
  impact: string;
}

export interface ArchitecturePreferences {
  database?: string;
  authentication?: string;
  storage?: string;
  email?: string;
  payments?: string;
  queue?: string;
  deployment?: string;
}

export interface BackendBlueprint {
  summary: string;
  modules: BlueprintModule[];
  entities: BlueprintEntity[];
  database: BlueprintDatabase;
  apis: BlueprintAPI[];
  services: BlueprintService[];
  storage: BlueprintStorage[];
  queues: BlueprintQueue[];
  events: BlueprintEvent[];
  permissions: BlueprintPermission[];
  businessRules: BlueprintBusinessRule[];
  infrastructure: BlueprintInfrastructure;
  integrations: BlueprintIntegration[];
  capabilities: any[]; // BusinessCapability[]
  suggestions?: any[]; // PatternSuggestion[]
  securityModel: string;
  readinessScore: number;
  validationErrors: string[];
  // Feature modules derived from import-graph communities (graph analytics).
  // Distinct from `modules` (capability-derived BoundedContext projection),
  // which drives NestJS module/controller emission.
  featureModules?: BlueprintFeatureModule[];
  overview?: {
    name: string;
    description?: string;
    type?: string;
    complexity?: number;
  };
}

export interface BlueprintFeatureModule {
  name: string; // from community dominantName (e.g. "auth", "swap")
  communityId: number;
  entityNames: string[]; // tableName values of entities in this community
  isPrimary: boolean; // true if any entity in this module is a god node
}

export interface BlueprintBusinessRule {
  id: string;
  rule: string;
  entity?: string;
  type: "guard" | "validation" | "constraint";
  logic: string;
}

export interface BlueprintInfrastructure {
  database: BlueprintInfraComponent;
  storage: BlueprintInfraComponent;
  email: BlueprintInfraComponent;
  queue: BlueprintInfraComponent;
  monitoring: BlueprintInfraComponent;
  analytics: BlueprintInfraComponent;
  payments: BlueprintInfraComponent;
  auth: BlueprintInfraComponent;
}

export interface BlueprintInfraComponent {
  provider: string;
  rationale: string;
  confidence: number;
}

export interface BlueprintIntegration {
  name: string;
  provider: string;
  requiredEnv: string[];
  webhooks: string[];
}

export interface BlueprintModule {
  name: string;
  description: string;
  entities: string[];
  services: string[];
}

export interface BlueprintEntity {
  name: string;
  tableName: string;
  description?: string;
  fields: BlueprintField[];
  relationships?: any[];
  indexes: string[];
  constraints: string[];
  ownership?: {
    ownedBy?: string;
    isOwner?: boolean;
  };
  evidence?: any[];
  // Graph-analytics context — only populated when import-graph analytics were
  // available at blueprint time; all three stay undefined otherwise.
  isPrimary?: boolean; // true if this entity's source file is a god node
  communityId?: number; // community this entity belongs to (-1 if unassigned)
  sourceFile?: string; // file path this entity was inferred from
}

export interface BlueprintField {
  name: string;
  type: string;
  isPrimary?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  references?: string;
  validation?: BlueprintValidation;
  evidence?: any[];
}

export interface BlueprintValidation {
  required?: boolean;
  format?: "email" | "uuid" | "url" | "ipv4" | "ipv6";
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: string[];
}

export interface BlueprintDatabase {
  type: string;
  tables: string[];
  schemas: string[];
}

export interface BlueprintAPI {
  module: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  description: string;
  isProtected: boolean;
  requiredRoles: string[];
}

export interface BlueprintService {
  name: string;
  module: string;
  description: string;
  methods: string[];
}

export interface BlueprintStorage {
  bucket: string;
  purpose: string;
  access: "public" | "private";
}

export interface BlueprintQueue {
  name: string;
  purpose: string;
  concurrency: number;
}

export interface BlueprintEvent {
  name: string;
  source: string;
  payload: string[];
}

export interface BlueprintPermission {
  role: string;
  action: string;
  resource: string;
}

// Capability + relationship shapes consumed by the deterministic generators.
// Permissive by design (blueprint.capabilities / entity.relationships are any[]).
export interface BlueprintCapability {
  id?: string;
  name: string;
  description?: string;
  category?: string;
  associatedEntity?: string;
  confidence?: number;
  status?: string;
  [key: string]: any;
}

export interface BlueprintRelationship {
  target: string;
  type: string;
  field?: string;
  foreignKey?: string;
  [key: string]: any;
}

export interface ArchitectureReviewState {
  overview: {
    name: string;
    description: string;
    type: string;
    complexity: number;
  };
  roles: BackendRole[];
  capabilities: any[]; // BusinessCapability[]
  businessRules: BackendBusinessRule[];
  entities: BackendEntity[];
  integrations: BackendIntegration[];
  requirements: BackendRequirement[];
  infrastructure: BackendInfrastructure;
  confidenceLevels: Record<string, number>;
  gaps: any[]; // ArchitectureGap[]
  activePattern?: any; // ArchitecturePattern
}

export interface ResolvedArchitectureState {
  domainGraph: any; // DomainGraph
  entities: any[]; // DomainEntity[]
  relationships: any[]; // DomainRelationship[]
  capabilities: any[]; // BusinessCapability[]
  infrastructure: BackendInfrastructure;
  stackSelections: ArchitecturePreferences;
  resolvedGapAnswers: Record<string, string>;
  remainingGaps: any[]; // ArchitectureGap[]
  readinessScore: number;
  confidenceLevels: Record<string, number>;
  overview: {
    name: string;
    description: string;
    type: string;
    complexity: number;
  };
  roles: any[]; // DomainRole[]
  businessRules: any[]; // ArchitectureRule[]
  suggestions: any[]; // PatternSuggestion[]
}
