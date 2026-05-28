import { describe, test, expect } from "vitest";
import { DomainGraphValidator } from "../engines/domain-graph-validator";
import { BlueprintConsistencyValidator } from "../engines/blueprint-consistency-validator";
import { RelationshipReconstructionEngine } from "../engines/relationship-engine";
import { SemanticType, DomainGraph, DomainEntity } from "../domain-intelligence-types";

describe("Domain Graph Integrity & Blueprint Synchronization Sprint - TDD", () => {
  
  test("Phase 2: DomainGraphValidator rejects orphan capabilities", () => {
    const validator = new DomainGraphValidator();
    const graph: any = {
      entities: [{ name: "User" }],
      capabilities: [{ name: "Create Listing", associatedEntity: "Listing" }], // Orphan capability
      relationships: [],
      modules: []
    };
    const result = validator.validate(graph);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes("Orphan capability"))).toBe(true);
  });

  test("Phase 2: DomainGraphValidator rejects orphan entities (not in any module)", () => {
    const validator = new DomainGraphValidator();
    const graph: any = {
      entities: [{ name: "Review" }],
      capabilities: [],
      relationships: [],
      modules: [{ name: "CoreModule", entities: ["User"] }] // Review is not in any module
    };
    const result = validator.validate(graph);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes("Orphan entity"))).toBe(true);
  });

  test("Phase 3: BlueprintConsistencyValidator catches synthesis mismatch", () => {
    const validator = new BlueprintConsistencyValidator();
    const graph: any = {
      entities: [{ name: "Listing" }, { name: "User" }],
      relationships: [{ from: "User", to: "Listing" }],
      modules: [{ name: "CoreModule" }]
    };
    const blueprint: any = {
      entities: [{ name: "Listing" }], // Missing User
      database: { tables: [] },
      modules: [{ name: "CoreModule" }]
    };
    
    const result = validator.validate(graph, blueprint);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(e => e.includes("Entity count mismatch"))).toBe(true);
  });

  test("Phase 6: RelationshipReconstructionEngine requires evidence", () => {
    const engine = new RelationshipReconstructionEngine();
    const entities: DomainEntity[] = [
      { name: "User", table: "users", type: SemanticType.ENTITY, description: "", fields: [], relationships: [], indexes: [], constraints: [], confidence: 100, evidence: [], reasoning: "", qualificationPassed: true, qualificationScore: 100 },
      { name: "Listing", table: "listings", type: SemanticType.ENTITY, description: "", fields: [], relationships: [], indexes: [], constraints: [], confidence: 100, evidence: [], reasoning: "", qualificationPassed: true, qualificationScore: 100 }
    ];
    
    // No evidence provided
    const resultNoEvidence = engine.reconstruct(entities, []);
    expect(resultNoEvidence.length).toBe(0);

    // Provide evidence
    const evidence: any[] = [
      { className: "ROUTE", originalValue: "/users/:id/listings" }
    ];
    const resultWithEvidence = engine.reconstruct(entities, evidence);
    expect(resultWithEvidence.length).toBe(1);
    expect(resultWithEvidence[0].target).toBe("User"); // Listing -> User
    expect(resultWithEvidence[0].evidence.length).toBeGreaterThan(0);
  });
});
