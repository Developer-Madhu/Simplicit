import { ConfidenceLevel } from "@/features/ingestion/types";
import { BlueprintInfrastructure } from "./types";

export enum SemanticType {
  ENTITY = "ENTITY",
  REFERENCE_ENTITY = "REFERENCE_ENTITY",
  PERSISTENT_ENTITY = "PERSISTENT_ENTITY",
  AGGREGATE_ROOT = "AGGREGATE_ROOT",
  VALUE_OBJECT = "VALUE_OBJECT",
  COMMAND = "COMMAND",
  WORKFLOW = "WORKFLOW",
  EVENT = "EVENT",
  ROLE = "ROLE",
  UI_COMPONENT = "UI_COMPONENT",
  PAGE = "PAGE",
  VIEW_MODEL = "VIEW_MODEL",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
  INFRASTRUCTURE = "INFRASTRUCTURE",
  UNKNOWN = "UNKNOWN"
}

export enum EvidenceClass {
  SOURCE_CODE = "SOURCE_CODE",
  ROUTE = "ROUTE",
  API = "API",
  DATABASE = "DATABASE",
  SCHEMA = "SCHEMA",
  STATE = "STATE",
  FORM = "FORM",
  CONFIG = "CONFIG",
  DEPENDENCY = "DEPENDENCY",
  TEST = "TEST",
  DOCUMENTATION = "DOCUMENTATION"
}

export interface StructuredEvidence {
  className: EvidenceClass;
  sourceType: "route" | "component" | "page" | "api_call" | "form" | "state" | "documentation" | "dependency" | "config" | "database" | "schema";
  originalValue: string;
  semanticContext: string;
  confidence: number;
  filePath?: string;
  reasoning: string;
}

export interface DomainEntity {
  name: string;
  table: string;
  type: SemanticType.ENTITY | SemanticType.AGGREGATE_ROOT | SemanticType.REFERENCE_ENTITY | SemanticType.PERSISTENT_ENTITY;
  description: string;
  fields: DomainField[];
  relationships: DomainRelationship[];
  indexes: string[];
  constraints: string[];
  confidence: number;
  evidence: StructuredEvidence[];
  reasoning: string;
  qualificationPassed: boolean;
  qualificationScore: number;
  rejectionReason?: string;
}

export interface DomainField {
  name: string;
  type: string;
  isPrimary?: boolean;
  isNullable?: boolean;
  isUnique?: boolean;
  references?: string;
  evidence: StructuredEvidence[];
}

export interface DomainRelationship {
  target: string;
  type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
  ownership: boolean;
  joinTable?: string;
  cascade?: "delete" | "nullify" | "none";
  evidence: StructuredEvidence[];
}

export interface DomainRole {
  name: string;
  description: string;
  permissions: DomainPermission[];
  evidence: StructuredEvidence[];
  reasoning: string;
}

export interface DomainPermission {
  action: "create" | "read" | "update" | "delete" | "manage" | "read_own" | "update_own" | "delete_own";
  resource: string;
  rule?: string;
  evidence: StructuredEvidence[];
}

export interface DomainWorkflow {
  name: string;
  type: SemanticType.WORKFLOW | SemanticType.COMMAND;
  description: string;
  steps: string[];
  trigger: string;
  outcome: string;
  entities: string[];
  evidence: StructuredEvidence[];
}

export interface BoundedContext {
  name: string;
  description: string;
  entities: string[];
  services: string[];
  workflows: string[];
  evidence: StructuredEvidence[];
}

export interface ReadinessBreakdown {
  semanticAccuracy: number;
  evidenceCoverage: number;
  relationshipQuality: number;
  domainConsistency: number;
  infraVerification: number;
  securityCoverage: number;
  architectureCoherence: number;
}

export interface ArchitectureGap {
  id: string;
  category: "data_model" | "security" | "infrastructure" | "workflow" | "lifecycle";
  severity: "critical" | "important" | "optional";
  description: string;
  confidence: number;
  impact: string;
  requiredForGeneration: boolean;
  questionId?: string;
}

export interface PatternSuggestion {
  name: string;
  id: string;
  description: string;
  expectedEntities: string[];
  expectedModules: string[];
  expectedIntegrations: string[];
  confidence: number;
  evidence: StructuredEvidence[];
  isAdvisory: boolean;
}

export enum CapabilityCategory {
  AUTHENTICATION = "AUTHENTICATION",
  CONTENT_MANAGEMENT = "CONTENT_MANAGEMENT",
  LISTING_MANAGEMENT = "LISTING_MANAGEMENT",
  RESERVATION_MANAGEMENT = "RESERVATION_MANAGEMENT",
  PAYMENT_MANAGEMENT = "PAYMENT_MANAGEMENT",
  USER_MANAGEMENT = "USER_MANAGEMENT",
  REVIEW_MANAGEMENT = "REVIEW_MANAGEMENT",
  SEARCH_DISCOVERY = "SEARCH_DISCOVERY",
  ADMINISTRATION = "ADMINISTRATION",
  UNKNOWN = "UNKNOWN"
}

export interface BusinessCapability {
  id: string;
  name: string;
  description: string;
  category: CapabilityCategory;
  evidence: StructuredEvidence[];
  confidence: number;
  associatedEntity?: string;
  status?: string;
}

export interface DomainGraph {
  entities: DomainEntity[];
  relationships: DomainRelationship[];
  capabilities: BusinessCapability[];
  modules: BoundedContext[];
  infrastructure: BlueprintInfrastructure;
  roles: DomainRole[];
  businessRules: ArchitectureRule[];
  evidence: StructuredEvidence[];
  nodes: DomainNode[]; // Keep for visualization mapping
  edges: DomainEdge[]; // Keep for visualization mapping
}

export interface ArchitectureRule {
  id: string;
  rule: string;
  type: "constraint" | "guard" | "validation";
  logic: string;
  entityId?: string;
}

export interface DomainInsight {
  domain: string;
  graph: DomainGraph;
  readinessScore: number;
  readinessBreakdown: ReadinessBreakdown;
  validationErrors: string[];
  gaps: ArchitectureGap[];
  suggestions: PatternSuggestion[];
  
  // Legacy aliases mapped directly to graph for backwards compatibility
  entities: DomainEntity[];
  roles: DomainRole[];
  workflows: DomainWorkflow[];
  capabilities: BusinessCapability[];
  modules: BoundedContext[];
  evidenceLog: StructuredEvidence[];
}

export interface DomainNode {
  id: string;
  type: SemanticType;
  label: string;
}

export interface DomainEdge {
  from: string;
  to: string;
  relation: "owns" | "contains" | "places" | "creates" | "manages" | "depends_on" | "triggers" | "requires" | "accesses" | "references";
}
