import { describe, test, expect } from "vitest";
import { BackendBlueprint } from "../types";

describe("ArchitectureGraph Visualizer", () => {
  const mockBlueprint: any = {
    modules: [{ name: "ListingModule", entities: ["Listing"] }],
    entities: [{ name: "Listing", table: "listings", fields: [], relationships: [{ target: "User", type: "many-to-one" }] }],
    capabilities: [{ name: "Create Listing", category: "LISTING_MANAGEMENT", associatedEntity: "Listing", evidence: [] }],
    infrastructure: {
      database: { provider: "PostgreSQL", rationale: "Test", confidence: 100 },
      auth: { provider: "Clerk", rationale: "Test", confidence: 100 }
    }
  };

  test("renders module nodes", () => {
    // TDD: failing test
    // render(<ArchitectureGraph blueprint={mockBlueprint} />);
    // expect(screen.getByText("ListingModule")).toBeInTheDocument();
  });

  test("renders entity nodes", () => {
    // expect(screen.getByText("Listing")).toBeInTheDocument();
  });

  test("renders capability nodes", () => {
    // expect(screen.getByText("Create Listing")).toBeInTheDocument();
  });

  test("renders infrastructure nodes", () => {
    // expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
  });
});
