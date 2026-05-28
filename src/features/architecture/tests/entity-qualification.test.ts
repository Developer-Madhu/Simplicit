import { describe, test, expect } from "vitest";
import { EntityQualifier } from "../engines/entity-qualifier";
import { SemanticType, StructuredEvidence, EvidenceClass } from "../domain-intelligence-types";

describe("EntityQualifier", () => {
  const qualifier = new EntityQualifier();

  const mockEvidence = (source: any): StructuredEvidence => ({
    className: source === "route" 
      ? EvidenceClass.ROUTE 
      : (source === "component" 
        ? EvidenceClass.SOURCE_CODE 
        : (source === "state" 
          ? EvidenceClass.STATE 
          : (source === "database" 
            ? EvidenceClass.DATABASE 
            : (source === "api" 
              ? EvidenceClass.API 
              : EvidenceClass.FORM)))),
    sourceType: source,
    originalValue: "Test",
    semanticContext: "Mock",
    confidence: 1.0,
    reasoning: "Test"
  });

  test("Rejects concepts with only one evidence source", () => {
    const evidence = [mockEvidence("route")];
    expect(qualifier.qualify("Preview", SemanticType.ENTITY, evidence).passed).toBe(false);
  });

  test("Accepts concepts with 2+ independent sources", () => {
    const evidence = [mockEvidence("database"), mockEvidence("api")];
    expect(qualifier.qualify("Booking", SemanticType.ENTITY, evidence).passed).toBe(true);
  });

  test("Rejects concepts in documentation if score below threshold", () => {
    const docEvidence: StructuredEvidence = {
      className: EvidenceClass.DOCUMENTATION,
      sourceType: "documentation",
      originalValue: "User",
      semanticContext: "Mock",
      confidence: 1.0,
      reasoning: "Test"
    };
    expect(qualifier.qualify("User", SemanticType.ENTITY, [docEvidence]).passed).toBe(false);
  });

  test("Rejects UI components even if multiple sources", () => {
    const evidence = [mockEvidence("route"), mockEvidence("component"), mockEvidence("state")];
    expect(qualifier.qualify("RoomCard", SemanticType.UI_COMPONENT, evidence).passed).toBe(false);
  });
});
