import { describe, test, expect } from "vitest";
import { SemanticClassifier } from "../engines/semantic-classifier";
import { SemanticType, StructuredEvidence, EvidenceClass } from "../domain-intelligence-types";

describe("SemanticClassifier", () => {
  const classifier = new SemanticClassifier();

  const mockEvidence = (val: string, type: any): StructuredEvidence => ({
    className: type === "documentation" ? EvidenceClass.DOCUMENTATION : (type === "dependency" ? EvidenceClass.DEPENDENCY : (type === "component" ? EvidenceClass.SOURCE_CODE : EvidenceClass.ROUTE)),
    sourceType: type,
    originalValue: val,
    semanticContext: "Mock",
    confidence: 1.0,
    reasoning: "Test"
  });

  test("Classifies 'User' as ENTITY when in documentation", () => {
    const evidence = [mockEvidence("User", "documentation")];
    expect(classifier.classify("User", evidence)).toBe(SemanticType.ENTITY);
  });

  test("Classifies 'Login' as WORKFLOW even if in documentation", () => {
    const evidence = [mockEvidence("Login", "documentation")];
    expect(classifier.classify("Login", evidence)).toBe(SemanticType.WORKFLOW);
  });

  test("Classifies 'RoomCard' as UI_COMPONENT", () => {
    const evidence = [mockEvidence("RoomCard", "component")];
    expect(classifier.classify("RoomCard", evidence)).toBe(SemanticType.UI_COMPONENT);
  });

  test("Classifies 'LocationUpdate' as COMMAND", () => {
    const evidence = [mockEvidence("LocationUpdate", "route")];
    expect(classifier.classify("LocationUpdate", evidence)).toBe(SemanticType.COMMAND);
  });

  test("Classifies 'Stripe' as EXTERNAL_SERVICE when in dependencies", () => {
    const evidence = [mockEvidence("stripe", "dependency")];
    expect(classifier.classify("Stripe", evidence)).toBe(SemanticType.EXTERNAL_SERVICE);
  });
});
