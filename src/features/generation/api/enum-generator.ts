/**
 * Enum Generator
 * Generates reusable NestJS enums from blueprint metadata.
 */
export class EnumGenerator {
  public static generate(name: string, values: string[]): string {
    const enumName = name.charAt(0).toUpperCase() + name.slice(1);
    let code = `export enum ${enumName} {\n`;
    values.forEach(v => {
      code += `  ${v.toUpperCase()} = "${v.toUpperCase()}",\n`;
    });
    code += `}`;
    return code;
  }
}
