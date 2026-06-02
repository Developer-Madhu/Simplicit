import { OpenAIService } from "./openai";
import { BackendBlueprint, BlueprintCapability } from "@/features/architecture/types";
import { ServiceDefinition, DtoDefinition } from "./surface-types";
import { AIContextBuilder } from "./ai-context-builder";
import { BUSINESS_LOGIC_SYSTEM_PROMPT } from "./business-logic-system-prompt";
import { AIOutputValidator } from "./ai-output-validator";

/**
 * Service Logic AI Engine
 * Orchestrates LLM calls to generate implementations for service methods.
 * Operates as a constrained implementer within the architecture contract.
 */
export class ServiceLogicAIEngine {
  public static async implement(
    blueprint: BackendBlueprint,
    services: ServiceDefinition[],
    dtos: DtoDefinition[]
  ): Promise<Record<string, Record<string, string>>> {
    const implementations: Record<string, Record<string, string>> = {};

    for (const service of services) {
      implementations[service.name] = {};
      
      const entityName = service.name.replace('Service', '');
      const relevantCapabilities = blueprint.capabilities.filter(c => c.associatedEntity === entityName);

      const allowedRepos = services.map(s => s.name.replace('Service', 'Repo'));
      const allowedDtos = dtos.map(d => d.name);

      for (const capability of relevantCapabilities) {
        const methodName = capability.name.split(' ').map((w: string, i: number) => i === 0 ? w.toLowerCase() : w).join('');
        
        // Find the matching method in the service contract
        // The generator uses standard names for CRUD, but custom names for capabilities
        const methodContract = (service as any).methods?.find((m: any) => m === methodName || m.name === methodName);

        const contract = typeof methodContract === 'string' 
            ? { name: methodContract, params: [], returnType: 'any', isAsync: true } 
            : methodContract || { name: methodName, params: [], returnType: 'any', isAsync: true };

        const context = AIContextBuilder.build(blueprint, capability, contract, dtos);
        
        try {
          const userPrompt = `
            Context: ${JSON.stringify(context)}
            Please implement the logic for the method "${contract.name}".
          `;
          
          const code = await OpenAIService.chatComplete(BUSINESS_LOGIC_SYSTEM_PROMPT, userPrompt);
          
          const validation = AIOutputValidator.validate(code, allowedRepos, allowedDtos);
          if (!validation.isValid) {
             console.error(`AI implementation for ${service.name}.${methodName} rejected: ${validation.error}`);
             implementations[service.name][methodName] = `// TODO: AI implementation rejected - ${validation.error}\n    throw new Error("Implementation security violation.");`;
          } else {
             implementations[service.name][methodName] = code.trim();
          }
        } catch (error) {
          console.error(`Failed to implement logic for ${service.name}.${methodName}:`, error);
          implementations[service.name][methodName] = `// TODO: Implement ${methodName}\n    // Auto-generation failed. Please implement manually.`;
        }
      }
    }

    return implementations;
  }
}
