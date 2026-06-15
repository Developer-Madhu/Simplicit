import type {
  ArchitectureNode,
  FileNode,
  ModuleSummary,
  RouteSummary,
  SchemaTable
} from "@/lib/types";
import type { NormalizedSchema } from "./schema-types";
import type {
  ApiSurfaceDefinition,
  ServiceDefinition,
  DtoDefinition,
  PermissionDefinition
} from "./surface-types";
import type { PipelineStage } from "../types/pipeline-events";

export interface AuthStrategy {
  providers: string;
  sessions: string;
  roles: string;
  mfa: string;
  rateLimit: string;
}

export interface AuthFlowStep {
  n: number;
  t: string;
  d: string;
}

export interface EnvVariable {
  k: string;
  v: string;
  kind: "secret" | "public";
  note?: string;
}

export interface GenerationMetadata {
  stackSummary: Record<string, string>;
  modules: ModuleSummary[];
  apiRoutes: RouteSummary[];
  schemaTables: SchemaTable[];
  architectureNodes: ArchitectureNode[];
  architectureEdges: Array<[string, string, string]>;
  fileTree: FileNode[];
  routeCode: string[];
  schemaCode: string[];
  authStrategy: AuthStrategy;
  authFlowSteps: AuthFlowStep[];
  envVariables: EnvVariable[];
  files?: Record<string, string>;
  // Uploaded frontend source files (path → content), persisted at project
  // creation from IngestionResult.keyFiles. Lets the IDE explorer show the
  // user's analyzed frontend immediately — before/during the pipeline — since
  // serializeIngestionResult intentionally drops keyFiles from `ingestion`.
  source_files?: Record<string, string>;
  // Written by the pipeline's failure path so a hard-refresh can reconstruct the
  // error panel (there is no 'failed' project status in the schema — failure is
  // status 'paused' + this field). Cleared (null) on a successful run.
  lastError?: { stage: PipelineStage; message: string; timestamp: number } | null;
  // Set by the deterministic pipeline (Agent 3) so the final pipeline summary
  // can report security counts without re-running analysis.
  securitySummary?: { issuesFound: number; issuesFixed: number };
  normalizedSchema?: NormalizedSchema;
  apiSurface?: ApiSurfaceDefinition[];
  services?: ServiceDefinition[];
  serviceImplementations?: Record<string, Record<string, string>>;
  dtos?: DtoDefinition[];
  permissions?: PermissionDefinition;
}

