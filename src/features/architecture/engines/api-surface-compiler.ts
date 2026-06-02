import { BackendBlueprint, BlueprintEntity, BlueprintRelationship } from "../types";
import { ApiSurfaceDefinition, DtoDefinition } from "@/features/generation/api/surface-types";

/**
 * API Surface Compiler
 * Converts BackendBlueprint into deterministic API definitions.
 * No AI. Pure transformation.
 */
export class ApiSurfaceCompiler {
  public compile(blueprint: BackendBlueprint): ApiSurfaceDefinition[] {
    const apis: ApiSurfaceDefinition[] = [];

    blueprint.entities.forEach(entity => {
      // 1. Standard CRUD Endpoints
      apis.push(...this.generateCRUDEndpoints(entity));

      // 2. Relationship Endpoints
      if (entity.relationships) {
        entity.relationships.forEach(rel => {
          apis.push(...this.generateRelationshipEndpoints(entity, rel));
        });
      }
    });

    return apis;
  }

  private generateCRUDEndpoints(entity: BlueprintEntity): ApiSurfaceDefinition[] {
    const resource = entity.tableName.toLowerCase();
    const moduleName = `${entity.name}Module`;
    const endpoints: ApiSurfaceDefinition[] = [];

    // GET /resource
    endpoints.push({
      module: moduleName,
      path: `/api/v1/${resource}`,
      method: "GET",
      description: `List all ${entity.name} resources`,
      isProtected: true,
      requiredRoles: [],
      resource,
      kind: "crud",
      params: [],
      responseBody: { name: `${entity.name}Response`, fields: [] } // Fields populated by DTO generator
    });

    // GET /resource/:id
    endpoints.push({
      module: moduleName,
      path: `/api/v1/${resource}/:id`,
      method: "GET",
      description: `Get a single ${entity.name} by ID`,
      isProtected: true,
      requiredRoles: [],
      resource,
      kind: "crud",
      params: ["id"],
      responseBody: { name: `${entity.name}Response`, fields: [] }
    });

    // POST /resource
    endpoints.push({
      module: moduleName,
      path: `/api/v1/${resource}`,
      method: "POST",
      description: `Create a new ${entity.name}`,
      isProtected: true,
      requiredRoles: [],
      resource,
      kind: "crud",
      params: [],
      requestBody: { name: `Create${entity.name}Request`, fields: [] },
      responseBody: { name: `${entity.name}Response`, fields: [] }
    });

    // PATCH /resource/:id
    endpoints.push({
      module: moduleName,
      path: `/api/v1/${resource}/:id`,
      method: "PATCH",
      description: `Update an existing ${entity.name}`,
      isProtected: true,
      requiredRoles: [],
      resource,
      kind: "crud",
      params: ["id"],
      requestBody: { name: `Update${entity.name}Request`, fields: [] },
      responseBody: { name: `${entity.name}Response`, fields: [] }
    });

    // DELETE /resource/:id
    endpoints.push({
      module: moduleName,
      path: `/api/v1/${resource}/:id`,
      method: "DELETE",
      description: `Delete a ${entity.name} by ID`,
      isProtected: true,
      requiredRoles: [],
      resource,
      kind: "crud",
      params: ["id"],
      responseBody: { name: "void", fields: [] }
    });

    return endpoints;
  }

  private generateRelationshipEndpoints(entity: BlueprintEntity, rel: any): ApiSurfaceDefinition[] {
    const endpoints: ApiSurfaceDefinition[] = [];
    const sourceResource = entity.tableName.toLowerCase();
    const targetResource = rel.target.toLowerCase() + "s"; // Simplified pluralization
    const moduleName = `${entity.name}Module`;

    if (rel.type === "one-to-many" || rel.type === "many-to-many") {
      // GET /users/:id/listings
      endpoints.push({
        module: moduleName,
        path: `/api/v1/${sourceResource}/:id/${targetResource}`,
        method: "GET",
        description: `Get all ${rel.target} resources for a specific ${entity.name}`,
        isProtected: true,
        requiredRoles: [],
        resource: targetResource,
        kind: "relationship",
        params: ["id"],
        responseBody: { name: `${rel.target}Response`, fields: [] }
      });

      // POST /users/:id/listings
      endpoints.push({
        module: moduleName,
        path: `/api/v1/${sourceResource}/:id/${targetResource}`,
        method: "POST",
        description: `Create a new ${rel.target} for a specific ${entity.name}`,
        isProtected: true,
        requiredRoles: [],
        resource: targetResource,
        kind: "relationship",
        params: ["id"],
        requestBody: { name: `Create${rel.target}Request`, fields: [] },
        responseBody: { name: `${rel.target}Response`, fields: [] }
      });
    }

    return endpoints;
  }
}
