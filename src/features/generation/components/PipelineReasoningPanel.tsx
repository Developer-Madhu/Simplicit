import type { StageState } from "../hooks/usePipelineStream";
import type { PipelineStage } from "../types/pipeline-events";

const STAGE_LABELS: Record<string, string> = {
  ARCHITECT: "Designing architecture",
  GENERATOR: "Writing services & controllers",
  SECURITY: "Running security scan",
  STABILITY: "Type-checking output",
  TEST_WRITER: "Generating tests",
  SDK: "Building API client",
};

interface PipelineReasoningPanelProps {
  stages: StageState[];
  activeStage: PipelineStage | null;
  elapsedSeconds: number;
}

export function PipelineReasoningPanel({ stages, elapsedSeconds }: PipelineReasoningPanelProps) {
  const pipelineStages = stages.filter((s) => s.stage !== "DEPLOY");

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100%",
        padding: "40px 32px",
        fontFamily: "var(--sf-font-sans)",
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "40px", maxWidth: "480px" }}>
        <h2
          style={{
            fontSize: "22px",
            fontWeight: 500,
            marginBottom: "8px",
            color: "var(--sf-text, #e5e5e5)",
          }}
        >
          Building your backend
        </h2>
        <p style={{ fontSize: "13px", opacity: 0.5, lineHeight: 1.6 }}>
          Each step is reasoned and verified before the next begins.
          {elapsedSeconds > 0 && <span style={{ marginLeft: "6px" }}>{elapsedSeconds}s elapsed</span>}
        </p>
      </div>

      {/* Stage checklist */}
      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        {pipelineStages.map((s) => {
          const isDone = s.status === "done";
          const isRunning = s.status === "running";
          const isError = s.status === "error";
          const isPending = s.status === "pending";

          return (
            <div
              key={s.stage}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "10px 14px",
                borderRadius: "8px",
                background: isRunning ? "var(--sf-surface-2, rgba(255,255,255,0.04))" : "transparent",
                transition: "background 0.2s",
              }}
            >
              {/* Status indicator */}
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "11px",
                  color: "#fff",
                  background: isDone
                    ? "var(--sf-accent, #6366f1)"
                    : isError
                    ? "var(--sf-error, #ef4444)"
                    : "transparent",
                  border: isRunning
                    ? "2px solid var(--sf-accent, #6366f1)"
                    : isPending
                    ? "1.5px solid var(--sf-border, #444)"
                    : "none",
                  animation: isRunning ? "sf-skeleton-pulse 1.5s ease-in-out infinite" : "none",
                }}
              >
                {isDone && "✓"}
                {isError && "✕"}
              </div>

              {/* Label + message */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: isRunning ? 500 : 400,
                    color: isPending ? "var(--sf-text-dim, #666)" : "var(--sf-text, #e5e5e5)",
                    lineHeight: 1.3,
                  }}
                >
                  {STAGE_LABELS[s.stage] ?? s.stage}
                </div>
                {isRunning && s.message && (
                  <div
                    style={{
                      fontSize: "11px",
                      opacity: 0.5,
                      marginTop: "2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {s.message}
                  </div>
                )}
              </div>

              {/* Running label */}
              {isRunning && <span style={{ fontSize: "10px", opacity: 0.5, flexShrink: 0 }}>running</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
