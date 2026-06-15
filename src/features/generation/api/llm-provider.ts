export type LLMProvider = "anthropic" | "nvidia";

export type AgentName = "generator" | "security" | "test-writer";

const AGENT_ENV_VARS: Record<AgentName, string> = {
  generator: "SERVICE_LOGIC_PROVIDER",
  security: "SECURITY_PROVIDER",
  "test-writer": "TEST_WRITER_PROVIDER",
};

/**
 * Resolves which LLM provider an agent should use, per the priority cascade:
 * 1. Agent-specific override (if set AND that provider's key exists)
 * 2. ANTHROPIC_API_KEY if present (preferred default — best quality)
 * 3. NVIDIA_API_KEY if present
 * 4. throws — pipeline cannot run with neither key
 *
 * This keeps the upgrade path zero-config: a user with only NVIDIA_API_KEY runs
 * every agent on NVIDIA; adding ANTHROPIC_API_KEY later flips them all to
 * Anthropic automatically, no other env changes needed.
 */
export function resolveProvider(agent: AgentName): LLMProvider {
  const override = process.env[AGENT_ENV_VARS[agent]] as LLMProvider | undefined;
  if (override === "anthropic" && process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (override === "nvidia" && process.env.NVIDIA_API_KEY) return "nvidia";

  if (process.env.ANTHROPIC_API_KEY) return "anthropic";
  if (process.env.NVIDIA_API_KEY) return "nvidia";

  throw new Error("KeyMissingError: Neither ANTHROPIC_API_KEY nor NVIDIA_API_KEY is configured.");
}

/** True if at least one provider key exists — used for the pipeline's startup gate. */
export function hasAnyProvider(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY || process.env.NVIDIA_API_KEY);
}
