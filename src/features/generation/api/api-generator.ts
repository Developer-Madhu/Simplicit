import { RouteSummary } from "@/lib/types";
import { NormalizedSchema } from "./schema-types";

export class APIGenerator {
  /**
   * Enrich raw apiRoutes lists with schemas, validations, names, and grouping based on schema details.
   */
  public static enrich(apiRoutes: RouteSummary[], schema?: NormalizedSchema): RouteSummary[] {
    return apiRoutes.map((route) => {
      // 1. Determine resource and group names
      const pathParts = route.path.split("/").filter((p) => p && p !== "v1");
      const resource = pathParts[0] || "auth";
      const isParam = pathParts.some((p) => p.startsWith(":"));

      const groupName = resource.charAt(0).toUpperCase() + resource.slice(1);
      const actionName = this.getActionName(route.method, route.path, resource, isParam);

      // 2. Identify corresponding schema table
      const tableName = this.findMatchingTable(resource, schema);
      const table = schema?.tables.find((t) => t.name === tableName);

      // 3. Generate Request/Response Payloads & Validation Rules
      let requestPayload = "";
      let responsePayload = "";
      const validationRules: string[] = [];

      if (table) {
        const columns = table.fields || [];

        switch (route.method) {
          case "POST":
            requestPayload = this.generateCreatePayload(columns);
            responsePayload = this.generateSingleResponse(columns);
            validationRules.push(...this.generateCreateValidations(columns));
            break;
          case "GET":
            if (isParam) {
              requestPayload = "None (URL Parameter)";
              responsePayload = this.generateSingleResponse(columns);
              validationRules.push("id path parameter must be a valid UUID");
            } else {
              requestPayload = "Query Parameters:\nlimit?: number (pagination limit)\noffset?: number (pagination offset)\nq?: string (search term)";
              responsePayload = this.generateListResponse(resource, columns);
              validationRules.push(
                "limit query parameter must be a positive integer (max: 100)",
                "offset query parameter must be a positive integer"
              );
            }
            break;
          case "PUT":
          case "PATCH":
            requestPayload = this.generateUpdatePayload(columns);
            responsePayload = this.generateSingleResponse(columns);
            validationRules.push(
              "id path parameter must be a valid UUID",
              ...this.generateUpdateValidations(columns)
            );
            break;
          case "DELETE":
            requestPayload = "None (URL Parameter)";
            responsePayload = `{\n  "success": true,\n  "message": "${resource} deleted successfully"\n}`;
            validationRules.push("id path parameter must be a valid UUID");
            break;
        }
      } else {
        // Fallback for custom endpoints (auth, stripe, stats)
        const customGen = this.generateCustomPayloads(route.path, route.method);
        requestPayload = customGen.req;
        responsePayload = customGen.res;
        validationRules.push(...customGen.validations);
      }

      return {
        ...route,
        name: actionName,
        group: groupName,
        requestPayload,
        responsePayload,
        validationRules
      };
    });
  }

  private static getActionName(method: string, path: string, resource: string, isParam: boolean): string {
    const term = resource.endsWith("s") ? resource.slice(0, -1) : resource;
    const termCap = term.charAt(0).toUpperCase() + term.slice(1);

    if (path.includes("webhook")) return "Handle Stripe Webhook";
    if (path.includes("register") || path.includes("signup")) return "Register User";
    if (path.includes("login")) return "Authenticate User";
    if (path.includes("me")) return "Get Current Profile";
    if (path.includes("checkout")) return "Create Billing Checkout Session";

    switch (method) {
      case "GET":
        return isParam ? `Get ${termCap}` : `List ${termCap}s`;
      case "POST":
        return `Create ${termCap}`;
      case "PUT":
      case "PATCH":
        return `Update ${termCap}`;
      case "DELETE":
        return `Delete ${termCap}`;
      default:
        return `${method} ${path}`;
    }
  }

  private static findMatchingTable(resource: string, schema?: NormalizedSchema): string | null {
    if (!schema) return null;
    const plural = resource.endsWith("s") ? resource : resource + "s";
    const singular = resource.endsWith("s") ? resource.slice(0, -1) : resource;

    for (const t of schema.tables) {
      const name = t.name.toLowerCase();
      if (name === resource.toLowerCase() || name === plural.toLowerCase() || name === singular.toLowerCase()) {
        return t.name;
      }
    }
    return null;
  }

  private static mapSqlType(sqlType: string): string {
    const type = sqlType.toLowerCase();
    if (type.includes("uuid") || type.includes("text") || type.includes("char") || type.includes("timestamp") || type.includes("date")) {
      return "string";
    }
    if (type.includes("int") || type.includes("number") || type.includes("float") || type.includes("double") || type.includes("numeric")) {
      return "number";
    }
    if (type.includes("bool")) {
      return "boolean";
    }
    if (type.includes("json")) {
      return "Record<string, any>";
    }
    return "any";
  }

  private static generateCreatePayload(columns: any[]): string {
    const props: string[] = [];
    columns.forEach((col) => {
      const isAuto = col.primaryKey || col.defaultValue || col.name === "created_at" || col.name === "updated_at";
      if (!isAuto) {
        const jsType = this.mapSqlType(col.type);
        props.push(`  "${col.name}"${col.nullable ? "?" : ""}: ${jsType};`);
      }
    });

    if (props.length === 0) return "{\n  // No payload attributes required\n}";
    return `{\n${props.join("\n")}\n}`;
  }

  private static generateUpdatePayload(columns: any[]): string {
    const props: string[] = [];
    columns.forEach((col) => {
      if (!col.primaryKey && col.name !== "created_at" && col.name !== "updated_at") {
        const jsType = this.mapSqlType(col.type);
        props.push(`  "${col.name}"?: ${jsType};`);
      }
    });

    return `{\n${props.join("\n")}\n}`;
  }

  private static generateSingleResponse(columns: any[]): string {
    const props = columns.map((col) => {
      const jsType = this.mapSqlType(col.type);
      return `  "${col.name}": ${jsType}${col.nullable ? " | null" : ""};`;
    });
    return `{\n${props.join("\n")}\n}`;
  }

  private static generateListResponse(resource: string, columns: any[]): string {
    const props = columns.map((col) => {
      const jsType = this.mapSqlType(col.type);
      return `      "${col.name}": ${jsType}${col.nullable ? " | null" : ""};`;
    });
    return `{\n  "data": Array<{\n${props.join("\n")}\n  }>,\n  "pagination": {\n    "total": number,\n    "limit": number,\n    "offset": number\n  }\n}`;
  }

  private static generateCreateValidations(columns: any[]): string[] {
    const rules: string[] = [];
    columns.forEach((col) => {
      const isAuto = col.primaryKey || col.defaultValue || col.name === "created_at" || col.name === "updated_at";
      if (!isAuto && !col.nullable) {
        rules.push(`${col.name} is a required body parameter`);
      }
      if (col.name.includes("email")) {
        rules.push(`${col.name} must be a valid email format`);
      }
    });
    return rules;
  }

  private static generateUpdateValidations(columns: any[]): string[] {
    const rules: string[] = [];
    columns.forEach((col) => {
      if (col.name.includes("email")) {
        rules.push(`${col.name} must be a valid email format if provided`);
      }
    });
    return rules;
  }

  private static generateCustomPayloads(path: string, method: string): { req: string; res: string; validations: string[] } {
    if (path.includes("login")) {
      return {
        req: `{\n  "email": string;\n  "password": string;\n}`,
        res: `{\n  "user": {\n    "id": string;\n    "email": string;\n    "name": string | null;\n  },\n  "session": {\n    "token": string;\n    "expiresAt": string;\n  }\n}`,
        validations: ["email is required and must be a valid format", "password is required (min: 8 characters)"]
      };
    }
    if (path.includes("register") || path.includes("signup")) {
      return {
        req: `{\n  "email": string;\n  "password": string;\n  "name"?: string;\n}`,
        res: `{\n  "user": {\n    "id": string;\n    "email": string;\n    "name": string | null;\n  },\n  "session": {\n    "token": string;\n    "expiresAt": string;\n  }\n}`,
        validations: ["email is required and must be a valid format", "password is required (min: 8 characters)"]
      };
    }
    if (path.includes("checkout")) {
      return {
        req: `{\n  "priceId": string;\n  "successUrl": string;\n  "cancelUrl": string;\n}`,
        res: `{\n  "url": string; // Stripe checkout session URL\n}`,
        validations: ["priceId is required", "successUrl must be a valid HTTP URL", "cancelUrl must be a valid HTTP URL"]
      };
    }
    if (path.includes("webhook")) {
      return {
        req: `{\n  "id": string;\n  "type": string;\n  "data": Record<string, any>;\n}`,
        res: `{\n  "received": true\n}`,
        validations: ["Stripe-Signature header must be present and valid"]
      };
    }

    if (method === "GET") {
      return {
        req: "None",
        res: `{\n  "status": "success",\n  "data": any\n}`,
        validations: []
      };
    }
    return {
      req: `{\n  // Custom parameters\n}`,
      res: `{\n  "status": "success"\n}`,
      validations: []
    };
  }
}
