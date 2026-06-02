import { BackendBlueprint } from "@/features/architecture/types";

export interface ValidationIssue {
  component: string;
  message: string;
  severity: "critical" | "warning";
}

/**
 * Runtime Validation Engine
 * Validates the generated project structure and integrity.
 */
export class RuntimeValidationEngine {
  public static validate(
    blueprint: BackendBlueprint,
    files: Record<string, string>
  ): { score: number; issues: ValidationIssue[] } {
    const issues: ValidationIssue[] = [];

    // 1. Module Integrity
    blueprint.modules.forEach(mod => {
      const folder = `src/modules/${mod.name.toLowerCase().replace('module', '')}`;
      const moduleFile = `${folder}/${mod.name.toLowerCase()}.module.ts`;
      
      if (!files[moduleFile]) {
        issues.push({ component: "Module", message: `Missing module file: ${moduleFile}`, severity: "critical" });
      }

      // Check controller registration (simplified check by content)
      if (files[moduleFile] && !files[moduleFile].includes('controllers:')) {
         issues.push({ component: "Module", message: `Module ${mod.name} has no controllers registered`, severity: "warning" });
      }
    });

    // 2. Dependency Integrity
    if (!files["package.json"]) {
      issues.push({ component: "Package", message: "Missing package.json", severity: "critical" });
    }

    // 3. Infrastructure Integrity
    if (!files["src/infra/database.module.ts"]) {
      issues.push({ component: "Infra", message: "Missing database module", severity: "critical" });
    }
    if (!files["src/infra/auth.module.ts"]) {
      issues.push({ component: "Infra", message: "Missing auth module", severity: "critical" });
    }

    // 4. Environment Integrity
    if (!files[".env.example"]) {
      issues.push({ component: "Env", message: "Missing .env.example", severity: "warning" });
    }

    // Calculate score
    const criticalCount = issues.filter(i => i.severity === "critical").length;
    const warningCount = issues.filter(i => i.severity === "warning").length;
    
    let score = 100 - (criticalCount * 25) - (warningCount * 5);
    score = Math.max(0, score);

    return { score, issues };
  }
}
