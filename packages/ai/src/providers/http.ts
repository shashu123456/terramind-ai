import type { ChatResult, LlmProvider, LlmProviderName } from "../types";

/**
 * Minimum OpenAI-compatible chat-completions adapter.
 *
 * Covers the Granite (IBM watsonx / local), OpenAI, and Ollama endpoints that
 * expose `/chat/completions`. The product ships with `local` as the default
 * provider; these adapters give the same surface for teams wiring their own
 * model gateway. The copilot guardrails still apply above this layer —
 * deterministic calculators remain the only source of numbers.
 */
export class OpenAiCompatibleProvider implements LlmProvider {
  readonly name: LlmProviderName;
  readonly model: string;
  private readonly baseUrl: string;
  private readonly apiKey?: string;

  constructor(opts: { name: LlmProviderName; baseUrl: string; apiKey?: string; model: string }) {
    this.name = opts.name;
    this.baseUrl = opts.baseUrl.replace(/\/+$/, "");
    this.apiKey = opts.apiKey;
    this.model = opts.model;
  }

  async chat(params: {
    messages: { role: string; content: string }[];
    temperature?: number;
    maxTokens?: number;
  }): Promise<ChatResult> {
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({
        model: this.model,
        messages: params.messages,
        temperature: params.temperature ?? 0.2,
        max_tokens: params.maxTokens ?? 1024,
        stream: false,
      }),
    });
    if (!res.ok) {
      throw new Error(`LLM provider ${this.name} responded ${res.status}: ${await res.text()}`);
    }
    const data = (await res.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number };
    };
    const content = data.choices?.[0]?.message?.content ?? "";
    return {
      content,
      model: this.model,
      usage: {
        promptTokens: data.usage?.prompt_tokens,
        completionTokens: data.usage?.completion_tokens,
      },
    };
  }

  async listModels(): Promise<string[]> {
    try {
      const res = await fetch(`${this.baseUrl}/models`, {
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {},
      });
      if (!res.ok) return [this.model];
      const data = (await res.json()) as { data?: Array<{ id: string }> };
      return data.data?.map((m) => m.id) ?? [this.model];
    } catch {
      return [this.model];
    }
  }
}