export interface SystemPromptMetadata {
  version: string;
  tool: string;
  schema: string;
  promptHash: string;
}

export interface SystemPrompt {
  raw: string;
  content: string;
  metadata: SystemPromptMetadata;
  filename: string;
}

// Memory cache to prevent repeated reads or network fetches
const promptCache: Record<string, SystemPrompt> = {};

// Helper to load 'fs' dynamically only on the server
const getFs = () => {
  if (typeof window === "undefined") {
    try {
      return eval('require("fs/promises")');
    } catch {
      try {
        return eval('require("fs")').promises;
      } catch {
        return null;
      }
    }
  }
  return null;
};

// Helper to load 'path' dynamically only on the server
const getPath = () => {
  if (typeof window === "undefined") {
    try {
      return eval('require("path")');
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * Computes a simple, client-safe, deterministic hash of the prompt content for fingerprinting.
 */
export function computeHash(content: string): string {
  let hash = 5381;
  const normalized = content.replace(/\r\n/g, "\n").trim();
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash * 33) ^ normalized.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).substring(0, 8);
}

/**
 * Parses raw prompt contents and extracts metadata frontmatter if present.
 */
export function parseRawPrompt(raw: string, filename: string): SystemPrompt {
  let content = raw;
  const metadata: SystemPromptMetadata = {
    version: "1.0",
    tool: "unknown",
    schema: "simplicit-context-v1",
    promptHash: computeHash(raw)
  };

  const fmMatch = raw.match(/^---\r?\n([\s\S]+?)\r?\n---\r?\n([\s\S]*)$/);
  if (fmMatch) {
    const fmText = fmMatch[1];
    content = fmMatch[2];
    
    const lines = fmText.split("\n");
    for (const line of lines) {
      const parts = line.split(":");
      if (parts.length >= 2) {
        const key = parts[0].trim().toLowerCase();
        const val = parts.slice(1).join(":").trim();
        if (key === "version") metadata.version = val;
        else if (key === "tool") metadata.tool = val;
        else if (key === "schema") metadata.schema = val;
      }
    }
  }

  return {
    raw,
    content,
    metadata,
    filename
  };
}

/**
 * Normalizes a tool name or ID to a standard file key.
 */
export function normalizeToolName(tool: string): string {
  const t = tool.toLowerCase().replace(/[^a-z0-9]/g, "").trim();
  if (t.includes("claude")) return "claude";
  if (t.includes("cursor")) return "cursor";
  if (t.includes("lovable")) return "lovable";
  if (t.includes("bolt")) return "bolt";
  if (t.includes("v0")) return "v0";
  if (t.includes("windsurf")) return "windsurf";
  return "generic";
}

/**
 * Asynchronously loads a system prompt by tool name.
 * Caches loaded prompts, resolves paths server-side, fallbacks to generic.md, and fetches from /api/prompts client-side.
 */
export async function getSystemPrompt(tool: string): Promise<SystemPrompt> {
  const normalizedTool = normalizeToolName(tool);
  
  if (promptCache[normalizedTool]) {
    return promptCache[normalizedTool];
  }

  let rawContent = "";
  let filename = `${normalizedTool}.md`;

  if (typeof window === "undefined") {
    const fs = getFs();
    const path = getPath();
    
    if (fs && path) {
      const cwd = typeof process !== "undefined" && process.cwd ? process.cwd() : "";
      const searchPath = path.join(cwd, "system-prompts", filename);
      
      try {
        rawContent = await fs.readFile(searchPath, "utf-8");
      } catch (err) {
        // Fallback to generic.md on server side
        try {
          const fallbackPath = path.join(cwd, "system-prompts", "generic.md");
          rawContent = await fs.readFile(fallbackPath, "utf-8");
          filename = "generic.md";
        } catch (fallbackErr) {
          throw new Error(`Critical: Prompt files missing in registry. Tried ${searchPath} and generic.md.`);
        }
      }
    } else {
      throw new Error("Server-side fs/path modules are unavailable.");
    }
  } else {
    // Client-side: fetch from Next.js API Endpoint
    try {
      const response = await fetch(`/api/prompts?tool=${encodeURIComponent(normalizedTool)}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch prompt from API: ${response.statusText}`);
      }
      const promptObj = await response.json();
      promptCache[normalizedTool] = promptObj;
      return promptObj;
    } catch (err) {
      console.error("Client-side prompt fetch error, fallback in use:", err);
      throw err;
    }
  }

  const prompt = parseRawPrompt(rawContent, filename);
  promptCache[normalizedTool] = prompt;
  return prompt;
}
