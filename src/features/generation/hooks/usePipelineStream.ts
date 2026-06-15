import { useState, useCallback, useRef } from "react";
import type {
  PipelineEvent,
  PipelineStage,
  StageStatus,
  UserFacingError,
  PipelineSummary,
} from "../types/pipeline-events";

export interface StageState {
  stage: PipelineStage;
  status: StageStatus;
  message: string;
  userError?: UserFacingError;
}

export interface PipelineStreamState {
  isRunning: boolean;
  isComplete: boolean;
  stages: StageState[];
  activeStage: PipelineStage | null;
  globalError: UserFacingError | null;
  summary: PipelineSummary | null;
  elapsedSeconds: number;
  // Set by the deploy flow (Phase C) once the backend has a live URL.
  deployUrl: string | null;
}

const STAGE_ORDER: PipelineStage[] = [
  "ARCHITECT", "GENERATOR", "SECURITY", "STABILITY", "TEST_WRITER", "SDK", "DEPLOY",
];

const STAGE_LABELS: Record<PipelineStage, string> = {
  ARCHITECT: "Architect",
  GENERATOR: "Code Generator",
  SECURITY: "Security Scan",
  STABILITY: "Stability Check",
  TEST_WRITER: "Test Writer",
  SDK: "SDK Generator",
  DEPLOY: "Deploy",
};

const initialStages = (): StageState[] =>
  STAGE_ORDER.map((stage) => ({ stage, status: "pending" as StageStatus, message: "" }));

const initialState = (): PipelineStreamState => ({
  isRunning: false,
  isComplete: false,
  stages: initialStages(),
  activeStage: null,
  globalError: null,
  summary: null,
  elapsedSeconds: 0,
  deployUrl: null,
});

/**
 * Manages the SSE connection to /api/generate and folds the PipelineEvent
 * stream (Phase A contract) into renderable state for PipelineStatusPanel.
 */
export function usePipelineStream() {
  const [state, setState] = useState<PipelineStreamState>(initialState);

  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    const startTime = Date.now();
    timerRef.current = setInterval(() => {
      setState((s) => ({ ...s, elapsedSeconds: Math.floor((Date.now() - startTime) / 1000) }));
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const updateStage = useCallback((stage: PipelineStage, update: Partial<StageState>) => {
    setState((s) => ({
      ...s,
      activeStage: update.status === "running" ? stage : s.activeStage,
      stages: s.stages.map((st) => (st.stage === stage ? { ...st, ...update } : st)),
    }));
  }, []);

  /**
   * startGeneration — call this instead of fetch('/api/generate').
   * Errors never throw out of here; they land in state.globalError.
   */
  const startGeneration = useCallback(async (requestBody: Record<string, unknown>) => {
    setState({ ...initialState(), isRunning: true });
    startTimer();

    abortRef.current = new AbortController();

    const handleEvent = (event: PipelineEvent) => {
      switch (event.type) {
        case "stage_update":
          if (event.stage) {
            updateStage(event.stage, {
              status: event.status ?? "running",
              message: event.message,
              userError: event.userError,
            });
          }
          break;
        case "progress":
          if (event.stage) {
            updateStage(event.stage, { message: event.message });
          }
          break;
        case "complete":
          stopTimer();
          setState((s) => ({
            ...s,
            isRunning: false,
            isComplete: true,
            activeStage: null,
            summary: event.summary ?? null,
          }));
          break;
        case "error":
          stopTimer();
          setState((s) => ({
            ...s,
            isRunning: false,
            globalError: event.userError ?? {
              title: "Generation failed",
              explanation: event.message,
              action: "Try again.",
              recoverable: true,
              stage: s.activeStage ?? "GENERATOR",
            },
          }));
          break;
      }
    };

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: abortRef.current.signal,
      });

      if (!response.ok) {
        // Pre-stream failures (auth, rate limit, validation) return JSON.
        let serverMessage = `HTTP ${response.status}: ${response.statusText}`;
        try {
          const jsonErr = await response.json();
          if (jsonErr?.error) serverMessage = jsonErr.error;
        } catch { /* body wasn't JSON */ }
        throw new Error(serverMessage);
      }

      if (!response.body) {
        throw new Error("No response stream received");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? ""; // last incomplete chunk stays in buffer

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event: PipelineEvent = JSON.parse(line.slice(6));
            handleEvent(event);
          } catch {
            // Malformed SSE line — skip it
          }
        }
      }

      // Stream closed without a terminal event (server died mid-run) —
      // don't leave the panel spinning forever.
      stopTimer();
      setState((s) =>
        s.isRunning && !s.isComplete && !s.globalError
          ? {
              ...s,
              isRunning: false,
              globalError: {
                title: "Generation ended unexpectedly",
                explanation: "The server closed the connection before generation finished.",
                action: "Try again.",
                recoverable: true,
                stage: s.activeStage ?? "GENERATOR",
              },
            }
          : s
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") return; // User cancelled
      stopTimer();
      const message = err instanceof Error ? err.message : String(err);
      setState((s) => ({
        ...s,
        isRunning: false,
        globalError: {
          title: "Could not run generation",
          explanation: message,
          action: "Check your connection and try again.",
          recoverable: true,
          stage: s.activeStage ?? "GENERATOR",
        },
      }));
    }
  }, [startTimer, stopTimer, updateStage]);

  /**
   * Folds deploy-flow events (from /api/deploy/railway, consumed by
   * DeployButton) into the same stage state the generation stream uses,
   * so the DEPLOY card animates like every other stage.
   */
  const updateDeployStage = useCallback((event: PipelineEvent) => {
    if (event.stage === "DEPLOY") {
      updateStage("DEPLOY", {
        status: event.status ?? "running",
        message: event.message,
        userError: event.userError,
      });
    }
    if (event.deployUrl) {
      setState((s) => ({ ...s, deployUrl: event.deployUrl ?? s.deployUrl }));
    }
  }, [updateStage]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    stopTimer();
    setState((s) => ({ ...s, isRunning: false }));
  }, [stopTimer]);

  const reset = useCallback(() => {
    stopTimer();
    setState(initialState());
  }, [stopTimer]);

  return { state, startGeneration, cancel, reset, updateDeployStage, STAGE_LABELS };
}
