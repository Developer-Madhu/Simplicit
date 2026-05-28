import type { FrameworkInfo, DependencyInfo, ConfidenceLevel } from "../types";

const FRAMEWORK_DEFINITIONS: Record<string, {
  name: string;
  dependencies: string[];
  configs: string[];
  folders: string[];
  scripts: string[];
}> = {
  nextjs: {
    name: "Next.js",
    dependencies: ["next"],
    configs: ["next.config.js", "next.config.ts", "next.config.mjs"],
    folders: ["app", "pages"],
    scripts: ["next dev", "next build"],
  },
  remix: {
    name: "Remix",
    dependencies: ["@remix-run/react", "@remix-run/node", "@remix-run/serve"],
    configs: ["remix.config.js", "remix.config.ts", "vite.config.ts"], // Remix v2 uses Vite
    folders: ["app"],
    scripts: ["remix dev", "remix build"],
  },
  astro: {
    name: "Astro",
    dependencies: ["astro"],
    configs: ["astro.config.mjs", "astro.config.js", "astro.config.ts"],
    folders: ["src/pages", "src/layouts"],
    scripts: ["astro dev", "astro build"],
  },
  vite: {
    name: "Vite",
    dependencies: ["vite"],
    configs: ["vite.config.js", "vite.config.ts", "vite.config.mjs"],
    folders: [],
    scripts: ["vite", "vite build"],
  },
  cra: {
    name: "Create React App",
    dependencies: ["react-scripts"],
    configs: [],
    folders: ["public", "src"],
    scripts: ["react-scripts start", "react-scripts build"],
  },
  nuxt: {
    name: "Nuxt",
    dependencies: ["nuxt", "nuxt3"],
    configs: ["nuxt.config.js", "nuxt.config.ts"],
    folders: ["pages", "layouts", "app"],
    scripts: ["nuxt dev", "nuxt build"],
  },
  sveltekit: {
    name: "SvelteKit",
    dependencies: ["@sveltejs/kit"],
    configs: ["svelte.config.js"],
    folders: ["src/routes"],
    scripts: ["vite dev", "vite build"],
  },
};

const UI_LIBRARIES = [
  { name: "Tailwind CSS", signal: "tailwindcss" },
  { name: "Material UI", signal: "@mui/material" },
  { name: "Chakra UI", signal: "@chakra-ui/react" },
  { name: "Ant Design", signal: "antd" },
  { name: "shadcn/ui", signal: "components.json" },
  { name: "styled-components", signal: "styled-components" },
  { name: "Emotion", signal: "@emotion/react" },
];

export function detectFramework(files: Map<string, string>): FrameworkInfo {
  const fileNames = Array.from(files.keys());
  const pkgContent = findPackageJson(files);
  const pkg = safeParseJson(pkgContent);
  const allDeps = Object.keys({ ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) });
  const scriptsMap = pkg?.scripts || {};
  const scriptsStr = Object.values(scriptsMap).join(" ");

  const signals = new Map<string, { score: number, evidence: string[] }>();

  // 1. Evaluate each framework definition using Weighted Consensus
  for (const [id, def] of Object.entries(FRAMEWORK_DEFINITIONS)) {
    let score = 0;
    const evidence: string[] = [];
    
    // Dependency match (Base signal)
    const matchingDeps = def.dependencies.filter(d => allDeps.includes(d));
    if (matchingDeps.length > 0) {
      score += 45;
      evidence.push(`Matched dependencies: ${matchingDeps.join(", ")}`);
      // Bonus if it's the core dependency
      if (allDeps.includes(id === 'nextjs' ? 'next' : id)) score += 5;
    }
    
    // Config match (Strong confirmatory signal)
    const matchingConfigs = def.configs.filter(c => fileNames.includes(c));
    if (matchingConfigs.length > 0) {
      score += 35;
      evidence.push(`Found config files: ${matchingConfigs.join(", ")}`);
    }
    
    // Script match (Strong confirmatory signal)
    const matchingScripts = def.scripts.filter(s => scriptsStr.includes(s));
    if (matchingScripts.length > 0) {
      score += 20;
      evidence.push(`Matched build scripts: ${matchingScripts.join(", ")}`);
    }

    // Folder match (Confirmatory signal)
    const matchingFolders = def.folders.filter(f => fileNames.some(path => path.startsWith(`${f}/`)));
    if (matchingFolders.length > 0) {
      score += 15;
      evidence.push(`Conventional folder structure: /${matchingFolders[0]}`);
    }

    signals.set(def.name, { score, evidence });
  }

  // 2. Determine winner
  let bestFramework = "Unknown";
  let maxScore = 0;
  let frameworkEvidence: string[] = [];

  for (const [name, data] of signals.entries()) {
    if (data.score > maxScore) {
      maxScore = data.score;
      bestFramework = name;
      frameworkEvidence = data.evidence;
    }
  }

  // Special case: Remix v2 often looks like Vite but has @remix-run deps
  if (bestFramework === "Vite" && allDeps.some(d => d.startsWith("@remix-run/"))) {
    bestFramework = "Remix";
    maxScore += 40;
    frameworkEvidence.push("Remix-specific packages detected in Vite project");
  }

  // Fallback for generic React/Vue/Svelte if no meta-framework detected
  if (bestFramework === "Unknown" || maxScore < 40) {
    if (allDeps.includes("react")) {
      bestFramework = "React";
      maxScore = 40;
      frameworkEvidence.push("React library in dependencies");
    } else if (allDeps.includes("vue")) {
      bestFramework = "Vue";
      maxScore = 40;
      frameworkEvidence.push("Vue library in dependencies");
    } else if (allDeps.includes("svelte")) {
      bestFramework = "Svelte";
      maxScore = 40;
      frameworkEvidence.push("Svelte library in dependencies");
    }
    
    // Boost generic frameworks if they have JSX/TSX or Vue/Svelte files
    if (bestFramework === "React" && fileNames.some(f => f.endsWith(".tsx") || f.endsWith(".jsx"))) {
      maxScore += 25;
      frameworkEvidence.push("Found JSX/TSX components");
    }
    if (bestFramework === "Vue" && fileNames.some(f => f.endsWith(".vue"))) {
      maxScore += 25;
      frameworkEvidence.push("Found Vue SFC components");
    }
    if (bestFramework === "Svelte" && fileNames.some(f => f.endsWith(".svelte"))) {
      maxScore += 25;
      frameworkEvidence.push("Found Svelte components");
    }
  }

  // 3. Detect Router
  let router: string | null = null;
  if (bestFramework === "Next.js") {
    const hasApp = fileNames.some(p => p.includes("app/page.tsx") || p.includes("app/page.jsx") || p.includes("app/page.ts") || p.includes("app/page.js"));
    const hasPages = fileNames.some(p => p.includes("pages/index.tsx") || p.includes("pages/index.jsx") || p.includes("pages/index.ts") || p.includes("pages/index.js"));
    if (hasApp && hasPages) router = "App Router + Pages Router";
    else if (hasApp) router = "App Router";
    else if (hasPages) router = "Pages Router";
    else router = "Next.js Default";
  } else if (allDeps.includes("react-router-dom") || allDeps.includes("react-router")) {
    router = "React Router";
  } else if (allDeps.includes("@tanstack/react-router")) {
    router = "TanStack Router";
  } else if (["Nuxt", "SvelteKit", "Remix", "Astro"].includes(bestFramework)) {
    router = "File-based Router";
  }
  if (router) frameworkEvidence.push(`Routing system: ${router}`);

  // 4. Detect CSS/UI Frameworks
  let cssFramework: string | null = null;
  for (const fw of UI_LIBRARIES) {
    if (fw.signal === "components.json") {
      if (fileNames.includes("components.json")) {
        cssFramework = cssFramework ? `${cssFramework} + shadcn/ui` : "shadcn/ui";
        frameworkEvidence.push("UI Library: shadcn/ui (components.json)");
      }
    } else if (allDeps.includes(fw.signal)) {
      cssFramework = fw.name;
      frameworkEvidence.push(`UI Library: ${fw.name}`);
    }
  }
  // Check for Tailwind config separately
  if (!cssFramework?.includes("Tailwind") && fileNames.some(f => f.includes("tailwind.config"))) {
    cssFramework = cssFramework ? `${cssFramework} + Tailwind CSS` : "Tailwind CSS";
    frameworkEvidence.push("Found tailwind.config");
  }

  // 5. Confidence Mapping (Priority 5)
  let confidence: ConfidenceLevel = "Heuristic inference";
  if (maxScore >= 95) confidence = "Deterministic";
  else if (maxScore >= 80) confidence = "Multi-source confirmation";
  else if (maxScore >= 60) confidence = "Strong evidence";
  else if (maxScore >= 40) confidence = "Partial evidence";

  let version = pkg?.dependencies?.[bestFramework.toLowerCase()] || null;
  if (bestFramework === "Next.js") version = pkg?.dependencies?.["next"] || null;
  else if (bestFramework === "SvelteKit") version = pkg?.dependencies?.["@sveltejs/kit"] || null;
  else if (bestFramework === "Nuxt") version = pkg?.dependencies?.["nuxt"] || pkg?.dependencies?.["nuxt3"] || null;
  else if (bestFramework === "React") version = pkg?.dependencies?.["react"] || null;

  return {
    name: bestFramework,
    confidence,
    evidence: frameworkEvidence,
    version,
    router,
    cssFramework,
    stateManagement: detectStateManagement(allDeps, files),
    language: fileNames.some(f => f.endsWith(".ts") || f.endsWith(".tsx") || f.includes("tsconfig.json")) ? "typescript" : "javascript",
  };
}

function detectStateManagement(deps: string[], files: Map<string, string>): string | null {
  const fileNames = Array.from(files.keys());
  
  if (deps.includes("zustand")) return "Zustand";
  if (deps.includes("@reduxjs/toolkit") || deps.includes("redux")) return "Redux";
  if (deps.includes("jotai")) return "Jotai";
  if (deps.includes("recoil")) return "Recoil";
  if (deps.includes("@tanstack/react-query")) return "React Query";
  
  // Check for Context API usage
  const hasContext = fileNames.some(f => {
    const content = files.get(f);
    return content?.includes("createContext") && content?.includes("useContext");
  });
  if (hasContext) return "Context API";

  return null;
}

export function extractDependencies(files: Map<string, string>): DependencyInfo[] {
  const pkgContent = findPackageJson(files);
  const pkg = safeParseJson(pkgContent);
  if (!pkg) return [];

  const deps: DependencyInfo[] = [];
  for (const [name, version] of Object.entries(pkg.dependencies || {})) {
    deps.push({ name, version: String(version), isDev: false });
  }
  for (const [name, version] of Object.entries(pkg.devDependencies || {})) {
    deps.push({ name, version: String(version), isDev: true });
  }
  return deps;
}

function findPackageJson(files: Map<string, string>): string | null {
  // Return the shallowest package.json
  const paths = Array.from(files.keys()).filter(f => f.endsWith("package.json"));
  if (paths.length === 0) return null;
  paths.sort((a, b) => a.split("/").length - b.split("/").length);
  return files.get(paths[0]) || null;
}

function safeParseJson(content: string | null): any {
  if (!content) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}
