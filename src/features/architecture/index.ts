export * from "./types";
export * from "./synthesis-types";

// Core Engines
export * from "./evidence-engine";
export * from "./domain-discovery-engine";
export * from "./domain-intelligence-engine";
export * from "./synthesis-engine";

// UI Components
export { ArchitecturePage } from "./components/architecture-page";
export { ArchitectureReview } from "./components/architecture-review";
export { BlueprintReview } from "./components/blueprint-review";
export { StackSelectionWizard } from "./components/stack-selection-wizard";
export { GapResolutionWizard } from "./components/gap-resolution-wizard";

// Phase 1 Engines
export * from "./engines/architecture-requirements-engine";
export * from "./engines/gap-resolution-engine";

export * from "./utils";

export { ArchitectureReview as default } from "./components/architecture-review";

