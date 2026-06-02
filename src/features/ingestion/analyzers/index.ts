/**
 * index.ts  (UPDATED — AST-first orchestration)
 * ─────────────────────────────────────────────────────────────────────
 * What changed vs the original:
 *
 *   1. AST-FIRST: Before any analysis, `buildASTGraph()` runs the
 *      Tree-sitter pipeline over all files. This produces a
 *      `SimplicitASTGraph` with precise, evidence-tagged nodes.
 *
 *   2. AST INFERRERS: inferEntities, inferAPIs, inferRoles, jsxIntent
 *      now come from `ast-domain-inferrers.ts` which reads the graph.
 *      The regex-based inferrers remain as a fallback if AST fails.
 *
 *   3. GRAPHIFY SUPPORT: If the user uploads graphify-out/graph.json
 *      it's imported via `importGraphifyJSON()` and treated as the
 *      AST graph — same synthesis pipeline, better quality.
 *
 *   4. ZERO BREAKING CHANGES: IngestionResult shape is identical.
 *      The synthesis-engine, domain-intelligence-engine, and all
 *      downstream code need no modifications.
 *
 *   5. PROGRESS REPORTING: AST stages are surfaced through onProgress
 *      so the UI can show accurate loading states.
 */

import type {
  IngestionResult,
  AnalysisStage,
  FeatureModule,
  SemanticGraph,
  SemanticNode,
  SemanticEdge,
  ConfidenceLevel,
  InferredRole,
  InferredWorkflow,
  CRUDSystem,
  StateAnalysis,
  SimplicitContext,
} from "../types";

// ── Existing analyzers (kept for fallback + non-duplicated logic) ──
import { detectFramework, extractDependencies } from "./framework-detector";
import { extractRoutes } from "./route-extractor";
import { inferMetadata } from "./metadata-inferrer";
import { calculateComplexity, inferMissingBackendSystems } from "./complexity-analyzer";
import { inferWorkflowsAndCRUD } from "./workflow-inferrer";
import { analyzeStateManagement } from "./state-inferrer";
import { parseSimplicitContext, generateClarificationQuestions, reconstructDomainFromContext } from "./context-parser";
import { generateClarificationQuestions as generateAdaptiveQuestions } from "./question-generator";

// ── NEW: AST pipeline ──────────────────────────────────────────────
import { buildASTGraph, importGraphifyJSON } from "./ast/ast-graph-builder";
import {
  inferEntitiesFromAST,
  inferAPIFromAST,
  inferRolesFromAST,
  analyzeIntentFromAST,
} from "./ast/ast-domain-inferrers";

// ── Fallback regex inferrers (used if AST produces zero results) ────
import { inferEntities } from "./entity-inferrer";
import { inferApiExpectations } from "./api-inferrer";
import { inferRoles } from "./role-inferrer";
import { analyzeJsxIntent } from "./jsx-intent";

import type { SimplicitASTGraph } from "./ast/ast-types";

// ─── AnalysisStage extended labels ───────────────────────────────────
// These are passed to onProgress and surfaced in the UI loading screen.
// Adding AST-specific stages doesn't break the existing AnalysisStage
// type as long as it's typed as string in the UI component.
type ExtendedAnalysisStage =
  | AnalysisStage
  | "Initializing AST engine..."
  | "Parsing source files (AST)..."
  | "Building knowledge graph..."
  | "Extracting entities from AST..."
  | "Importing Graphify graph...";

// ─── Main entry point ─────────────────────────────────────────────────
export async function analyzeProject(
  rawFiles: Map<string, string>,
  mode: "zip" | "github" | "context" | "prompt",
  onProgress?: (stage: AnalysisStage) => void,
  targetRoot?: string,
  userPrompt: string = ""
): Promise<IngestionResult> {
  const analysisLogs: string[] = [];
  const log = (msg: string) => {
    const time = new Date().toLocaleTimeString();
    analysisLogs.push(`[${time}] ${msg}`);
  };
  const progress = (stage: string) => onProgress?.(stage as AnalysisStage);

  log(`Starting ${mode} analysis of ${rawFiles.size} files...`);

  // ── 1. Root Normalization (unchanged) ────────────────────────────
  progress("Mapping filesystem...");
  const { root, files, candidates } = resolveProjectRoot(rawFiles, targetRoot);
  root ? log(`Root normalized to: ${root}`) : log(`Using root: ./`);

  // ── 2. Context-first orchestration (unchanged from original) ─────
  let simplicitContext: SimplicitContext | undefined;
  const contextFile = Array.from(rawFiles.keys()).find((p) =>
    p.toLowerCase().endsWith("simplicit.context.md")
  );
  if (contextFile) {
    log(`Authoritative spec found: ${contextFile}`);
    const parsed = parseSimplicitContext(rawFiles.get(contextFile)!);
    if (!parsed.validation.isValid && parsed.validation.errors.some((e) => e.includes("schema version"))) {
      throw new Error(`Ingestion Blocked: ${parsed.validation.errors.join(", ")}`);
    }
    simplicitContext = parsed;
    log(`Context intelligence: ${simplicitContext.metrics.entityCount} entities, ${simplicitContext.metrics.workflowCount} workflows`);
  }

  const isContextOnly = mode === "context";

  // ── 3. Framework detection (unchanged) ───────────────────────────
  progress("Detecting framework...");
  await tick(200);

  let framework = isContextOnly
    ? {
        name: "Unknown",
        confidence: "Heuristic inference" as const,
        evidence: [] as string[],
        version: null,
        router: null,
        cssFramework: null,
        stateManagement: null,
        language: "javascript" as const,
      }
    : detectFramework(files);

  if (simplicitContext?.frontendStack.framework && simplicitContext.frontendStack.framework !== "Unknown") {
    framework = {
      ...framework,
      name: simplicitContext.frontendStack.framework,
      confidence: "Deterministic",
      evidence: ["Declared in simplicit.context.md"],
      language: simplicitContext.frontendStack.language.toLowerCase().includes("type") ? "typescript" : "javascript" as any,
      cssFramework: simplicitContext.frontendStack.uiLibraries.join(" + ") || framework.cssFramework,
      stateManagement: simplicitContext.frontendStack.stateLibraries.join(", ") || framework.stateManagement,
    };
  }

  // ── 4. Dependencies & file tree (unchanged) ───────────────────────
  const fileTree = Array.from(files.keys()).map((p) => p.replace(/\\/g, "/")).sort();
  let dependencies = isContextOnly ? [] : extractDependencies(files);

  if (simplicitContext) {
    const contextDeps = [
      ...simplicitContext.integrations.map((i) => ({ name: i.name, version: "latest", isDev: false })),
      ...simplicitContext.frontendStack.uiLibraries.map((l) => ({ name: l.toLowerCase().replace(/ /g, "-"), version: "latest", isDev: false })),
      ...simplicitContext.frontendStack.stateLibraries.map((l) => ({ name: l.toLowerCase().replace(/ /g, "-"), version: "latest", isDev: false })),
    ];
    const existingNames = new Set(dependencies.map((d) => d.name.toLowerCase()));
    contextDeps.forEach((cd) => {
      if (!existingNames.has(cd.name.toLowerCase())) dependencies.push(cd);
    });
  }

  log(`Mapped ${fileTree.length} files, ${dependencies.length} dependencies`);

  // ── 5. Route extraction (unchanged — filesystem-based) ────────────
  progress("Reconstructing route hierarchy...");
  await tick(200);

  let routes = isContextOnly ? [] : extractRoutes(files, framework.name);

  if (simplicitContext?.endpoints.length) {
    simplicitContext.endpoints.forEach((e) => {
      if (!routes.some((r) => r.path === e.path)) {
        routes.push({
          path: e.path,
          component: null,
          isDynamic: e.path.includes(":"),
          isProtected: e.isProtected,
          category: "unknown",
          params: [],
          kind: e.path.startsWith("/api") ? "api" : "page",
          confidence: "Deterministic",
          evidence: ["Declared in simplicit.context.md"],
        });
      }
    });
  }

  // ── 6. ★ AST PIPELINE ★ ──────────────────────────────────────────
  let astGraph: SimplicitASTGraph | null = null;

  if (!isContextOnly) {
    // Check for graphify-out/graph.json (user-supplied Graphify output)
    const graphifyJsonKey = Array.from(rawFiles.keys()).find(
      (p) => p.includes("graphify-out") && p.endsWith("graph.json")
    );

    if (graphifyJsonKey) {
      progress("Importing Graphify graph..." as any);
      log("Graphify graph.json detected — importing pre-built knowledge graph.");
      astGraph = importGraphifyJSON(rawFiles.get(graphifyJsonKey)!);
      if (astGraph) {
        log(`Graphify import: ${astGraph.stats.componentCount} components, ${astGraph.stats.typeDefCount} types`);
      }
    }

    if (!astGraph) {
      // In-browser AST extraction
      progress("Initializing AST engine..." as any);
      log("Starting Tree-sitter AST extraction...");

      astGraph = await buildASTGraph(
        files,
        framework.name,
        null,
        (msg, pct) => {
          progress(msg as any);
          log(msg);
        }
      );

      const mode = astGraph.stats.parseErrors === 0 ? "Tree-sitter" : "Hybrid (Tree-sitter + regex)";
      log(`AST extraction complete (${mode}): ${astGraph.stats.componentCount} components, ${astGraph.stats.routeCount} routes, ${astGraph.stats.apiCallCount} API calls, ${astGraph.stats.typeDefCount} type defs`);
    }
  }

  // ── 7. Domain inference — AST-first, regex fallback ──────────────
  progress("Analyzing application domains...");
  await tick(200);

  const metadata = inferMetadata(files);
  const stateAnalysis = analyzeStateManagement(files, dependencies);

  let entities;
  let apiExpectations;
  let roles;
  let intentResult;

  if (astGraph && !isContextOnly) {
    // ★ AST path — higher accuracy ★
    log("Using AST-powered domain inference...");
    entities = inferEntitiesFromAST(astGraph, routes);
    apiExpectations = inferAPIFromAST(astGraph);
    roles = inferRolesFromAST(astGraph, routes);
    intentResult = analyzeIntentFromAST(astGraph);

    // Merge AST routes back (AST may have found routes regex missed)
    const existingPaths = new Set(routes.map((r) => r.path));
    for (const astRoute of astGraph.allRoutes) {
      if (!existingPaths.has(astRoute.path)) {
        routes.push({
          path: astRoute.path,
          component: astRoute.filePath,
          isDynamic: astRoute.isDynamic,
          isProtected: astRoute.isProtected,
          category: "unknown",
          params: astRoute.paramSegments,
          kind: astRoute.kind as any,
          confidence: astRoute.confidence as any,
          evidence: astRoute.evidence.map((e) => e.snippet),
        });
      }
    }

    // Fallback: if AST produced nothing (empty project, all files skipped), use regex
    if (entities.length === 0) {
      log("AST entity inference empty — falling back to regex.");
      entities = inferEntities(files, routes.map((r) => r.path));
    }
    if (apiExpectations.length === 0) {
      apiExpectations = inferApiExpectations(files);
    }
    if (roles.length === 0) {
      roles = inferRoles(routes, files);
    }
  } else {
    // ★ Regex fallback path (context-only or AST totally failed) ★
    log("Using regex-based domain inference (fallback).");
    entities = isContextOnly ? [] : inferEntities(files, routes.map((r) => r.path));
    apiExpectations = isContextOnly ? [] : inferApiExpectations(files);
    roles = isContextOnly ? [] : inferRoles(routes, files);
    intentResult = analyzeJsxIntent(files);
  }

  const scan = intentResult ?? analyzeJsxIntent(files);
  let { workflows, crudSystems } = isContextOnly
    ? { workflows: [], crudSystems: [] }
    : inferWorkflowsAndCRUD(routes, entities, scan.intent, files);

  // ── 8. Context overrides (unchanged from original) ────────────────
  metadata.primarySource = simplicitContext ? "context" : mode === "prompt" ? "prompt" : "frontend";

  if (simplicitContext) {
    const reconstruction = reconstructDomainFromContext(simplicitContext);
    if (simplicitContext.overview.name) metadata.name = simplicitContext.overview.name;
    if (simplicitContext.overview.description) metadata.description = simplicitContext.overview.description;
    if (reconstruction.appType) metadata.appType = reconstruction.appType;
    if (reconstruction.missingBackendSystems) {
      metadata.missingBackendSystems = Array.from(
        new Set([...metadata.missingBackendSystems, ...reconstruction.missingBackendSystems])
      );
    }
    if (reconstruction.roles) {
      reconstruction.roles.forEach((r: any) => {
        if (!roles.some((ir) => ir.name.toLowerCase() === r.name.toLowerCase())) roles.push(r);
      });
    }
    const reconstructedEntities = (reconstruction as { entities?: any[] }).entities;
    if (reconstructedEntities) {
      reconstructedEntities.forEach((e: any) => {
        if (!entities.some((ie) => ie.name.toLowerCase() === e.name.toLowerCase())) entities.push(e);
      });
    }
    if (reconstruction.workflows) {
      reconstruction.workflows.forEach((w: any) => {
        if (!workflows.some((iw) => iw.name.toLowerCase() === w.name.toLowerCase())) workflows.push(w);
      });
    }
  }

  // ── 9. Key files, documentation (unchanged) ───────────────────────
  const keyFiles = new Map<string, string>();
  const documentation: Array<{ path: string; content: string }> = [];
  const keyPatterns = [
    "package.json", "tsconfig.json", "next.config", "nuxt.config",
    "svelte.config", "vite.config", "tailwind.config", ".env.example",
    ".env.local", "README.md", "components.json",
  ];

  for (const [path, content] of files) {
    const filename = path.split("/").pop() || "";
    if (keyPatterns.some((pat) => filename.startsWith(pat))) keyFiles.set(path, content);
    if (path.toLowerCase().endsWith(".md") || path.toLowerCase().endsWith(".mdx")) {
      documentation.push({ path, content });
    }
  }

  // ── 10. Finalization (unchanged) ──────────────────────────────────
  progress("Detecting administrative systems...");
  const featureModules = reconstructFeatureModules(routes, entities, scan.intent);
  const semanticGraph = buildSemanticGraph(routes, entities, featureModules, apiExpectations, roles, workflows);
  const summary = generateArchitecturalSummary(metadata.appType, featureModules, entities, framework, roles, workflows, crudSystems);

  const getNormalizedId = (name: string) =>
    name
      .toLowerCase()
      .trim()
      .replace(/s$/, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

  entities.forEach((e: any) => (e.normalizedId = getNormalizedId(e.name)));
  workflows.forEach((w: any) => (w.normalizedId = getNormalizedId(w.name)));
  roles.forEach((r: any) => (r.normalizedId = getNormalizedId(r.name)));
  featureModules.forEach((m: any) => (m.normalizedId = getNormalizedId(m.name)));
  apiExpectations.forEach((ae: any) => (ae.normalizedId = getNormalizedId(`${ae.method}-${ae.path}`)));

  entities.sort((a: any, b: any) => a.name.localeCompare(b.name));
  workflows.sort((a: any, b: any) => a.name.localeCompare(b.name));
  featureModules.sort((a: any, b: any) => a.name.localeCompare(b.name));
  apiExpectations.sort((a: any, b: any) => `${a.path}-${a.method}`.localeCompare(`${b.path}-${b.method}`));
  roles.sort((a: any, b: any) => a.name.localeCompare(b.name));

  metadata.architecturalSummary = summary;
  metadata.featureModules = featureModules;
  metadata.roles = roles;
  metadata.workflows = workflows;
  metadata.crudSystems = crudSystems;
  metadata.stateAnalysis = stateAnalysis;
  metadata.semanticGraph = semanticGraph;
  metadata.inferredEntities = entities;
  metadata.apiExpectations = apiExpectations;
  metadata.intent = scan.intent;
  metadata.authFlows =
    scan.intent.hasAuthScreens || workflows.some((w: any) => w.name.includes("Authentication"))
      ? ["Email/Password", "OAuth (Inferred)"]
      : [];

  const partialResult: any = { metadata, dependencies, routes };
  const complexityNum = calculateComplexity(partialResult as any);
  metadata.complexityScore =
    complexityNum < 30 ? "Low" : complexityNum < 60 ? "Medium" : complexityNum < 85 ? "High" : "Enterprise";

  progress("Inferring backend requirements...");
  await tick(200);
  const missing = inferMissingBackendSystems({ metadata, dependencies, routes, keyFiles: new Map() } as any);
  metadata.missingBackendSystems = Array.from(new Set([...metadata.missingBackendSystems, ...missing]));

  // Log AST source in the analysis
  if (astGraph) {
    log(
      `AST source: ${astGraph.source} | Confidence: ${astGraph.stats.parseErrors === 0 ? "Full AST" : "Hybrid"} | ` +
        `Components: ${astGraph.stats.componentCount} | Types: ${astGraph.stats.typeDefCount} | APIs: ${astGraph.stats.apiCallCount}`
    );
  }

  log(`Analysis complete. Entities: ${entities.length}, Workflows: ${metadata.workflows.length}, Roles: ${roles.length}`);
  progress("Done");

  const result: IngestionResult = {
    mode,
    framework,
    routes,
    metadata,
    dependencies,
    fileTree,
    keyFiles,
    documentation,
    analyzedAt: new Date().toISOString(),
    rootPath: root,
    rootCandidates: candidates,
    simplicitContext,
    analysisLogs,
    // Attach the AST graph for downstream use by the synthesis engine
    astGraph: astGraph ?? undefined,
  } as any;

  result.clarificationQuestions = generateAdaptiveQuestions(result as any, userPrompt);

  console.log("[Simplicit AST Debug]", {
  analysisMode: (result as any).astGraph ? "AST" : "Regex fallback",
  astSource: (result as any).astGraph?.source,
  components: (result as any).astGraph?.stats?.componentCount,
  typeDefinitions: (result as any).astGraph?.stats?.typeDefCount,
  apiCalls: (result as any).astGraph?.stats?.apiCallCount,
  parseErrors: (result as any).astGraph?.stats?.parseErrors,
  entities: result.metadata.inferredEntities?.map((e: any) => `${e.name} (${e.confidence})`),
  lastLogs: result.analysisLogs?.slice(-4),
});

  return result;
}



// ─── Helpers (unchanged from original) ───────────────────────────────

function reconstructFeatureModules(routes: any[], entities: any[], intent: any): FeatureModule[] {
  const modules: FeatureModule[] = [];
  if (
    intent.hasAuthScreens ||
    routes.some((r: any) => r.category === "auth" || r.path.includes("user") || r.path.includes("profile"))
  ) {
    modules.push({
      name: "User Management",
      description: "Handles authentication flows, user profiles, and session management.",
      routes: routes
        .filter((r: any) => r.category === "auth" || r.path.includes("user") || r.path.includes("profile"))
        .map((r: any) => r.path),
      entities: ["user", "profile"],
      confidence: "Strong evidence",
    } as any);
  }

  const coreEntities = entities.filter(
    (e: any) =>
      (e.confidence === "Strong evidence" || e.confidence === "Deterministic") &&
      !["user", "profile"].includes(e.name)
  );
  if (coreEntities.length > 0) {
    modules.push({
      name: `${coreEntities[0].name.charAt(0).toUpperCase() + coreEntities[0].name.slice(1)} Engine`,
      description: `Core business logic for ${coreEntities.map((e: any) => e.name).join(", ")}.`,
      routes: routes
        .filter((r: any) => coreEntities.some((e: any) => r.path.includes(e.name)))
        .map((r: any) => r.path),
      entities: coreEntities.map((e: any) => e.name),
      confidence: "Heuristic inference",
    } as any);
  }
  return modules;
}

function buildSemanticGraph(
  routes: any[],
  entities: any[],
  modules: FeatureModule[],
  apis: any[],
  roles: InferredRole[],
  workflows: InferredWorkflow[]
): SemanticGraph {
  const nodes: SemanticNode[] = [];
  const edges: SemanticEdge[] = [];
  roles.forEach((r) => nodes.push({ id: `role_${r.name}`, type: "role", label: r.name }));
  workflows.forEach((w) => {
    nodes.push({ id: `wf_${w.name}`, type: "workflow", label: w.name });
    const firstRole = roles[0]?.name || "User";
    edges.push({ from: `role_${firstRole}`, to: `wf_${w.name}`, relation: "triggers" });
  });
  modules.forEach((m) => nodes.push({ id: `feat_${m.name}`, type: "feature", label: m.name }));
  entities.forEach((e: any) => {
    nodes.push({ id: `ent_${e.name}`, type: "entity", label: e.name, metadata: { confidence: e.confidence } });
    const parentModule = modules.find((m) => m.entities.includes(e.name));
    if (parentModule) edges.push({ from: `feat_${parentModule.name}`, to: `ent_${e.name}`, relation: "owns" });
  });
  return { nodes, edges };
}

function generateArchitecturalSummary(
  appType: string,
  modules: FeatureModule[],
  entities: any[],
  framework: any,
  roles: InferredRole[],
  workflows: InferredWorkflow[],
  crudSystems: CRUDSystem[]
): string {
  const roleList = roles.length > 0 ? roles.map((r) => r.name).join(" and ") : "users";
  const wfList = workflows.length > 0 ? workflows.map((w) => w.name).join(", ") : "standard flows";
  let summary = `This project represents an ${appType} architected for role-based access by ${roleList}. `;
  if (workflows.length > 0) summary += `The application orchestrates core workflows including ${wfList}. `;
  summary += `Backend requirements include relational persistence, authentication, and targeted API endpoints to support the inferred architectural domains.`;
  return summary;
}

function resolveProjectRoot(
  files: Map<string, string>,
  forceRoot?: string
): { root: string; files: Map<string, string>; candidates: string[] } {
  const pkgPaths = Array.from(files.keys())
    .filter((p) => p.endsWith("package.json"))
    .sort((a, b) => a.split("/").length - b.split("/").length);

  if (pkgPaths.length === 0) return { root: "", files, candidates: [] };

  const candidates = pkgPaths.map((p) => p.replace("package.json", ""));
  let bestPkgPath = pkgPaths[0];

  if (forceRoot !== undefined) {
    const found = pkgPaths.find((p) => p.replace("package.json", "") === forceRoot);
    if (found) bestPkgPath = found;
  }

  const rootPath = bestPkgPath.replace("package.json", "");
  if (rootPath === "" || rootPath === "./") return { root: "", files, candidates };

  const normalizedFiles = new Map<string, string>();
  for (const [path, content] of files) {
    if (path.startsWith(rootPath)) normalizedFiles.set(path.slice(rootPath.length), content);
  }
  return { root: rootPath, files: normalizedFiles, candidates };
}

const tick = (ms = 0) => new Promise((r) => setTimeout(r, ms));

// Re-exports (unchanged)
export { detectFramework, extractDependencies } from "./framework-detector";
export { extractRoutes } from "./route-extractor";
export { inferMetadata } from "./metadata-inferrer";
