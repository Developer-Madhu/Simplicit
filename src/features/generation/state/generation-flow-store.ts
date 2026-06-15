import type { IngestionResult, ClarificationQuestion } from "@/features/ingestion/types";

/**
 * In-memory handoff between the workspace (upload + CodeGraph analysis) and
 * the IDE (`/generations/{id}?flow=new`), keyed by project id.
 *
 * The full IngestionResult cannot be serialized through navigation — keyFiles
 * is a Map of up to 200 source files and astGraph is the raw Tree-sitter
 * output; serializeIngestionResult intentionally drops both. A module
 * singleton survives client-side route changes, which is all the wizard
 * needs. Lost on hard refresh — that is the documented degradation: the IDE
 * redirects back to /workspace when `flow=new` has no matching state.
 */
export interface GenerationFlowState {
  /** Absent for the prompt-only flow (no upload) — the IDE skips the wizard
   *  and generates directly from the prompt (AI-driven pipeline branch). */
  ingestionResult?: IngestionResult;
  prompt: string;
  stack: string;
  /** Wizard answers accumulated so far (clarification + domain questions). */
  answers: Record<string, string | string[]>;
  clarificationQuestions: ClarificationQuestion[];
  createdAt: number;
}

const flowStateMap = new Map<string, GenerationFlowState>();

export function setFlowState(projectId: string, state: GenerationFlowState): void {
  flowStateMap.set(projectId, state);
}

export function getFlowState(projectId: string): GenerationFlowState | undefined {
  return flowStateMap.get(projectId);
}

export function clearFlowState(projectId: string): void {
  flowStateMap.delete(projectId);
}

export function hasFlowState(projectId: string): boolean {
  return flowStateMap.has(projectId);
}
