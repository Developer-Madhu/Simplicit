import { BackendBlueprint, BlueprintEntity } from "@/features/architecture/types";
import { NormalizedSchema } from "./schema-types";
import { 
  ApiSurfaceDefinition, 
  ServiceDefinition, 
  DtoDefinition, 
  PermissionDefinition 
} from "./surface-types";
import { DtoValidationCompiler } from "./dto-validation-compiler";
import { ServiceLogicCompiler } from "./service-logic-compiler";
import { InfraModuleGenerator } from "./infra-generator";
import { DependencyAssembler } from "./dependency-assembler";
import { EnvGenerator } from "./env-generator";

/**
 * NestJS Framework Compiler
 * Compiles deterministic contracts into a bootable NestJS project.
 */
export class NestJSGenerator {
  public static generate(
    blueprint: BackendBlueprint,
    schema: NormalizedSchema,
    apiSurface: ApiSurfaceDefinition[],
    services: ServiceDefinition[],
    dtos: DtoDefinition[],
    permissions: PermissionDefinition,
    implementations?: Record<string, Record<string, string>>,
    unitTests?: Record<string, string>
  ): Record<string, string> {
    const files: Record<string, string> = {};

    // 1. Generate Infrastructure Modules
    files[`src/infra/database.module.ts`] = InfraModuleGenerator.generate('database', blueprint.infrastructure.database);
    files[`src/infra/auth.module.ts`] = InfraModuleGenerator.generate('auth', blueprint.infrastructure.auth);

    // 2. Generate Modules
    blueprint.modules.forEach(mod => {
      const moduleName = mod.name;
      const folder = `src/modules/${moduleName.toLowerCase().replace('module', '')}`;
      
      files[`${folder}/${moduleName.toLowerCase()}.module.ts`] = this.compileModule(mod);
      
      // Controllers
      const modApis = apiSurface.filter(api => api.module === moduleName);
      if (modApis.length > 0) {
        files[`${folder}/${moduleName.toLowerCase()}.controller.ts`] = this.compileController(moduleName, modApis);
      }

      // Services
      const modServices = services.filter(svc => svc.module === moduleName);
      modServices.forEach(svc => {
        const serviceImpl = implementations?.[svc.name] || {};
        files[`${folder}/${svc.name.toLowerCase().replace('service', '')}.service.ts`] = this.compileService(svc, blueprint, serviceImpl);
      });
    });

    // 3. Generate DTOs
    dtos.forEach(dto => {
      files[`src/dto/${dto.name.toLowerCase()}.dto.ts`] = this.compileDto(dto);
    });

    // 4. Generate Core files
    files[`src/app.module.ts`] = this.compileAppModule(blueprint.modules);
    files[`src/main.ts`] = this.compileMain();

    // 5. Generate Health & Utils
    files[`src/modules/core/health.controller.ts`] = this.generateHealthController();
    files[`src/modules/core/core.module.ts`] = `import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
})
export class CoreModule {}
`;

    // 6. Config & Readme
    files[".env.example"] = EnvGenerator.generate(blueprint);
    files["README.md"] = this.generateReadme(blueprint);

    // 7. Project Metadata
    files[`package.json`] = this.generatePackageJson(blueprint);

    // 8. Generate Tests
    if (unitTests) {
      Object.entries(unitTests).forEach(([name, code]) => {
        files[`test/${name.toLowerCase().replace(/\s+/g, '-')}.spec.ts`] = code;
      });
    }

    return files;
  }

  private static compileModule(mod: any): string {
    const name = mod.name;
    const baseName = name.replace('Module', '');
    return `import { Module } from '@nestjs/common';
import { ${baseName}Controller } from './${name.toLowerCase()}.controller';
import { ${baseName}Service } from './${name.toLowerCase()}.service';

@Module({
  controllers: [${baseName}Controller],
  providers: [${baseName}Service],
  exports: [${baseName}Service],
})
export class ${name} {}
`;
  }

  private static compileController(moduleName: string, apis: ApiSurfaceDefinition[]): string {
    const baseName = moduleName.replace('Module', '');
    let code = `import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ${baseName}Service } from './${moduleName.toLowerCase()}.service';

@Controller('${apis[0].resource}')
export class ${baseName}Controller {
  constructor(private readonly service: ${baseName}Service) {}
`;

    apis.forEach(api => {
      const methodDecorator = this.mapMethodDecorator(api.method);
      const params = api.params.map(p => `@Param('${p}') ${p}: string`).join(', ');
      const body = api.requestBody ? `@Body() data: any` : '';
      const args = [...api.params, api.requestBody ? 'data' : ''].filter(Boolean).join(', ');
      const guard = api.isProtected ? `\n  @UseGuards() // TODO: Map to appropriate guard` : '';

      code += `
  ${methodDecorator}('${api.path.split('/').pop()?.replace(':id', ':id') || ''}')${guard}
  async ${this.methodName(api)}(${[params, body].filter(Boolean).join(', ')}) {
    return await this.service.${this.methodName(api)}(${args});
  }
`;
    });

    code += `}\n`;
    return code;
  }

  private static compileService(svc: ServiceDefinition, blueprint: BackendBlueprint, serviceImpl: Record<string, string>): string {
    const entityName = svc.name.replace('Service', '');
    const repoName = `${entityName}Repo`;
    let code = `import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';

@Injectable()
export class ${svc.name} {
  constructor(@Inject('DRIZZLE_CLIENT') private readonly db: any) {}

  // Repository helper (Internal)
  private get ${repoName.toLowerCase()}() {
    return {
        findMany: async () => await (this.db as any).select().from({}), // Placeholder for real Drizzle select
        findById: async (id: string) => ({ id }), 
        create: async (data: any) => data,
        update: async (id: string, data: any) => data,
        delete: async (id: string) => {}
    };
  }
`;

    // Extracting methods from contract
    const standardMethods = ["findAll", "findById", "create", "update", "delete"];
    
    // We combine standard methods and custom implementations
    const allMethodNames = Array.from(new Set([...standardMethods, ...Object.keys(serviceImpl)]));

    allMethodNames.forEach(m => {
        const customImpl = serviceImpl[m];
        const methodDef = { name: m, params: [], returnType: 'any', isAsync: true };
        
        code += `
  async ${m}(${this.mapParams(m)}) {
    ${customImpl || ServiceLogicCompiler.compileMethod(entityName, methodDef, entityName + 'Repo')}
  }
`;
    });

    code += `}\n`;
    return code;
  }

  private static compileDto(dto: DtoDefinition): string {
    let code = `import { IsString, IsNumber, IsBoolean, IsOptional, IsNotEmpty, IsEmail, IsUUID, IsUrl, IsDateString, Min, Max, MinLength, MaxLength, Matches, IsEnum } from 'class-validator';

export class ${dto.name} {
`;

    dto.fields.forEach(f => {
      const decorators = DtoValidationCompiler.compile(f);
      decorators.forEach(d => code += `  ${d}\n`);
      code += `  ${f.name}: ${f.type};\n\n`;
    });

    code += `}\n`;
    return code;
  }

  private static compileAppModule(modules: any[]): string {
    const allModules = [...modules, { name: 'CoreModule' }];
    const imports = allModules.map(m => m.name).join(', ');
    const importStatements = allModules.map(m => {
        const path = m.name === 'CoreModule' ? './modules/core/core.module' : `./modules/${m.name.toLowerCase().replace('module', '')}/${m.name.toLowerCase()}.module`;
        return `import { ${m.name} } from '${path}';`;
    }).join('\n');

    return `import { Module } from '@nestjs/common';
import { DatabaseModule } from './infra/database.module';
import { AuthModule } from './infra/auth.module';
${importStatements}

@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    ${imports}
  ],
})
export class AppModule {}
`;
  }

  private static compileMain(): string {
    return `import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
`;
  }

  private static generateHealthController(): string {
    return `import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('version')
  version() {
    return { version: '0.0.1', engine: 'Simplicit-1.0' };
  }
}
`;
  }

  private static generateReadme(blueprint: BackendBlueprint): string {
    return `# ${blueprint.overview?.name || "Simplicit Backend"}

Generated by Simplicit Framework Compiler.

## Getting Started

1. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

2. **Setup Environment**
   Copy \`.env.example\` to \`.env\` and fill in the required credentials.
   \`\`\`bash
   cp .env.example .env
   \`\`\`

3. **Database Setup**
   Ensure your PostgreSQL instance is running and accessible via \`DATABASE_URL\`.
   \`\`\`bash
   npm run db:push
   \`\`\`

4. **Start the server**
   \`\`\`bash
   npm run start:dev
   \`\`\`

## API Endpoints

- Health Check: \`GET /health\`
- Version: \`GET /health/version\`

### Resources
${blueprint.entities.map(e => `- ${e.name}: \`/api/v1/${e.tableName.toLowerCase()}\``).join('\n')}

## Architecture

- **Framework**: NestJS
- **ORM**: Drizzle
- **Database**: ${blueprint.infrastructure.database.provider}
- **Auth**: ${blueprint.infrastructure.auth.provider}
`;
  }

  private static generatePackageJson(blueprint: BackendBlueprint): string {
    const dependencies = DependencyAssembler.assemble(blueprint);
    
    return JSON.stringify({
      name: blueprint.overview?.name.toLowerCase().replace(/\s+/g, '-') || "simplicit-backend",
      version: "0.0.1",
      description: "Generated by Simplicit",
      scripts: {
        "build": "nest build",
        "format": "prettier --write \"src/**/*.ts\"",
        "start": "nest start",
        "start:dev": "nest start --watch",
        "start:debug": "nest start --debug --watch",
        "start:prod": "node dist/main",
        "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
        "db:push": "drizzle-kit push:pg"
      },
      dependencies,
      devDependencies: {
        "@nestjs/cli": "^10.0.0",
        "@nestjs/schematics": "^10.0.0",
        "typescript": "^5.1.3",
        "drizzle-kit": "^0.20.0"
      }
    }, null, 2);
  }

  private static mapMethodDecorator(method: string): string {
    const m = method.toUpperCase();
    if (m === 'GET') return '@Get';
    if (m === 'POST') return '@Post';
    if (m === 'PATCH') return '@Patch';
    if (m === 'DELETE') return '@Delete';
    return '@Get';
  }

  private static methodName(api: ApiSurfaceDefinition): string {
    if (api.kind === 'crud') {
        if (api.method === 'GET' && !api.params.includes('id')) return 'findAll';
        if (api.method === 'GET') return 'findById';
        if (api.method === 'POST') return 'create';
        if (api.method === 'PATCH') return 'update';
        if (api.method === 'DELETE') return 'delete';
    }
    return api.path.split('/').pop()?.replace('-', '') || 'action';
  }

  private static mapParams(method: string): string {
    if (method === 'findById' || method === 'delete') return 'id: string';
    if (method === 'create') return 'data: any';
    if (method === 'update') return 'id: string, data: any';
    return '';
  }
}
