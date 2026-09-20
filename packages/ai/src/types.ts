export type LlmProviderName = "local" | "granite" | "openai" | "ollama";

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatParams {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
}

export interface ToolDef {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface ChatResult {
  content: string;
  model: string;
  usage?: { promptTokens?: number; completionTokens?: number };
}

export interface LlmProvider {
  name: LlmProviderName;
  model?: string;
  chat(params: ChatParams): Promise<ChatResult>;
  listModels?(): Promise<string[]>;
}