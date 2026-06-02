import { BackendBlueprint, BlueprintEntity, BlueprintCapability, BlueprintRelationship, BlueprintPermission } from "@/features/architecture/types";
import { ServiceMethodDefinition, DtoDefinition } from "./surface-types";

export interface AIGenerationContext {
  capability: BlueprintCapability;
  entity?: BlueprintEntity;
  dtos: DtoDefinition[];
  relationships: BlueprintRelationship[];
  permissions: BlueprintPermission[];
  infrastructure: {
    database: string;
    auth: string;
    payments: string;
    storage: string;
    email: string;
  };
  methodContract: ServiceMethodDefinition;
}

/**
 * AI Generation Context Builder
 * Strongly structures the information needed for the LLM to implement a specific capability.
 * Filters the blueprint to provide only relevant context to optimize token usage and accuracy.
 */
export class AIContextBuilder {
  public static build(
    blueprint: BackendBlueprint,
    capability: BlueprintCapability,
    methodContract: ServiceMethodDefinition,
    allDtos: DtoDefinition[]
  ): AIGenerationContext {
    const entity = blueprint.entities.find(e => e.name === capability.associatedEntity);
    
    // Filter DTOs relevant to this entity
    const relevantDtos = allDtos.filter(d => 
      d.name.includes(capability.associatedEntity || "") || 
      d.name.includes(capability.name.replace(/\s+/g, ""))
    );

    // Filter relationships involving this entity
    const relevantRelationships = (entity?.relationships || []).map(rel => ({
        ...rel,
        source: entity?.name || ""
    })) as any;

    // Filter permissions involving this entity or resource
    const relevantPermissions = blueprint.permissions.filter(p => 
      p.resource === entity?.tableName || p.resource === capability.name.toLowerCase().replace(/\s+/g, "-")
    );

    return {
      capability,
      entity,
      dtos: relevantDtos,
      relationships: relevantRelationships,
      permissions: relevantPermissions,
      infrastructure: {
        database: blueprint.infrastructure.database.provider,
        auth: blueprint.infrastructure.auth.provider,
        payments: blueprint.infrastructure.payments.provider,
        storage: blueprint.infrastructure.storage.provider,
        email: blueprint.infrastructure.email.provider,
      },
      methodContract
    };
  }
}
