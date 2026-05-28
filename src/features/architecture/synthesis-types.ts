import { ConfidenceLevel, IngestionResult, ClarificationQuestion } from "@/features/ingestion/types";
import { 
  BackendRole, 
  BackendWorkflow, 
  BackendEntity, 
  BackendIntegration, 
  BackendRequirement, 
  BackendInfrastructure,
  BackendBusinessRule
} from "./types";

export interface UnifiedContext {
  applicationType: string;
  name: string;
  description: string;
  roles: BackendRole[];
  workflows: BackendWorkflow[];
  entities: BackendEntity[];
  integrations: BackendIntegration[];
  businessRules: BackendBusinessRule[];
  infrastructure: BackendInfrastructure;
  confidence: Record<string, ConfidenceLevel>;
  sources: Record<string, string[]>;
}

export interface DomainNode {
  id: string;
  type: "Role" | "Entity" | "Workflow" | "Integration";
  label: string;
  metadata?: any;
}

export interface DomainEdge {
  from: string;
  to: string;
  relation: "owns" | "contains" | "places" | "creates" | "manages" | "depends_on" | "triggers" | "requires" | "accesses";
}

export interface DomainGraph {
  nodes: DomainNode[];
  edges: DomainEdge[];
}

export interface PermissionMatrixEntry {
  role: string;
  resource: string;
  action: "create" | "read" | "update" | "delete" | "manage" | "read_own" | "update_own" | "delete_own";
}

export interface PermissionMatrix {
  entries: PermissionMatrixEntry[];
}

export interface ArchitectureSynthesis {
  context: UnifiedContext;
  graph: DomainGraph;
  matrix: PermissionMatrix;
}
