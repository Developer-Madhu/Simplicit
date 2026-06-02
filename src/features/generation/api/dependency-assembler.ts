import { BackendBlueprint } from "@/features/architecture/types";

/**
 * Dependency Assembler
 * Generates package.json dependencies based on selected stack.
 */
export class DependencyAssembler {
  public static assemble(blueprint: BackendBlueprint): Record<string, string> {
    const dependencies: Record<string, string> = {
      "@nestjs/common": "^10.0.0",
      "@nestjs/core": "^10.0.0",
      "@nestjs/platform-express": "^10.0.0",
      "reflect-metadata": "^0.1.13",
      "rxjs": "^7.8.1",
      "class-validator": "^0.14.0",
      "class-transformer": "^0.5.1",
      "drizzle-orm": "^0.29.0",
      "pg": "^8.11.3"
    };

    const infra = blueprint.infrastructure;

    // Database
    if (infra.database.provider.toLowerCase().includes('supabase')) {
      dependencies["@supabase/supabase-js"] = "^2.39.0";
    }

    // Auth
    if (infra.auth.provider.toLowerCase().includes('clerk')) {
      dependencies["@clerk/clerk-sdk-node"] = "^4.12.0";
    } else if (infra.auth.provider.toLowerCase().includes('lucia')) {
      dependencies["lucia"] = "^3.0.0";
    }

    // Storage
    if (infra.storage.provider.toLowerCase().includes('cloudinary')) {
      dependencies["cloudinary"] = "^1.41.0";
    }

    // Payments
    if (infra.payments.provider.toLowerCase().includes('stripe')) {
      dependencies["stripe"] = "^14.10.0";
    }

    // Email
    if (infra.email.provider.toLowerCase().includes('resend')) {
      dependencies["resend"] = "^2.0.0";
    }

    return dependencies;
  }
}
