import { BackendBlueprint } from "@/features/architecture/types";
import { RuntimeValidationEngine, ValidationIssue } from "./runtime-validation-engine";

export interface ExportResult {
  files: Record<string, string>;
  readinessScore: number;
  issues: ValidationIssue[];
  isExportable: boolean;
}

/**
 * Project Exporter
 * Final assembly and validation of the generated project.
 */
export class ProjectExporter {
  public static prepare(
    blueprint: BackendBlueprint,
    files: Record<string, string>
  ): ExportResult {
    // 1. Run Validation
    const validation = RuntimeValidationEngine.validate(blueprint, files);
    
    // 2. Add Export Metadata
    const result: ExportResult = {
      files,
      readinessScore: validation.score,
      issues: validation.issues,
      isExportable: validation.score >= 90
    };

    return result;
  }
}
