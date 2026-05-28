import { describe, test, expect } from "vitest";
import { PatternRecognitionEngine } from "../engines/pattern-engine";

describe("PatternRecognitionEngine", () => {
  const engine = new PatternRecognitionEngine();

  test("Recognizes Notion pattern from Editor and Blocks evidence", () => {
    const evidence: any[] = [
      { originalValue: "Editor", confidence: 1.0, className: "dependency", sourceType: "dependency" },
      { originalValue: "BlocksList", confidence: 0.8, className: "state", sourceType: "state" },
      { originalValue: "NestedPage", confidence: 0.9, className: "route", sourceType: "route" }
    ];
    evidence.push({ originalValue: "DocumentStore", confidence: 1.0, className: "state", sourceType: "state" });
    
    const patterns = engine.recognize(evidence);
    expect(patterns[0]?.id).toBe("workspace_system");
  });

  test("Recognizes Airbnb pattern from Listing and Booking evidence", () => {
    const evidence: any[] = [
      { originalValue: "ListingCard", confidence: 1.0, className: "route", sourceType: "route" },
      { originalValue: "BookingForm", confidence: 0.9, className: "route", sourceType: "route" },
      { originalValue: "stay", confidence: 1.0, className: "route", sourceType: "route" }
    ];
    const patterns = engine.recognize(evidence);
    expect(patterns[0]?.id).toBe("booking_marketplace");
  });

  test("Returns empty array if no strong match", () => {
    const evidence: any[] = [{ originalValue: "RandomThing", confidence: 0.5, className: "route", sourceType: "route" }];
    const patterns = engine.recognize(evidence);
    expect(patterns).toHaveLength(0);
  });
});
