import { BackendBlueprint, BlueprintEntity } from "../types";
import { ServiceDefinition, ServiceMethodDefinition } from "@/features/generation/api/surface-types";

/**
 * Service Layer Generator
 * Generates framework-neutral service contracts.
 * No AI. Pure transformation.
 */
export class ServiceGenerator {
  public generate(blueprint: BackendBlueprint): ServiceDefinition[] {
    const services: ServiceDefinition[] = [];

    blueprint.entities.forEach(entity => {
      const moduleName = `${entity.name}Module`;
      const serviceName = `${entity.name}Service`;
      
      const methods: ServiceMethodDefinition[] = [];

      // 1. Standard CRUD Methods
      methods.push({ name: `findAll`, params: [], returnType: `${entity.name}[]`, isAsync: true });
      methods.push({ name: `findById`, params: [{ name: "id", type: "string" }], returnType: entity.name, isAsync: true });
      methods.push({ name: `create`, params: [{ name: "data", type: `Create${entity.name}Dto` }], returnType: entity.name, isAsync: true });
      methods.push({ name: `update`, params: [{ name: "id", type: "string" }, { name: "data", type: `Update${entity.name}Dto` }], returnType: entity.name, isAsync: true });
      methods.push({ name: `delete`, params: [{ name: "id", type: "string" }], returnType: "void", isAsync: true });

      // 2. Capability-based Methods
      const entityCapabilities = blueprint.capabilities.filter(cap => cap.associatedEntity === entity.name);
      entityCapabilities.forEach(cap => {
          const methodName = cap.name.split(' ').map((w: string, i: number) => i === 0 ? w.toLowerCase() : w).join('');
          methods.push({
              name: methodName,
              params: [{ name: "id", type: "string" }],
              returnType: "any",
              isAsync: true
          });
      });

      services.push({
        name: serviceName,
        module: moduleName,
        description: `Service for managing ${entity.name} domain objects.`,
        methods: methods.map(m => m.name) // Compatible with BlueprintService
      });
    });

    return services;
  }
}
