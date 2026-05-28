import { BusinessCapabilityEngine } from "./business-capability-engine";

export class CRUDClusterReconstructionEngine {
  private capabilityEngine: BusinessCapabilityEngine;
  
  // Stopwords for early rejection of target concepts (verbs or low-quality names)
  private stopwords = new Set([
    "show", "remove", "update", "create", "delete", 
    "data", "item", "temp", "preview", "test", "example"
  ]);

  // Actions classified as CRUD operations
  private crudVerbs = new Set([
    "Create", "Update", "Delete", "View", "Cancel", "Manage", "Get", "List"
  ]);

  constructor() {
    this.capabilityEngine = new BusinessCapabilityEngine();
  }

  /**
   * Identifies entities that should be auto-promoted based on CRUD clusters.
   * Order of operations: normalize -> stopword filter -> dedupe -> CRUD clustering -> promotion
   */
  public getPromotedEntities(workflows: string[]): string[] {
    const nounActions = new Map<string, Set<string>>();
    const seen = new Set<string>();

    workflows.forEach(w => {
      // 1. Normalize workflow names to extract action and object
      const normalized = this.normalizeWorkflow(w);
      if (!normalized) return;

      const { action, object } = normalized;

      // 2. Stopword Filter
      const lowerObject = object.toLowerCase();
      if (this.stopwords.has(lowerObject) || lowerObject.length <= 2) {
        return;
      }

      // 3. Dedupe action + object combination
      const key = `${action}:${object.toLowerCase()}`;
      if (seen.has(key)) return;
      seen.add(key);

      // 4. CRUD Clustering (Verify it's a valid CRUD verb)
      if (this.crudVerbs.has(action)) {
        if (!nounActions.has(object)) {
          nounActions.set(object, new Set<string>());
        }
        nounActions.get(object)!.add(action);
      }
    });

    // 5. Promotion: If >= 3 CRUD operations target the same noun, promote
    const promoted: string[] = [];
    nounActions.forEach((actions, noun) => {
      if (actions.size >= 3) {
        promoted.push(noun);
      }
    });

    return promoted;
  }

  private normalizeWorkflow(rawName: string): { action: string; object: string } | null {
    // Basic splitting logic similar to BusinessCapabilityEngine.normalizeIntent
    let splitName = rawName.replace(/create/gi, ' create ').replace(/update/gi, ' update ').replace(/delete/gi, ' delete ').trim();
    const parts = splitName.split(/(?=[A-Z])|_|\s+|(?<=[a-z])(?=[A-Z])/).map(p => p.toLowerCase()).filter(Boolean);
    
    // Find verb
    const verbMap: Record<string, string> = {
      "create": "Create", "new": "Create", "add": "Create", "book": "Create",
      "update": "Update", "modify": "Update", "edit": "Update",
      "delete": "Delete", "remove": "Delete", "cancel": "Delete",
      "view": "View", "get": "View", "list": "View", "show": "View",
      "manage": "Manage"
    };

    let action = "";
    for (const part of parts) {
      if (verbMap[part]) {
        action = verbMap[part];
        break;
      }
    }

    if (!action) return null;

    // Find object/noun
    const objectParts = parts.filter(p => !verbMap[p]);
    const rawObject = objectParts.join('');
    if (!rawObject) return null;

    const object = this.capabilityEngine.normalizeConcept(rawObject);
    return { action, object };
  }
}
