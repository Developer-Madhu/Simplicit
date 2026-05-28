import { 
  BusinessCapability, 
  CapabilityCategory, 
  StructuredEvidence, 
  DomainEntity,
  EvidenceClass 
} from "../domain-intelligence-types";

export class BusinessCapabilityEngine {
  private normalizationDictionary: Record<string, string> = {
    // Listing related
    "listing": "Listing",
    "room": "Listing",
    "property": "Listing",
    "home": "Listing",
    "stay": "Listing",
    "rental": "Listing",
    "location": "Listing",
    
    // Reservation related
    "reservation": "Reservation",
    "booking": "Reservation",
    "reserve": "Reservation",
    "stay_request": "Reservation",
    
    // User related
    "user": "User",
    
    // Auth related
    "login": "Authentication",
    "signin": "Authentication",
    "authenticate": "Authentication",
    "auth": "Authentication",
    
    // Account related
    "register": "Account Registration",
    "signup": "Account Registration",
    
    // Payment related
    "payment": "Payment",
    "pay": "Payment",
    "checkout": "Payment",
    "purchase": "Payment",
    
    // Review related
    "review": "Review",
    "rating": "Review",
    "feedback": "Review",

    // Notion related
    "page": "Document",
    "collaborator": "Member",
    "editor": "Member"
  };

  private verbMap: Record<string, string> = {
    "create": "Create",
    "new": "Create",
    "add": "Create",
    "update": "Update",
    "modify": "Update",
    "edit": "Update",
    "delete": "Delete",
    "remove": "Delete",
    "cancel": "Cancel",
    "publish": "Publish",
    "book": "Create",
    "reserve": "Create",
    "signin": "Authenticate",
    "login": "Authenticate",
    "signup": "Register",
    "register": "Register"
  };

  private categoryMap: Record<string, CapabilityCategory> = {
    "Listing": CapabilityCategory.LISTING_MANAGEMENT,
    "Reservation": CapabilityCategory.RESERVATION_MANAGEMENT,
    "Authentication": CapabilityCategory.AUTHENTICATION,
    "Account Registration": CapabilityCategory.USER_MANAGEMENT,
    "Payment Processing": CapabilityCategory.PAYMENT_MANAGEMENT,
    "Review Management": CapabilityCategory.REVIEW_MANAGEMENT,
    "Document": CapabilityCategory.CONTENT_MANAGEMENT,
    "Member": CapabilityCategory.USER_MANAGEMENT,
    "User": CapabilityCategory.USER_MANAGEMENT,
    "Workspace": CapabilityCategory.ADMINISTRATION
  };

  /**
   * Sprint: Capability Reconstruction Engine
   */
  public reconstruct(
    rawName: string, 
    evidence: StructuredEvidence[], 
    entities: DomainEntity[]
  ): BusinessCapability[] {
    const capabilities: BusinessCapability[] = [];
    
    // 1. Semantic Normalization
    const normalized = this.normalizeIntent(rawName);
    if (!normalized) return [];

    // 2. Identify Action and Object
    const { action, object } = normalized;

    // Stopwords early rejection
    const stopwords = new Set([
      "show", "remove", "update", "create", "delete", 
      "data", "item", "temp", "preview", "test", "example"
    ]);
    if (stopwords.has(object.toLowerCase())) {
      return [];
    }

    // 3. Link to Entity
    const associatedEntity = entities.find(e => 
      e.name.toLowerCase() === object.toLowerCase() || 
      this.normalizeConcept(e.name.toLowerCase()) === object
    );

    let status = "VALID";
    let confidence = this.calculateConfidence(evidence, !!associatedEntity);

    if (associatedEntity) {
      // Invariant: capability.confidence <= ownerEntity.confidence
      confidence = Math.min(confidence, associatedEntity.confidence);
    } else {
      // If owner entity is missing, set status to INVALID and confidence to 0
      status = "INVALID";
      confidence = 0;
    }

    // New Format: Verb + Entity
    const finalEntityName = associatedEntity?.name || object;
    const finalName = `${action} ${finalEntityName}`;

    // 4. Category
    const category = this.categoryMap[object] || CapabilityCategory.UNKNOWN;

    capabilities.push({
      id: `cap_${finalName.toLowerCase().replace(/\s+/g, '_')}`,
      name: finalName,
      description: `Business capability to ${action.toLowerCase()} ${finalEntityName} within the system.`,
      category,
      evidence,
      confidence,
      associatedEntity: associatedEntity?.name,
      status
    });

    return capabilities;
  }

  public validateWorkflowName(name: string): boolean {
    // Rule: Reject camelCase, PascalCase, snake_case, etc.
    if (/[a-z][A-Z]/.test(name)) return false; // camelCase/PascalCase detection
    if (/_/.test(name)) return false; // snake_case
    
    // Must have spaces and start with capital letters for each word
    const words = name.split(' ');
    if (words.length < 2 && !["Authenticate User", "Register User"].includes(name)) {
        // Special case for some common ones, but usually should be action + object
    }
    
    return words.every(w => /^[A-Z][a-z]*/.test(w));
  }

  public normalizeConcept(concept: string): string {
    const lower = concept.toLowerCase();
    for (const [key, value] of Object.entries(this.normalizationDictionary)) {
      if (lower.includes(key)) return value;
    }
    return this.capitalize(concept);
  }

  private normalizeIntent(rawName: string): { action: string, object: string } | null {
    // Split camelCase/snake_case/PascalCase and ensure special words like Locationcreate are split
    let splitName = rawName.replace(/create/gi, ' create ').replace(/update/gi, ' update ').replace(/delete/gi, ' delete ').trim();
    const parts = splitName.split(/(?=[A-Z])|_|\s+|(?<=[a-z])(?=[A-Z])/).map(p => p.toLowerCase()).filter(Boolean);
    
    let action = "Manage";
    let object = "";

    // Find verb
    for (const part of parts) {
      if (this.verbMap[part]) {
        action = this.verbMap[part];
        break;
      }
    }

    // Find object and normalize
    const objectParts = parts.filter(p => !this.verbMap[p]);
    const rawObject = objectParts.join('');
    object = this.normalizeConcept(rawObject || parts.join(''));

    // Special cases
    if (action === "Create" && (parts.includes("book") || parts.includes("reserve"))) {
      object = "Reservation";
    }

    if (object === "Authentication") {
        return { action: "Authenticate", object: "User" };
    }
    if (object === "Account Registration") {
        return { action: "Register", object: "User" };
    }

    return { action, object };
  }

  private calculateConfidence(evidence: StructuredEvidence[], hasEntity: boolean): number {
    const baseScore = Math.max(...evidence.map(e => e.confidence)) * 100;
    const associationBonus = hasEntity ? 10 : 0;
    return Math.min(100, Math.round(baseScore + associationBonus));
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
  }
}
