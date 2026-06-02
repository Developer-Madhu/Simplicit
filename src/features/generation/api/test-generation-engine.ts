import { OpenAIService } from "./openai";
import { AIGenerationContext } from "./ai-context-builder";

/**
 * Test Generation Engine
 * Generates Jest unit tests for every capability implementation.
 */
export class TestGenerationEngine {
  private static SYSTEM_PROMPT = `
    You are a Jest Testing Expert. Your task is to generate a comprehensive unit test for a NestJS service method.
    
    # REQUIREMENTS
    1. USE JEST: Write standard Jest test cases.
    2. MOCK DEPENDENCIES: Use jest.mock() or create mock providers for repositories and infrastructure.
    3. COVER EDGE CASES: Test both success and failure (e.g., entity not found) scenarios.
    4. MATCH IMPLEMENTATION: The test must reflect the provided business logic implementation.
    
    # OUTPUT FORMAT
    Return ONLY the test code. 
    Do not include explanations or markdown blocks.
  `;

  public static async generate(
    context: AIGenerationContext,
    implementation: string
  ): Promise<string> {
    try {
      const userPrompt = `
        Capability: ${context.capability.name}
        Method Signature: ${JSON.stringify(context.methodContract)}
        Implementation: 
        ${implementation}
        
        Please generate a Jest test file for this logic.
      `;
      
      const testCode = await OpenAIService.chatComplete(this.SYSTEM_PROMPT, userPrompt);
      return testCode.trim();
    } catch (error) {
      console.error(`Failed to generate test for ${context.capability.name}:`, error);
      return `// TODO: Manual test required for ${context.capability.name}`;
    }
  }
}
