import type { ProjectMetadata } from "../types";

// ─── File classification patterns ───────────────────────────────────
const COMPONENT_EXTENSIONS = /\.(tsx|jsx|vue|svelte)$/;
const PAGE_PATTERNS = [
  /\/pages?\//i,
  /\/views?\//i,
  /\/screens?\//i,
  /page\.(tsx?|jsx?)$/,
  /\+page\.(svelte|ts|js)$/,
];
const API_ROUTE_PATTERNS = [
  /\/api\//,
  /\/route\.(ts|js)$/,
  /\+server\.(ts|js)$/,
  /\/server\//,
];
const ENV_FILES = [
  ".env",
  ".env.local",
  ".env.example",
  ".env.development",
  ".env.production",
  ".env.template",
];
const BACKEND_INTEGRATIONS: Record<string, string[]> = {
  supabase: ["@supabase/supabase-js", "@supabase/ssr", "@supabase/auth-helpers-nextjs"],
  firebase: ["firebase", "@firebase/app", "firebase-admin"],
  prisma: ["@prisma/client", "prisma"],
  drizzle: ["drizzle-orm", "drizzle-kit"],
  convex: ["convex"],
  appwrite: ["appwrite"],
  pocketbase: ["pocketbase"],
  amplify: ["aws-amplify", "@aws-amplify/core"],
  stripe: ["stripe", "@stripe/stripe-js"],
};

// ─── Infer metadata from project files ──────────────────────────────
export function inferMetadata(
  files: Map<string, string>
): ProjectMetadata {
  const paths = Array.from(files.keys()).map((p) =>
    p.replace(/\\/g, "/")
  );

  return {
    name: inferName(files),
    description: inferDescription(files),
    totalFiles: paths.length,
    totalComponents: countComponents(paths),
    totalPages: countPages(paths),
    totalApiRoutes: countApiRoutes(paths),
    envVars: extractEnvVars(files),
    existingBackendIntegrations: detectBackendIntegrations(files),
    missingBackendSystems: [],
    primarySource: "frontend",
    appType: "Web Application",
    featureModules: [],
    roles: [],
    workflows: [],
    crudSystems: [],
    stateAnalysis: {
      libraries: [],
      cachingRequired: false,
      realtimeRequired: false,
      optimisticUpdates: false,
    },
    semanticGraph: { nodes: [], edges: [] },
    inferredEntities: [],
    apiExpectations: [],
    intent: {
      hasForms: false,
      hasDashboards: false,
      hasDataTables: false,
      hasAuthScreens: false,
      hasAnalytics: false,
      hasUploads: false,
      hasSettings: false,
      hasOnboarding: false,
      hasManagement: false,
    },
    authFlows: [],
  };
}

// ─── Infer project name ─────────────────────────────────────────────
function inferName(files: Map<string, string>): string | null {
  const pkgContent = findFile(files, "package.json");
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      if (pkg.name && typeof pkg.name === "string") {
        return pkg.name;
      }
    } catch {}
  }
  return null;
}

// ─── Infer description from README or package.json ──────────────────
function inferDescription(files: Map<string, string>): string | null {
  // Try package.json description first
  const pkgContent = findFile(files, "package.json");
  if (pkgContent) {
    try {
      const pkg = JSON.parse(pkgContent);
      if (pkg.description && typeof pkg.description === "string") {
        return pkg.description;
      }
    } catch {}
  }

  // Fallback to README first paragraph
  const readme = findFile(files, "README.md") || findFile(files, "readme.md");
  if (readme) {
    const lines = readme.split("\n");
    const firstParagraph: string[] = [];
    let started = false;

    for (const line of lines) {
      const trimmed = line.trim();
      // Skip title lines and badges
      if (trimmed.startsWith("#") || trimmed.startsWith("![") || trimmed.startsWith("[![")) {
        if (started) break;
        continue;
      }
      if (trimmed === "") {
        if (started) break;
        continue;
      }
      started = true;
      firstParagraph.push(trimmed);
    }

    if (firstParagraph.length > 0) {
      return firstParagraph.join(" ").slice(0, 200);
    }
  }

  return null;
}

// ─── Count components ───────────────────────────────────────────────
function countComponents(paths: string[]): number {
  return paths.filter((p) => {
    if (!COMPONENT_EXTENSIONS.test(p)) return false;
    // Exclude test files, stories, configs
    if (/\.(test|spec|stories|story)\./i.test(p)) return false;
    // Only count things in component-like directories or with PascalCase names
    const filename = p.split("/").pop() || "";
    const nameWithoutExt = filename.replace(/\.[^.]+$/, "");
    return /^[A-Z]/.test(nameWithoutExt) || /\/components?\//i.test(p);
  }).length;
}

// ─── Count pages ────────────────────────────────────────────────────
function countPages(paths: string[]): number {
  return paths.filter((p) =>
    PAGE_PATTERNS.some((pat) => pat.test(p))
  ).length;
}

// ─── Count API routes ───────────────────────────────────────────────
function countApiRoutes(paths: string[]): number {
  return paths.filter((p) =>
    API_ROUTE_PATTERNS.some((pat) => pat.test(p))
  ).length;
}

// ─── Extract env var names ──────────────────────────────────────────
function extractEnvVars(files: Map<string, string>): string[] {
  const vars = new Set<string>();

  for (const envFile of ENV_FILES) {
    const content = findFile(files, envFile);
    if (!content) continue;

    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=/);
      if (match) {
        vars.add(match[1]);
      }
    }
  }

  return Array.from(vars).sort();
}

// ─── Detect existing backend integrations ───────────────────────────
function detectBackendIntegrations(
  files: Map<string, string>
): string[] {
  const pkgContent = findFile(files, "package.json");
  if (!pkgContent) return [];

  let pkg: any;
  try {
    pkg = JSON.parse(pkgContent);
  } catch {
    return [];
  }

  const allDeps = Object.keys({
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  });

  const detected: string[] = [];
  for (const [integration, packages] of Object.entries(BACKEND_INTEGRATIONS)) {
    if (packages.some((p) => allDeps.includes(p))) {
      detected.push(integration);
    }
  }

  return detected;
}

// ─── File finder utility ────────────────────────────────────────────
function findFile(
  files: Map<string, string>,
  filename: string
): string | null {
  // Direct match
  if (files.has(filename)) return files.get(filename)!;
  if (files.has(`./${filename}`)) return files.get(`./${filename}`)!;

  // Search one level deep (common in ZIP roots)
  for (const [path, content] of files) {
    const normalized = path.replace(/\\/g, "/");
    const parts = normalized.split("/").filter(Boolean);
    if (
      parts.length <= 2 &&
      parts[parts.length - 1].toLowerCase() === filename.toLowerCase()
    ) {
      return content;
    }
  }

  return null;
}
