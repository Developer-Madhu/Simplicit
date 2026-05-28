import type {
  ArchitectureNode,
  FileNode,
  ModuleSummary,
  RouteSummary,
  SchemaTable
} from "@/lib/types";
import type { NormalizedSchema } from "./schema-types";

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
  normalizedSchema?: NormalizedSchema;
}

