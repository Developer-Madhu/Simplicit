import type { SerializableIngestionResult } from "@/features/ingestion/types";

export type GeneratorTool = "Standard" | "Cursor" | "ClaudeCode" | "Bolt" | "Lovable" | "v0";

export interface PromptVariant {
  tool: GeneratorTool;
  label: string;
  description: string;
  generate: (context: SerializableIngestionResult) => string;
}

const standardVariant: PromptVariant = {
  tool: "Standard",
  label: "Simplicit Standard",
  description: "Comprehensive architectural prompt for any LLM.",
  generate: (context) => {
    // Current generation logic will be moved here in future sprints
    return `Project: ${context.metadata.name}\nDescription: ${context.metadata.description}`;
  }
};

export const PROMPT_VARIANTS: Record<GeneratorTool, PromptVariant> = {
  Standard: standardVariant,
  Cursor: {
    tool: "Cursor",
    label: "Cursor Rules",
    description: "Optimized for .cursorrules and Cursor Compose.",
    generate: (ctx) => `[CURSOR] ${ctx.metadata.name}`
  },
  ClaudeCode: {
    tool: "ClaudeCode",
    label: "Claude Code",
    description: "Tailored for Claude Code's project analysis capabilities.",
    generate: (ctx) => `[CLAUDE] ${ctx.metadata.name}`
  },
  Bolt: {
    tool: "Bolt",
    label: "Bolt.new",
    description: "Direct-to-implementation prompt for Bolt.",
    generate: (ctx) => `[BOLT] ${ctx.metadata.name}`
  },
  Lovable: {
    tool: "Lovable",
    label: "Lovable",
    description: "Optimized for Lovable's full-stack workflows.",
    generate: (ctx) => `[LOVABLE] ${ctx.metadata.name}`
  },
  "v0": {
    tool: "v0",
    label: "v0",
    description: "Component-centric prompts for v0.",
    generate: (ctx) => `[V0] ${ctx.metadata.name}`
  }
};

export function getPromptForTool(tool: GeneratorTool, context: SerializableIngestionResult): string {
  const variant = PROMPT_VARIANTS[tool] || standardVariant;
  return variant.generate(context);
}
