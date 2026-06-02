import { DtoField } from "./surface-types";

/**
 * DTO Validation Compiler
 * Transforms BlueprintField validation metadata into NestJS validation decorators.
 * No AI. Pure transformation.
 */
export class DtoValidationCompiler {
  public static compile(field: DtoField): string[] {
    const decorators: string[] = [];

    // 1. Basic Type Validation
    switch (field.type.toLowerCase()) {
      case "string":
        decorators.push("@IsString()");
        break;
      case "number":
      case "integer":
        decorators.push("@IsNumber()");
        break;
      case "boolean":
        decorators.push("@IsBoolean()");
        break;
      case "date":
        decorators.push("@IsDateString()");
        break;
    }

    // 2. Required/Optional
    if (field.isRequired) {
      decorators.push("@IsNotEmpty()");
    } else {
      decorators.push("@IsOptional()");
    }

    // 3. Metadata Validation
    if (field.validation) {
      const v = field.validation;

      if (v.format === "email") decorators.push("@IsEmail()");
      if (v.format === "uuid") decorators.push("@IsUUID()");
      if (v.format === "url") decorators.push("@IsUrl()");
      
      if (v.min !== undefined) decorators.push(`@Min(${v.min})`);
      if (v.max !== undefined) decorators.push(`@Max(${v.max})`);
      
      if (v.minLength !== undefined) decorators.push(`@MinLength(${v.minLength})`);
      if (v.maxLength !== undefined) decorators.push(`@MaxLength(${v.maxLength})`);
      
      if (v.pattern) decorators.push(`@Matches(/${v.pattern}/)`);
      if (v.enum) decorators.push(`@IsEnum([${v.enum.map(e => `'${e}'`).join(", ")}])`);
    }

    return decorators;
  }
}
