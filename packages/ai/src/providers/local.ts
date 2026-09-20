import type { ChatResult, LlmProvider } from "../types";

/**
 * Local provider = the deterministic reasoning engine.
 *
 * The product deliberately does NOT send a free-form "answer my question with
 * numbers" prompt to an LLM in local mode. Instead the copilot (see
 * copilot.ts) builds grounded, calculator-backed answers. This provider is
 * kept for parity with the LlmProvider contract and refuses open-ended
 * numeric generation — anything other than flagged messaging is refused.
 */
export class LocalProvider implements LlmProvider {
  readonly name = "local" as const;
  readonly model = "campus-interventions-copilot-local";

  async chat(params: { messages: { role: string; content: string }[] }): Promise<ChatResult> {
    const last = params.messages[params.messages.length - 1];
    const body = last?.content ?? "";
    if (body.startsWith("__terramind_grounded__")) {
      return { content: body.slice("__terramind_grounded__".length), model: this.model };
    }
    return {
      content:
        "I run fully offline with the deterministic TerraMind engine. I cannot generate numbers myself — " +
        "please ask the copilot endpoint, which computes, cites and explains using the calculators and evidence base.",
      model: this.model,
    };
  }
}

export const localProvider = new LocalProvider();