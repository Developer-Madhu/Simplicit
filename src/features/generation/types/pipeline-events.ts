// Single source of truth for the event contract between the generation
// pipeline (server) and the workspace UI (client). Events are streamed over
// SSE by /api/generate as the pipeline runs.

// The 7 stages of the pipeline. DEPLOY is emitted by the deploy flow, not GenerationPipeline.
export type PipelineStage =
  | "ARCHITECT"
  | "GENERATOR"
  | "SECURITY"
  | "STABILITY"
  | "TEST_WRITER"
  | "SDK"
  | "DEPLOY";

export type StageStatus = "pending" | "running" | "done" | "error" | "skipped";

export interface PipelineEvent {
  type: "stage_update" | "progress" | "complete" | "error" | "deploy_update";
  stage?: PipelineStage;
  status?: StageStatus;
  // Human-readable, shown directly in the UI. Plain English. No stack traces.
  message: string;
  // Only on type:'error' — the user-facing explanation of what went wrong and what to do
  userError?: UserFacingError;
  // Only on type:'complete' — summary of the run
  summary?: PipelineSummary;
  // Only on type:'deploy_update'
  deployUrl?: string;
  timestamp: number; // Date.now()
}

export interface UserFacingError {
  title: string; // Short: "Security scan failed"
  explanation: string; // Plain English: what happened
  action: string; // What the user should do next
  recoverable: boolean; // Can they retry without changing anything?
  stage: PipelineStage;
  // Optional: technical detail for users who want it (shown in a collapsed section)
  technicalDetail?: string;
}

export interface PipelineSummary {
  totalFiles: number;
  modulesGenerated: number;
  testFilesGenerated: number;
  securityIssuesFound: number;
  securityIssuesFixed: number;
  sdkFilesGenerated: boolean;
  durationMs: number;
}

// Helper: serialize a PipelineEvent to an SSE line
export function toSSELine(event: PipelineEvent): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}
