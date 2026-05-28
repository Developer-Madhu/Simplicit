import { describe, test, expect } from "vitest";
import { ArchitectureGapDetector } from "../engines/gap-detector";
import { SemanticType } from "../domain-intelligence-types";

describe("ArchitectureGapDetector", () => {
  const detector = new ArchitectureGapDetector();

  test("Identifies recursive hierarchy gap for Documents", () => {
    const entities: any[] = [{ name: "Document", relationships: [] }];
    const gaps = detector.detect(entities, [], []);
    expect(gaps.some(g => g.id === "recursive_document")).toBe(true);
    expect(gaps.find(g => g.id === "recursive_document")?.severity).toBe("critical");
  });

  test("Identifies ownership gap for non-User entities", () => {
    const entities: any[] = [{ name: "Listing", relationships: [] }];
    const gaps = detector.detect(entities, [], []);
    expect(gaps.some(g => g.id === "ownership_listing")).toBe(true);
  });
});
