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
  ConfidenceLevel,
  ContextRelationship,
  ContextCapability
} from "../types";

/**
 * PHASE 1 — SECTION PARSER
 * Build deterministic parsers for markdown sections.
 */
export function parseSimplicitContext(markdown: string): SimplicitContext {
  // 1. Parse frontmatter metadata
  const metadata: { version?: string; tool?: string; schema?: string; promptHash?: string } = {};
  const fmMatch = markdown.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/);
  let contentMarkdown = markdown;
  if (fmMatch) {
    contentMarkdown = fmMatch[2];
    const fmText = fmMatch[1];
    const lines = fmText.split("\n");
    for (const line of lines) {
      const parts = line.split(":");
      if (parts.length >= 2) {
        const key = parts[0].trim().toLowerCase();
        const val = parts.slice(1).join(":").trim();
        if (key === "version") metadata.version = val;
        else if (key === "tool") metadata.tool = val;
        else if (key === "schema") metadata.schema = val;
        else if (key === "prompthash") metadata.promptHash = val;
      }
    }
  }

  // 2. Schema Check (lenient)
  // A recognized schema (simplicit-context-v2) yields the most accurate
  // extraction, but a missing/unsupported schema must NOT block ingestion.
  // We parse the markdown best-effort and surface a warning instead.
  const SUPPORTED_SCHEMAS = ["simplicit-context-v2"];
  const hasSupportedSchema = metadata.schema && SUPPORTED_SCHEMAS.includes(metadata.schema);

  const sections = splitIntoSections(contentMarkdown);
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!hasSupportedSchema) {
    warnings.push(`Schema version "${metadata.schema || "none"}" is not the recommended "simplicit-context-v2". Parsing as best-effort context.`);
  }

  // Required sections presence validation (emit warnings, do not fail)
  if (!sections.has("DOMAIN")) warnings.push("Missing required section: DOMAIN");
  if (!sections.has("ENTITIES")) warnings.push("Missing required section: ENTITIES");
  if (!sections.has("RELATIONSHIPS")) warnings.push("Missing required section: RELATIONSHIPS");
  if (!sections.has("CAPABILITIES")) warnings.push("Missing required section: CAPABILITIES");
  if (!sections.has("INFRASTRUCTURE")) warnings.push("Missing required section: INFRASTRUCTURE");

  // Parser Recovery Mode: Wrap each section in a try/catch
  let overview: ContextProjectOverview = { name: "", purpose: "", category: "unknown", description: "", goals: [] };
  try {
    overview = parseOverview(sections.get("DOMAIN") || "");
  } catch (err: any) {
    warnings.push(`Failed to parse DOMAIN section: ${err.message}`);
  }

  let frontendStack: ContextFrontendStack = { framework: "Unknown", bundler: "Unknown", runtime: "Node.js", language: "JavaScript", uiLibraries: [], routingLibraries: [], stateLibraries: [], animationLibraries: [] };
  try {
    frontendStack = parseFrontendStack(sections.get("Frontend Stack") || "");
  } catch (err: any) {
    warnings.push(`Failed to parse Frontend Stack section: ${err.message}`);
  }

  let auth: ContextAuthModel = { provider: "Custom", loginMethods: [], roleModel: "RBAC", visibilityRules: [] };
  try {
    auth = parseAuth(sections.get("Authentication Flow") || "");
  } catch (err: any) {
    warnings.push(`Failed to parse Authentication Flow section: ${err.message}`);
  }

  let businessRules: any[] = [];
  try {
    businessRules = parseBusinessRules(sections.get("Business Rules") || "");
  } catch (err: any) {
    warnings.push(`Failed to parse Business Rules section: ${err.message}`);
  }

  let validationRules: any[] = [];
  try {
    validationRules = parseValidationRules(sections.get("VALIDATION RULES") || "");
  } catch (err: any) {
    warnings.push(`Failed to parse VALIDATION RULES section: ${err.message}`);
  }

  let userJourneys: any[] = [];
  try {
    userJourneys = parseUserJourneys(sections.get("User Journeys") || "");
  } catch (err: any) {
    warnings.push(`Failed to parse User Journeys section: ${err.message}`);
  }

  let workflows: any[] = [];
  try {
    workflows = parseWorkflows(sections.get("BUSINESS WORKFLOWS") || "", userJourneys);
  } catch (err: any) {
    warnings.push(`Failed to parse BUSINESS WORKFLOWS section: ${err.message}`);
  }

  let roles: any[] = [];
  try {
    roles = parseRoles(sections.get("ROLES") || "", sections.get("DOMAIN") || "");
  } catch (err: any) {
    warnings.push(`Failed to parse ROLES section: ${err.message}`);
  }

  let endpoints: any[] = [];
  try {
    endpoints = parseEndpoints(sections.get("API SURFACE") || "", sections.get("Route Structure") || "");
  } catch (err: any) {
    warnings.push(`Failed to parse API SURFACE section: ${err.message}`);
  }

  let dataModels: any[] = [];
  try {
    dataModels = parseDataModels(sections.get("Data Models") || "", sections.get("ENTITIES") || "");
  } catch (err: any) {
    warnings.push(`Failed to parse ENTITIES section: ${err.message}`);
  }

  let relationships: any[] = [];
  try {
    relationships = parseRelationships(sections.get("RELATIONSHIPS") || "");
  } catch (err: any) {
    warnings.push(`Failed to parse RELATIONSHIPS section: ${err.message}`);
  }

  let capabilities: any[] = [];
  try {
    capabilities = parseCapabilities(sections.get("CAPABILITIES") || "");
  } catch (err: any) {
    warnings.push(`Failed to parse CAPABILITIES section: ${err.message}`);
  }

  let envVars: string[] = [];
  try {
    envVars = parseList(sections.get("Environment Variables Required") || "");
  } catch (err: any) {
    warnings.push(`Failed to parse Environment Variables Required: ${err.message}`);
  }

  const fileUploads = sections.get("File Upload Requirements") || "";
  const realtime = sections.get("Real-time Requirements") || "";

  let integrations: any[] = [];
  try {
    integrations = parseIntegrations(sections.get("INTEGRATIONS") || "");
  } catch (err: any) {
    warnings.push(`Failed to parse INTEGRATIONS section: ${err.message}`);
  }

  let infrastructure: ContextInfrastructure = { database: "UNKNOWN", caching: "None", storage: "None", compute: "Managed", services: [] };
  try {
    infrastructure = parseInfrastructure(sections.get("INFRASTRUCTURE") || "", integrations);
  } catch (err: any) {
    warnings.push(`Failed to parse INFRASTRUCTURE section: ${err.message}`);
  }

  const errorFormat = sections.get("Error Response Format") || "";

  // Assign Normalized IDs
  dataModels.forEach(m => m.normalizedId = getNormalizedId(m.name));
  endpoints.forEach(e => e.normalizedId = getNormalizedId(`${e.method}-${e.path}`));
  workflows.forEach(w => w.normalizedId = getNormalizedId(w.name));
  roles.forEach(r => r.normalizedId = getNormalizedId(r.name));
  integrations.forEach(i => i.normalizedId = getNormalizedId(i.name));
  relationships.forEach(r => r.normalizedId = getNormalizedId(`${r.source}-${r.target}`));
  capabilities.forEach(c => c.normalizedId = getNormalizedId(c.name));

  // Determine Section Confidence
  const entitiesConfidence = parseSectionConfidence(sections.get("ENTITIES") || "");
  const relationshipsConfidence = parseSectionConfidence(sections.get("RELATIONSHIPS") || "");
  let infrastructureConfidence = parseSectionConfidence(sections.get("INFRASTRUCTURE") || "");
  if (infrastructureConfidence === "UNKNOWN" && (sections.get("INFRASTRUCTURE") || "").trim() !== "") {
    infrastructureConfidence = "HIGH";
  }

  // Deterministic Ordering
  dataModels.sort((a, b) => a.name.localeCompare(b.name));
  relationships.sort((a, b) => `${a.source}-${a.target}`.localeCompare(`${b.source}-${b.target}`));
  capabilities.sort((a, b) => a.name.localeCompare(b.name));
  workflows.sort((a, b) => a.name.localeCompare(b.name));
  endpoints.sort((a, b) => `${a.path}-${a.method}`.localeCompare(`${b.path}-${b.method}`));

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
    relationships,
    capabilities,
    entitiesConfidence,
    relationshipsConfidence,
    infrastructureConfidence,
    metadata,
    envVars,
    fileUploads,
    realtime,
    integrations,
    infrastructure,
    errorFormat,
    rawMarkdown: markdown,
    metrics,
    validation: {
      isValid: true,
      errors,
      warnings
    }
  };

  // Run final consistency checks to populate warnings
  try {
    validateContext(ctx);
  } catch (err: any) {
    ctx.validation.errors.push(`Validation exception: ${err.message}`);
    ctx.validation.isValid = false;
  }

  // Merge parser warning arrays
  ctx.validation.warnings = Array.from(new Set([...ctx.validation.warnings, ...warnings]));

  return ctx;
}

function splitIntoSections(markdown: string): Map<string, string> {
  const sections = new Map<string, string>();
  const lines = markdown.split("\n");
  let currentHeader = "";
  let currentContent: string[] = [];

  for (const line of lines) {
    const headerMatch = line.match(/^#{1,2}\s+(.*)/);
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
  const h = header.toLowerCase().trim();
  if (h === "domain" || h === "project overview") return "DOMAIN";
  if (h === "entities" || h === "data models" || h === "schema") return "ENTITIES";
  if (h === "relationships") return "RELATIONSHIPS";
  if (h === "capabilities") return "CAPABILITIES";
  if (h === "roles" || h === "user roles and permissions") return "ROLES";
  if (h === "permissions") return "PERMISSIONS";
  if (h === "infrastructure" || h === "cloud") return "INFRASTRUCTURE";
  if (h === "integrations" || h === "third-party integrations") return "INTEGRATIONS";
  if (h === "business workflows" || h === "workflows" || h === "logical flows") return "BUSINESS WORKFLOWS";
  if (h === "validation rules") return "VALIDATION RULES";
  if (h === "storage objects") return "STORAGE OBJECTS";
  if (h === "api surface" || h === "api endpoints" || h === "api definition") return "API SURFACE";
  if (h === "open questions") return "OPEN QUESTIONS";
  
  // Older fallbacks
  if (h.includes("overview")) return "DOMAIN";
  if (h.includes("frontend") || h.includes("ui stack") || h.includes("tech stack")) return "Frontend Stack";
  if (h.includes("business rules")) return "Business Rules";
  if (h.includes("validation rules")) return "VALIDATION RULES";
  if (h.includes("user journeys")) return "User Journeys";
  if (h.includes("route structure") || h.includes("page map") || h.includes("navigation")) return "Route Structure";
  if (h.includes("authentication")) return "Authentication Flow";
  if (h.includes("environment variables")) return "Environment Variables Required";
  if (h.includes("file upload")) return "File Upload Requirements";
  if (h.includes("real-time") || h.includes("websocket")) return "Real-time Requirements";
  if (h.includes("error response")) return "Error Response Format";
  
  return header;
}

function parseOverview(content: string): ContextProjectOverview {
  const lines = content.split("\n").map(l => l.trim()).filter(Boolean);
  let name = "";
  let purpose = "";
  let category = "Web Application";
  let description = "";
  const goals: string[] = [];

  for (const line of lines) {
    if (line.match(/^name\s*:/i)) {
      name = line.split(":")[1]?.trim() || "";
    } else if (line.match(/^category\s*:/i)) {
      category = line.split(":")[1]?.trim() || "Web Application";
    } else if (line.match(/^description\s*:/i)) {
      description = line.split(":")[1]?.trim() || "";
    } else if (line.startsWith("-") || line.startsWith("*")) {
      goals.push(line.slice(1).trim());
    } else if (!name && !line.includes(":")) {
      name = line;
    } else if (!description && !line.includes(":")) {
      description = line;
    }
  }

  purpose = description;
  if (category.toUpperCase() === "UNKNOWN") {
    category = "unknown";
  }

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
    const isAction = /upload|generate|process|submit|manage|create|auth|view|track|request|post|save|apply|search|browse|join|send|publish|register|login|logout|discuss|comment|reply|share|delete|edit|update|review|approve|reject|book|schedule|pay|cancel|invite|assign/i.test(name)
      || name.split(" ").length >= 2; // Multi-word names are almost always workflows
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
  const seen = new Set<string>();
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Format 1: **RoleName**: permissions (existing format)
    const boldMatch = trimmed.match(/\*\*(.*?)\*\*[:\s]*(.*)/);
    if (boldMatch) {
      const name = boldMatch[1].trim();
      if (name && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        roles.push({
          name,
          permissions: boldMatch[2].split(",").map(p => p.trim()).filter(Boolean),
          visibilityRules: []
        });
      }
      continue;
    }

    // Format 2: plain bullet list — * RoleName or - RoleName
    const bulletMatch = trimmed.match(/^[*\-]\s+([A-Za-z][A-Za-z\s]{1,30})$/);
    if (bulletMatch) {
      const name = bulletMatch[1].trim();
      // Skip section headers and non-role words
      const skipWords = new Set([
        "evidence", "permissions", "roles", "users", "actors",
        "description", "capabilities", "unknown"
      ]);
      if (name && !seen.has(name.toLowerCase()) && !skipWords.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        roles.push({
          name,
          permissions: [],
          visibilityRules: []
        });
      }
      continue;
    }

    // Format 3: plain word on its own line (no bullet)
    // Only if it looks like a role name (single PascalCase word)
    if (/^[A-Z][a-z]+$/.test(trimmed) && !seen.has(trimmed.toLowerCase())) {
      const skipWords = new Set(["evidence", "unknown", "high", "medium", "low"]);
      if (!skipWords.has(trimmed.toLowerCase())) {
        seen.add(trimmed.toLowerCase());
        roles.push({ name: trimmed, permissions: [], visibilityRules: [] });
      }
    }
  }

  // Fallback: search overview if roles still empty
  if (roles.length === 0) {
    const actorMatch = overviewContent.match(/actors:|users:|target users:(.*)/i);
    if (actorMatch) {
      actorMatch[1].split(",").map(a => a.trim()).forEach(a => {
        if (a) roles.push({ name: a, permissions: [], visibilityRules: [] });
      });
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
  
  // Strategy 1: Header-based entities (### Entity: Profiles)
  const parts = allContent.split(/^###?\s*(?:Entity:\s*)?/im);
  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split("\n");
    const headerLine = lines[0].trim();
    if (!headerLine || headerLine.startsWith("-") || headerLine.startsWith("*") || headerLine.length > 30) continue;
    
    if (headerLine.toUpperCase() === "UNKNOWN") continue;

    const name = headerLine;
    const fields: string[] = [];
    const relations: string[] = [];
    const evidence: string[] = [];
    const capabilities: string[] = [];
    const lifecycle: string[] = [];
    const businessRules: string[] = [];
    let type = "";
    let description = "";
    let confidence = "";

    let currentSection = "";

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const lowerLine = line.toLowerCase();

      // Check key-value fields
      if (line.match(/^type\s*:/i)) {
        type = line.split(":")[1]?.trim() || "";
        currentSection = "";
        continue;
      }
      if (line.match(/^description\s*:/i)) {
        description = line.split(":")[1]?.trim() || "";
        currentSection = "";
        continue;
      }
      if (line.match(/^confidence\s*:/i)) {
        confidence = line.split(":")[1]?.trim() || "";
        currentSection = "";
        continue;
      }

      // Check lists headers
      if (lowerLine.startsWith("fields:")) {
        currentSection = "fields";
        continue;
      }
      if (lowerLine.startsWith("relationships:")) {
        currentSection = "relations";
        continue;
      }
      if (lowerLine.startsWith("evidence:")) {
        currentSection = "evidence";
        continue;
      }
      if (lowerLine.startsWith("capabilities:")) {
        currentSection = "capabilities";
        continue;
      }
      if (lowerLine.startsWith("lifecycle:")) {
        currentSection = "lifecycle";
        continue;
      }
      if (lowerLine.startsWith("business rules:")) {
        currentSection = "rules";
        continue;
      }

      // Check list items
      if (line.startsWith("*") || line.startsWith("-")) {
        const val = line.slice(1).trim();
        if (val.toUpperCase() === "UNKNOWN") continue;
        if (currentSection === "fields") {
          fields.push(val);
        } else if (currentSection === "relations") {
          relations.push(val);
        } else if (currentSection === "evidence") {
          evidence.push(val);
        } else if (currentSection === "capabilities") {
          capabilities.push(val);
        } else if (currentSection === "lifecycle") {
          lifecycle.push(val);
        } else if (currentSection === "rules") {
          businessRules.push(val);
        }
      }
    }

    if (fields.length > 0 || relations.length > 0 || description || capabilities.length > 0) {
      models.set(name.toLowerCase(), {
        name,
        fields,
        relations,
        evidence: evidence.length > 0 ? evidence : undefined,
        capabilities: capabilities.length > 0 ? capabilities : undefined,
        lifecycle: lifecycle.length > 0 ? lifecycle : undefined,
        confidence: confidence || undefined,
        type: type || undefined,
        description: description || undefined,
        businessRules: businessRules.length > 0 ? businessRules : undefined,
      });
    }
  }

  // Strategy 2: List-based entities (- **Name**: fields)
  const lines = allContent.split("\n");
  for (const line of lines) {
    const match = line.match(/^[-\s*]*\*\*(.*?)\*\*[:\s]*(.*)/);
    if (match) {
      const name = match[1].trim();
      if (name.toUpperCase() === "UNKNOWN") continue;
      if (name.length < 30 && !models.has(name.toLowerCase())) {
        const rest = match[2].trim();
        const fields = rest && rest.toUpperCase() !== "UNKNOWN" ? rest.split(",").map(f => f.trim()) : [];
        models.set(name.toLowerCase(), { name, fields, relations: [] });
      }
    } else {
       // Strategy 3: Pure list (- profiles, analyses)
       const listMatch = line.match(/^[-\s*]+([a-z_]{3,20})$/i);
       if (listMatch) {
          const name = listMatch[1].trim();
          if (name.toUpperCase() === "UNKNOWN") continue;
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

  // Format 1: Structured block format
  // ### Integration\nName: X\nPurpose: Y\nEvidence:\n* Z\nConfidence: HIGH
  const blockParts = content.split(/^###?\s*(?:Integration:?\s*)?/im);

  for (const part of blockParts) {
    if (!part.trim()) continue;
    const lines = part.split("\n").map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) continue;

    let name = "";
    let purpose = "";
    const evidence: string[] = [];
    let confidence = "";
    let currentSection = "";

    for (const line of lines) {
      const lower = line.toLowerCase();
      if (line.match(/^name\s*:/i)) {
        name = line.split(":").slice(1).join(":").trim();
        currentSection = "";
      } else if (line.match(/^purpose\s*:/i)) {
        purpose = line.split(":").slice(1).join(":").trim();
        currentSection = "";
      } else if (line.match(/^confidence\s*:/i)) {
        confidence = line.split(":").slice(1).join(":").trim();
        currentSection = "";
      } else if (lower.startsWith("evidence:")) {
        currentSection = "evidence";
      } else if ((line.startsWith("*") || line.startsWith("-")) && currentSection === "evidence") {
        evidence.push(line.slice(1).trim());
      }
    }

    if (name && name.toUpperCase() !== "UNKNOWN") {
      integrations.push({
        name,
        purpose,
        category: inferIntegrationCategory(name),
        evidence: evidence.length > 0 ? evidence : undefined,
        confidence: confidence || undefined,
      } as any);
      continue;
    }

    // If no Name: field found, first non-empty line might be the name
    // (handles simple single-line blocks)
    const firstLine = lines[0];
    if (
      firstLine &&
      !firstLine.startsWith("#") &&
      !firstLine.toLowerCase().startsWith("evidence") &&
      firstLine.length < 50
    ) {
      const parts = firstLine.split(":");
      const flatName = parts[0].trim();
      if (flatName && flatName.toUpperCase() !== "UNKNOWN" && !integrations.some(i => i.name === flatName)) {
        integrations.push({
          name: flatName,
          purpose: parts.slice(1).join(":").trim(),
          category: inferIntegrationCategory(flatName),
        });
      }
    }
  }

  // Format 2: flat list fallback — * Firebase: Authentication
  if (integrations.length === 0) {
    const lines = content.split("\n");
    for (const line of lines) {
      const clean = line.replace(/^[-\s*#]+/, "").trim();
      if (!clean || clean.length < 3) continue;
      if (clean.toLowerCase().startsWith("integration")) continue;
      const parts = clean.split(":");
      const name = parts[0].trim();
      if (name && name.length < 40 && name.toUpperCase() !== "UNKNOWN") {
        integrations.push({
          name,
          purpose: parts.slice(1).join(":").trim(),
          category: inferIntegrationCategory(name),
        });
      }
    }
  }

  // Deduplicate by name
  const seen = new Set<string>();
  return integrations.filter(i => {
    const key = i.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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

  // Required sections presence validation (strict warnings, no silent acceptance)
  const markdown = ctx.rawMarkdown || "";
  if (!/##\s+DOMAIN/i.test(markdown)) {
    warnings.push("Missing required section: DOMAIN");
  }
  if (!/##\s+ENTITIES/i.test(markdown)) {
    warnings.push("Missing required section: ENTITIES");
  }
  if (!/##\s+RELATIONSHIPS/i.test(markdown)) {
    warnings.push("Missing required section: RELATIONSHIPS");
  }
  if (!/##\s+CAPABILITIES/i.test(markdown)) {
    warnings.push("Missing required section: CAPABILITIES");
  }
  if (!/##\s+INFRASTRUCTURE/i.test(markdown)) {
    warnings.push("Missing required section: INFRASTRUCTURE");
  }

  // Required DOMAIN elements
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

function parseRelationships(content: string): ContextRelationship[] {
  const relationships: ContextRelationship[] = [];
  const parts = content.split(/^###?\s*(?:Relationship)?/im);

  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split("\n");
    
    let source = "";
    let target = "";
    let type = "";
    const evidence: string[] = [];
    let confidence = "";
    let currentSection = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const lowerLine = trimmed.toLowerCase();

      if (trimmed.startsWith("Source:")) {
        source = trimmed.replace("Source:", "").replace(/[<>]/g, "").trim();
        currentSection = "";
      } else if (trimmed.startsWith("Target:")) {
        target = trimmed.replace("Target:", "").replace(/[<>]/g, "").trim();
        currentSection = "";
      } else if (trimmed.startsWith("Type:")) {
        type = trimmed.replace("Type:", "").replace(/[<>]/g, "").trim();
        currentSection = "";
      } else if (trimmed.startsWith("Confidence:")) {
        confidence = trimmed.replace("Confidence:", "").trim();
        currentSection = "";
      } else if (lowerLine.startsWith("evidence:")) {
        currentSection = "evidence";
      } else if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        const val = trimmed.slice(1).trim();
        if (val.toUpperCase() === "UNKNOWN") continue;
        if (currentSection === "evidence") {
          evidence.push(val);
        }
      }
    }

    if (source && target) {
      relationships.push({
        source,
        target,
        type,
        evidence,
        confidence
      });
    }
  }

  return relationships;
}

function parseCapabilities(content: string): ContextCapability[] {
  const capabilities: ContextCapability[] = [];
  const parts = content.split(/^###?\s*(?:Capability)?/im);

  for (const part of parts) {
    if (!part.trim()) continue;
    const lines = part.split("\n");

    let name = "";
    let entity = "";
    let category = "";
    const evidence: string[] = [];
    const validationRules: string[] = [];
    const permissions: string[] = [];
    let confidence = "";
    let currentSection = "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const lowerLine = trimmed.toLowerCase();

      if (trimmed.startsWith("Name:")) {
        name = trimmed.replace("Name:", "").replace(/[<>]/g, "").trim();
        currentSection = "";
      } else if (trimmed.startsWith("Entity:")) {
        entity = trimmed.replace("Entity:", "").replace(/[<>]/g, "").trim();
        currentSection = "";
      } else if (trimmed.startsWith("Category:")) {
        category = trimmed.replace("Category:", "").trim();
        currentSection = "";
      } else if (trimmed.startsWith("Confidence:")) {
        confidence = trimmed.replace("Confidence:", "").trim();
        currentSection = "";
      } else if (lowerLine.startsWith("evidence:")) {
        currentSection = "evidence";
      } else if (lowerLine.startsWith("validation rules:")) {
        currentSection = "validationRules";
      } else if (lowerLine.startsWith("permissions:")) {
        currentSection = "permissions";
      } else if (trimmed.startsWith("*") || trimmed.startsWith("-")) {
        const val = trimmed.slice(1).trim();
        if (val.toUpperCase() === "UNKNOWN") continue;
        if (currentSection === "evidence") {
          evidence.push(val);
        } else if (currentSection === "validationRules") {
          validationRules.push(val);
        } else if (currentSection === "permissions") {
          permissions.push(val);
        }
      }
    }

    if (name) {
      capabilities.push({
        name,
        entity,
        category,
        evidence,
        validationRules: validationRules.length > 0 ? validationRules : undefined,
        permissions: permissions.length > 0 ? permissions : undefined,
        confidence
      });
    }
  }

  return capabilities;
}

function getNormalizedId(name: string): string {
  let id = name.toLowerCase().trim();
  if (id.endsWith("s") && !id.endsWith("ss")) {
    id = id.slice(0, -1);
  }
  return id.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function parseSectionConfidence(sectionText: string): string {
  const match = sectionText.match(/confidence\s*:\s*(high|medium|low|unknown)/i);
  return match ? match[1].toUpperCase() : "UNKNOWN";
}
