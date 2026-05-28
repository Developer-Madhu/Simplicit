import type { DetectedRoute, RouteCategory, ConfidenceLevel } from "../types";

// ─── Main entry point ───────────────────────────────────────────────
export function extractRoutes(
  files: Map<string, string>,
  frameworkName: string
): DetectedRoute[] {
  const paths = Array.from(files.keys()).map((p) =>
    p.replace(/\\/g, "/")
  );

  let routes: DetectedRoute[] = [];

  switch (frameworkName) {
    case "Next.js":
      routes = [
        ...extractNextAppRoutes(paths, files),
        ...extractNextPagesRoutes(paths, files),
        ...extractNextApiRoutes(paths, files),
      ];
      break;
    case "Nuxt":
      routes = extractNuxtRoutes(paths, files);
      break;
    case "SvelteKit":
      routes = extractSvelteKitRoutes(paths, files);
      break;
    case "Astro":
      routes = extractAstroRoutes(paths, files);
      break;
    default:
      routes = extractGenericRoutes(paths, files);
  }

  // Priority 2: React Router Intelligence
  const rrRoutes = extractReactRouterRoutes(paths, files);
  if (rrRoutes.length > 0) {
    if (routes.length === 0) {
      routes = rrRoutes;
    } else {
      for (const rr of rrRoutes) {
        if (!routes.some(r => r.path === rr.path)) {
          routes.push(rr);
        }
      }
    }
  }

  // Final validation: Filter out common non-route files that might have been picked up
  return routes.filter(r => !r.path.includes('/components/') && !r.path.includes('/ui/'));
}

function isProtected(content: string): boolean {
  const lower = content.toLowerCase();
  const signals = [
    "withauth", "protectedroute", "requireauth", "useauth", "useuser",
    "authguard", "authcontext", "session", "middleware", "auth.js",
    "getServerSideProps", "unauthorized", "redirect('/login')"
  ];
  return signals.some(s => lower.includes(s.toLowerCase()));
}

function determineCategory(path: string, content: string): RouteCategory {
  const lowerPath = path.toLowerCase();
  const lowerContent = content.toLowerCase();

  // 1. Admin / Management
  if (lowerPath.includes("/admin") || lowerPath.includes("/manage") || lowerPath.includes("/system") || lowerPath.includes("/dashboard/admin")) return "admin";
  if (lowerContent.includes("adminpanel") || lowerContent.includes("managesystem") || lowerContent.includes("userlist")) return "admin";

  // 2. Auth
  if (lowerPath.includes("/auth") || lowerPath.includes("/login") || lowerPath.includes("/signup") || lowerPath.includes("/register") || lowerPath.includes("/forgot-password")) return "auth";
  if (lowerContent.includes("<login") || lowerContent.includes("authform") || lowerContent.includes("signin")) return "auth";

  // 3. Dashboard / App Core
  if (lowerPath.includes("/dashboard") || lowerPath.includes("/overview") || lowerPath.includes("/app") || lowerPath.includes("/workspace") || lowerPath.includes("/console")) return "dashboard";
  if (lowerContent.includes("dashboardlayout") || lowerContent.includes("chart") || lowerContent.includes("analytics") || lowerContent.includes("datatable")) return "dashboard";

  // 4. Settings / Profile
  if (lowerPath.includes("/settings") || lowerPath.includes("/profile") || lowerPath.includes("/account") || lowerPath.includes("/preferences") || lowerPath.includes("/billing")) return "settings";
  
  // 5. Onboarding
  if (lowerPath.includes("/onboarding") || lowerPath.includes("/setup") || lowerPath.includes("/welcome") || lowerPath.includes("/tour")) return "onboarding";
  
  // 6. Public
  const publicPaths = ["/", "/about", "/contact", "/pricing", "/terms", "/privacy", "/faq"];
  if (publicPaths.includes(lowerPath)) return "public";
  
  return "unknown";
}

// ─── Next.js App Router ─────────────────────────────────────────────
function extractNextAppRoutes(paths: string[], files: Map<string, string>): DetectedRoute[] {
  const routes: DetectedRoute[] = [];
  const appPrefix = findPrefix(paths, "app");
  if (!appPrefix) return routes;

  for (const p of paths) {
    if (!p.startsWith(appPrefix)) continue;
    const relative = p.slice(appPrefix.length);
    const content = files.get(p) || "";

    // page.tsx / page.jsx / page.ts / page.js
    if (/\/page\.(tsx?|jsx?)$/.test(relative)) {
      const routePath = filePathToRoutePath(
        relative.replace(/\/page\.(tsx?|jsx?)$/, "")
      );
      const params = extractDynamicParams(routePath);
      routes.push({
        path: routePath || "/",
        component: p,
        isDynamic: params.length > 0,
        isProtected: isProtected(content),
        category: determineCategory(routePath, content),
        params,
        kind: "page",
        confidence: "Strong evidence",
        evidence: [],
      });
    }

    // layout.tsx
    if (/\/layout\.(tsx?|jsx?)$/.test(relative)) {
      const routePath = filePathToRoutePath(
        relative.replace(/\/layout\.(tsx?|jsx?)$/, "")
      );
      routes.push({
        path: routePath || "/",
        component: p,
        isDynamic: false,
        isProtected: isProtected(content),
        category: determineCategory(routePath, content),
        params: [],
        kind: "layout",
        confidence: "Strong evidence",
        evidence: [],
      });
    }

    // API routes: route.ts in app directory
    if (/\/route\.(ts|js)$/.test(relative)) {
      const routePath = filePathToRoutePath(
        relative.replace(/\/route\.(ts|js)$/, "")
      );
      const params = extractDynamicParams(routePath);
      routes.push({
        path: routePath || "/",
        component: p,
        isDynamic: params.length > 0,
        isProtected: isProtected(content),
        category: "unknown",
        params,
        kind: "api",
        confidence: "Strong evidence",
        evidence: [],
      });
    }
  }

  return routes;
}

// ─── Next.js Pages Router ───────────────────────────────────────────
function extractNextPagesRoutes(paths: string[], files: Map<string, string>): DetectedRoute[] {
  const routes: DetectedRoute[] = [];
  const pagesPrefix = findPrefix(paths, "pages");
  if (!pagesPrefix) return routes;

  for (const p of paths) {
    if (!p.startsWith(pagesPrefix)) continue;
    const relative = p.slice(pagesPrefix.length);
    const content = files.get(p) || "";

    if (relative.startsWith("/api/") || relative === "/api") continue;
    if (/\/_[a-z]/.test(relative)) continue;

    if (/\.(tsx?|jsx?)$/.test(relative)) {
      let routePath = relative
        .replace(/\.(tsx?|jsx?)$/, "")
        .replace(/\/index$/, "");
      routePath = filePathToRoutePath(routePath);
      const params = extractDynamicParams(routePath);

      routes.push({
        path: routePath || "/",
        component: p,
        isDynamic: params.length > 0,
        isProtected: isProtected(content),
        category: determineCategory(routePath, content),
        params,
        kind: "page",
        confidence: "Partial evidence",
        evidence: [],
      });
    }
  }

  return routes;
}

// ─── Next.js API Routes (pages/api/) ────────────────────────────────
function extractNextApiRoutes(paths: string[], files: Map<string, string>): DetectedRoute[] {
  const routes: DetectedRoute[] = [];

  for (const p of paths) {
    const normalized = p.replace(/\\/g, "/");
    let apiPath: string | null = null;
    const content = files.get(p) || "";

    const pagesApiMatch = normalized.match(/\/pages\/api\/(.+)\.(tsx?|jsx?)$/);
    if (pagesApiMatch) {
      apiPath = pagesApiMatch[1]
        .replace(/\/index$/, "")
        .replace(/\[([^\]]+)\]/g, ":$1");
      const params = extractDynamicParams(`/api/${apiPath}`);
      routes.push({
        path: `/api/${apiPath}`,
        component: p,
        isDynamic: params.length > 0,
        isProtected: isProtected(content),
        category: "unknown",
        params,
        kind: "api",
        confidence: "Partial evidence",
        evidence: [],
      });
    }
  }

  return routes;
}

// ─── Nuxt Routes ────────────────────────────────────────────────────
function extractNuxtRoutes(paths: string[], files: Map<string, string>): DetectedRoute[] {
  const routes: DetectedRoute[] = [];
  const pagesPrefix = findPrefix(paths, "pages");
  if (!pagesPrefix) return routes;

  for (const p of paths) {
    if (!p.startsWith(pagesPrefix)) continue;
    const relative = p.slice(pagesPrefix.length);
    const content = files.get(p) || "";

    if (/\.(vue|tsx?|jsx?)$/.test(relative)) {
      let routePath = relative
        .replace(/\.(vue|tsx?|jsx?)$/, "")
        .replace(/\/index$/, "");
      routePath = filePathToRoutePath(routePath);
      const params = extractDynamicParams(routePath);

      routes.push({
        path: routePath || "/",
        component: p,
        isDynamic: params.length > 0,
        isProtected: isProtected(content),
        category: determineCategory(routePath, content),
        params,
        kind: "page",
        confidence: "Partial evidence",
        evidence: [],
      });
    }
  }

  return routes;
}

// ─── SvelteKit Routes ───────────────────────────────────────────────
function extractSvelteKitRoutes(paths: string[], files: Map<string, string>): DetectedRoute[] {
  const routes: DetectedRoute[] = [];
  const routesPrefix = findPrefix(paths, "routes");
  if (!routesPrefix) return routes;

  for (const p of paths) {
    if (!p.startsWith(routesPrefix)) continue;
    const relative = p.slice(routesPrefix.length);
    const content = files.get(p) || "";

    if (/\/\+page\.(svelte|ts|js)$/.test(relative)) {
      let routePath = relative
        .replace(/\/\+page\.(svelte|ts|js)$/, "")
        .replace(/\[([^\]]+)\]/g, ":$1");
      routePath = routePath || "/";
      const params = extractDynamicParams(routePath);

      routes.push({
        path: routePath,
        component: p,
        isDynamic: params.length > 0,
        isProtected: isProtected(content),
        category: determineCategory(routePath, content),
        params,
        kind: "page",
        confidence: "Strong evidence",
        evidence: [],
      });
    }
  }

  return routes;
}

// ─── Astro Routes ───────────────────────────────────────────────────
function extractAstroRoutes(paths: string[], files: Map<string, string>): DetectedRoute[] {
  const routes: DetectedRoute[] = [];
  const pagesPrefix = findPrefix(paths, "src/pages");
  if (!pagesPrefix) return routes;

  for (const p of paths) {
    if (!p.startsWith(pagesPrefix)) continue;
    const relative = p.slice(pagesPrefix.length);
    const content = files.get(p) || "";

    if (/\.(astro|md|mdx|ts|js)$/.test(relative)) {
      let routePath = relative
        .replace(/\.(astro|md|mdx|ts|js)$/, "")
        .replace(/\/index$/, "");
      routePath = filePathToRoutePath(routePath);
      const params = extractDynamicParams(routePath);

      routes.push({
        path: routePath || "/",
        component: p,
        isDynamic: params.length > 0,
        isProtected: isProtected(content),
        category: determineCategory(routePath, content),
        params,
        kind: "page",
        confidence: "Partial evidence",
        evidence: [],
      });
    }
  }

  return routes;
}

// ─── Generic Heuristic Routes ───────────────────────────────────────
function extractGenericRoutes(paths: string[], files: Map<string, string>): DetectedRoute[] {
  const routes: DetectedRoute[] = [];
  const pagePatterns = [/\/pages?\//i, /\/views?\//i, /\/screens?\//i, /\/routes?\//i, /\/features\/.*\/pages?\//i];

  for (const p of paths) {
    const normalized = p.replace(/\\/g, "/");
    if (!/\.(tsx?|jsx?|vue|svelte)$/.test(normalized)) continue;
    if (normalized.includes("/components/") || normalized.includes("/ui/")) continue;
    
    const content = files.get(p) || "";

    if (pagePatterns.some((pat) => pat.test(normalized))) {
      const filename = normalized.split("/").pop()!.replace(/\.(tsx?|jsx?|vue|svelte)$/, "");
      let routePath = `/${filename.toLowerCase().replace(/[_\s]/g, "-")}`;
      if (routePath === "/index" || routePath === "/page") {
        // Try to get parent dir name
        const parts = normalized.split("/");
        const parent = parts[parts.length - 2];
        if (parent && parent !== "pages" && parent !== "views" && parent !== "screens") {
          routePath = `/${parent.toLowerCase().replace(/[_\s]/g, "-")}`;
        } else {
          routePath = "/";
        }
      }

      routes.push({
        path: routePath,
        component: p,
        isDynamic: routePath.includes(":"),
        isProtected: isProtected(content),
        category: determineCategory(routePath, content),
        params: extractDynamicParams(routePath),
        kind: "page",
        confidence: "Heuristic inference",
        evidence: [],
      });
    }
  }

  return routes;
}

// ─── React Router Patterns ──────────────────────────────────────────
function extractReactRouterRoutes(paths: string[], files: Map<string, string>): DetectedRoute[] {
  const routes: DetectedRoute[] = [];
  
  // Pattern 1: <Route path="..." />
  const componentRouteRegex = /<Route\s+[^>]*?path=['"`](.*?)['"`]/g;
  // Pattern 2: path: "..." (createBrowserRouter / route objects)
  const objectRouteRegex = /path:\s*['"`](.*?)['"`]/g;
  // Pattern 3: createBrowserRouter([...])
  const browserRouterRegex = /createBrowserRouter\(\s*\[([\s\S]*?)\]\s*\)/g;

  for (const p of paths) {
    if (!/\.(tsx|jsx|js|ts)$/.test(p)) continue;
    const content = files.get(p) || "";
    const protectedByLayout = isProtected(content);
    
    let match;
    // Scan for JSX Route components
    while ((match = componentRouteRegex.exec(content)) !== null) {
      const routePath = match[1];
      if (isValidReactRouterPath(routePath)) {
        routes.push({
          path: routePath,
          component: p,
          isDynamic: routePath.includes(':'),
          isProtected: protectedByLayout || isProtected(content),
          category: determineCategory(routePath, content),
          params: extractDynamicParams(routePath),
          kind: "page",
          confidence: "Partial evidence",
          evidence: []
        });
      }
    }

    // Scan for route objects
    while ((match = objectRouteRegex.exec(content)) !== null) {
      const routePath = match[1];
      if (isValidReactRouterPath(routePath)) {
        routes.push({
          path: routePath,
          component: p,
          isDynamic: routePath.includes(':'),
          isProtected: protectedByLayout || isProtected(content),
          category: determineCategory(routePath, content),
          params: extractDynamicParams(routePath),
          kind: "page",
          confidence: "Partial evidence",
          evidence: []
        });
      }
    }
  }

  // Deduplicate RR routes by path
  const unique = new Map<string, DetectedRoute>();
  for (const r of routes) {
    if (!unique.has(r.path) || r.confidence === "Strong evidence") {
      unique.set(r.path, r);
    }
  }

  return Array.from(unique.values());
}

function isValidReactRouterPath(path: string): boolean {
  if (path.includes("${") || path.includes("+")) return false; // Skip dynamic template strings for now
  return path.startsWith('/') || path === '*' || path === '' || /^[a-zA-Z]/.test(path);
}

// ─── Utilities ──────────────────────────────────────────────────────

function findPrefix(paths: string[], dirName: string): string | null {
  for (const p of paths) {
    const normalized = p.replace(/\\/g, "/");
    const idx = normalized.indexOf(`/${dirName}/`);
    if (idx !== -1) return normalized.slice(0, idx + `/${dirName}`.length);
    if (normalized.startsWith(`${dirName}/`)) return dirName;
  }
  return null;
}

function filePathToRoutePath(filePath: string): string {
  return (
    filePath
      .replace(/\/\([^)]+\)/g, "")
      .replace(/\[\.\.\.([^\]]+)\]/g, "*$1")
      .replace(/\[([^\]]+)\]/g, ":$1")
      .replace(/\/+/g, "/")
      .replace(/\/$/, "") || "/"
  );
}

function extractDynamicParams(routePath: string): string[] {
  const params: string[] = [];
  const matches = routePath.matchAll(/:([^/]+)/g);
  for (const m of matches) params.push(m[1]);
  const splatMatches = routePath.matchAll(/\*([^/]+)/g);
  for (const m of splatMatches) params.push(`...${m[1]}`);
  return params;
}
