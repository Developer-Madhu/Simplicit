import { BackendBlueprint } from "@/features/architecture/types";
import { NormalizedSchema } from "./schema-types";

export interface CodeGenerationTask {
  file: string;
  type: "schema" | "relations" | "route" | "service" | "migration" | "config" | "middleware" | "policy";
  status: "pending" | "completed";
  blueprintRef?: any;
}

/**
 * Code Generation Plan
 * Converts a BackendBlueprint into a set of discrete generation tasks.
 * Acts as the master contract for the generator.
 */
export class CodeGenerationPlan {
  public static create(blueprint: BackendBlueprint, schema: NormalizedSchema): CodeGenerationTask[] {
    const tasks: CodeGenerationTask[] = [];

    // 1. Database & Schema
    tasks.push({ file: "src/db/schema.ts", type: "schema", status: "pending" });
    tasks.push({ file: "src/db/relations.ts", type: "relations", status: "pending" });
    tasks.push({ file: "supabase/migrations/0000_init.sql", type: "migration", status: "pending" });

    // 2. API Routes & DTOs
    blueprint.entities.forEach(entity => {
        tasks.push({
            file: `src/dtos/${entity.name.toLowerCase()}.dto.ts`,
            type: "config",
            status: "pending",
            blueprintRef: entity
        });
    });

    blueprint.apis.forEach(api => {
        tasks.push({
            file: `src/app${api.path}/route.ts`,
            type: "route",
            status: "pending",
            blueprintRef: api
        });
    });

    // 3. Services
    blueprint.services.forEach(svc => {
        tasks.push({
            file: `src/services/${svc.name.toLowerCase().replace('service', '')}.service.ts`,
            type: "service",
            status: "pending",
            blueprintRef: svc
        });
    });

    // 4. Permissions & Auth
    tasks.push({ file: "src/middleware.ts", type: "middleware", status: "pending" });
    tasks.push({ file: "src/lib/permissions.ts", type: "policy", status: "pending" });
    tasks.push({ file: "supabase/seed.sql", type: "config", status: "pending" });

    // 5. Infrastructure
    tasks.push({ file: ".env.example", type: "config", status: "pending" });
    tasks.push({ file: "docker-compose.yml", type: "config", status: "pending" });

    return tasks;
  }
}
