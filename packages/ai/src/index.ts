export type { LlmProvider, LlmProviderName, ChatMessage, ChatParams, ChatResult, ToolDef } from "./types";
export { getProvider, localProvider, OpenAiCompatibleProvider } from "./providers";
export { copilotAsk } from "./copilot";
export type { CopilotContext } from "./copilot";
export { KNOWLEDGE_BASE, getEvidenceById, getEvidenceByIds } from "./rag/knowledge";
export type { EvidenceEntry } from "./rag/knowledge";
export { retrieve } from "./rag/retrieve";
export type { RetrievedEvidence } from "./rag/retrieve";