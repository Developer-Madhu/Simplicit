import {
  NormalizedSchema,
  SchemaEnum,
  SchemaField,
  SchemaConstraint,
  SchemaRelationship,
  SchemaIndex
} from "./schema-types";
import { SchemaTable } from "@/lib/types";

export class SchemaParser {
  /**
   * Parse Drizzle ORM code lines and visual SchemaTable models to compile a normalized schema structure.
   */
  public static parse(schemaCode: string[], schemaTables: SchemaTable[]): NormalizedSchema {
    const code = schemaCode.join("\n");
    const enums: SchemaEnum[] = [];
    const tables: NormalizedSchema["tables"] = [];
    const relationships: SchemaRelationship[] = [];
    const globalIndexes: SchemaIndex[] = [];

    // 1. Parse Enums: export const userRole = pgEnum('user_role', ['admin', 'user'])
    const enumRegex = /pgEnum\s*\(\s*['"]([^'"]+)['"]\s*,\s*\[\s*([^\]]+)\s*\]\s*\)/g;
    let match;
    while ((match = enumRegex.exec(code)) !== null) {
      const name = match[1];
      const values = match[2]
        .split(",")
        .map((v) => v.replace(/['"\s]/g, ""))
        .filter((v) => v.length > 0);
      enums.push({ name, values });
    }

    // 2. Parse Tables: export const users = pgTable('users', { ... })
    const tableRegex = /export\s+const\s+(\w+)\s*=\s*pgTable\s*\(\s*['"]([^'"]+)['"]\s*,\s*\{([\s\S]*?)\}/g;
    const tableMatches: Array<{ jsName: string; dbName: string; body: string }> = [];
    while ((match = tableRegex.exec(code)) !== null) {
      tableMatches.push({
        jsName: match[1],
        dbName: match[2],
        body: match[3]
      });
    }

    // Fall back to schemaTables layout if pgTable pattern doesn't parse
    if (tableMatches.length === 0) {
      for (const st of schemaTables) {
        const fields: SchemaField[] = (st.columns || []).map((col) => ({
          name: col.name,
          type: col.type,
          primaryKey: !!col.pk,
          nullable: !col.pk,
          fk: !!col.fk
        }));

        tables.push({
          name: st.name,
          fields,
          indexes: [],
          constraints: []
        });
      }
    } else {
      for (const tMatch of tableMatches) {
        const fields: SchemaField[] = [];
        const tableIndexes: SchemaIndex[] = [];
        const tableConstraints: SchemaConstraint[] = [];

        // Parse fields inside table definition
        const lines = tMatch.body.split("\n");
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("//") || trimmed.startsWith("/*")) continue;

          // e.g. id: uuid('id').primaryKey().defaultRandom(),
          const colMatch = trimmed.match(/^(\w+)\s*:\s*(\w+)\s*\(\s*['"]?([^'")]*)['"]?\s*\)/);
          if (colMatch) {
            const jsName = colMatch[1];
            const colType = colMatch[2];
            const dbName = colMatch[3] || jsName;

            const primaryKey = trimmed.includes(".primaryKey()");
            const nullable = !trimmed.includes(".notNull()") && !primaryKey;

            // Default values
            let defaultValue: string | undefined;
            if (trimmed.includes(".defaultRandom()")) defaultValue = "gen_random_uuid()";
            else if (trimmed.includes(".defaultNow()")) defaultValue = "now()";
            else {
              const defMatch = trimmed.match(/\.default\(([^)]+)\)/);
              if (defMatch) {
                defaultValue = defMatch[1];
              }
            }

            // References
            let fk = false;
            if (trimmed.includes(".references(")) {
              fk = true;
              const refMatch = trimmed.match(/\.references\(\s*\(\s*\)\s*=>\s*([\w_]+)\.([\w_]+)\s*\)/);
              if (refMatch) {
                const refTable = refMatch[1];
                const refCol = refMatch[2];
                tableConstraints.push({
                  name: `fk_${tMatch.dbName}_${dbName}`,
                  type: "foreign_key",
                  table: tMatch.dbName,
                  columns: [dbName],
                  reference: {
                    table: refTable,
                    columns: [refCol]
                  }
                });
              }
            }

            fields.push({
              name: dbName,
              type: colType,
              primaryKey,
              nullable,
              defaultValue,
              fk
            });

            // Unique constraint / index
            if (trimmed.includes(".unique()")) {
              tableConstraints.push({
                name: `uq_${tMatch.dbName}_${dbName}`,
                type: "unique",
                table: tMatch.dbName,
                columns: [dbName]
              });
              const idxName = `idx_${tMatch.dbName}_${dbName}_unique`;
              const uniqueIdx = {
                name: idxName,
                table: tMatch.dbName,
                columns: [dbName],
                unique: true
              };
              tableIndexes.push(uniqueIdx);
              globalIndexes.push(uniqueIdx);
            }
          }
        }

        tables.push({
          name: tMatch.dbName,
          fields,
          indexes: tableIndexes,
          constraints: tableConstraints
        });
      }
    }

    // 3. Parse Indexes: uniqueIndex('name_idx').on(table.column)
    const indexRegex = /(uniqueIndex|index)\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\.\s*on\s*\(\s*\w+\.([\w_]+)\s*\)/g;
    let idxMatch;
    while ((idxMatch = indexRegex.exec(code)) !== null) {
      const isUnique = idxMatch[1] === "uniqueIndex";
      const idxName = idxMatch[2];
      const colName = idxMatch[3];

      // Associate with target table
      let targetTableName = "";
      for (const t of tables) {
        const tableDefIndex = code.indexOf(`pgTable('${t.name}'`);
        if (tableDefIndex !== -1) {
          const subCode = code.slice(tableDefIndex, tableDefIndex + 1500);
          if (subCode.includes(idxName)) {
            targetTableName = t.name;
            break;
          }
        }
      }

      if (targetTableName) {
        const newIdx: SchemaIndex = {
          name: idxName,
          table: targetTableName,
          columns: [colName],
          unique: isUnique
        };
        const tbl = tables.find((t) => t.name === targetTableName);
        if (tbl && !tbl.indexes.some((i) => i.name === idxName)) {
          tbl.indexes.push(newIdx);
        }
        if (!globalIndexes.some((i) => i.name === idxName)) {
          globalIndexes.push(newIdx);
        }
      }
    }

    // 4. Populate primary keys as constraints and map relationships
    for (const t of tables) {
      const pkFields = t.fields.filter((f) => f.primaryKey).map((f) => f.name);
      if (pkFields.length > 0 && !t.constraints.some((c) => c.type === "primary_key")) {
        t.constraints.push({
          name: `pk_${t.name}`,
          type: "primary_key",
          table: t.name,
          columns: pkFields
        });
      }
    }

    // Synthesize connections
    for (const t of tables) {
      for (const field of t.fields) {
        let referencedTable = "";
        let referencedCol = "id";

        const fkConst = t.constraints.find(
          (c) => c.type === "foreign_key" && c.columns.includes(field.name)
        );
        if (fkConst && fkConst.reference) {
          referencedTable = fkConst.reference.table;
          referencedCol = fkConst.reference.columns[0];
        } else if (field.fk) {
          // Naming convention fallback
          let target = field.name.replace("_id", "");
          if (
            target === "instructor" ||
            target === "student" ||
            target === "owner" ||
            target === "seller" ||
            target === "buyer"
          ) {
            referencedTable = "users";
          } else {
            if (target === "course") referencedTable = "courses";
            else if (target === "exam") referencedTable = "exams";
            else if (target === "listing") referencedTable = "listings";
            else if (target === "workspace") referencedTable = "workspaces";
            else {
              referencedTable = target.endsWith("s") ? target : target + "s";
            }
          }
        }

        if (referencedTable && tables.some((other) => other.name === referencedTable)) {
          // Check for unique key mapping
          const isUnique =
            t.constraints.some((c) => c.type === "unique" && c.columns.includes(field.name)) ||
            t.indexes.some((i) => i.unique && i.columns.includes(field.name));

          const relType = isUnique ? "one-to-one" : "many-to-one";

          // Add Many-to-One / One-to-One
          relationships.push({
            name: `${t.name}.${field.name} → ${referencedTable}.${referencedCol}`,
            fromTable: t.name,
            fromColumns: [field.name],
            toTable: referencedTable,
            toColumns: [referencedCol],
            type: relType
          });

          // Add One-to-Many / One-to-One inverse
          relationships.push({
            name: `${referencedTable}.${referencedCol} → ${t.name}.${field.name}`,
            fromTable: referencedTable,
            fromColumns: [referencedCol],
            toTable: t.name,
            toColumns: [field.name],
            type: isUnique ? "one-to-one" : "one-to-many"
          });
        }
      }
    }

    // Index verification for performance
    for (const t of tables) {
      for (const field of t.fields) {
        if (field.fk && !t.indexes.some((idx) => idx.columns.includes(field.name))) {
          const idxName = `idx_${t.name}_${field.name}`;
          const newIdx = {
            name: idxName,
            table: t.name,
            columns: [field.name],
            unique: false
          };
          t.indexes.push(newIdx);
          if (!globalIndexes.some((i) => i.name === idxName)) {
            globalIndexes.push(newIdx);
          }
        }
      }
    }

    return {
      tables,
      enums,
      relationships,
      indexes: globalIndexes
    };
  }
}
