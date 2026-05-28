import type { IngestionResult, AnalysisStage, FeatureModule, SemanticGraph, SemanticNode, SemanticEdge, ConfidenceLevel, InferredRole, InferredWorkflow, CRUDSystem, StateAnalysis, SimplicitContext } from "../types";
import { detectFramework, extractDependencies } from "./framework-detector";
import { extractRoutes } from "./route-extractor";
import { inferMetadata } from "./metadata-inferrer";
import { calculateComplexity, inferMissingBackendSystems } from "./complexity-analyzer";
import { inferEntities } from "./entity-inferrer";
import { analyzeJsxIntent } from "./jsx-intent";
import { inferApiExpectations } from "./api-inferrer";
import { inferRoles } from "./role-inferrer";
import { inferWorkflowsAndCRUD } from "./workflow-inferrer";
import { analyzeStateManagement } from "./state-inferrer";
import { parseSimplicitContext, generateClarificationQuestions, reconstructDomainFromContext } from "./context-parser";
import { generateClarificationQuestions as generateAdaptiveQuestions } from "./question-generator";

/**
 * Orchestrates all analyzers against a file map.
 * Returns a complete `IngestionResult` with human-level architectural intelligence.
 */
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

  log(`Starting ${mode} analysis of ${rawFiles.size} files...`);

  // 1. Root Normalization
  onProgress?.("Mapping filesystem...");
  const { root, files, candidates } = resolveProjectRoot(rawFiles, targetRoot);
  
  if (root) {
    log(`Normalized project root to: ${root}`);
  } else {
    log(`Using project root: ./`);
  }

  // ─── Objective 1: Context-First Orchestration ──────────
  let simplicitContext: SimplicitContext | undefined;
  const contextFile = Array.from(rawFiles.keys()).find(p => p.toLowerCase().endsWith("simplicit.context.md"));
  
  if (contextFile) {
    log(`Authoritative specification found: ${contextFile}.`);
    simplicitContext = parseSimplicitContext(rawFiles.get(contextFile)!);
    log(`Context intelligence reconstructed: ${simplicitContext.metrics.entityCount} entities, ${simplicitContext.metrics.workflowCount} workflows.`);
  }

  const isContextOnly = mode === "context";

  // 2. Framework Detection
  onProgress?.("Detecting framework...");
  await new Promise(r => setTimeout(r, 400));
  
  let framework = isContextOnly ? {
    name: "Unknown",
    confidence: "Heuristic inference" as const,
    evidence: [],
    version: null,
    router: null,
    cssFramework: null,
    stateManagement: null,
    language: "javascript" as const,
  } : detectFramework(files);

  if (simplicitContext && simplicitContext.frontendStack.framework && simplicitContext.frontendStack.framework !== "Unknown") {
    log(`Source Priority: Using declared framework from specification.`);
    framework = {
      ...framework,
      name: simplicitContext.frontendStack.framework,
      confidence: "Deterministic",
      evidence: ["Explicitly declared in simplicit.context.md"],
      language: simplicitContext.frontendStack.language.toLowerCase().includes("type") ? "typescript" : "javascript" as any,
      cssFramework: simplicitContext.frontendStack.uiLibraries.join(" + ") || framework.cssFramework,
      stateManagement: simplicitContext.frontendStack.stateLibraries.join(", ") || framework.stateManagement,
    };
  }

  // 3. Filesystem & Dependency Synthesis
  const fileTree = Array.from(files.keys())
    .map((p) => p.replace(/\\/g, "/"))
    .sort();
  
  let dependencies = isContextOnly ? [] : extractDependencies(files);

  if (simplicitContext) {
    const contextDeps = [
      ...simplicitContext.integrations.map(i => ({ name: i.name, version: "latest", isDev: false })),
      ...(simplicitContext.frontendStack.uiLibraries.map(l => ({ name: l.toLowerCase().replace(/ /g, '-'), version: "latest", isDev: false }))),
      ...(simplicitContext.frontendStack.stateLibraries.map(l => ({ name: l.toLowerCase().replace(/ /g, '-'), version: "latest", isDev: false })))
    ];
    
    const existingNames = new Set(dependencies.map(d => d.name.toLowerCase()));
    contextDeps.forEach(cd => {
      if (!existingNames.has(cd.name.toLowerCase())) {
        dependencies.push(cd);
      }
    });
  }

  log(`Mapped ${fileTree.length} files and ${dependencies.length} dependencies`);

  // 4. Route & Page Reconstruction
  onProgress?.("Reconstructing route hierarchy...");
  await new Promise(r => setTimeout(r, 400));
  
  let routes = isContextOnly ? [] : extractRoutes(files, framework.name);
  
  if (simplicitContext && simplicitContext.endpoints.length > 0) {
    log(`Mapping ${simplicitContext.endpoints.length} routes from specification.`);
    simplicitContext.endpoints.forEach(e => {
       if (!routes.some(r => r.path === e.path)) {
          routes.push({
            path: e.path,
            component: null,
            isDynamic: e.path.includes(":"),
            isProtected: e.isProtected,
            category: "unknown",
            params: [],
            kind: e.path.startsWith("/api") ? "api" : "page",
            confidence: "Deterministic",
            evidence: ["Declared in simplicit.context.md"]
          });
       }
    });
  }

  // 5. Semantic Domain Reconstruction
  onProgress?.("Analyzing application domains...");
  await new Promise(r => setTimeout(r, 400));
  
  const metadata = inferMetadata(files);
  const scan = analyzeJsxIntent(files);
  const stateAnalysis = analyzeStateManagement(files, dependencies);

  // Identify Key Files & Docs
  const keyFiles = new Map<string, string>();
  const documentation: Array<{ path: string; content: string }> = [];
  const keyPatterns = [
    "package.json", "tsconfig.json", "next.config", "nuxt.config",
    "svelte.config", "vite.config", "tailwind.config", ".env.example",
    ".env.local", "README.md", "components.json",
  ];

  for (const [path, content] of files) {
    const filename = path.split("/").pop() || "";
    if (keyPatterns.some((pat) => filename.startsWith(pat))) {
      keyFiles.set(path, content);
    }
    if (path.toLowerCase().endsWith(".md") || path.toLowerCase().endsWith(".mdx")) {
      documentation.push({ path, content });
    }
  }

  // Apply context overrides
  metadata.primarySource = simplicitContext ? "context" : (mode === "prompt" ? "prompt" : "frontend");
  
  let roles = isContextOnly ? [] : inferRoles(routes, files);
  let entities = isContextOnly ? [] : inferEntities(files, routes.map(r => r.path));
  let { workflows, crudSystems } = isContextOnly ? { workflows: [], crudSystems: [] } : inferWorkflowsAndCRUD(routes, entities, scan.intent, files);
  let apiExpectations = isContextOnly ? [] : inferApiExpectations(files);

  if (simplicitContext) {
    const reconstruction = reconstructDomainFromContext(simplicitContext);
    
    if (simplicitContext.overview.name) metadata.name = simplicitContext.overview.name;
    if (simplicitContext.overview.description) metadata.description = simplicitContext.overview.description;
    
    if (reconstruction.appType) metadata.appType = reconstruction.appType;
    if (reconstruction.missingBackendSystems) {
      metadata.missingBackendSystems = Array.from(new Set([...metadata.missingBackendSystems, ...reconstruction.missingBackendSystems]));
    }
    
    if (reconstruction.roles) {
      reconstruction.roles.forEach(r => {
        if (!roles.some(ir => ir.name.toLowerCase() === r.name.toLowerCase())) {
          roles.push(r as any);
        }
      });
    }
    
    if (reconstruction.workflows) {
      reconstruction.workflows.forEach(w => {
        if (!workflows.some(iw => iw.name.toLowerCase() === w.name.toLowerCase())) {
          workflows.push(w as any);
        }
      });
    }

    simplicitContext.endpoints.forEach(e => {
      if (!apiExpectations.some(ae => ae.path === e.path && ae.method === e.method)) {
        apiExpectations.push({
          method: e.method as any,
          path: e.path,
          purpose: e.description,
          confidence: "Deterministic"
        });
      }
    });

    simplicitContext.dataModels.forEach(m => {
       if (!entities.some(ie => ie.name.toLowerCase() === m.name.toLowerCase())) {
          entities.push({
            name: m.name,
            confidence: "Deterministic",
            hints: ["Explicitly declared in context"]
          });
       }
    });

    metadata.totalPages = Math.max(metadata.totalPages, simplicitContext.metrics.pageCount);
    metadata.totalApiRoutes = Math.max(metadata.totalApiRoutes, simplicitContext.metrics.routeCount);
  }

  // 6. Finalization
  onProgress?.("Detecting administrative systems...");
  const featureModules = reconstructFeatureModules(routes, entities, scan.intent);
  const semanticGraph = buildSemanticGraph(routes, entities, featureModules, apiExpectations, roles, workflows);
  const summary = generateArchitecturalSummary(metadata.appType, featureModules, entities, framework, roles, workflows, crudSystems);
  
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
  metadata.authFlows = (scan.intent.hasAuthScreens || workflows.some(w => w.name.includes("Authentication"))) ? ["Email/Password", "OAuth (Inferred)"] : [];

  const partialResult: any = { metadata, dependencies, routes };
  const complexityNum = calculateComplexity(partialResult as any);
  metadata.complexityScore = complexityNum < 30 ? "Low" : complexityNum < 60 ? "Medium" : complexityNum < 85 ? "High" : "Enterprise";

  onProgress?.("Inferring backend requirements...");
  await new Promise(r => setTimeout(r, 400));
  const missing = inferMissingBackendSystems({ metadata, dependencies, routes, keyFiles: new Map() } as any);
  metadata.missingBackendSystems = Array.from(new Set([...metadata.missingBackendSystems, ...missing]));

  log(`Analysis complete. Reconstructed ${metadata.workflows.length} workflows.`);
  onProgress?.("Done");

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
  };

  // Adaptive Question Generation (Objective 1)
  result.clarificationQuestions = generateAdaptiveQuestions(result, userPrompt);

  return result;
}

// ─── Semantic Reasoning Helpers ─────────────────────────────────────

function reconstructFeatureModules(routes: any[], entities: any[], intent: any): FeatureModule[] {
  const modules: FeatureModule[] = [];
  
  if (intent.hasAuthScreens || routes.some(r => r.category === "auth" || r.path.includes("user") || r.path.includes("profile"))) {
    modules.push({
      name: "User Management",
      description: "Handles authentication flows, user profiles, and session management.",
      routes: routes.filter(r => r.category === "auth" || r.path.includes("user") || r.path.includes("profile")).map(r => r.path),
      entities: ["user", "profile"],
      confidence: "Strong evidence"
    } as any);
  }

  const coreEntities = entities.filter((e: any) => (e.confidence === "Strong evidence" || e.confidence === "Deterministic") && !["user", "profile"].includes(e.name));
  if (coreEntities.length > 0) {
    modules.push({
      name: `${coreEntities[0].name.charAt(0).toUpperCase() + coreEntities[0].name.slice(1)} Engine`,
      description: `Core business logic and lifecycle management for ${coreEntities.map((e: any) => e.name).join(", ")}.`,
      routes: routes.filter(r => coreEntities.some((e: any) => r.path.includes(e.name))).map(r => r.path),
      entities: coreEntities.map((e: any) => e.name),
      confidence: "Heuristic inference"
    } as any);
  }

  return modules;
}

function buildSemanticGraph(routes: any[], entities: any[], modules: FeatureModule[], apis: any[], roles: InferredRole[], workflows: InferredWorkflow[]): SemanticGraph {
  const nodes: SemanticNode[] = [];
  const edges: SemanticEdge[] = [];

  roles.forEach(r => {
    nodes.push({ id: `role_${r.name}`, type: "role", label: r.name });
  });

  workflows.forEach(w => {
    nodes.push({ id: `wf_${w.name}`, type: "workflow", label: w.name });
    if (w.name.includes("Management")) {
      edges.push({ from: `role_Administrator`, to: `wf_${w.name}`, relation: "triggers" });
    } else {
      const firstRole = roles[0]?.name || "User";
      edges.push({ from: `role_${firstRole}`, to: `wf_${w.name}`, relation: "triggers" });
    }
  });

  modules.forEach(m => {
    nodes.push({ id: `feat_${m.name}`, type: "feature", label: m.name });
  });

  entities.forEach(e => {
    nodes.push({ id: `ent_${e.name}`, type: "entity", label: e.name, metadata: { confidence: e.confidence } });
    const parentModule = modules.find(m => m.entities.includes(e.name));
    if (parentModule) {
      edges.push({ from: `feat_${parentModule.name}`, to: `ent_${e.name}`, relation: "owns" });
    }
  });

  return { nodes, edges };
}

function generateArchitecturalSummary(appType: string, modules: FeatureModule[], entities: any[], framework: any, roles: InferredRole[], workflows: InferredWorkflow[], crudSystems: CRUDSystem[]): string {
  const roleList = roles.length > 0 ? roles.map(r => r.name).join(" and ") : "users";
  const wfList = workflows.length > 0 ? workflows.map(w => w.name).join(", ") : "standard flows";
  
  let summary = `This project represents an ${appType} architected for role-based access by ${roleList}. `;
  if (workflows.length > 0) {
    summary += `The application orchestrates core workflows including ${wfList}. `;
  }
  summary += `Backend requirements include relational persistence, authentication, and targeted API endpoints to support the inferred architectural domains.`;
  return summary;
}

function resolveProjectRoot(files: Map<string, string>, forceRoot?: string): { 
  root: string; 
  files: Map<string, string>;
  candidates: string[];
} {
  const pkgPaths = Array.from(files.keys())
    .filter(p => p.endsWith('package.json'))
    .sort((a, b) => a.split('/').length - b.split('/').length);

  if (pkgPaths.length === 0) return { root: '', files, candidates: [] };

  const candidates = pkgPaths.map(p => p.replace('package.json', ''));
  let bestPkgPath = pkgPaths[0];
  
  if (forceRoot !== undefined) {
    const found = pkgPaths.find(p => p.replace('package.json', '') === forceRoot);
    if (found) bestPkgPath = found;
  }

  const rootPath = bestPkgPath.replace('package.json', '');
  const normalizedFiles = new Map<string, string>();
  
  if (rootPath === '' || rootPath === './') {
    return { root: '', files, candidates };
  }

  for (const [path, content] of files) {
    if (path.startsWith(rootPath)) {
      normalizedFiles.set(path.slice(rootPath.length), content);
    }
  }
  return { root: rootPath, files: normalizedFiles, candidates };
}

export { detectFramework, extractDependencies } from "./framework-detector";
export { extractRoutes } from "./route-extractor";
export { inferMetadata } from "./metadata-inferrer";
