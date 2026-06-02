import { BackendBlueprint, BlueprintPermission } from "../types";
import { PermissionDefinition, PermissionPolicy } from "@/features/generation/api/surface-types";

/**
 * Permission Generator
 * Generates framework-neutral permission policies and RLS rules.
 * No AI. Pure transformation.
 */
export class PermissionGenerator {
  public generate(blueprint: BackendBlueprint): PermissionDefinition {
    const policies: PermissionPolicy[] = [];
    const rlsRules: string[] = [];

    // 1. Role-based Policies from Blueprint
    blueprint.permissions.forEach(perm => {
      policies.push({
        resource: perm.resource,
        role: perm.role,
        action: perm.action,
        effect: "allow"
      });
    });

    // 2. Ownership-based RLS Rules
    blueprint.entities.forEach(entity => {
      if (entity.ownership?.ownedBy) {
        const ownerField = entity.fields.find(f => f.name.includes(entity.ownership!.ownedBy!));
        if (ownerField) {
            rlsRules.push(`CREATE POLICY owner_access ON ${entity.tableName} FOR ALL USING (auth.uid() = ${ownerField.name});`);
            
            // Add implicit policies for owners
            blueprint.infrastructure.auth.provider !== "Unknown" && policies.push({
                resource: entity.tableName,
                role: "authenticated",
                action: "manage_own",
                effect: "allow",
                condition: `owner_field == current_user_id`
            });
        }
      }
    });

    return {
      policies,
      rlsRules
    };
  }
}
