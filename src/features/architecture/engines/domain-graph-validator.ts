import { DomainGraph, SemanticType } from "../domain-intelligence-types";

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class DomainGraphValidator {
  private stopwords = new Set([
    "show", "remove", "update", "create", "delete", 
    "data", "item", "temp", "preview", "test", "example"
  ]);

  /**
   * Phase 2: Domain Graph Integrity Validation
   */
  public validate(graph: DomainGraph): ValidationResult {
    const errors: string[] = [];

    const entityNames = new Set(graph.entities.map(e => e.name));
    const moduleEntities = new Set(graph.modules.flatMap(m => m.entities));

    // Rule 1: Every capability must belong to an existing entity
    graph.capabilities?.forEach(cap => {
      if (!cap.associatedEntity) {
        errors.push(`Orphan capability: '${cap.name}' does not belong to any entity.`);
      } else if (!entityNames.has(cap.associatedEntity)) {
        errors.push(`Orphan capability: '${cap.name}' references non-existent entity '${cap.associatedEntity}'.`);
      }
    });

    // Rule 2: Every entity must belong to a module
    graph.entities?.forEach(ent => {
      if (!moduleEntities.has(ent.name)) {
        errors.push(`Orphan entity: '${ent.name}' does not belong to any module.`);
      }
    });

    // Rule 3: Every module must contain at least one entity
    graph.modules?.forEach(mod => {
      if (mod.entities.length === 0) {
        errors.push(`Empty module: '${mod.name}' contains no entities.`);
      }
    });

    // Rule 4: No orphan nodes (a node must be connected by at least one edge)
    const connectedNodeIds = new Set<string>();
    graph.edges?.forEach(edge => {
      connectedNodeIds.add(edge.from);
      connectedNodeIds.add(edge.to);
    });

    graph.nodes?.forEach(node => {
      if ([SemanticType.ENTITY, SemanticType.WORKFLOW].includes(node.type)) {
        if (!connectedNodeIds.has(node.id)) {
          errors.push(`Orphan node: '${node.label}' of type ${node.type} has no connections in the graph.`);
        }
      }
    });

    // Rule 5: No capability may reference UNKNOWN or a verb (failed normalization)
    graph.capabilities?.forEach(cap => {
      const parts = cap.name.split(" ");
      const action = parts[0];
      const entityName = parts.slice(1).join(" ");
      
      if (entityName.toUpperCase() === "UNKNOWN") {
        errors.push(`Capability '${cap.name}' references UNKNOWN owner entity.`);
      }
      
      const lowerEntityName = entityName.toLowerCase();
      if (this.stopwords.has(lowerEntityName)) {
        errors.push(`Invalid capability name/failed normalization: '${cap.name}' (cannot target verb/stopword '${entityName}').`);
      }
    });

    // Verify all relationships connect existing entities
    graph.entities?.forEach(ent => {
      ent.relationships?.forEach(rel => {
        if (!entityNames.has(rel.target)) {
          errors.push(`Invalid relationship: '${ent.name}' references non-existent target '${rel.target}'.`);
        }
      });
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
