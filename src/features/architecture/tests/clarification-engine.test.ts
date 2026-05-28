import { describe, test, expect } from "vitest";
import { IntelligentClarificationEngine } from "../engines/clarification-engine";

describe("IntelligentClarificationEngine", () => {
  const engine = new IntelligentClarificationEngine();

  test("Generates recursive hierarchy question for Document gap", () => {
    const gaps: any[] = [{ id: "recursive_document", category: "data_model", description: "Recursive hierarchy?", impact: "Schema" }];
    const questions = engine.generateQuestions(gaps);
    expect(questions[0].text).toBe("Recursive hierarchy?");
    expect(questions[0].options?.length).toBeGreaterThan(0);
    expect(questions[0].options?.some(o => o.value === "recursive")).toBe(true);
  });

  test("Generates ownership question for Listing gap", () => {
    const gaps: any[] = [{ id: "ownership_listing", category: "security", description: "Who owns Listing?", impact: "RLS" }];
    const questions = engine.generateQuestions(gaps);
    expect(questions[0].options?.some(o => o.value === "user_owned")).toBe(true);
  });
});
