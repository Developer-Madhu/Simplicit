import { BlueprintInfraComponent } from "@/features/architecture/types";

/**
 * Infrastructure Compiler
 * Generates provider modules from stack selections.
 */
export class InfraModuleGenerator {
  public static generate(type: string, component: BlueprintInfraComponent): string {
    const provider = component.provider;
    
    if (type === 'database') {
      return this.compileDatabaseModule(provider);
    }
    if (type === 'auth') {
      return this.compileAuthModule(provider);
    }
    
    return `// Module for ${type} using ${provider} placeholder`;
  }

  private static compileDatabaseModule(provider: string): string {
    return `import { Module, Global } from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from '../db/schema';

@Global()
@Module({
  providers: [
    {
      provide: 'DRIZZLE_CLIENT',
      useFactory: () => {
        const pool = new Pool({
          connectionString: process.env.DATABASE_URL,
        });
        return drizzle(pool, { schema });
      },
    },
  ],
  exports: ['DRIZZLE_CLIENT'],
})
export class DatabaseModule {}
`;
  }

  private static compileAuthModule(provider: string): string {
    return `import { Module, Global } from '@nestjs/common';

@Global()
@Module({
  providers: [
    {
      provide: 'AUTH_SERVICE',
      useValue: { provider: '${provider}' },
    },
  ],
  exports: ['AUTH_SERVICE'],
})
export class AuthModule {}
`;
  }
}
