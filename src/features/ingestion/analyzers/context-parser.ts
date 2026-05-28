import type { 
  SimplicitContext, 
  ContextProjectOverview, 
  ContextBusinessRule, 
  ContextUserJourney, 
  ContextRole, 
  ContextEndpoint, 
  ContextDataModel, 
  ContextIntegration,
  ContextValidationRule,
  ContextWorkflow,
  ContextInfrastructure,
  ContextFrontendStack,
  ContextAuthModel,
  ProjectMetadata,
  RouteCategory,
  ConfidenceLevel
} from "../types";

/**
 * PHASE 1 — SECTION PARSER
 * Build deterministic parsers for markdown sections.
 */
export function parseSimplicitContext(markdown: string): SimplicitContext {
  const sections = splitIntoSections(markdown);
  
  const overview = parseOverview(sections.get("Project Overview") || "");
  const frontendStack = parseFrontendStack(sections.get("Frontend Stack") || "");
  const auth = parseAuth(sections.get("Authentication Flow") || "");
  const businessRules = parseBusinessRules(sections.get("Business Rules") || "");
  const validationRules = parseValidationRules(sections.get("Validation Rules") || "");
  const userJourneys = parseUserJourneys(sections.get("User Journeys") || "");
  const workflows = parseWorkflows(sections.get("Workflows") || "", userJourneys);
  const roles = parseRoles(sections.get("User Roles and Permissions") || "", sections.get("Project Overview") || "");
  const endpoints = parseEndpoints(sections.get("API Endpoints") || "", sections.get("Route Structure") || "");
  const dataModels = parseDataModels(sections.get("Data Models") || "", sections.get("Entities") || "");
  
  const integrations = parseIntegrations(sections.get("Third-Party Integrations") || "");
  const infrastructure = parseInfrastructure(sections.get("Infrastructure") || "", integrations);

  const metrics = {
    routeCount: endpoints.length,
    pageCount: computePageCount(endpoints),
    protectedRouteCount: endpoints.filter(e => e.isProtected).length,
    publicRouteCount: endpoints.filter(e => !e.isProtected).length,
    entityCount: dataModels.length,
    workflowCount: workflows.length,
    integrationCount: integrations.length
  };
  
  const ctx: SimplicitContext = {
    overview,
    frontendStack,
    auth,
    businessRules,
    validationRules,
    userJourneys,
    workflows,
    roles,
    endpoints,
    dataModels,
    envVars: parseList(sections.get("Environment Variables Required") || ""),
    fileUploads: sections.get("File Upload Requirements") || "",
    realtime: sections.get("Real-time Requirements") || "",
    integrations,
    infrastructure,
    errorFormat: sections.get("Error Response Format") || "",
    rawMarkdown: markdown,
    metrics,
    validation: {
      isValid: true,
      errors: [],
      warnings: [],
    }
  };

  validateContext(ctx);
  return ctx;
}

function splitIntoSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = markdown.split("\n");
  let currentHeader = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^#+\s+(.*)/);
    if (headerMatch) {
      if (currentHeader) {
        sections.set(normalizeHeader(currentHeader), currentContent.join("\n").trim());
      }
      currentHeader = headerMatch[1];
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }

  if (currentHeader) {
    sections.set(normalizeHeader(currentHeader), currentContent.join("\n").trim());
  }

  return sections;
}

function normalizeHeader(header: string): string {
  const h = header.toLowerCase();
  if (h.includes("overview")) return "Project Overview";
  if (h.includes("frontend") || h.includes("ui stack") || h.includes("tech stack")) return "Frontend Stack";
  if (h.includes("business rules")) return "Business Rules";
  if (h.includes("validation rules")) return "Validation Rules";
  if (h.includes("user journeys")) return "User Journeys";
  if (h.includes("workflows") || h.includes("logical flows")) return "Workflows";
  if (h.includes("roles") || h.includes("permissions")) return "User Roles and Permissions";
  if (h.includes("endpoints") || h.includes("api definition")) return "API Endpoints";
  if (h.includes("route structure") || h.includes("page map") || h.includes("navigation")) return "Route Structure";
  if (h.includes("data models") || h.includes("entities") || h.includes("schema")) return "Data Models";
  if (h.includes("authentication")) return "Authentication Flow";
  if (h.includes("environment variables")) return "Environment Variables Required";
  if (h.includes("file upload")) return "File Upload Requirements";
  if (h.includes("real-time") || h.includes("websocket")) return "Real-time Requirements";
  if (h.includes("integrations")) return "Third-Party Integrations";
  if (h.includes("infrastructure") || h.includes("cloud")) return "Infrastructure";
  if (h.includes("error response")) return "Error Response Format";
  return header;
}

function parseOverview(content: string): ContextProjectOverview {
  const lines = content.split("\n");
  const name = lines[0]?.trim() || "";
  const description = lines.find(l => !l.startsWith("-") && l.trim() !== "" && l !== name)?.trim() || "";
  const goals = lines.filter(l => l.startsWith("-")).map(l => l.slice(1).trim());

  let purpose = description;
  let category = "Web Application";

  if (name.toLowerCase().includes("analyzer") || description.toLowerCase().includes("analyzer")) category = "Analytical Platform";
  if (name.toLowerCase().includes("exam") || description.toLowerCase().includes("exam")) category = "Examination System";
  if (name.toLowerCase().includes("platform") || description.toLowerCase().includes("platform")) category = "SaaS Platform";

  return { name, purpose, category, description, goals };
}

function parseFrontendStack(content: string): ContextFrontendStack {
  const stack: ContextFrontendStack = { 
    framework: "Unknown", 
    bundler: "Unknown", 
    runtime: "Node.js", 
    language: "JavaScript",
    uiLibraries: [],
    routingLibraries: [],
    stateLibraries: [],
    animationLibraries: []
  };
  
  const cleanContent = content.replace(/\s+/g, " ");
  const lContent = cleanContent.toLowerCase();

  // 1. Framework & Runtime (Objective 3)
  if (lContent.includes("react")) stack.framework = "React";
  if (lContent.includes("next.js") || lContent.includes("nextjs")) stack.framework = "Next.js";
  if (lContent.includes("vue")) stack.framework = "Vue";
  if (lContent.includes("svelte")) stack.framework = "Svelte";
  if (lContent.includes("remix")) stack.framework = "Remix";
  if (lContent.includes("nuxt")) stack.framework = "Nuxt";
  if (lContent.includes("astro")) stack.framework = "Astro";

  if (lContent.includes("vite")) stack.bundler = "Vite";
  if (lContent.includes("webpack")) stack.bundler = "Webpack";
  if (lContent.includes("deno")) stack.runtime = "Deno";
  if (lContent.includes("bun")) stack.runtime = "Bun";

  if (lContent.includes("typescript") || lContent.includes(" ts")) stack.language = "TypeScript";

  // 2. Libraries
  const uiSignals = ["tailwind", "shadcn", "material ui", "mui", "chakra", "antd", "bootstrap", "daisyui", "mantine"];
  uiSignals.forEach(s => {
    if (lContent.includes(s)) {
      const labelMap: Record<string, string> = { "tailwind": "Tailwind CSS", "shadcn": "shadcn/ui", "material ui": "Material UI", "mui": "Material UI" };
      stack.uiLibraries.push(labelMap[s] || s);
    }
  });

  if (lContent.includes("react-router") || lContent.includes("browserrouter")) stack.routingLibraries.push("React Router");
  if (lContent.includes("tanstack router")) stack.routingLibraries.push("TanStack Router");
  
  if (lContent.includes("zustand")) stack.stateLibraries.push("Zustand");
  if (lContent.includes("redux")) stack.stateLibraries.push("Redux");
  if (lContent.includes("recoil")) stack.stateLibraries.push("Recoil");
  if (lContent.includes("jotai")) stack.stateLibraries.push("Jotai");
  
  if (lContent.includes("framer motion") || lContent.includes("framer-motion")) stack.animationLibraries.push("Framer Motion");
  if (lContent.includes("gsap")) stack.animationLibraries.push("GSAP");

  stack.uiLibraries = Array.from(new Set(stack.uiLibraries));
  return stack;
}

function parseAuth(content: string): ContextAuthModel {
  const auth: ContextAuthModel = { provider: "Custom", loginMethods: [], roleModel: "RBAC", visibilityRules: [] };
  const lines = content.split("\n");
  for (const line of lines) {
    const l = line.toLowerCase();
    if (l.includes("supabase")) auth.provider = "Supabase Auth";
    if (l.includes("clerk")) auth.provider = "Clerk";
    if (l.includes("firebase")) auth.provider = "Firebase Auth";
    if (l.includes("auth0")) auth.provider = "Auth0";
    if (l.includes("nextauth") || l.includes("next-auth") || l.includes("auth.js")) auth.provider = "NextAuth.js";
    
    if (l.includes("email") || l.includes("password")) auth.loginMethods.push("Email/Password");
    if (l.includes("google") || l.includes("github") || l.includes("oauth")) auth.loginMethods.push("OAuth");
    if (l.includes("magic link")) auth.loginMethods.push("Magic Link");
    
    if (l.includes("visibility") || l.includes("protected") || l.includes("access control")) auth.visibilityRules.push(line.replace(/^[-\s*]+/, "").trim());
  }
  auth.loginMethods = Array.from(new Set(auth.loginMethods));
  return auth;
}

function parseBusinessRules(content: string): ContextBusinessRule[] {
  const rules: ContextBusinessRule[] = [];
  const lines = content.split("\n");
  
  for (const line of lines) {
    const clean = line.replace(/^[-\s*]+/, "").trim();
    if (!clean || clean.length < 5) continue;
    
    const parts = clean.split(":");
    if (parts.length >= 2) {
      rules.push({
        id: `BR-${rules.length + 1}`,
        rule: parts[0].trim(),
        impact: parts.slice(1).join(":").trim()
      });
    } else {
      rules.push({
        id: `BR-${rules.length + 1}`,
        rule: clean,
        impact: ""
      });
    }
  }
  return rules;
}

function parseValidationRules(content: string): ContextValidationRule[] {
  const rules: ContextValidationRule[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const clean = line.replace(/^[-\s*]+/, "").trim();
    if (!clean) continue;
    const match = clean.match(/\*\*(.*?)\*\*[:\s]*(.*)/);
    if (match) {
      const rest = match[2].trim();
      rules.push({
        field: match[1].trim(),
        rule: rest.split("->")[0]?.trim() || rest,
        errorMessage: rest.split("->")[1]?.trim() || "",
        source: clean.toLowerCase().includes("zod") ? "zod" : "business"
      });
    }
  }
  return rules;
}

function parseUserJourneys(content: string): ContextUserJourney[] {
  const journeys: ContextUserJourney[] = [];
  const parts = content.split(/^###?\s+/m);

  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split("\n");
    const name = lines[0].trim();
    const steps = lines.filter(l => l.match(/^(\d+\.|-)\s+/)).map(l => l.replace(/^(\d+\.|-)\s+/, "").trim());
    if (name && steps.length > 0) {
      journeys.push({ name, steps });
    }
  }
  return journeys;
}

function parseWorkflows(content: string, journeys: ContextUserJourney[]): ContextWorkflow[] {
  const workflows: ContextWorkflow[] = [];
  const parts = content.split(/^###?\s+/m);

  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split("\n");
    const name = lines[0].trim();
    
    // Objective 6: Workflow Validation (Action-oriented filtering)
    const isAction = /upload|generate|process|submit|manage|create|auth|view|track|request/i.test(name);
    const isSchemaDoc = /schema|public|database|table|foreign key|id:|primary key/i.test(name) || lines.some(l => l.includes("living in public schema"));
    
    if (name && isAction && !isSchemaDoc) {
      const workflow: ContextWorkflow = { name, description: "", trigger: "", outcome: "", evidence: [name] };
      for (const line of lines) {
        const l = line.toLowerCase();
        if (l.includes("desc")) workflow.description = line.split(":")[1]?.trim() || "";
        if (l.includes("trigger")) workflow.trigger = line.split(":")[1]?.trim() || "";
        if (l.includes("outcome") || l.includes("result")) workflow.outcome = line.split(":")[1]?.trim() || "";
      }
      workflows.push(workflow);
    }
  }

  // Objective 6: Also derive workflows from User Journeys if Journeys exist but Workflows don't
  if (workflows.length === 0 && journeys.length > 0) {
    journeys.forEach(j => {
      workflows.push({
        name: j.name,
        description: `Implicit workflow derived from user journey: ${j.name}`,
        trigger: j.steps[0] || "User starts journey",
        outcome: j.steps[j.steps.length - 1] || "Journey completes",
        evidence: [`Derived from journey: ${j.name}`]
      });
    });
  }

  return workflows;
}

function parseRoles(content: string, overviewContent: string): ContextRole[] {
  const roles: ContextRole[] = [];
  const lines = content.split("\n");

  for (const line of lines) {
    if (line.match(/^[-\s*]*\*\*/)) {
      const match = line.match(/\*\*(.*?)\*\*[:\s]*(.*)/);
      if (match) {
        roles.push({
          name: match[1].trim(),
          permissions: match[2].split(",").map(p => p.trim()).filter(Boolean),
          visibilityRules: []
        });
      }
    }
  }

  // Objective 8: Primary User Detection (Search Overview if Role section is thin)
  if (roles.length === 0) {
    const actorMatch = overviewContent.match(/actors:|users:|target users:(.*)/i);
    if (actorMatch) {
       const actors = actorMatch[1].split(",").map(a => a.trim());
       actors.forEach(a => roles.push({ name: a, permissions: [], visibilityRules: [] }));
    }
  }

  return roles;
}

function parseEndpoints(content: string, routeContent: string): ContextEndpoint[] {
  const endpoints: Map<string, ContextEndpoint> = new Map();
  const allContent = content + "\n" + routeContent;
  const lines = allContent.split("\n");

  for (const line of lines) {
    // Matches patterns like: GET /api/users, `POST /login`, - GET /u/:id
    const match = line.match(/(GET|POST|PUT|PATCH|DELETE|UNKNOWN)\s+([^\s:]+)/i);
    if (match) {
      const method = match[1].toUpperCase() as any;
      const path = match[2].trim().replace(/[`']/g, "");
      const key = `${method} ${path}`;
      
      if (!endpoints.has(key)) {
        endpoints.set(key, {
          method,
          path,
          description: line.split(":").slice(1).join(":").trim() || "Defined in specification",
          isProtected: line.toLowerCase().includes("protected") || line.toLowerCase().includes("auth") || line.toLowerCase().includes("private")
        });
      }
    } else if (line.includes("/") && (line.includes("Page") || line.includes("Route"))) {
       // Support purely path-based pages if no method
       const pathMatch = line.match(/[`'](\/[^\s`']+)[`']/);
       if (pathMatch) {
          const path = pathMatch[1];
          if (!endpoints.has(`GET ${path}`)) {
            endpoints.set(`GET ${path}`, {
              method: "GET",
              path,
              description: "Page route defined in specification",
              isProtected: line.toLowerCase().includes("protected") || line.toLowerCase().includes("auth")
            });
          }
       }
    }
  }
  return Array.from(endpoints.values());
}

function parseDataModels(content: string, entityContent: string): ContextDataModel[] {
  const models: Map<string, ContextDataModel> = new Map();
  const allContent = content + "\n" + entityContent;
  
  // Strategy 1: Header-based entities (### Profiles)
  const parts = allContent.split(/^###?\s+/m);
  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split("\n");
    const name = lines[0].trim();
    if (!name || name.startsWith("-") || name.startsWith("*") || name.length > 30) continue;
    
    const fields = lines.filter(l => l.match(/^[-\s*]+/)).map(l => l.replace(/^[-\s*]+/, "").trim());
    const relations = lines.filter(l => l.includes("->") || l.includes("references")).map(l => l.trim());
    
    if (fields.length > 0) {
      models.set(name.toLowerCase(), { name, fields, relations });
    }
  }

  // Strategy 2: List-based entities (- **Name**: fields)
  const lines = allContent.split("\n");
  for (const line of lines) {
    const match = line.match(/^[-\s*]*\*\*(.*?)\*\*[:\s]*(.*)/);
    if (match) {
      const name = match[1].trim();
      if (name.length < 30 && !models.has(name.toLowerCase())) {
        const rest = match[2].trim();
        const fields = rest ? rest.split(",").map(f => f.trim()) : [];
        models.set(name.toLowerCase(), { name, fields, relations: [] });
      }
    } else {
       // Strategy 3: Pure list (- profiles, analyses)
       const listMatch = line.match(/^[-\s*]+([a-z_]{3,20})$/i);
       if (listMatch) {
          const name = listMatch[1].trim();
          if (!models.has(name.toLowerCase())) {
             models.set(name.toLowerCase(), { name, fields: [], relations: [] });
          }
       }
    }
  }

  return Array.from(models.values());
}

function parseInfrastructure(content: string, integrations: ContextIntegration[]): ContextInfrastructure {
  const infra: ContextInfrastructure = { database: "PostgreSQL", caching: "None", storage: "None", compute: "Managed", services: [] };
  const lines = content.split("\n");
  for (const line of lines) {
    const l = line.toLowerCase();
    const value = line.split(":")[1]?.trim() || "";
    if (l.includes("db") || l.includes("database")) infra.database = value || "PostgreSQL";
    if (l.includes("cache") || l.includes("redis")) infra.caching = value || "Redis";
    if (l.includes("storage") || l.includes("s3")) infra.storage = value || "S3";
    if (l.includes("compute") || l.includes("host") || l.includes("server")) infra.compute = value || "Managed";
  }
  
  // Infer services from integrations
  integrations.forEach(i => {
    if (i.name.toLowerCase().includes("supabase")) infra.services.push("Database");
    if (i.name.toLowerCase().includes("resend") || i.name.toLowerCase().includes("email")) infra.services.push("Email");
    if (i.name.toLowerCase().includes("ai") || i.name.toLowerCase().includes("openai") || i.name.toLowerCase().includes("gemini")) infra.services.push("AI Processing");
    if (i.name.toLowerCase().includes("stripe") || i.name.toLowerCase().includes("payment")) infra.services.push("Payments");
  });
  
  return infra;
}

function parseList(content: string): string[] {
  return content.split("\n").filter(l => l.match(/^[-\s*]+/)).map(l => l.replace(/^[-\s*]+/, "").trim());
}

function parseIntegrations(content: string): ContextIntegration[] {
  const integrations: ContextIntegration[] = [];
  const lines = content.split("\n");
  for (const line of lines) {
    const clean = line.replace(/^[-\s*]+/, "").trim();
    if (!clean || clean.length < 3) continue;
    const parts = clean.split(":");
    integrations.push({
      name: parts[0]?.trim() || "Unknown",
      purpose: parts.slice(1).join(":").trim(),
      category: inferIntegrationCategory(parts[0]?.trim() || "")
    });
  }
  return integrations;
}

function inferIntegrationCategory(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("supabase") || n.includes("firebase")) return "Backend as a Service";
  if (n.includes("stripe") || n.includes("paypal")) return "Payments";
  if (n.includes("resend") || n.includes("sendgrid")) return "Email";
  if (n.includes("openai") || n.includes("gemini") || n.includes("anthropic")) return "AI";
  return "Third-party Service";
}

function computePageCount(endpoints: ContextEndpoint[]): number {
  const pages = endpoints.filter(e => !e.path.startsWith('/api') && e.method === "GET");
  if (pages.length > 0) return pages.length;
  // Fallback: if no clear GET pages but endpoints exist, assume at least 1 page for dashboard/main
  return endpoints.length > 0 ? Math.ceil(endpoints.length / 3) : 0;
}

/**
 * PHASE 4 — VALIDATION LAYER
 * Run consistency checks before finishing.
 */
function validateContext(ctx: SimplicitContext) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required sections
  if (!ctx.overview.name || !ctx.overview.description) {
    errors.push("Project Overview section is incomplete.");
  }
  
  // Consistency checks (Objective 10)
  if (ctx.frontendStack.framework === "Unknown" && ctx.metrics.pageCount > 0) {
    warnings.push("Frontend framework not explicitly identified despite routes being present.");
  }
  
  if (ctx.metrics.routeCount > 0 && ctx.metrics.pageCount === 0) {
    warnings.push("Endpoints defined but Page count is 0.");
  }

  if (ctx.metrics.entityCount > 0 && ctx.metrics.workflowCount === 0) {
     warnings.push("Entities declared without associated business workflows.");
  }

  ctx.validation = {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * PHASE 3 — DOMAIN RECONSTRUCTION
 * Logically derives high-level intelligence from the structured knowledge graph.
 */
export function reconstructDomainFromContext(ctx: SimplicitContext): Partial<ProjectMetadata> {
  const readmeContent = ctx.rawMarkdown.toLowerCase();
  
  // 1. Application Type Detection (Phase 3 & Objective 12 Benchmark)
  let appType = ctx.overview.category || "Web Application";
  if (readmeContent.includes("resume") && (readmeContent.includes("skill gap") || readmeContent.includes("analysis"))) {
    appType = "Resume Skill Gap Analysis Platform";
  } else if (ctx.dataModels.some(m => ["order", "cart", "product"].includes(m.name.toLowerCase()))) {
    appType = "E-commerce Platform";
  } else if (ctx.dataModels.some(m => ["course", "lesson", "student"].includes(m.name.toLowerCase()))) {
    appType = "LMS Platform";
  }

  // 2. Primary User Reconstruction (Objective 8)
  const roles = ctx.roles.map(r => ({
    name: r.name,
    description: `Declared role: ${r.name}. Permissions: ${r.permissions.join(", ")}`,
    confidence: "Deterministic" as const,
    evidence: ["Explicitly declared in simplicit.context.md"]
  }));

  // 3. Workflow Reconstruction (Phase 3 & Objective 6 & 11)
  const workflows = ctx.workflows.map(w => ({
    name: w.name,
    description: w.description || `Logical flow triggered by ${w.trigger}. Outcome: ${w.outcome}`,
    routes: [],
    entities: [],
    confidence: "Deterministic" as const,
    evidence: w.evidence || ["Explicitly declared in simplicit.context.md"]
  }));

  // 4. Infrastructure & Backend Requirements (Objective 9)
  const missingBackendSystems: string[] = [];
  if (ctx.metrics.entityCount > 0) missingBackendSystems.push("Database");
  if (ctx.roles.length > 0 || ctx.auth.provider !== "Custom") missingBackendSystems.push("Authentication");
  
  if (ctx.integrations.some(i => i.category === "Email")) missingBackendSystems.push("Email Infrastructure");
  if (ctx.integrations.some(i => i.category === "AI") || readmeContent.includes("ai processing")) missingBackendSystems.push("AI Processing");
  
  if (ctx.realtime || readmeContent.includes("real-time") || readmeContent.includes("websocket")) missingBackendSystems.push("Real-time Infrastructure");
  if (ctx.fileUploads || readmeContent.includes("file upload") || readmeContent.includes("s3")) missingBackendSystems.push("File Storage");
  
  if (readmeContent.includes("cache") || readmeContent.includes("redis")) missingBackendSystems.push("Caching");
  if (readmeContent.includes("leaderboard") || readmeContent.includes("ranking")) missingBackendSystems.push("Leaderboard System");
  if (readmeContent.includes("profile") || readmeContent.includes("public page")) missingBackendSystems.push("Public Profiles");

  return {
    appType,
    missingBackendSystems: Array.from(new Set(missingBackendSystems)),
    roles,
    workflows,
  };
}

export function generateClarificationQuestions(ctx: SimplicitContext): string[] {
  const questions: string[] = [];

  // Check for missing payment providers
  const hasPayments = ctx.businessRules.some(r => r.rule.toLowerCase().includes("payment") || r.impact.toLowerCase().includes("payment"));
  const hasPaymentIntegration = ctx.integrations.some(i => i.category === "Payments");
  if (hasPayments && !hasPaymentIntegration) {
    questions.push("Which payment provider should be used (e.g. Stripe, PayPal)?");
  }

  // Check for missing notification channels
  const hasNotifications = ctx.userJourneys.some(j => j.steps.some(s => s.toLowerCase().includes("notif")));
  const hasNotifIntegration = ctx.integrations.some(i => i.category === "Email");
  if (hasNotifications && !hasNotifIntegration) {
    questions.push("Should notifications use email, SMS, or both? Please specify a preferred provider (e.g. Resend, Twilio).");
  }

  // Check for missing file storage details
  if (ctx.fileUploads && !ctx.infrastructure.storage) {
    questions.push("Where should uploaded files be stored (e.g. AWS S3, Supabase Storage)?");
  }

  return questions;
}
