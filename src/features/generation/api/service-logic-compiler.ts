import { ServiceMethodDefinition } from "./surface-types";

/**
 * Service Logic Compiler
 * Generates implementation logic for service methods using deterministic templates.
 */
export class ServiceLogicCompiler {
  public static compileMethod(
    entityName: string, 
    method: ServiceMethodDefinition,
    repoName: string
  ): string {
    const name = method.name;
    const repo = `this.${repoName.toLowerCase()}`;

    // 1. CRUD Templates
    if (name === "findAll") {
      return `return await ${repo}.findMany();`;
    }
    if (name === "findById") {
      return `return await ${repo}.findById(id);`;
    }
    if (name === "create") {
      return `return await ${repo}.create(data);`;
    }
    if (name === "update") {
      return `return await ${repo}.update(id, data);`;
    }
    if (name === "delete") {
      return `await ${repo}.delete(id);`;
    }

    // 2. Relationship Templates (Heuristic)
    if (name.startsWith("get") && name.endsWith("s")) {
        const target = name.slice(3);
        return `return await ${repo}.findRelated("${target.toLowerCase()}", id);`;
    }

    // 3. Capability Implementation (Constrained LLM Assistant placeholder)
    // In production, this would be a prompt to an LLM providing the capability description
    return `// TODO: Implement ${name} logic\n    // Evidence suggests this involves state transition for ${entityName}\n    throw new Error("Method not implemented.");`;
  }
}
