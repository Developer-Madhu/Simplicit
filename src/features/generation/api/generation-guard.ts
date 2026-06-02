import { BackendBlueprint } from "@/features/architecture/types";

/**
 * Generation Guard
 * Performs a final pre-flight check on the approved blueprint.
 * Blocks generation if critical metadata is missing.
 */
export class GenerationGuard {
  public static validate(blueprint: BackendBlueprint): string[] {
    const errors: string[] = [];

    // 1. Structural Validation
    if (!blueprint.entities || blueprint.entities.length === 0) {
      errors.push("No entities found in blueprint. Backend requires at least one domain entity.");
    }

    // 2. Metadata Integrity
    blueprint.entities.forEach(entity => {
        if (!entity.fields || entity.fields.length === 0) {
            errors.push(`Entity '${entity.name}' has no fields defined.`);
        }
        if (!entity.tableName) {
            errors.push(`Entity '${entity.name}' is missing a database table name.`);
        }
    });

    // 3. Infrastructure Readiness
    if (!blueprint.infrastructure.database.provider || blueprint.infrastructure.database.provider === "Unknown") {
        errors.push("Database infrastructure provider is not selected.");
    }

    // 4. Readiness Gate (Bypassed as per user request)
    /*
    if (blueprint.readinessScore < 60) {
        errors.push(`Architecture readiness score is too low (${blueprint.readinessScore}%). Please resolve more gaps.`);
    }
    */

    // 5. Capability-Entity Synchronization
    blueprint.capabilities.forEach(cap => {
        if (cap.status === "INVALID") {
            errors.push(`Invalid business capability detected: ${cap.name}`);
        }
    });

    return errors;
  }
}
