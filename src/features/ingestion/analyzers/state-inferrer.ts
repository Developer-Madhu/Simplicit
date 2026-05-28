import type { StateAnalysis } from "../types";

export function analyzeStateManagement(files: Map<string, string>, dependencies: any[]): StateAnalysis {
  const libraries: string[] = [];
  const depNames = dependencies.map(d => d.name);

  if (depNames.includes("@tanstack/react-query") || depNames.includes("swr") || depNames.includes("@apollo/client")) {
    libraries.push("Async Data Synchronization");
  }
  if (depNames.includes("zustand") || depNames.includes("redux") || depNames.includes("@reduxjs/toolkit") || depNames.includes("jotai") || depNames.includes("recoil")) {
    libraries.push("Global Client State");
  }
  if (depNames.includes("react-hook-form") || depNames.includes("formik")) {
    libraries.push("Form State Management");
  }

  let cachingRequired = false;
  let realtimeRequired = false;
  let optimisticUpdates = false;

  for (const content of files.values()) {
    const lower = content.toLowerCase();
    if (lower.includes("usequery") || lower.includes("usemutation") || lower.includes("swr") || lower.includes("useapollo")) {
      cachingRequired = true;
    }
    if (lower.includes("onmutate") || lower.includes("optimistic") || lower.includes("rollback")) {
      optimisticUpdates = true;
    }
    if (lower.includes("socket") || lower.includes("pusher") || lower.includes("realtime") || lower.includes("supabase.channel") || lower.includes("onmessage")) {
      realtimeRequired = true;
    }
  }

  return {
    libraries,
    cachingRequired,
    realtimeRequired,
    optimisticUpdates
  };
}
