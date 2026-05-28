import { describe, test, expect } from "vitest";
import { EntityQualifier } from "../engines/entity-qualifier";
import { SemanticType, StructuredEvidence, EvidenceClass } from "../domain-intelligence-types";

describe("Entity Qualifier - Scoring Model & Persistence Fallacy", () => {
  const qualifier = new EntityQualifier();

  const mockEv = (cls: EvidenceClass): StructuredEvidence => ({
    className: cls,
    sourceType: "route", // dummy
    originalValue: "Test",
    semanticContext: "Mock",
    confidence: 1.0,
    reasoning: "Test"
  });

  test("Listing survives: API(30) + Route(20) + State(25) = 75 (PASS)", () => {
    const evidence = [mockEv(EvidenceClass.API), mockEv(EvidenceClass.ROUTE), mockEv(EvidenceClass.STATE)];
    const result = qualifier.qualify("Listing", SemanticType.ENTITY, evidence);
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(75);
  });

  test("RoomCard rejected: Component(10) only = 10 (FAIL)", () => {
    const evidence = [mockEv(EvidenceClass.SOURCE_CODE)]; // Assuming SOURCE_CODE is used for components
    const result = qualifier.qualify("RoomCard", SemanticType.UI_COMPONENT, evidence);
    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(60);
  });

  test("Preview rejected: Component(10) + Route(20) = 30 (FAIL)", () => {
    const evidence = [mockEv(EvidenceClass.SOURCE_CODE), mockEv(EvidenceClass.ROUTE)];
    const result = qualifier.qualify("Preview", SemanticType.ENTITY, evidence);
    expect(result.passed).toBe(false);
    expect(result.score).toBeLessThan(60);
  });

  test("Workspace survives (Reference Entity): State(25) + Database(40) = 65 (PASS, no form required)", () => {
    const evidence = [mockEv(EvidenceClass.STATE), mockEv(EvidenceClass.DATABASE)];
    const result = qualifier.qualify("Workspace", SemanticType.ENTITY, evidence);
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(60);
  });

  test("Product survives (Reference Entity): Schema(35) + API(30) = 65 (PASS, no form required)", () => {
    const evidence = [mockEv(EvidenceClass.SCHEMA), mockEv(EvidenceClass.API)];
    const result = qualifier.qualify("Product", SemanticType.ENTITY, evidence);
    expect(result.passed).toBe(true);
    expect(result.score).toBeGreaterThanOrEqual(65);
  });
});
