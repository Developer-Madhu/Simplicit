import { describe, test, expect } from "vitest";
import { InfraVerifier } from "../engines/infra-verifier";
import { StructuredEvidence, EvidenceClass } from "../domain-intelligence-types";

describe("InfraVerifier", () => {
  const verifier = new InfraVerifier();

  const mockDep = (val: string): StructuredEvidence => ({
    className: EvidenceClass.DEPENDENCY,
    sourceType: "dependency",
    originalValue: val,
    semanticContext: "Mock",
    confidence: 1.0,
    reasoning: "Test"
  });

  test("Verifies Stripe when package is present", () => {
    const signals = [mockDep("stripe")];
    const decision = verifier.verify("Payments", signals);
    expect(decision.provider).toBe("Stripe");
    expect(decision.confidence).toBe(1.0);
  });

  test("Verifies Clerk when package is present", () => {
    const signals = [mockDep("@clerk/nextjs")];
    const decision = verifier.verify("Authentication", signals);
    expect(decision.provider).toBe("Clerk");
  });

  test("Returns Unknown when no evidence exists", () => {
    const decision = verifier.verify("Payments", []);
    expect(decision.provider).toBe("Unknown");
    expect(decision.confidence).toBeLessThan(0.5);
  });
});
