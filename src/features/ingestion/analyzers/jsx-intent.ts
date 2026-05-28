import type { ComponentIntent } from "../types";

export interface IntentScanResult {
  intent: ComponentIntent;
  detectedForms: string[];
}

export function analyzeJsxIntent(files: Map<string, string>): IntentScanResult {
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

  for (const [path, content] of files) {
    if (!/\.(tsx|jsx|vue|svelte)$/.test(path)) continue;

    const lowerPath = path.toLowerCase();
    const filename = path.split("/").pop() || "";
    const lowerFilename = filename.toLowerCase();
    
    // Quick heuristic: remove whitespace and lower case the content
    const normalizedContent = content.replace(/\s+/g, " ").toLowerCase();

    // 1. Forms (Look for hooks and component patterns)
    const formSignals = [
      "<form", "useform", "formik", "react-hook-form", "zodresolver", "yupresolver",
      "submit", "onsubmit", "input", "textarea", "select"
    ];
    const formScore = formSignals.filter(s => normalizedContent.includes(s.toLowerCase())).length;
    if (formScore >= 3 || normalizedContent.includes("useform")) {
      intent.hasForms = true;
      const formName = filename.replace(/\.[^.]+$/, "");
      if (lowerFilename.includes("form") || lowerFilename.includes("modal") || lowerFilename.includes("dialog")) {
        detectedForms.push(formName);
      }
    }

    // 2. Dashboards (Path + Content signal)
    if (lowerPath.includes("/dashboard") || lowerFilename.includes("dashboard") || lowerFilename.includes("overview")) {
      if (normalizedContent.includes("sidebar") || normalizedContent.includes("layout") || normalizedContent.includes("chart")) {
        intent.hasDashboards = true;
      }
    }

    // 3. Data Tables (Grid and Table components)
    const tableSignals = ["<table", "datatable", "ag-grid", "tanstack-table", "react-table", "column", "sorting", "pagination"];
    if (tableSignals.some(s => normalizedContent.includes(s.toLowerCase())) || lowerFilename.includes("table") || lowerFilename.includes("list")) {
      intent.hasDataTables = true;
    }

    // 4. Auth Screens
    const authSignals = ["login", "signup", "signin", "register", "password", "forgot", "logout", "auth"];
    if (authSignals.some(s => lowerFilename.includes(s)) || (lowerPath.includes("/auth") && normalizedContent.includes("form"))) {
      intent.hasAuthScreens = true;
    }

    // 5. Analytics
    const analyticsSignals = ["chart", "graph", "metric", "stat", "analytics", "recharts", "highcharts", "apexcharts", "plot"];
    if (analyticsSignals.some(s => normalizedContent.includes(s.toLowerCase())) || lowerPath.includes("/analytics")) {
      intent.hasAnalytics = true;
    }

    // 6. Uploads
    if (normalizedContent.includes("type=\"file\"") || normalizedContent.includes("type='file'") || normalizedContent.includes("dropzone") || lowerFilename.includes("upload")) {
      intent.hasUploads = true;
    }

    // 7. Settings
    if (lowerPath.includes("/settings") || lowerFilename.includes("settings") || lowerFilename.includes("preferences") || lowerFilename.includes("profile")) {
      intent.hasSettings = true;
    }

    // 8. Onboarding
    const onboardingSignals = ["onboarding", "setup", "wizard", "stepper", "welcome", "tour"];
    if (onboardingSignals.some(s => lowerPath.includes(s) || lowerFilename.includes(s))) {
      intent.hasOnboarding = true;
    }

    // 9. Management / Admin
    if (lowerPath.includes("/admin") || lowerPath.includes("/manage") || lowerFilename.includes("admin") || lowerFilename.includes("management")) {
      if (normalizedContent.includes("user") || normalizedContent.includes("permission") || normalizedContent.includes("config")) {
        intent.hasManagement = true;
      }
    }
  }

  return {
    intent,
    detectedForms: Array.from(new Set(detectedForms)).slice(0, 10),
  };
}
