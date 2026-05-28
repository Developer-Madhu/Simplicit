import type { InferredAPI, ConfidenceLevel } from "../types";

export function inferApiExpectations(files: Map<string, string>): InferredAPI[] {
  const apis: InferredAPI[] = [];
  const fetchRegex = /fetch\(['"`](.*?)['"`]/g;
  const axiosRegex = /axios\.(get|post|put|patch|delete)\(['"`](.*?)['"`]/g;
  const useQueryRegex = /useQuery\(\{[\s\S]*?queryKey:[\s\S]*?\['(.*?)'\][\s\S]*?\}\)/g; // Simple heuristic

  for (const [path, content] of files) {
    if (!/\.(ts|tsx|js|jsx)$/.test(path)) continue;

    // 1. Find explicit fetch calls
    let match;
    while ((match = fetchRegex.exec(content)) !== null) {
      const url = match[1];
      if (url.startsWith("http") || url.startsWith("/")) {
        apis.push({
          method: content.substring(match.index, match.index + 50).toUpperCase().includes("POST") ? "POST" : "GET", // Rough guess
          path: url.split("?")[0], // Remove query params
          purpose: inferPurpose(url, path),
          confidence: "Partial evidence",
        });
      }
    }

    // 2. Find axios calls
    while ((match = axiosRegex.exec(content)) !== null) {
      const method = match[1].toUpperCase() as any;
      const url = match[2];
      if (url.startsWith("http") || url.startsWith("/")) {
        apis.push({
          method,
          path: url.split("?")[0],
          purpose: inferPurpose(url, path),
          confidence: "Strong evidence",
        });
      }
    }
  }

  // Deduplicate by path + method
  const uniqueApis = new Map<string, InferredAPI>();
  for (const api of apis) {
    const key = `${api.method}:${api.path}`;
    // Simple deduplication
    if (!uniqueApis.has(key) || api.confidence === "Strong evidence") {
      uniqueApis.set(key, api);
    }
  }

  return Array.from(uniqueApis.values()).sort((a, b) => a.path.localeCompare(b.path));
}

function inferPurpose(url: string, sourcePath: string): string {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl.includes("login") || lowerUrl.includes("signin")) return "Authenticate user";
  if (lowerUrl.includes("user") || lowerUrl.includes("profile")) return "Fetch user data";
  if (lowerUrl.includes("stripe") || lowerUrl.includes("checkout")) return "Process payment";
  if (lowerUrl.includes("upload") || lowerUrl.includes("file")) return "Handle file upload";
  
  const endpoint = url.split("/").pop();
  if (endpoint && endpoint.length > 2) {
    return `Interact with ${endpoint.replace(/[-_]/g, " ")} data`;
  }
  
  return "Data interaction";
}
