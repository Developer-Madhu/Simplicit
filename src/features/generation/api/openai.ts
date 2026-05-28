export interface OpenAICompletionOptions {
  model?: string;
  temperature?: number;
  response_format?: { type: "json_object" | "text" };
  max_tokens?: number;
}

export class OpenAIService {
  private static getApiKey(): string | undefined {
    return process.env.OPENAI_API_KEY;
  }

  /**
   * Calls the OpenAI Chat Completion API with retry and timeout handling.
   */
  public static async chatComplete(
    systemPrompt: string,
    userPrompt: string,
    options: OpenAICompletionOptions = {}
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY environment variable is not defined.");
    }

    const model = options.model || "gpt-4o-mini";
    const temperature = options.temperature ?? 0.2;
    const max_tokens = options.max_tokens ?? 4000;
    const response_format = options.response_format || { type: "json_object" };

    const url = "https://api.openai.com/v1/chat/completions";
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    const body = JSON.stringify({
      model,
      temperature,
      max_tokens,
      response_format,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const maxRetries = 3;
    let attempt = 0;
    let delay = 1000; // start with 1s delay

    while (attempt < maxRetries) {
      attempt++;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout

      try {
        const response = await fetch(url, {
          method: "POST",
          headers,
          body,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (!content) {
            throw new Error("OpenAI response did not contain content.");
          }
          return content;
        }

        // Handle retryable status codes
        if (response.status === 429 || response.status >= 500) {
          console.warn(
            `OpenAI API returned status ${response.status}. Attempt ${attempt} of ${maxRetries}. Retrying in ${delay}ms...`
          );
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, delay));
            delay *= 2; // exponential backoff
            continue;
          }
        }

        const errText = await response.text();
        throw new Error(
          `OpenAI API returned status ${response.status}: ${errText || response.statusText}`
        );
      } catch (err: any) {
        clearTimeout(timeoutId);
        const isTimeout = err.name === "AbortError";
        const message = isTimeout ? "Request timed out" : err.message;

        // OpenAI Request failed

        if (attempt >= maxRetries) {
          throw new Error(`OpenAI failed after ${maxRetries} attempts. Last error: ${message}`);
        }

        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    throw new Error("OpenAI API call failed unexpectedly.");
  }
}
