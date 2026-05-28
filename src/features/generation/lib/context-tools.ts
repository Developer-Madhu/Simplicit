export interface ContextTool {
  id: string;
  name: string;
  description: string;
  qualityScore: number;
  recommended?: boolean;
}

export const CONTEXT_TOOLS: ContextTool[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    description: "Copy this prompt into Claude Code. Claude will generate a simplicit.context.md file describing your project. Upload that file back into Simplicit for improved backend generation.",
    qualityScore: 5,
    recommended: true
  },
  {
    id: "cursor",
    name: "Cursor",
    description: "Optimized for Cursor's Composer and codebase indexing. Generates a complete project specification.",
    qualityScore: 5,
    recommended: true
  },
  {
    id: "lovable",
    name: "Lovable",
    description: "Optimized for projects built with Lovable/GPT-Engineer. Focuses on full-stack semantic mapping.",
    qualityScore: 4
  },
  {
    id: "bolt",
    name: "Bolt",
    description: "Optimized for Bolt.new applications. Captures modern full-stack requirements.",
    qualityScore: 4
  },
  {
    id: "v0",
    name: "v0",
    description: "Component-centric prompt for v0.dev. Helps reconstruct architecture from UI components.",
    qualityScore: 3
  },
  {
    id: "windsurf",
    name: "Windsurf",
    description: "Optimized for Windsurf's context-aware coding environment.",
    qualityScore: 5
  },
  {
    id: "replit",
    name: "Replit Agent",
    description: "Optimized for Replit Agent's autonomous project building.",
    qualityScore: 4
  },
  {
    id: "custom",
    name: "Custom Frontend",
    description: "Generic prompt for hand-written React/Next.js or existing internal projects.",
    qualityScore: 3
  }
];
