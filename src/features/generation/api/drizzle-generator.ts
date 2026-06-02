import { NormalizedSchema } from "./schema-types";

/**
 * Deterministic Drizzle Generator
 * Converts NormalizedSchema into Drizzle ORM code strings.
 * No LLM involvement. Pure code compilation.
 */
export class DrizzleGenerator {
  public static generateSchema(schema: NormalizedSchema): string[] {
    const lines: string[] = [];
    lines.push(`import { pgTable, uuid, varchar, integer, boolean, timestamp, jsonb, text, pgEnum, uniqueIndex, index, foreignKey } from "drizzle-orm/pg-core";`);
    lines.push("");

    // 1. Generate Enums
    schema.enums.forEach(en => {
      lines.push(`export const ${en.name} = pgEnum('${en.name}', [${en.values.map(v => `'${v}'`).join(", ")}]);`);
    });
    if (schema.enums.length > 0) lines.push("");

    // 2. Generate Tables
    schema.tables.forEach(table => {
      lines.push(`export const ${table.name} = pgTable('${table.name}', {`);
      
      table.fields.forEach(field => {
        let colDef = `  ${field.name}: ${this.mapType(field.type)}('${field.name}')`;
        if (field.primaryKey && table.fields.filter(f => f.primaryKey).length === 1) {
            colDef += ".primaryKey()";
        }
        if (!field.nullable) colDef += ".notNull()";
        if (field.defaultValue) {
          if (field.defaultValue === "gen_random_uuid()") colDef += ".defaultRandom()";
          else if (field.defaultValue === "now()") colDef += ".defaultNow()";
          else {
              const val = isNaN(Number(field.defaultValue)) ? `'${field.defaultValue}'` : field.defaultValue;
              colDef += `.default(${val})`;
          }
        }
        lines.push(colDef + ",");
      });
      
      lines.push(`});`);
      lines.push("");
    });

    return lines;
  }

  public static generateRelations(schema: NormalizedSchema): string[] {
    const lines: string[] = [];
    lines.push(`import { relations } from "drizzle-orm";`);
    
    // Group tables to avoid missing imports if generated in separate files
    const tableNames = schema.tables.map(t => t.name);
    lines.push(`import { ${tableNames.join(", ")} } from "./schema";`);
    lines.push("");

    schema.tables.forEach(table => {
        const tableRels = schema.relationships.filter(r => r.fromTable === table.name);
        if (tableRels.length === 0) return;

        lines.push(`export const ${table.name}Relations = relations(${table.name}, ({ one, many }) => ({`);
        
        tableRels.forEach(rel => {
            const targetTable = rel.toTable;
            const targetName = targetTable.replace(/s$/, '');
            
            if (rel.type === "many-to-one") {
                lines.push(`  ${targetName}: one(${targetTable}, {`);
                lines.push(`    fields: [${table.name}.${rel.fromColumns[0]}],`);
                lines.push(`    references: [${targetTable}.${rel.toColumns[0]}],`);
                lines.push(`  }),`);
            } else if (rel.type === "one-to-many") {
                lines.push(`  ${targetTable}: many(${targetTable}),`);
            }
        });

        lines.push(`}));`);
        lines.push("");
    });

    return lines;
  }

  private static mapType(type: string): string {
    const t = type.toLowerCase();
    if (t === "uuid") return "uuid";
    if (t === "varchar") return "varchar";
    if (t === "integer") return "integer";
    if (t === "boolean") return "boolean";
    if (t === "timestamp") return "timestamp";
    if (t === "jsonb") return "jsonb";
    if (t === "decimal") return "integer"; // Fallback to integer for simplicity in Drizzle if not defined
    return "text";
  }
}
