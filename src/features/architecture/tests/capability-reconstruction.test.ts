import { describe, test, expect } from "vitest";
import { BusinessCapabilityEngine } from "../engines/business-capability-engine";
import { EvidenceClass, SemanticType } from "../domain-intelligence-types";

describe("Business Capability Reconstruction Sprint - TDD", () => {
  const engine = new BusinessCapabilityEngine();

  const mockEvidence = (val: string, className: EvidenceClass): any => ({
    className,
    originalValue: val,
    sourceType: className.toLowerCase(),
    semanticContext: "Mock",
    confidence: 0.8,
    reasoning: "Test"
  });

  test("1. createRoom must become Create Listing", () => {
    const evidence = [mockEvidence("createRoom", EvidenceClass.SOURCE_CODE)];
    const capabilities = engine.reconstruct("createRoom", evidence, []);
    expect(capabilities[0].name).toBe("Create Listing");
  });

  test("2. bookStay must become Create Reservation", () => {
    const evidence = [mockEvidence("bookStay", EvidenceClass.API)];
    const capabilities = engine.reconstruct("bookStay", evidence, []);
    expect(capabilities[0].name).toBe("Create Reservation");
  });

  test("3. login must become Authenticate User", () => {
    const evidence = [mockEvidence("login", EvidenceClass.ROUTE)];
    const capabilities = engine.reconstruct("login", evidence, []);
    expect(capabilities[0].name).toBe("Authenticate User");
  });

  test("4. Locationcreate must never appear in blueprint (normalization)", () => {
    const evidence = [mockEvidence("Locationcreate", EvidenceClass.SOURCE_CODE)];
    const capabilities = engine.reconstruct("Locationcreate", evidence, []);
    expect(capabilities[0].name).not.toBe("Locationcreate");
    expect(capabilities[0].name).toBe("Create Listing");
  });

  test("5. Raw function names forbidden in workflows (validation)", () => {
    const name = "update_listing_price";
    expect(engine.validateWorkflowName(name)).toBe(false);
    expect(engine.validateWorkflowName("Update Listing Price")).toBe(true);
  });

  test("6. Capability linked to entity", () => {
    const entities: any[] = [{ name: "Listing", table: "listings" }];
    const evidence = [mockEvidence("createRoom", EvidenceClass.SOURCE_CODE)];
    const capabilities = engine.reconstruct("createRoom", evidence, entities);
    expect(capabilities[0].associatedEntity).toBe("Listing");
  });

  test("8. Airbnb benchmark outputs: Listing, Reservation, Review", () => {
    // This is more of an integration test for the normalization dictionary
    expect(engine.normalizeConcept("room")).toBe("Listing");
    expect(engine.normalizeConcept("property")).toBe("Listing");
    expect(engine.normalizeConcept("booking")).toBe("Reservation");
    expect(engine.normalizeConcept("rating")).toBe("Review");
  });

  test("9. Notion benchmark outputs: Workspace, Document, Member", () => {
    expect(engine.normalizeConcept("page")).toBe("Document");
    expect(engine.normalizeConcept("collaborator")).toBe("Member");
  });
});
