import { SemanticType, StructuredEvidence, EvidenceClass } from "../domain-intelligence-types";

// Verbs that trigger COMMAND/WORKFLOW classification
const WORKFLOW_VERBS = ["login", "register", "signup", "signin", "logout", "auth", "authenticate", "onboarding"];
const COMMAND_VERBS = ["update", "create", "delete", "remove", "add", "cancel", "submit", "confirm", "approve", "reject", "upload", "reserve", "book", "pay"];

// Nouns that look like verbs but represent business concepts
const NOUN_EXCEPTIONS = ["reservation", "booking", "payment", "review", "approval", "submission", "checkout"];

const UI_ARTIFACTS = ["card", "modal", "section", "layout", "page", "button", "input", "dropdown", "select", "toggle", "switch", "wrapper", "container", "provider", "context", "handler", "preview"];

export class SemanticClassifier {
  /**
   * Rule #1: Documentation is never domain truth (capped at 0.05)
   * Sprint 1: Classify a discovered concept into a strict taxonomy
   * Sprint (Entity Survival): Distinguish between ACTION and BUSINESS OBJECT using Intent Resolution.
   */
  public classify(name: string, evidence: StructuredEvidence[]): SemanticType {
    const lower = name.toLowerCase();

    // 1. Filter out pure documentation noise (Rule #1)
    const nonDocEvidence = evidence.filter(e => e.className !== EvidenceClass.DOCUMENTATION);
    
    // 2. UI Artifact Checks (Rule #4)
    if (UI_ARTIFACTS.some(p => lower.includes(p) && !lower.includes("page"))) {
      return SemanticType.UI_COMPONENT;
    }
    if (lower.includes("page")) {
      return SemanticType.PAGE;
    }

    // 3. Intent Resolution (Noun vs Verb Exception)
    // If the concept is a known business noun (e.g. "reservation"), protect it from command classification.
    const isNounException = NOUN_EXCEPTIONS.some(n => lower === n || lower.endsWith(n));

    if (!isNounException) {
      // 4. Action/Process Checks (Login/Register are workflows)
      if (WORKFLOW_VERBS.some(v => lower === v || lower.startsWith(v + "_") || lower.endsWith("_" + v))) {
        return SemanticType.WORKFLOW;
      }

      // If it's a strict command verb (e.g. "reserve", "book", "pay")
      if (COMMAND_VERBS.some(v => lower === v || lower.startsWith(v + "_") || lower.endsWith("_" + v) || lower.includes("update") || lower.includes("create"))) {
        return SemanticType.COMMAND;
      }
    }

    // 5. Source code/State/DB/API/Documentation check for ENTITY classification
    if (evidence.some(e => 
      e.className === EvidenceClass.STATE || 
      e.className === EvidenceClass.SOURCE_CODE || 
      e.className === EvidenceClass.DATABASE || 
      e.className === EvidenceClass.API || 
      e.className === EvidenceClass.SCHEMA || 
      e.className === EvidenceClass.DOCUMENTATION ||
      e.sourceType === "documentation" ||
      e.sourceType === "state" ||
      e.sourceType === "database" ||
      e.sourceType === "schema"
    )) {
      return SemanticType.ENTITY;
    }

    // 6. Dependency check for EXTERNAL_SERVICE classification
    if (evidence.some(e => e.sourceType === "dependency" || e.className === EvidenceClass.DEPENDENCY)) {
      return SemanticType.EXTERNAL_SERVICE;
    }

    return SemanticType.UNKNOWN;
  }
}
