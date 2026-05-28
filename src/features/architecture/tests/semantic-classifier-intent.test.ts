import { describe, test, expect } from "vitest";
import { SemanticClassifier } from "../engines/semantic-classifier";
import { SemanticType, StructuredEvidence, EvidenceClass } from "../domain-intelligence-types";

describe("Semantic Classifier - Concept Intent Resolution", () => {
  const classifier = new SemanticClassifier();

  const mockEv = (val: string, cls: EvidenceClass, ctx: string = ""): StructuredEvidence => ({
    className: cls,
    sourceType: "route", // dummy
    originalValue: val,
    semanticContext: ctx,
    confidence: 1.0,
    reasoning: "Test"
  });

  test("reserve is a COMMAND, reservation is an ENTITY", () => {
    // Action verb
    expect(classifier.classify("reserve", [mockEv("reserve", EvidenceClass.ROUTE)])).toBe(SemanticType.COMMAND);
    // Noun form
    expect(classifier.classify("reservation", [mockEv("reservation", EvidenceClass.STATE)])).toBe(SemanticType.ENTITY);
  });

  test("book is a COMMAND, booking is an ENTITY", () => {
    expect(classifier.classify("book", [mockEv("book", EvidenceClass.API)])).toBe(SemanticType.COMMAND);
    expect(classifier.classify("booking", [mockEv("booking", EvidenceClass.DATABASE)])).toBe(SemanticType.ENTITY);
  });

  test("pay is a COMMAND, payment is an ENTITY", () => {
    expect(classifier.classify("pay", [mockEv("pay", EvidenceClass.ROUTE)])).toBe(SemanticType.COMMAND);
    expect(classifier.classify("payment", [mockEv("payment", EvidenceClass.API)])).toBe(SemanticType.ENTITY);
  });
});
