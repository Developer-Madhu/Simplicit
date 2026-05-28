import type { InferredEntity, ConfidenceLevel } from "../types";

/**
 * Priority 1 & 4: Refined Semantic Entity Inference.
 * Implements strict signal filtering to separate implementation noise
 * from business architecture meaning.
 */

// Implementation-level words to strictly ignore (Priority 1)
const IMPLEMENTATION_NOISE = new Set([
  "set", "use", "handle", "toggle", "is", "has", "on", "click", "change",
  "state", "effect", "ref", "context", "callback", "memo", "hook",
  "provider", "wrapper", "container", "layout", "page", "component",
  "style", "theme", "props", "params", "query", "mutation", "fetch",
  "axios", "api", "route", "nav", "item", "list", "row", "cell", "data",
  "value", "key", "index", "loading", "error", "success", "fail",
  "open", "close", "show", "hide", "submit", "reset", "clear",
  "add", "remove", "delete", "edit", "update", "create", "save",
]);

export function inferEntities(
  files: Map<string, string>,
  routes: string[]
): InferredEntity[] {
  const entityMap = new Map<string, InferredEntity & { _rawScore: number }>();

  const addOrUpdateEntity = (name: string, scoreBoost: number, hint: string) => {
    const cleanName = name.toLowerCase().trim();
    
    // Priority 9: Semantic Validation Safeguard
    if (cleanName.length <= 2) return;
    if (IMPLEMENTATION_NOISE.has(cleanName)) return;
    if (/^\d+$/.test(cleanName)) return; // No numbers

    const existing = entityMap.get(cleanName);
    if (existing) {
      existing._rawScore = Math.min(100, existing._rawScore + scoreBoost);
      if (!existing.hints.includes(hint)) existing.hints.push(hint);
    } else {
      entityMap.set(cleanName, {
        name: cleanName,
        _rawScore: scoreBoost,
        confidence: "Heuristic inference",
        hints: [hint]      });
    }
  };

  // 1. Infer from route paths (Strongest architectural signal)
  for (const route of routes) {
    // Only look at paths that aren't obviously implementation or system
    const segments = route.split("/").filter(s => 
      s && !s.startsWith("[") && !s.startsWith(":") && !s.startsWith("(") && s !== "api"
    );
    
    for (const segment of segments) {
      const singular = singularize(segment);
      addOrUpdateEntity(singular, 40, `Core domain identified in route: ${route}`);
    }
  }

  // 2. Infer from Data Structures & Contracts (Priority 4)
  for (const [path, content] of files) {
    if (!/\.(tsx|jsx|ts|js)$/.test(path)) continue;

    // Look for Interface/Type definitions (Strong business signal)
    const typeMatches = content.match(/(interface|type)\s+([A-Z]\w+)/g);
    if (typeMatches) {
      for (const m of typeMatches) {
        const name = m.split(/\s+/)[1];
        addOrUpdateEntity(singularize(name), 15, `Data contract detected: ${name}`);
      }
    }

    // Look for Form naming (Priority 5)
    const formMatch = content.match(/([A-Z]\w+)(Form|Schema|Validation)/g);
    if (formMatch) {
      for (const m of formMatch) {
        const entity = m.replace(/(Form|Schema|Validation)/, "");
        addOrUpdateEntity(singularize(entity), 30, `Business input system detected: ${m}`);
      }
    }

    // Look for API contract naming
    const apiMatch = content.match(/\/api\/([a-zA-Z]\w+)/g);
    if (apiMatch) {
      for (const m of apiMatch) {
        const entity = m.replace("/api/", "");
        addOrUpdateEntity(singularize(entity), 25, `Backend dependency inferred: ${m}`);
      }
    }
  }

  // Map scores to calibrated ConfidenceLevel strings (Priority 9)
  const results = Array.from(entityMap.values())
    // Priority 2: Semantic Signal Consensus (require multiple signals or very high score)
    .filter(e => e.hints.length >= 2 || e._rawScore >= 50)
    .map(e => {
      let conf: ConfidenceLevel = "Heuristic inference";
      if (e.hints.length >= 3 || e._rawScore >= 80) conf = "Strong evidence";
      else if (e.hints.length === 2) conf = "Multi-source confirmation";
      else if (e._rawScore >= 60) conf = "Partial evidence";
      else conf = "Heuristic inference";
      
      return {
        name: e.name,
        confidence: conf,
        hints: e.hints
      };
    });

  // Fallback
  if (results.length === 0) {
    results.push({ name: "user", confidence: "Partial evidence", hints: ["Fundamental application requirement"] });
  }

  const confWeight: Record<ConfidenceLevel, number> = {
    "Deterministic": 5,
    "Strong evidence": 4,
    "Multi-source confirmation": 3,
    "Partial evidence": 2,
    "Heuristic inference": 1,
  };
  
  return results.sort((a, b) => confWeight[b.confidence] - confWeight[a.confidence]);
}

function singularize(word: string): string {
  const lower = word.toLowerCase();
  if (lower.endsWith("ies")) return lower.slice(0, -3) + "y";
  if (lower.endsWith("es")) {
    if (lower.endsWith("sses")) return lower.slice(0, -2);
    return lower.slice(0, -2);
  }
  if (lower.endsWith("s") && !lower.endsWith("ss")) return lower.slice(0, -1);
  return lower;
}
