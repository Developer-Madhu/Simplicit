export interface AnthropicCompletionOptions {
  model?: string;
  temperature?: number;
  // Accepted for OpenAIService signature compatibility. Anthropic has no
  // json_object response mode in this raw-fetch pattern — the system prompts
  // already pin the output format, and chatComplete strips markdown fences so
  // callers that JSON.parse the result keep working unchanged.
  response_format?: { type: "json_object" | "text" };
  max_tokens?: number;
}

/**
 * Drop-in replacement for OpenAIService (same static chatComplete signature,
 * same string return) backed by the Anthropic Messages API. Uses the exact
 * fetch pattern established by SecurityAgent/TestWriterAgent: same model,
 * same headers, retry on 429/5xx with exponential backoff, hard timeout.
 */
export class AnthropicService {
  private static getApiKey(): string | undefined {
    return process.env.ANTHROPIC_API_KEY;
  }

  public static async chatComplete(
    systemPrompt: string,
    userPrompt: string,
    options: AnthropicCompletionOptions = {}
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("ANTHROPIC_API_KEY environment variable is not defined.");
    }

    const url = "https://api.anthropic.com/v1/messages";
    const headers = {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };
    const body = JSON.stringify({
      model: options.model || "claude-sonnet-4-6",
      max_tokens: options.max_tokens ?? 4000,
      temperature: options.temperature ?? 0.2,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const maxRetries = 3;
    let delay = 1000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch(url, { method: "POST", headers, body, signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const text = Array.isArray(data.content)
            ? data.content.find((b: any) => b.type === "text")?.text
            : undefined;
          if (!text) {
            throw new Error("Anthropic response did not contain text content.");
          }
          // OpenAI's json_object mode guaranteed bare JSON; strip fences so
          // existing JSON.parse / code-validating callers see the same shape.
          return this.stripMarkdownFences(text);
        }

        if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
          console.warn(
            `Anthropic API returned status ${response.status}. Attempt ${attempt} of ${maxRetries}. Retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }

        const errText = await response.text();
        throw new Error(`Anthropic API returned status ${response.status}: ${errText || response.statusText}`);
      } catch (err: any) {
        clearTimeout(timeoutId);
        const message = err?.name === "AbortError" ? "Request timed out" : err?.message;
        if (attempt >= maxRetries) {
          throw new Error(`Anthropic API failed after ${maxRetries} attempts. Last error: ${message}`);
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    throw new Error("Anthropic API call failed unexpectedly.");
  }

  private static stripMarkdownFences(text: string): string {
    const trimmed = text.trim();
    if (!trimmed.startsWith("```")) return trimmed;
    return trimmed
      .replace(/^```[a-zA-Z]*\s*\n?/, "")
      .replace(/\n?```\s*$/, "")
      .trim();
  }
}
