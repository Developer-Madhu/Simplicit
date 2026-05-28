import { BusinessCapability, DomainEntity } from "../domain-intelligence-types";

export interface CapabilityValidationError {
  type: "ORPHAN_CAPABILITY";
  capability: string;
  missingEntity: string;
}

export class CapabilityEntityValidator {
  /**
   * Validates capability-entity consistency
   */
  public validate(
    capabilities: BusinessCapability[],
    entities: DomainEntity[]
  ): { isValid: boolean; errors: CapabilityValidationError[]; errorStrings: string[] } {
    const errors: CapabilityValidationError[] = [];
    const errorStrings: string[] = [];

    const entityNames = new Set(entities.map(e => e.name.toLowerCase()));

    capabilities.forEach(cap => {
      // Find the entity name from the capability name (e.g. "Create Listing" -> "Listing")
      const parts = cap.name.split(" ");
      if (parts.length >= 2) {
        const action = parts[0];
        const entityName = parts.slice(1).join(" ");
        
        // Actions that require an owning entity
        const entityActions = ["Create", "Update", "Delete", "Manage", "View", "Cancel"];
        
        if (entityActions.includes(action)) {
          // Special exception: "User" is a global entity, but "Listing", "Reservation", "Review", "Payment" must exist
          if (!entityNames.has(entityName.toLowerCase())) {
            errors.push({
              type: "ORPHAN_CAPABILITY",
              capability: cap.name,
              missingEntity: entityName
            });
            errorStrings.push(`[ORPHAN_CAPABILITY] Capability '${cap.name}' requires missing entity '${entityName}'.`);
          }
        }
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
      errorStrings
    };
  }
}
