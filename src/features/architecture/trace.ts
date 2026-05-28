import * as fs from "fs";
import * as path from "path";

export interface EntityTrace {
  entity: string;
  stage: string;
  score: number;
  sources: string[];
  qualificationPassed: boolean;
  rejectionReason: string;
  timestamp: string;
}

const REPORT_PATH = path.resolve(process.cwd(), "entity-trace-report.json");

/**
 * Reset the trace report file
 */
export function resetTraceReport(): void {
  try {
    fs.writeFileSync(REPORT_PATH, JSON.stringify([], null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to reset trace report:", err);
  }
}

/**
 * Trace an entity candidate at a specific stage
 */
export function traceEntity(
  entity: string,
  stage: string,
  data: {
    score: number;
    sources: string[];
    qualificationPassed: boolean;
    rejectionReason: string;
  }
): void {
  try {
    let traces: EntityTrace[] = [];
    if (fs.existsSync(REPORT_PATH)) {
      try {
        const content = fs.readFileSync(REPORT_PATH, "utf-8");
        traces = JSON.parse(content);
      } catch {
        traces = [];
      }
    }

    traces.push({
      entity,
      stage,
      score: data.score,
      sources: data.sources,
      qualificationPassed: data.qualificationPassed,
      rejectionReason: data.rejectionReason,
      timestamp: new Date().toISOString()
    });

    fs.writeFileSync(REPORT_PATH, JSON.stringify(traces, null, 2), "utf-8");
  } catch (err) {
    console.error(`Failed to trace entity ${entity} at stage ${stage}:`, err);
  }
}
