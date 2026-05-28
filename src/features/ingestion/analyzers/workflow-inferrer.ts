import type { InferredWorkflow, DetectedRoute, InferredEntity, ComponentIntent, CRUDSystem, ConfidenceLevel } from "../types";

export function inferWorkflowsAndCRUD(
  routes: DetectedRoute[],
  entities: InferredEntity[],
  intent: ComponentIntent,
  files: Map<string, string>
): { workflows: InferredWorkflow[], crudSystems: CRUDSystem[] } {
  const workflows: InferredWorkflow[] = [];
  const crudSystems: CRUDSystem[] = [];

  // 1. Authentication Flow
  if (intent.hasAuthScreens || routes.some(r => r.category === "auth")) {
    const authRoutes = routes.filter(r => r.category === "auth");
    const evidence: string[] = [];
    if (intent.hasAuthScreens) evidence.push("Detected authentication components");
    if (authRoutes.length > 0) evidence.push(`Found auth-related routes: ${authRoutes.length}`);

    workflows.push({
      name: "Authentication & Authorization",
      description: "Secure login, registration, and session management flow.",
      routes: authRoutes.map(r => r.path),
      entities: ["user"],
      confidence: "Multi-source confirmation",
      evidence
    });
  }

  // 2. Onboarding Flow
  if (intent.hasOnboarding || routes.some(r => r.category === "onboarding")) {
    const onboardingRoutes = routes.filter(r => r.category === "onboarding");
    const evidence: string[] = [];
    if (intent.hasOnboarding) evidence.push("Identified onboarding wizard/stepper components");
    if (onboardingRoutes.length > 0) evidence.push("Found dedicated onboarding routes");

    workflows.push({
      name: "User Onboarding",
      description: "Guided setup and profile completion flow.",
      routes: onboardingRoutes.map(r => r.path),
      entities: ["user", "profile"],
      confidence: "Strong evidence",
      evidence
    });
  }

  // 3. E-commerce / Checkout Flow
  if (entities.some(e => e.name === "order" || e.name === "cart" || e.name === "checkout" || e.name === "payment")) {
    const rts = routes.filter(r => ["cart", "checkout", "order", "payment"].some(k => r.path.includes(k)));
    const evidence: string[] = [];
    evidence.push(`Detected entities: ${entities.filter(e => ["order", "cart", "product", "payment"].includes(e.name)).map(e => e.name).join(", ")}`);
    if (rts.length > 0) evidence.push(`Found commerce-related routes: ${rts.length}`);

    workflows.push({
      name: "E-commerce Checkout",
      description: "Product selection, cart management, and payment processing flow.",
      routes: rts.map(r => r.path),
      entities: entities.filter(e => ["order", "cart", "product", "payment"].includes(e.name)).map(e => e.name),
      confidence: "Multi-source confirmation",
      evidence
    });
  }

  // 4. Content / Media Upload Flow
  if (intent.hasUploads || entities.some(e => e.name === "media" || e.name === "file" || e.name === "upload")) {
    const mediaRoutes = routes.filter(r => r.path.includes("upload") || r.path.includes("media"));
    const evidence: string[] = [];
    if (intent.hasUploads) evidence.push("Found file upload components");
    if (mediaRoutes.length > 0) evidence.push("Found media management routes");

    workflows.push({
      name: "Media Management",
      description: "File uploading, processing, and attachment workflows.",
      routes: mediaRoutes.map(r => r.path),
      entities: entities.filter(e => ["media", "file", "asset", "document"].includes(e.name)).map(e => e.name),
      confidence: "Strong evidence",
      evidence
    });
  }

  // 5. Dashboard / Analytics (Priority 6: Stricter Thresholds)
  let analyticsSignals = 0;
  const analyticsEvidence: string[] = [];
  if (intent.hasAnalytics) { analyticsSignals += 1; analyticsEvidence.push("Found chart/metrics components"); }
  if (routes.some(r => r.path.includes("analytics") || r.path.includes("report"))) { analyticsSignals += 1; analyticsEvidence.push("Found reporting/analytics routes"); }
  
  const pkgContent = files.get("package.json");
  if (pkgContent) {
    const chartLibs = ["recharts", "chart.js", "apexcharts", "d3", "highcharts", "victory", "plot"];
    const foundLibs = chartLibs.filter(lib => pkgContent.includes(`"${lib}"`));
    if (foundLibs.length > 0) {
      analyticsSignals += 1;
      analyticsEvidence.push(`Visualization libraries: ${foundLibs.join(", ")}`);
    }
  }

  if (analyticsSignals >= 2) {
    workflows.push({
      name: "Reporting & Analytics",
      description: "Data aggregation and visualization dashboard.",
      routes: routes.filter(r => r.category === "dashboard" || r.path.includes("report")).map(r => r.path),
      entities: [],
      confidence: analyticsSignals >= 3 ? "Multi-source confirmation" : "Strong evidence",
      evidence: analyticsEvidence
    });
  }

  // 6. Settings
  if (intent.hasSettings || routes.some(r => r.category === "settings")) {
    const settingsRoutes = routes.filter(r => r.category === "settings");
    const evidence: string[] = [];
    if (intent.hasSettings) evidence.push("Detected user preference / profile forms");
    if (settingsRoutes.length > 0) evidence.push("Found account/settings routes");

    workflows.push({
      name: "Account Settings",
      description: "User preference, billing, and profile management.",
      routes: settingsRoutes.map(r => r.path),
      entities: ["user"],
      confidence: "Strong evidence",
      evidence
    });
  }

  // 7. Extract CRUD Systems from valid Entities
  for (const entity of entities) {
    if (entity.confidence === "Deterministic" || entity.confidence === "Multi-source confirmation" || entity.confidence === "Strong evidence") {
      const relatedRoutes = routes.filter(r => r.path.includes(entity.name));
      const operations: any[] = ["Read", "List"];
      const crudEvidence: string[] = [`Relational entity identified: ${entity.name}`];
      
      let hasCreate = false;
      let hasUpdate = false;
      let hasDelete = false;

      // Look at routes
      if (relatedRoutes.some(r => r.path.includes("new") || r.path.includes("create"))) {
        hasCreate = true;
        crudEvidence.push("Matched creation routes");
      }
      if (relatedRoutes.some(r => r.path.includes("edit") || r.path.includes("update"))) {
        hasUpdate = true;
        crudEvidence.push("Matched modification routes");
      }
      if (relatedRoutes.some(r => r.path.includes("delete"))) {
        hasDelete = true;
        crudEvidence.push("Matched deletion routes");
      }

      // Look at files mentioning the entity
      for (const [path, content] of files) {
        if (!path.includes(entity.name)) continue;
        const lower = content.toLowerCase();
        if (lower.includes("create") || lower.includes("post") || lower.includes("insert")) hasCreate = true;
        if (lower.includes("update") || lower.includes("edit") || lower.includes("put") || lower.includes("patch")) hasUpdate = true;
        if (lower.includes("delete") || lower.includes("remove") || lower.includes("destroy")) hasDelete = true;
      }

      if (hasCreate) operations.push("Create");
      if (hasUpdate) operations.push("Update");
      if (hasDelete) operations.push("Delete");

      if (relatedRoutes.length > 0) {
        crudSystems.push({
          entity: entity.name,
          operations,
          routes: relatedRoutes.map(r => r.path),
          confidence: operations.length >= 4 ? "Multi-source confirmation" : "Strong evidence",
          evidence: crudEvidence
        });
        
        // Add to workflows if it's a full CRUD system
        if (hasCreate && hasUpdate) {
          workflows.push({
            name: `${entity.name.charAt(0).toUpperCase() + entity.name.slice(1)} Management`,
            description: `Full lifecycle management (CRUD) for ${entity.name}.`,
            routes: relatedRoutes.map(r => r.path),
            entities: [entity.name],
            confidence: "Multi-source confirmation",
            evidence: crudEvidence
          });
        }
      }
    }
  }

  // Deduplicate workflows by name
  const uniqueWorkflows = new Map<string, InferredWorkflow>();
  for (const wf of workflows) {
    uniqueWorkflows.set(wf.name, wf);
  }

  return { 
    workflows: Array.from(uniqueWorkflows.values()), 
    crudSystems 
  };
}
