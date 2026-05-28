import { describe, test, expect } from "vitest";
import { ReadinessValidator } from "../engines/readiness-validator";

describe("ReadinessValidator", () => {
  const validator = new ReadinessValidator();

  test("Reduces score if critical gaps exist", () => {
    const insight: any = {
      entities: [{ name: "User", relationships: [] }],
      gaps: [{ id: "missing_entity_workspace", severity: "critical", category: "data_model" }],
      evidenceLog: [{ confidence: 1.0 }]
    };
    const { score } = validator.validate(insight);
    expect(score).toBeLessThan(90);
  });

  test("Increases score if pattern is matched", () => {
    const withPattern: any = {
      entities: [{ name: "Listing", relationships: [{ target: "User", ownership: true }] }],
      activePattern: { id: "booking_marketplace" },
      evidenceLog: new Array(10).fill({}),
      gaps: []
    };
    const withoutPattern: any = {
      ...withPattern,
      activePattern: undefined
    };
    
    const scoreWith = validator.validate(withPattern).score;
    const scoreWithout = validator.validate(withoutPattern).score;
    
    expect(scoreWith).toBeGreaterThan(scoreWithout);
  });

  test("Score is 0 for empty insight", () => {
    const { score } = validator.validate({});
    expect(score).toBe(0);
  });
});
