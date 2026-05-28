import { describe, test, expect } from "vitest";
import { ConfidenceEngine } from "../engines/confidence-engine";
import { StructuredEvidence, EvidenceClass } from "../domain-intelligence-types";

describe("ConfidenceEngine", () => {
  const engine = new ConfidenceEngine();

  const mockEvidence = (type: any): StructuredEvidence => {
    let className = EvidenceClass.ROUTE;
    if (type === "documentation") className = EvidenceClass.DOCUMENTATION;
    else if (type === "form") className = EvidenceClass.FORM;
    else if (type === "api_call") className = EvidenceClass.API;
    else if (type === "state") className = EvidenceClass.STATE;
    return {
      className,
      sourceType: type,
      originalValue: "Test",
      semanticContext: "Mock",
      confidence: 1.0,
      reasoning: "Test"
    };
  };

  test("Documentation provides base 5% confidence", () => {
    const evidence = [mockEvidence("documentation")];
    expect(engine.calculate(evidence)).toBe(0.05);
  });

  test("Diversity of sources increases confidence", () => {
    const singleSource = [mockEvidence("route")];
    const multiSource = [mockEvidence("route"), mockEvidence("form"), mockEvidence("api_call")];
    
    expect(engine.calculate(multiSource)).toBeGreaterThan(engine.calculate(singleSource));
  });

  test("Confidence caps at 100%", () => {
    const overkill = [
      mockEvidence("documentation"), 
      mockEvidence("route"), 
      mockEvidence("form"), 
      mockEvidence("api_call"),
      mockEvidence("state")
    ];
    expect(engine.calculate(overkill)).toBe(1.0);
  });
});
