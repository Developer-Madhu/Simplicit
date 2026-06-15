export interface NvidiaCompletionOptions {
  model?: string;
  temperature?: number;
  // Accepted for AnthropicService/OpenAIService signature parity. NVIDIA NIM's
  // open-weight models are not reliable in json_object mode for this raw-fetch
  // pattern, so it is ignored — the system prompt pins the format and
  // chatComplete strips markdown fences, exactly like AnthropicService.
  response_format?: { type: "json_object" | "text" };
  max_tokens?: number;
}

/**
 * NVIDIA NIM service — an OpenAI-compatible /v1/chat/completions client pointed
 * at build.nvidia.com (`https://integrate.api.nvidia.com/v1`), authenticated
 * with an `nvapi-...` Bearer token.
 *
 * Drop-in replacement for AnthropicService: same static chatComplete signature,
 * same fence-stripped string return. ServiceLogicAIEngine (Agent 2) can select
 * it as a provider with no other change to its call sites.
 *
 * Opt-in only — chosen exclusively when SERVICE_LOGIC_PROVIDER=nvidia AND
 * NVIDIA_API_KEY is set. Anthropic remains the default and the silent fallback.
 * SecurityAgent / TestWriterAgent are unaffected and stay on Anthropic.
 */
export class NvidiaService {
  private static getApiKey(): string | undefined {
    return process.env.NVIDIA_API_KEY;
  }

  public static async chatComplete(
    systemPrompt: string,
    userPrompt: string,
    options: NvidiaCompletionOptions = {}
  ): Promise<string> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      throw new Error(
        "NVIDIA_API_KEY environment variable is not defined (integrate.api.nvidia.com)."
      );
    }

    // Model + defaults come from the build.nvidia.com config; override the model
    // via NVIDIA_MODEL. Catalog identifiers carry version suffixes that change
    // over time, so keep the exact string in server config rather than hardcoding
    // it at call sites.
    const model = options.model || process.env.NVIDIA_MODEL || "deepseek-ai/deepseek-v4-pro";
    const temperature = options.temperature ?? 1;
    const max_tokens = options.max_tokens ?? 16384;

    const url = "https://integrate.api.nvidia.com/v1/chat/completions";
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };

    const body = JSON.stringify({
      model,
      temperature,
      top_p: 0.95,
      max_tokens,
      // deepseek "thinking" mode emits chain-of-thought tokens before the answer;
      // disable it so the response is just the requested code, matching the plain
      // output AnthropicService returns.
      chat_template_kwargs: { thinking: false },
      stream: false,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
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
          const content = data.choices?.[0]?.message?.content;
          if (!content) {
            throw new Error(
              "NVIDIA NIM (integrate.api.nvidia.com) response did not contain content."
            );
          }
          // Match AnthropicService: strip ``` fences so JSON.parse / code-
          // validating callers see the same bare output regardless of provider.
          return this.stripMarkdownFences(content);
        }

        if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
          console.warn(
            `NVIDIA NIM (integrate.api.nvidia.com) returned status ${response.status}. Attempt ${attempt} of ${maxRetries}. Retrying in ${delay}ms...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          delay *= 2;
          continue;
        }

        const errText = await response.text();
        throw new Error(
          `NVIDIA NIM (integrate.api.nvidia.com) returned status ${response.status}: ${errText || response.statusText}`
        );
      } catch (err: any) {
        clearTimeout(timeoutId);
        const message = err?.name === "AbortError" ? "Request timed out" : err?.message;
        if (attempt >= maxRetries) {
          throw new Error(
            `NVIDIA NIM (integrate.api.nvidia.com) failed after ${maxRetries} attempts. Last error: ${message}`
          );
        }
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }

    throw new Error("NVIDIA NIM (integrate.api.nvidia.com) API call failed unexpectedly.");
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
