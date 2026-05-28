import { DomainGraph } from "../domain-intelligence-types";

export class BlueprintConsistencyValidator {
  /**
   * Phase 3: Blueprint Preservation Layer
   * Synthesis must be serialization only. Mismatches block generation.
   */
  public validate(graph: DomainGraph, blueprint: any): { isValid: boolean, errors: string[] } {
    const errors: string[] = [];

    // 1. Entity count match
    if (graph.entities.length !== blueprint.entities.length) {
      errors.push(`Entity count mismatch: Graph has ${graph.entities.length}, Blueprint has ${blueprint.entities.length}. Synthesis altered the architecture.`);
    }

    // 2. Module count match
    if (graph.modules.length !== blueprint.modules.length) {
      errors.push(`Module count mismatch: Graph has ${graph.modules.length}, Blueprint has ${blueprint.modules.length}.`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
