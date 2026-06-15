// ─── Types ──────────────────────────────────────────────────────────
export type {
  IngestionMode,
  IngestionState,
  IngestionResult,
  SerializableIngestionResult,
  ProjectContext,
  FrameworkInfo,
  DetectedRoute,
  ProjectMetadata,
  DependencyInfo,
  ClarificationQuestion,
  QuestionOption,
} from "./types";

export { serializeIngestionResult } from "./types";

// ─── Analyzers ──────────────────────────────────────────────────────
export { analyzeProject } from "./analyzers";
export { generateClarificationQuestions } from "./analyzers/question-generator";

// ─── Providers ──────────────────────────────────────────────────────
export { processZipFile } from "./providers/zip-provider";
export type { ZipProcessProgress } from "./providers/zip-provider";

// ─── Components ─────────────────────────────────────────────────────
export { IngestionPanel } from "./components/ingestion-panel";
export { AnalysisSummary } from "./components/analysis-summary";
export { ClarificationQuestions } from "./components/clarification-questions";
