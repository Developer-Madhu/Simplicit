import { ConfidenceLevel } from "@/features/ingestion/types";

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
  table: string;
  description?: string;
  fields: BlueprintField[];
  relationships?: any[];
  indexes: string[];
  evidence?: any[];
}

export interface BlueprintField {
  name: string;
  type: string;
  isPrimary?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  references?: string;
  evidence?: any[];
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
