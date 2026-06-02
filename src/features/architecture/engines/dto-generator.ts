import { BlueprintEntity, BlueprintField } from "../types";
import { DtoDefinition, DtoField } from "@/features/generation/api/surface-types";

/**
 * DTO Generator
 * Generates Create, Update, and Response DTO definitions.
 * No AI. Pure transformation.
 */
export class DtoGenerator {
  public generate(entity: BlueprintEntity): DtoDefinition[] {
    const dtos: DtoDefinition[] = [];

    // 1. Response DTO (All fields)
    dtos.push({
      name: `${entity.name}Response`,
      fields: entity.fields.map(f => this.mapField(f))
    });

    // 2. Create DTO (No id, no created_at)
    dtos.push({
      name: `Create${entity.name}Request`,
      fields: entity.fields
        .filter(f => f.name !== 'id' && f.name !== 'created_at')
        .map(f => this.mapField(f))
    });

    // 3. Update DTO (All optional, no id, no created_at)
    dtos.push({
      name: `Update${entity.name}Request`,
      fields: entity.fields
        .filter(f => f.name !== 'id' && f.name !== 'created_at')
        .map(f => ({ ...this.mapField(f), isRequired: false }))
    });

    return dtos;
  }

  private mapField(f: BlueprintField): DtoField {
    return {
      name: f.name,
      type: this.mapType(f.type),
      isNullable: !!f.isNullable,
      isRequired: !f.isNullable && !f.isPrimary
    };
  }

  private mapType(dbType: string): string {
    const t = dbType.toLowerCase();
    if (t === 'varchar' || t === 'text') return 'string';
    if (t === 'integer' || t === 'decimal') return 'number';
    if (t === 'boolean') return 'boolean';
    if (t === 'timestamp') return 'Date';
    if (t === 'jsonb') return 'any';
    return 'string';
  }
}
