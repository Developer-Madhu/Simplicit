import { BusinessCapability } from "../domain-intelligence-types";
import { ActionEndpoint } from "@/features/generation/api/surface-types";

/**
 * Capability API Generator
 * Generates action endpoints from business capabilities.
 * No AI. Pure transformation.
 */
export class CapabilityApiGenerator {
  public generate(capabilities: any[]): ActionEndpoint[] {
    return capabilities.map(cap => {
      const actionName = cap.name.toLowerCase().replace(/\s+/g, "-");
      const moduleName = cap.category ? `${this.capitalize(cap.category.replace('_MANAGEMENT', '').toLowerCase())}Module` : "CoreModule";

      return {
        module: moduleName,
        path: `/api/v1/actions/${actionName}`,
        method: "POST",
        description: cap.description,
        isProtected: true,
        requiredRoles: [],
        resource: "actions",
        kind: "action",
        params: [],
        capabilityId: cap.id,
        responseBody: { name: `${cap.name.replace(/\s+/g, '')}Response`, fields: [] }
      };
    });
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
