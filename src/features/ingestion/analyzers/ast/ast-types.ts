/**
 * ast-types.ts
 * ─────────────────────────────────────────────────────────────────────
 * Canonical AST node shapes produced by the in-browser Tree-sitter
 * pipeline. Every downstream engine (entity-inferrer, api-inferrer,
 * workflow-inferrer, synthesis-engine) consumes ONLY these types —
 * never raw Tree-sitter nodes.
 *
 * Drop-in replacement for the existing regex-based extractors.
 * Output maps 1-to-1 with the existing IngestionResult shape so
 * zero changes are needed in index.ts orchestration.
 */

// ─── Confidence (mirrors existing ConfidenceLevel union) ────────────
export type ASTConfidence =
  | "Deterministic"         // proven from AST — e.g. explicit TypeScript interface
  | "Strong evidence"       // found in 2+ AST signals
  | "Multi-source confirmation"
  | "Partial evidence"      // 1 weak signal
  | "Heuristic inference";  // fallback

// ─── Evidence trail (Graphify-style EXTRACTED/INFERRED tagging) ──────
export type EvidenceTag = "EXTRACTED" | "INFERRED" | "AMBIGUOUS";

export interface ASTEvidence {
  tag: EvidenceTag;
  filePath: string;
  line: number;         // 1-based
  column: number;       // 0-based
  snippet: string;      // max 120 chars of source for auditing
  confidence: number;   // 0–100
}

// ─── Prop from TypeScript interface/type ────────────────────────────
export interface ASTProp {
  name: string;
  type: string;          // raw TypeScript type string, "unknown" if not typed
  required: boolean;
  defaultValue: string | null;
}

// ─── API call found inside a component ──────────────────────────────
export type HTTPMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE" | "UNKNOWN";
export type APILibrary = "fetch" | "axios" | "trpc" | "react-query" | "swr" | "unknown";

export interface ASTAPICall {
  method: HTTPMethod;
  url: string | null;          // static URL if determinable; null if dynamic
  urlPattern: string | null;   // /api/users/:id style if we can resolve it
  library: APILibrary;
  line: number;
  filePath: string;
  confidence: ASTConfidence;
  evidence: ASTEvidence;
}

// ─── React/Vue/Svelte component ─────────────────────────────────────
export interface ASTComponent {
  name: string;
  filePath: string;
  line: number;
  exportType: "default" | "named" | "none";
  props: ASTProp[];
  stateFields: string[];           // useState variable names
  contextDependencies: string[];   // useContext argument names
  apiCalls: ASTAPICall[];
  childComponents: string[];       // JSX/template tags that start with uppercase
  hasForm: boolean;
  hasTable: boolean;
  hasChart: boolean;
  confidence: ASTConfidence;
  evidence: ASTEvidence[];
}

// ─── Route ──────────────────────────────────────────────────────────
export type ASTRouteKind = "page" | "layout" | "api" | "unknown";
export type ASTFramework =
  | "nextjs-app"
  | "nextjs-pages"
  | "nuxt"
  | "sveltekit"
  | "astro"
  | "react-router"
  | "generic";

export interface ASTRoute {
  path: string;
  filePath: string;
  framework: ASTFramework;
  kind: ASTRouteKind;
  isDynamic: boolean;
  isProtected: boolean;
  paramSegments: string[];        // ["id", "slug"]
  httpMethods: HTTPMethod[];      // only for API routes
  confidence: ASTConfidence;
  evidence: ASTEvidence[];
}

// ─── Import/export edge ──────────────────────────────────────────────
export interface ASTImport {
  fromFile: string;     // absolute path within the zip/repo
  importedName: string; // "Button", "useAuth", etc.
  isDefault: boolean;
  line: number;
}

// ─── TypeScript type/interface definition ───────────────────────────
export interface ASTTypeDefinition {
  name: string;
  kind: "interface" | "type" | "enum" | "class";
  fields: Array<{ name: string; type: string; optional: boolean }>;
  filePath: string;
  line: number;
  confidence: ASTConfidence;
  evidence: ASTEvidence;
}

// ─── Data-flow node (store / context) ───────────────────────────────
export interface ASTDataFlow {
  kind: "zustand" | "redux" | "jotai" | "recoil" | "context" | "unknown";
  name: string;
  stateShape: Record<string, string>;  // field name → inferred type
  filePath: string;
  line: number;
}

// ─── Full per-file AST result ────────────────────────────────────────
export interface ASTFileResult {
  filePath: string;
  language: "typescript" | "tsx" | "javascript" | "jsx" | "vue" | "svelte" | "other";
  components: ASTComponent[];
  routes: ASTRoute[];
  imports: ASTImport[];
  typeDefinitions: ASTTypeDefinition[];
  apiCalls: ASTAPICall[];   // top-level (outside any component)
  dataFlows: ASTDataFlow[];
  parseError: string | null;
}

// ─── Full project AST graph ──────────────────────────────────────────
// This is the normalized format that works whether input came from:
//   • an in-browser ZIP/GitHub extraction (our Tree-sitter pipeline)
//   • a user-supplied graphify-out/graph.json (Graphify mode)
export interface SimplicitASTGraph {
  projectName: string | null;
  framework: string;
  language: "typescript" | "javascript" | "mixed";
  files: ASTFileResult[];
  allComponents: ASTComponent[];
  allRoutes: ASTRoute[];
  allTypeDefinitions: ASTTypeDefinition[];
  allAPICallsFlat: ASTAPICall[];
  allDataFlows: ASTDataFlow[];
  importGraph: Map<string, string[]>;  // filePath → files it imports
  stats: {
    totalFiles: number;
    componentCount: number;
    routeCount: number;
    apiCallCount: number;
    typeDefCount: number;
    parseErrors: number;
  };
  extractedAt: string;
  source: "zip" | "github" | "graphify-json";
}
