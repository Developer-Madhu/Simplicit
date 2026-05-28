export interface SchemaEnum {
  name: string;
  values: string[];
}

export interface SchemaField {
  name: string;
  type: string;
  primaryKey: boolean;
  nullable: boolean;
  defaultValue?: string;
  fk?: boolean;
}

export interface SchemaConstraint {
  name: string;
  type: "primary_key" | "foreign_key" | "unique" | "check";
  table: string;
  columns: string[];
  reference?: {
    table: string;
    columns: string[];
  };
}

export interface SchemaRelationship {
  name: string;
  fromTable: string;
  fromColumns: string[];
  toTable: string;
  toColumns: string[];
  type: "one-to-many" | "many-to-one" | "one-to-one" | "many-to-many";
}

export interface SchemaIndex {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
}

export interface NormalizedSchema {
  tables: Array<{
    name: string;
    fields: SchemaField[];
    indexes: SchemaIndex[];
    constraints: SchemaConstraint[];
  }>;
  enums: SchemaEnum[];
  relationships: SchemaRelationship[];
  indexes: SchemaIndex[];
}
