import { DomainEntity, DomainRelationship, StructuredEvidence, EvidenceClass } from "../domain-intelligence-types";

export class RelationshipReconstructionEngine {
  /**
   * STEP 2: Relationship Reconstruction
   * Infer relationships from evidence (routes, schemas, payloads) instead of heuristics.
   */
  public reconstruct(entities: DomainEntity[], evidenceLog: StructuredEvidence[]): DomainRelationship[] {
    const relationships: DomainRelationship[] = [];

    // 1. Evidence-Driven Inference (Route Nesting & State references)
    entities.forEach(entity => {
      const eName = entity.name.toLowerCase();

      entities.forEach(target => {
        if (entity.name === target.name) return;
        const tName = target.name.toLowerCase();

        // Detect foreign keys or references in state/api evidence
        const hasFKEvidence = evidenceLog.some(e => 
          (e.className === EvidenceClass.STATE || e.className === EvidenceClass.API || e.className === EvidenceClass.SCHEMA) &&
          e.originalValue.toLowerCase().includes(`${tName}id`) &&
          e.originalValue.toLowerCase().includes(eName)
        );

        // Detect route nesting (e.g., /workspaces/:id/documents)
        const hasRouteNesting = evidenceLog.some(e => 
          e.className === EvidenceClass.ROUTE && 
          e.originalValue.toLowerCase().includes(`/${tName}s`) && 
          e.originalValue.toLowerCase().includes(`/${eName}s`) &&
          e.originalValue.toLowerCase().indexOf(`/${tName}s`) < e.originalValue.toLowerCase().indexOf(`/${eName}s`)
        );

        if (hasFKEvidence || hasRouteNesting) {
          const rel: DomainRelationship = {
            target: target.name,
            type: "many-to-one",
            ownership: hasRouteNesting, // Route nesting strongly implies ownership
            evidence: [
              ...evidenceLog.filter(e => e.originalValue.toLowerCase().includes(`${tName}id`) && e.originalValue.toLowerCase().includes(eName)),
              ...evidenceLog.filter(e => e.className === EvidenceClass.ROUTE && e.originalValue.toLowerCase().includes(`/${tName}s`) && e.originalValue.toLowerCase().includes(`/${eName}s`))
            ].slice(0, 3)
          };
          
          relationships.push(rel);
          
          // Attach to entity for backward compatibility during transition
          if (!entity.relationships.some(r => r.target === target.name)) {
            entity.relationships.push(rel);
          }
        }
      });
    });

    return relationships;
  }
}
