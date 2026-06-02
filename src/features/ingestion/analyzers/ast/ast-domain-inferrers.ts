/**
 * ast-domain-inferrers.ts
 * ─────────────────────────────────────────────────────────────────────
 * Drop-in AST-powered replacements for:
 *   • entity-inferrer.ts   → inferEntitiesFromAST()
 *   • api-inferrer.ts      → inferAPIFromAST()
 *   • role-inferrer.ts     → inferRolesFromAST()
 *   • jsx-intent.ts        → analyzeIntentFromAST()
 *
 * Output types are IDENTICAL to the existing inferrers so index.ts
 * needs zero changes — just swap the import.
 *
 * WHAT'S BETTER vs the regex versions:
 *   • Entities: uses TypeScript interface field names (exact, not guessed)
 *   • APIs: exact URL strings with line numbers, not regex over raw text
 *   • Roles: reads actual RBAC type unions (type Role = 'admin' | 'user')
 *   • Intent: reads real component tree (hasForm = actual <form> tag found)
 *   • Everything carries an evidence trail (EXTRACTED/INFERRED + line number)
 */

import type {
  SimplicitASTGraph,
  ASTComponent,
  ASTTypeDefinition,
  ASTAPICall,
  ASTConfidence,
} from "./ast-types";

// Re-use the existing IngestionResult types so we stay compatible
import type {
  InferredEntity,
  InferredAPI,
  InferredRole,
  ComponentIntent,
  ConfidenceLevel,
  DetectedRoute,
} from "../../types";

// ─── Implementation noise (same list as current entity-inferrer) ─────
const IMPLEMENTATION_NOISE = new Set([
  "set", "use", "handle", "toggle", "is", "has", "on", "click", "change",
  "state", "effect", "ref", "context", "callback", "memo", "hook",
  "provider", "wrapper", "container", "layout", "page", "component",
  "style", "theme", "props", "params", "query", "mutation", "fetch",
  "axios", "api", "route", "nav", "item", "list", "row", "cell", "data",
  "value", "key", "index", "loading", "error", "success", "fail",
  "open", "close", "show", "hide", "submit", "reset", "clear",
  "add", "remove", "delete", "edit", "update", "create", "save",
  // Additional AST-aware additions (common React/TS utilities)
  "react", "node", "event", "handler", "config", "options", "result",
  "response", "request", "client", "server", "session", "token",
  // Primitive field names — data properties, not domain entities
  "name", "title", "email", "password", "username", "phone",
  "address", "age", "date", "time", "description", "body",
  "text", "label", "slug", "url", "link", "image", "avatar",
  "icon", "color", "size", "weight", "height", "width",
  "count", "total", "amount", "price", "quantity", "number",
  "format", "type", "kind", "category", "tag", "group",
  "status", "message", "code", "token", "hash", "version",
  // Auth-specific primitives
  "login", "logout", "signup", "signin", "register",
  "credential", "credentials",
  // Next.js data-fetching function names (never domain entities)
  "getserversideprop", "getserversideprops", "getstaticprop",
  "getstaticprops", "getstaticpath", "getstaticpaths",
]);

// TypeScript utility/error type name suffixes — never business entities
const UTILITY_TYPE_SUFFIXES = new Set([
  "error", "failure", "success", "response", "request", "payload",
  "option", "options", "config", "props", "state", "param", "params",
  "result", "callback", "handler", "context", "provider", "ref",
  "interface", "schema", "dto", "input", "output", "args", "arg",
  "type", "types", "util", "utils", "helper", "helpers",
  "item", "items", "queue", "queueitem", "signature", "approval",
  "template", "templates", "record", "entry", "node", "edge",
  "meta", "metadata", "info", "detail", "details", "summary",
  "event", "events", "action", "actions", "mutation", "selector",
  // UI component suffixes — page components are never domain entities
  "page", "screen", "view", "layout", "container", "wrapper",
  "panel", "section", "widget", "card", "list", "grid", "table",
  "form", "modal", "dialog", "drawer", "sidebar", "navbar",
  "header", "footer", "hero", "banner", "badge", "chip", "tab",
  "admin", "adminpage", "adminview", "adminscreen",
  // Common non-entity compound suffixes
  "notfound", "unauthorized", "forbidden", "error",
  "loading", "skeleton", "placeholder", "empty",
]);

// ─── Common domain entity vocabulary (expands the existing list) ─────
const ENTITY_SIGNALS: Record<string, string[]> = {
  user:         ["user", "auth", "profile", "account", "member", "login", "signup", "session", "identity"],
  product:      ["product", "item", "listing", "catalog", "inventory", "sku", "variant", "goods"],
  order:        ["order", "cart", "checkout", "purchase", "transaction", "basket", "invoice"],
  payment:      ["payment", "stripe", "billing", "subscription", "plan", "charge", "invoice"],
  post:         ["post", "article", "blog", "content", "feed", "thread", "entry"],
  comment:      ["comment", "reply", "review", "feedback", "rating", "reaction"],
  file:         ["file", "upload", "attachment", "media", "image", "document", "asset", "storage"],
  notification: ["notification", "alert", "badge", "inbox", "message", "push"],
  workspace:    ["workspace", "organization", "org", "team", "project", "space", "tenant"],
  role:         ["role", "permission", "admin", "moderator", "access", "policy"],
  exam:         ["exam", "quiz", "test", "assessment", "question", "submission", "proctoring"],
  candidate:    ["candidate", "applicant", "resume", "job", "position"],
  course:       ["course", "lesson", "module", "enrollment", "curriculum", "student"],
  report:       ["report", "metric", "analytics", "dashboard", "stat", "insight"],
  tag:          ["tag", "label", "category", "taxonomy", "genre"],
};

// ═══════════════════════════════════════════════════════════════════════
// 1. ENTITY INFERRER (AST-powered)
// ═══════════════════════════════════════════════════════════════════════
export function inferEntitiesFromAST(
  graph: SimplicitASTGraph,
  routes: DetectedRoute[]
): InferredEntity[] {
  const entityMap = new Map<string, { score: number; hints: string[]; confidence: ConfidenceLevel }>();

  const addSignal = (rawName: string, score: number, hint: string) => {
    const name = singularize(rawName.toLowerCase().trim());
    if (name.length <= 2) return;
    if (IMPLEMENTATION_NOISE.has(name)) return;
    if (Array.from(UTILITY_TYPE_SUFFIXES).some(s => name.endsWith(s))) return;
    if (/^\d+$/.test(name)) return;

    const entry = entityMap.get(name);
    if (entry) {
      entry.score = Math.min(100, entry.score + score);
      if (!entry.hints.includes(hint)) entry.hints.push(hint);
    } else {
      entityMap.set(name, { score, hints: [hint], confidence: "Heuristic inference" });
    }
  };

  // ── Signal 1: TypeScript interface/type names (STRONGEST — Deterministic) ──
  for (const typeDef of graph.allTypeDefinitions) {
    const name = typeDef.name.replace(/(Props|State|Type|Interface|Schema|Form|Input|Output|DTO|Request|Response)$/, "");
    if (name.length > 2 && /^[A-Z]/.test(name)) {
      // Business interfaces = high confidence if they have fields
      if (typeDef.fields.length < 2) continue; // Skip single-field utility types
      const scoreBoost = typeDef.fields.length >= 3 ? 60 : 40;
      addSignal(name, scoreBoost, `TypeScript ${typeDef.kind} with ${typeDef.fields.length} fields: ${typeDef.filePath}:${typeDef.line}`);

      // Also add each field name as a signal for related entities
      for (const field of typeDef.fields) {
        const fieldLower = field.name.toLowerCase();
        if (!IMPLEMENTATION_NOISE.has(fieldLower) && !["id", "createdAt", "updatedAt"].includes(field.name)) {
          // e.g. if Order has a 'product' field → signal for Product entity
          addSignal(fieldLower, 15, `Field reference in ${typeDef.name}: ${field.name}`);
        }
      }
    }
  }

  // ── Signal 2: Route path segments (STRONG) ───────────────────────
  // Filter out UI/navigation route segments that are never entities
  const UI_ROUTE_SEGMENTS = new Set([
    "login", "logout", "signin", "signout", "signup", "register",
    "forgot", "reset", "verify", "confirm", "callback", "oauth",
    "dashboard", "home", "index", "landing", "about", "contact",
    "settings", "profile", "account", "preferences", "billing",
    "help", "support", "docs", "documentation", "faq",
    "404", "500", "error", "notfound", "not-found", "unauthorized",
    "forbidden", "maintenance", "coming-soon",
    "admin", "onboarding", "welcome", "setup",
    // Next.js special files and test file patterns
    "_app", "_document", "_error", "middleware", "instrumentation",
    // Test file patterns
    "test", "spec", "mock", "fixture", "story", "stories",
    // Next.js dynamic catch-all patterns (these become "[...args]")
    "args", "slug", "id", "params",
    // Common Next.js API utility routes
    "gettoken", "settokenincalcom", "refresh", "verify",
  ]);
  for (const route of routes) {
    const segments = route.path
      .split("/")
      .filter((s) => s && !s.startsWith(":") && !s.startsWith("*") && s !== "api" && s !== "v1" && s !== "v2"
        && !s.startsWith("[")    // catch-all [slug] not yet normalized
        && !s.startsWith("-")    // hyphen-prefixed = bad normalization
        && !s.includes(".")      // file extensions = not a route segment
        && !/\.(test|spec|stories)/.test(s)); // test file segments
    for (const seg of segments) {
      if (UI_ROUTE_SEGMENTS.has(seg.toLowerCase())) continue;
      addSignal(seg, 50, `Core domain in route: ${route.path}`);
    }
  }

  // ── Signal 3: API call URL patterns (STRONG) ─────────────────────
  for (const call of graph.allAPICallsFlat) {
    const url = call.urlPattern ?? call.url;
    if (!url) continue;
    const segments = url
      .split("/")
      .filter((s) => s && !s.startsWith(":") && s !== "api" && s !== "v1" && s !== "v2");
    for (const seg of segments) {
      addSignal(seg, 25, `Backend dependency: ${call.method} ${url} (${call.filePath}:${call.line})`);
    }
  }

  // ── Signal 4: Component prop names matching entity signals ────────
  for (const comp of graph.allComponents) {
    for (const prop of comp.props) {
      const propLower = prop.name.toLowerCase();
      for (const [entityName, signals] of Object.entries(ENTITY_SIGNALS)) {
        if (signals.some((s) => propLower === s || propLower.includes(s))) {
          addSignal(entityName, 20, `Prop "${prop.name}" in component: ${comp.name}`);
        }
      }
    }
  }

  // ── Signal 5: useState variable names ────────────────────────────
  for (const comp of graph.allComponents) {
    for (const stateField of comp.stateFields) {
      const lower = stateField.toLowerCase();
      if (!IMPLEMENTATION_NOISE.has(lower) && lower.length > 2) {
        addSignal(lower, 10, `State field in ${comp.name}: ${stateField}`);
      }
    }
  }

  // ── Map scores → ConfidenceLevel ─────────────────────────────────
  const confWeight: Record<ConfidenceLevel, number> = {
    Deterministic: 5, "Strong evidence": 4, "Multi-source confirmation": 3,
    "Partial evidence": 2, "Heuristic inference": 1,
  };

  const results: InferredEntity[] = Array.from(entityMap.entries())
    .filter(([, e]) => e.hints.length >= 2 || e.score >= 50)
    .map(([name, e]) => {
      const conf: ConfidenceLevel =
        e.score >= 90 || e.hints.length >= 4
          ? "Deterministic"
          : e.score >= 70 || e.hints.length >= 3
          ? "Strong evidence"
          : e.hints.length >= 2
          ? "Multi-source confirmation"
          : e.score >= 50
          ? "Partial evidence"
          : "Heuristic inference";

      return {
        name,
        confidence: conf,
        hints: e.hints,
        normalizedId: name.replace(/[^a-z0-9]+/g, "-"),
      };
    })
    .sort((a, b) => confWeight[b.confidence] - confWeight[a.confidence]);

  if (results.length === 0) {
    return [{ name: "user", confidence: "Partial evidence", hints: ["Fundamental application requirement"], normalizedId: "user" }];
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// 2. API INFERRER (AST-powered)
// ═══════════════════════════════════════════════════════════════════════
export function inferAPIFromAST(graph: SimplicitASTGraph): InferredAPI[] {
  const apis: InferredAPI[] = [];
  const seen = new Set<string>();

  for (const call of graph.allAPICallsFlat) {
    const path = call.urlPattern ?? call.url;
    if (!path) continue;
    if (!path.startsWith("/") && !path.startsWith("http")) continue;

    const cleanPath = path.split("?")[0];
    const key = `${call.method}:${cleanPath}`;
    if (seen.has(key)) continue;
    seen.add(key);

    // Convert ASTConfidence → ConfidenceLevel
    const confMap: Record<ASTConfidence, ConfidenceLevel> = {
      "Deterministic": "Deterministic",
      "Strong evidence": "Strong evidence",
      "Multi-source confirmation": "Multi-source confirmation",
      "Partial evidence": "Partial evidence",
      "Heuristic inference": "Heuristic inference",
    };

    apis.push({
      method: call.method as any,
      path: cleanPath,
      purpose: inferAPIPurpose(cleanPath, call.filePath),
      confidence: confMap[call.confidence],
      normalizedId: `${call.method.toLowerCase()}-${cleanPath.replace(/\//g, "-").replace(/^-/, "")}`,
    });
  }

  // Also scan route.ts files for API routes we may have missed
  for (const route of graph.allRoutes) {
    if (route.kind !== "api") continue;
    for (const method of route.httpMethods) {
      const key = `${method}:${route.path}`;
      if (seen.has(key)) continue;
      seen.add(key);

      apis.push({
        method: method as any,
        path: route.path,
        purpose: inferAPIPurpose(route.path, route.filePath),
        confidence: "Strong evidence",
        normalizedId: `${method.toLowerCase()}-${route.path.replace(/\//g, "-").replace(/^-/, "")}`,
      });
    }
  }

  return apis.sort((a, b) => a.path.localeCompare(b.path));
}

function inferAPIPurpose(url: string, sourcePath: string): string {
  const lower = url.toLowerCase();
  if (lower.includes("login") || lower.includes("signin") || lower.includes("auth/callback")) return "Authenticate user";
  if (lower.includes("logout") || lower.includes("signout")) return "End user session";
  if (lower.includes("register") || lower.includes("signup")) return "Create user account";
  if (lower.includes("password") || lower.includes("reset")) return "Password management";
  if (lower.includes("user") || lower.includes("profile") || lower.includes("me")) return "Fetch or update user data";
  if (lower.includes("stripe") || lower.includes("checkout") || lower.includes("payment")) return "Process payment";
  if (lower.includes("upload") || lower.includes("file") || lower.includes("media")) return "Handle file operations";
  if (lower.includes("webhook")) return "Receive webhook event";
  if (lower.includes("search")) return "Search resources";

  const segments = url.split("/").filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  if (lastSegment && !lastSegment.startsWith(":") && lastSegment.length > 2) {
    return `Interact with ${lastSegment.replace(/[-_]/g, " ")} resource`;
  }
  return "Data interaction";
}

// ═══════════════════════════════════════════════════════════════════════
// 3. ROLE INFERRER (AST-powered)
// ═══════════════════════════════════════════════════════════════════════
export function inferRolesFromAST(
  graph: SimplicitASTGraph,
  routes: DetectedRoute[]
): InferredRole[] {
  const roles = new Map<string, InferredRole>();

  const addRole = (name: string, desc: string, conf: ConfidenceLevel, evidence: string) => {
    const existing = roles.get(name);
    if (!existing) {
      roles.set(name, { name, description: desc, confidence: conf, evidence: [evidence], normalizedId: name.toLowerCase() });
    } else {
      if (!existing.evidence.includes(evidence)) existing.evidence.push(evidence);
    }
  };

  // ── Signal 1: TypeScript union type named "Role" or "*Role*" ─────
  for (const typeDef of graph.allTypeDefinitions) {
    if (
      typeDef.kind === "type" &&
      (typeDef.name === "Role" ||
        typeDef.name === "UserRole" ||
        typeDef.name.toLowerCase().includes("role"))
    ) {
      // Parse union members from the fields (they come out as fields with empty names in regex path)
      // For AST path they'd be as union type members — we handle both
      for (const field of typeDef.fields) {
        const roleName = field.name
          .replace(/['"]/g, "")
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);
        for (const rn of roleName) {
          if (rn.length > 1) {
            addRole(
              capitalize(rn),
              `Role from TypeScript union: ${typeDef.name}`,
              "Deterministic",
              `${typeDef.filePath}:${typeDef.line}`
            );
          }
        }
      }
    }
  }

  // ── Signal 2: Route paths ─────────────────────────────────────────
  for (const route of routes) {
    const path = route.path.toLowerCase();
    if (path.includes("/admin") || path.includes("/manage")) {
      addRole("Administrator", "Manages platform configuration", "Strong evidence", `Admin route: ${route.path}`);
    }
    if (path.includes("/instructor") || path.includes("/teacher")) {
      addRole("Instructor", "Creates and manages educational content", "Strong evidence", `Route: ${route.path}`);
    }
    if (path.includes("/student") || path.includes("/learner")) {
      addRole("Student", "Consumes educational content", "Strong evidence", `Route: ${route.path}`);
    }
  }

  // ── Signal 3: role comparison patterns in component code ─────────
  const rolePatterns: Array<[RegExp, string, string]> = [
    [/role\s*===?\s*['"`](admin|administrator)['"`]/i, "Administrator", "RBAC check"],
    [/role\s*===?\s*['"`]manager['"`]/i, "Manager", "RBAC check"],
    [/role\s*===?\s*['"`]moderator['"`]/i, "Moderator", "RBAC check"],
    [/role\s*===?\s*['"`]guest['"`]/i, "Guest", "Unauthenticated visitor"],
    [/isAdmin/i, "Administrator", "isAdmin flag"],
    [/isModerator/i, "Moderator", "isModerator flag"],
    [/org_id|tenant_id|organization/i, "Organization Admin", "Multi-tenant signal"],
    [/role\s*===?\s*['"`]owner['"`]/i, "Owner", "Resource owner check"],
  ];

  for (const fileResult of graph.files) {
    for (const comp of fileResult.components) {
      for (const [pattern, roleName, desc] of rolePatterns) {
        for (const ev of comp.evidence) {
          if (pattern.test(ev.snippet)) {
            addRole(roleName, desc, "Strong evidence", `${comp.filePath}:${comp.line}`);
          }
        }
      }
    }
  }

  if (roles.size === 0) {
    addRole("User", "Standard authenticated user", "Heuristic inference", "Fundamental application requirement");
  }

  return Array.from(roles.values());
}

// ═══════════════════════════════════════════════════════════════════════
// 4. JSX INTENT ANALYZER (AST-powered)
// ═══════════════════════════════════════════════════════════════════════
export function analyzeIntentFromAST(graph: SimplicitASTGraph): {
  intent: ComponentIntent;
  detectedForms: string[];
} {
  const intent: ComponentIntent = {
    hasForms: false,
    hasDashboards: false,
    hasDataTables: false,
    hasAuthScreens: false,
    hasAnalytics: false,
    hasUploads: false,
    hasSettings: false,
    hasOnboarding: false,
    hasManagement: false,
  };
  const detectedForms: string[] = [];

  for (const comp of graph.allComponents) {
    const lowerPath = comp.filePath.toLowerCase();
    const lowerName = comp.name.toLowerCase();

    // Forms: exact AST detection (not string matching)
    if (comp.hasForm) {
      intent.hasForms = true;
      if (lowerName.includes("form") || lowerName.includes("modal") || lowerName.includes("dialog")) {
        detectedForms.push(comp.name);
      }
    }

    // Tables
    if (comp.hasTable) intent.hasDataTables = true;

    // Charts / Analytics
    if (comp.hasChart) intent.hasAnalytics = true;

    // Auth screens
    if (
      lowerPath.includes("/auth/") ||
      lowerPath.includes("/login") ||
      lowerPath.includes("/signup") ||
      lowerName.includes("login") ||
      lowerName.includes("signup") ||
      lowerName.includes("auth")
    ) {
      intent.hasAuthScreens = true;
    }

    // Dashboard
    if (lowerPath.includes("/dashboard") || lowerName.includes("dashboard") || lowerName.includes("overview")) {
      intent.hasDashboards = true;
    }

    // Uploads: look for child components or props that suggest file handling
    if (
      comp.childComponents.some((c) => c.toLowerCase().includes("upload") || c.toLowerCase().includes("dropzone"))
    ) {
      intent.hasUploads = true;
    }

    // Settings
    if (
      lowerPath.includes("/settings") ||
      lowerName.includes("settings") ||
      lowerName.includes("preferences")
    ) {
      intent.hasSettings = true;
    }

    // Onboarding
    if (
      lowerPath.includes("/onboarding") ||
      lowerPath.includes("/setup") ||
      lowerName.includes("onboarding") ||
      lowerName.includes("wizard") ||
      lowerName.includes("stepper")
    ) {
      intent.hasOnboarding = true;
    }

    // Management / Admin
    if (
      lowerPath.includes("/admin") ||
      lowerPath.includes("/manage") ||
      lowerName.includes("admin") ||
      lowerName.includes("management")
    ) {
      intent.hasManagement = true;
    }
  }

  // Also check analytics from API calls (e.g. calls to /analytics, /metrics, /stats)
  for (const call of graph.allAPICallsFlat) {
    const url = (call.url ?? "").toLowerCase();
    if (url.includes("analytic") || url.includes("metric") || url.includes("stat") || url.includes("report")) {
      intent.hasAnalytics = true;
    }
  }

  return {
    intent,
    detectedForms: [...new Set(detectedForms)].slice(0, 10),
  };
}

// ─── Utilities ───────────────────────────────────────────────────────
function singularize(word: string): string {
  // Words that must never be singularized (common false positives)
  const INVARIANT = new Set([
    "status", "canvas", "axios", "nexus", "radius", "bonus",
    "focus", "genus", "minus", "plus", "virus", "versus",
    "process", "access", "address", "success", "progress",
    "express", "excess", "stress", "compress", "suppress",
  ]);
  if (INVARIANT.has(word)) return word;
  if (word.endsWith("ies") && word.length > 4) return word.slice(0, -3) + "y";
  if (word.endsWith("sses")) return word.slice(0, -2);
  if (word.endsWith("ses")) return word.slice(0, -2);
  // Only strip trailing 's' if word is plural-shaped (length > 4, not ending in ss/us/is/as)
  if (
    word.endsWith("s") &&
    !word.endsWith("ss") &&
    !word.endsWith("us") &&
    !word.endsWith("is") &&
    !word.endsWith("as") &&
    !word.endsWith("ous") &&
    word.length > 4
  ) return word.slice(0, -1);
  return word;
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}
