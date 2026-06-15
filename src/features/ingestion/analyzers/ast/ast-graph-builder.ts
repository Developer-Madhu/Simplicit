/**
 * ast-graph-builder.ts
 * ─────────────────────────────────────────────────────────────────────
 * Aggregates all ASTFileResults into a SimplicitASTGraph.
 * This is the Graphify-equivalent "graph.json" for Simplicit —
 * the normalized format that feeds directly into the entity-inferrer,
 * api-inferrer, and synthesis-engine.
 *
 * Also handles importing a real graphify-out/graph.json so users
 * who run Graphify get a better-quality extraction for free.
 */

import { parseFile, deriveRoutes, initializeAST, isASTInitialized } from "./ast-parser";
import type {
  SimplicitASTGraph,
  ASTFileResult,
  ASTComponent,
  ASTRoute,
  ASTAPICall,
  ASTTypeDefinition,
  ASTDataFlow,
} from "./ast-types";

// ─── Files we skip entirely ──────────────────────────────────────────
const SKIP_PATTERNS = [
  /node_modules/,
  /\.next\//,
  /\.nuxt\//,
  /\.svelte-kit\//,
  /dist\//,
  /build\//,
  /\.git\//,
  /coverage\//,
  /\.(test|spec)\.(tsx?|jsx?)/,
  /\.stories\.(tsx?|jsx?)/,
  /\.d\.ts$/,
  /graphify-out\//,
  // Monorepo non-frontend packages (cal.com / turbo-style layouts)
  /packages\/app-store\//,     // app-store integrations
  /packages\/emails\//,        // email templates
  /packages\/i18n\//,          // translations
  /packages\/prisma\//,        // database schema (not frontend)
  /packages\/config\//,        // build configs
  /packages\/tsconfig\//,      // TypeScript configs
  /packages\/testing\//,       // test utilities
  /packages\/kysely\//,        // query builder
  /\.test\.(tsx?|jsx?)$/,       // test files (may be missing)
  /\.spec\.(tsx?|jsx?)$/,       // spec files
  /\.stories\.(tsx?|jsx?)$/,    // storybook
  /\/__tests__\//,             // test directories
  /\/\.storybook\//,           // storybook config
];

const PARSEABLE_EXTENSIONS = /\.(tsx?|jsx?|mjs)$/;

// ─── Main builder ────────────────────────────────────────────────────
export async function buildASTGraph(
  files: Map<string, string>,
  detectedFramework: string,
  projectName: string | null,
  onProgress?: (msg: string, pct: number) => void
): Promise<SimplicitASTGraph> {
  // Attempt to initialize Tree-sitter WASM (silent fallback on failure)
  if (!isASTInitialized()) {
    onProgress?.("Initializing AST engine...", 0);
    await initializeAST();
  }

  const mode = isASTInitialized() ? "Tree-sitter AST" : "Regex fallback";
  onProgress?.(`Parsing files (${mode})...`, 5);

  const parseableFiles: Array<[string, string]> = [];
  for (const [path, content] of files) {
    if (SKIP_PATTERNS.some((p) => p.test(path))) continue;
    if (!PARSEABLE_EXTENSIONS.test(path)) continue;
    if (content.length > 500_000) continue; // skip enormous generated files
    parseableFiles.push([path, content]);
  }

  const total = parseableFiles.length;

  // PASS 1: Parse all files to discover axios instances
  const pass1Results: ASTFileResult[] = [];
  for (let i = 0; i < parseableFiles.length; i++) {
    const [path, content] = parseableFiles[i];
    if (i % 10 === 0) onProgress?.(`Scanning ${path.split("/").pop()}...`, 5 + Math.round((i / total) * 35));
    if (i > 0 && i % 20 === 0) await new Promise((r) => setTimeout(r, 0));
    pass1Results.push(parseFile(path, content, detectedFramework));
  }

  // Collect axios instance names from pass 1
  // e.g. "request", "api", "http", "axiosInstance", "client"
  const axiosInstanceNames = new Set<string>(
    pass1Results
      .flatMap((r) => r.dataFlows)
      .filter((d) => d.name.startsWith("__axios_instance__"))
      .map((d) => d.name.replace("__axios_instance__", ""))
  );

  // PASS 2: Re-parse files with known instance names to extract API calls
  const fileResults: ASTFileResult[] = [];
  for (let i = 0; i < parseableFiles.length; i++) {
    const [path, content] = parseableFiles[i];
    if (i % 10 === 0) onProgress?.(`Parsing ${path.split("/").pop()}... (${i}/${total})`, 40 + Math.round((i / total) * 35));
    if (i > 0 && i % 20 === 0) await new Promise((r) => setTimeout(r, 0));
    fileResults.push(parseFile(path, content, detectedFramework, axiosInstanceNames));
  }

  onProgress?.("Building relationship graph...", 80);

  // Aggregate
  const allComponents: ASTComponent[] = fileResults.flatMap((r) => r.components);
  const allRoutes: ASTRoute[] = fileResults.flatMap((r) => r.routes);
  const allTypeDefs: ASTTypeDefinition[] = fileResults.flatMap((r) => r.typeDefinitions);
  const allAPICalls: ASTAPICall[] = [
    ...fileResults.flatMap((r) => r.apiCalls),
    ...allComponents.flatMap((c) => c.apiCalls),
  ];
  const allDataFlows: ASTDataFlow[] = fileResults.flatMap((r) => r.dataFlows);

  // Deduplicate API calls by method+url
  const seenAPIs = new Set<string>();
  const dedupedAPICalls = allAPICalls.filter((c) => {
    const key = `${c.method}:${c.url ?? c.urlPattern ?? "unknown"}`;
    if (seenAPIs.has(key)) return false;
    seenAPIs.add(key);
    return true;
  });

  // Build import graph (filePath → files it imports)
  const importGraph = new Map<string, string[]>();
  for (const result of fileResults) {
    const imports = result.imports
      .map((imp) => resolveImportPath(result.filePath, imp.fromFile, files))
      .filter(Boolean) as string[];
    if (imports.length > 0) importGraph.set(result.filePath, imports);
  }

  const parseErrors = fileResults.filter((r) => r.parseError !== null).length;

  onProgress?.("AST extraction complete.", 100);

  // Detect language
  const hasTSFiles = parseableFiles.some(([p]) => /\.tsx?$/.test(p));
  const hasJSFiles = parseableFiles.some(([p]) => /\.[jm]sx?$/.test(p) && !/\.tsx?$/.test(p));
  const language: SimplicitASTGraph["language"] =
    hasTSFiles && hasJSFiles ? "mixed" : hasTSFiles ? "typescript" : "javascript";

  return {
    projectName,
    framework: detectedFramework,
    language,
    files: fileResults,
    allComponents,
    allRoutes,
    allTypeDefinitions: allTypeDefs,
    allAPICallsFlat: dedupedAPICalls,
    allDataFlows,
    importGraph,
    stats: {
      totalFiles: parseableFiles.length,
      componentCount: allComponents.length,
      routeCount: allRoutes.length,
      apiCallCount: dedupedAPICalls.length,
      typeDefCount: allTypeDefs.length,
      parseErrors,
    },
    extractedAt: new Date().toISOString(),
    source: "zip",
  };
}

// ─── Graphify graph.json importer ────────────────────────────────────
/**
 * When a user runs `graphify .` and uploads graphify-out/graph.json,
 * we parse it into a SimplicitASTGraph so the same synthesis engine
 * handles both code paths identically.
 *
 * Graphify graph.json shape (v8):
 * {
 *   nodes: [{ id, label, type, file, line, degree }],
 *   edges: [{ source, target, relation, confidence, tag }],
 *   communities: [{ id, label, members }],
 *   god_nodes: [{ id, degree }],
 *   metadata: { project, extracted_at }
 * }
 */
export function importGraphifyJSON(graphJson: string): SimplicitASTGraph | null {
  try {
    const graph = JSON.parse(graphJson);
    if (!graph.nodes || !graph.edges) return null;

    type GNode = { id: string; label: string; type: string; file?: string; line?: number; degree?: number };
    type GEdge = { source: string; target: string; relation: string; confidence?: string; tag?: string };

    const nodes: GNode[] = graph.nodes;
    const edges: GEdge[] = graph.edges;

    // Map Graphify node types to our types
    const componentNodes = nodes.filter((n) =>
      ["function", "class", "component", "arrow_function"].includes(n.type)
    );
    const typeNodes = nodes.filter((n) => ["interface", "type", "enum"].includes(n.type));
    const fileNodes = nodes.filter((n) => n.type === "file");

    const allComponents: ASTComponent[] = componentNodes
      .filter((n) => /^[A-Z]/.test(n.label))
      .map((n) => ({
        name: n.label,
        filePath: n.file ?? "unknown",
        line: n.line ?? 1,
        exportType: "unknown" as any,
        props: [],
        stateFields: [],
        contextDependencies: [],
        apiCalls: [],
        childComponents: edges
          .filter((e) => e.source === n.id && e.relation === "calls")
          .map((e) => nodes.find((nn) => nn.id === e.target)?.label)
          .filter(Boolean) as string[],
        hasForm: false,
        hasTable: false,
        hasChart: false,
        confidence: "Strong evidence" as const,
        evidence: [
          {
            tag: (n.type === "function" ? "EXTRACTED" : "INFERRED") as "EXTRACTED" | "INFERRED",
            filePath: n.file ?? "unknown",
            line: n.line ?? 1,
            column: 0,
            snippet: `Graphify node: ${n.label} (${n.type})`,
            confidence: 85,
          },
        ],
      }));

    const allTypeDefs: ASTTypeDefinition[] = typeNodes.map((n) => ({
      name: n.label,
      kind: (n.type as "interface" | "type" | "enum") ?? "type",
      fields: [],
      filePath: n.file ?? "unknown",
      line: n.line ?? 1,
      confidence: "Strong evidence" as const,
      evidence: {
        tag: "EXTRACTED" as const,
        filePath: n.file ?? "unknown",
        line: n.line ?? 1,
        column: 0,
        snippet: `Graphify: ${n.label}`,
        confidence: 90,
      },
    }));

    // Build import graph from edges
    const importGraph = new Map<string, string[]>();
    for (const edge of edges) {
      if (edge.relation === "imports" || edge.relation === "uses") {
        const src = nodes.find((n) => n.id === edge.source)?.file;
        const tgt = nodes.find((n) => n.id === edge.target)?.file;
        if (src && tgt) {
          const existing = importGraph.get(src) ?? [];
          if (!existing.includes(tgt)) existing.push(tgt);
          importGraph.set(src, existing);
        }
      }
    }

    return {
      projectName: graph.metadata?.project ?? null,
      framework: graph.metadata?.framework ?? "Unknown",
      language: "typescript",
      files: [],
      allComponents,
      allRoutes: [],
      allTypeDefinitions: allTypeDefs,
      allAPICallsFlat: [],
      allDataFlows: [],
      importGraph,
      stats: {
        totalFiles: fileNodes.length,
        componentCount: allComponents.length,
        routeCount: 0,
        apiCallCount: 0,
        typeDefCount: allTypeDefs.length,
        parseErrors: 0,
      },
      extractedAt: graph.metadata?.extracted_at ?? new Date().toISOString(),
      source: "graphify-json",
    };
  } catch {
    return null;
  }
}

// ─── Import path resolver ────────────────────────────────────────────
function resolveImportPath(
  fromFile: string,
  importPath: string,
  files: Map<string, string>
): string | null {
  // TypeScript path aliases (@/, ~/, #/). Projects map these to EITHER the
  // project root (e.g. "@/*" -> "./*", as in next-saas-stripe-starter) or to
  // src/ (e.g. "@/*" -> "./src/*"). Try both so edges resolve regardless of the
  // alias convention — the previous code assumed src/ only and dropped every
  // root-aliased import.
  if (/^[@~#]\//.test(importPath)) {
    const stripped = importPath.replace(/^[@~#]\//, "");
    return tryExtensions(stripped, files) ?? tryExtensions("src/" + stripped, files);
  }

  if (!importPath.startsWith(".")) return null; // external package

  // Relative import — resolve against the source file's directory, collapsing
  // both ./ and ../ segments. The previous code only collapsed "/./", so any
  // "../" import resolved to a literal path that never matched a file key.
  const sourceDir = fromFile.includes("/")
    ? fromFile.slice(0, fromFile.lastIndexOf("/"))
    : "";
  const joined = (sourceDir ? sourceDir + "/" : "") + importPath;
  const resolved: string[] = [];
  for (const part of joined.split("/")) {
    if (part === "..") resolved.pop();
    else if (part !== "." && part !== "") resolved.push(part);
  }
  return tryExtensions(resolved.join("/"), files);
}

function tryExtensions(base: string, files: Map<string, string>): string | null {
  const exts = [".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts", "/index.js"];
  for (const ext of exts) {
    if (files.has(base + ext)) return base + ext;
    if (files.has(base)) return base;
  }
  return null;
}
