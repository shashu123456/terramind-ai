import type { LlmProvider, LlmProviderName } from "../types";
import { OpenAiCompatibleProvider } from "./http";
import { localProvider } from "./local";

export function getProvider(opts: {
  provider: LlmProviderName;
  baseUrl?: string;
  apiKey?: string;
  model?: string;
}): LlmProvider {
  const provider = opts.provider ?? "local";
  if (provider === "local" || !opts.baseUrl) {
    return localProvider;
  }
  return new OpenAiCompatibleProvider({
    name: provider,
    baseUrl: opts.baseUrl,
    apiKey: opts.apiKey,
    model: opts.model ?? "granite-3.3-8b-instruct",
  });
}

export { localProvider } from "./local";
export { OpenAiCompatibleProvider } from "./http";