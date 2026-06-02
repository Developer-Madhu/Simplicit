import { BackendBlueprint } from "../types";
import { NormalizedSchema, SchemaField, SchemaConstraint, SchemaRelationship, SchemaIndex } from "@/features/generation/api/schema-types";

/**
 * Deterministic Schema Compiler
 * Converts BackendBlueprint into a generation-ready DatabaseSchema (NormalizedSchema).
 * Pure transformation with NO AI involvement.
 */
export class SchemaCompiler {
  public compile(blueprint: BackendBlueprint): NormalizedSchema {
    const tables: NormalizedSchema["tables"] = [];
    const relationships: SchemaRelationship[] = [];
    const globalIndexes: SchemaIndex[] = [];

    // 1. Process Entities into Tables
    blueprint.entities.forEach(entity => {
      const fields: SchemaField[] = entity.fields.map(f => ({
        name: f.name,
        type: f.type,
        primaryKey: !!f.isPrimary,
        nullable: !!f.isNullable,
        defaultValue: this.inferDefaultValue(f.name, f.type),
        fk: !!f.references
      }));

      const tableIndexes: SchemaIndex[] = (entity.indexes || []).map(idx => ({
        name: `idx_${entity.tableName}_${idx}`,
        table: entity.tableName,
        columns: [idx],
        unique: false
      }));

      const tableConstraints: SchemaConstraint[] = (entity.constraints || []).map(c => ({
        name: `c_${entity.tableName}_${c.toLowerCase().replace(/\s+/g, '_').slice(0, 30)}`,
        type: "check",
        table: entity.tableName,
        columns: []
      }));

      // Add Primary Key constraint
      const pkFields = fields.filter(f => f.primaryKey).map(f => f.name);
      if (pkFields.length > 0) {
        tableConstraints.push({
          name: `pk_${entity.tableName}`,
          type: "primary_key",
          table: entity.tableName,
          columns: pkFields
        });
      }

      tables.push({
        name: entity.tableName,
        fields,
        indexes: tableIndexes,
        constraints: tableConstraints
      });

      globalIndexes.push(...tableIndexes);
    });

    // 2. Process Relationships into Foreign Keys and Junction Tables
    blueprint.entities.forEach(entity => {
      if (entity.relationships) {
        entity.relationships.forEach(rel => {
          const targetEntity = blueprint.entities.find(e => e.name === rel.target);
          if (!targetEntity) return;

          if (rel.type === "many-to-many") {
            this.handleManyToMany(entity, targetEntity, tables, relationships, globalIndexes);
          } else {
            this.handleStandardRelationship(entity, targetEntity, rel, tables, relationships);
          }
        });
      }
    });

    return {
      tables,
      enums: [], // Enums can be added if blueprint supports them
      relationships,
      indexes: globalIndexes
    };
  }

  private inferDefaultValue(name: string, type: string): string | undefined {
    if (name === 'id' && type === 'uuid') return 'gen_random_uuid()';
    if (name === 'created_at' && type === 'timestamp') return 'now()';
    return undefined;
  }

  private handleStandardRelationship(
    source: any, 
    target: any, 
    rel: any, 
    tables: any[], 
    relationships: SchemaRelationship[]
  ) {
    const fromTable = rel.type === "many-to-one" || rel.type === "one-to-one" ? source.tableName : target.tableName;
    const toTable = rel.type === "many-to-one" || rel.type === "one-to-one" ? target.tableName : source.tableName;
    const fkColumn = `${toTable.replace(/s$/, '')}_id`;

    // Ensure FK column exists
    const table = tables.find(t => t.name === fromTable);
    if (table) {
      if (!table.fields.some((f: any) => f.name === fkColumn)) {
        table.fields.push({
          name: fkColumn,
          type: "uuid",
          primaryKey: false,
          nullable: true,
          fk: true
        });
      }

      // Add FK constraint
      table.constraints.push({
        name: `fk_${fromTable}_${fkColumn}`,
        type: "foreign_key",
        table: fromTable,
        columns: [fkColumn],
        reference: {
          table: toTable,
          columns: ["id"]
        }
      });

      relationships.push({
        name: `${fromTable}.${fkColumn} → ${toTable}.id`,
        fromTable,
        fromColumns: [fkColumn],
        toTable,
        toColumns: ["id"],
        type: rel.type
      });
    }
  }

  private handleManyToMany(
    source: any, 
    target: any, 
    tables: any[], 
    relationships: SchemaRelationship[],
    globalIndexes: SchemaIndex[]
  ) {
    const joinTableName = [source.tableName, target.tableName].sort().join('_');
    
    if (tables.some(t => t.name === joinTableName)) return;

    const sourceFk = `${source.tableName.replace(/s$/, '')}_id`;
    const targetFk = `${target.tableName.replace(/s$/, '')}_id`;

    const fields: SchemaField[] = [
      { name: sourceFk, type: "uuid", primaryKey: true, nullable: false, fk: true },
      { name: targetFk, type: "uuid", primaryKey: true, nullable: false, fk: true },
      { name: "created_at", type: "timestamp", primaryKey: false, nullable: false, defaultValue: "now()" }
    ];

    const constraints: SchemaConstraint[] = [
      {
        name: `pk_${joinTableName}`,
        type: "primary_key",
        table: joinTableName,
        columns: [sourceFk, targetFk]
      },
      {
        name: `fk_${joinTableName}_${sourceFk}`,
        type: "foreign_key",
        table: joinTableName,
        columns: [sourceFk],
        reference: { table: source.tableName, columns: ["id"] }
      },
      {
        name: `fk_${joinTableName}_${targetFk}`,
        type: "foreign_key",
        table: joinTableName,
        columns: [targetFk],
        reference: { table: target.tableName, columns: ["id"] }
      }
    ];

    tables.push({
      name: joinTableName,
      fields,
      indexes: [],
      constraints
    });

    relationships.push({
      name: `${joinTableName} junction`,
      fromTable: source.tableName,
      fromColumns: ["id"],
      toTable: target.tableName,
      toColumns: ["id"],
      type: "many-to-many"
    });
  }
}
