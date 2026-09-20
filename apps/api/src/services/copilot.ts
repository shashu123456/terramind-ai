import { createHash } from "node:crypto";
import { copilotAsk } from "@terramind/ai";
import type { CopilotContext } from "@terramind/ai";
import { FACTOR_VERSION, MODEL_VERSION } from "@terramind/shared";
import type { CopilotAnswer } from "@terramind/shared";
import type { DataStore } from "@terramind/db";
import { siteProfile } from "./profile";

export interface CopilotAskInput {
  campusId?: number;
  question: string;
  mode?: string;
}

export async function askCopilot(
  store: DataStore,
  input: CopilotAskInput,
): Promise<CopilotAnswer> {
  let ctx: CopilotContext = {};
  if (input.campusId) {
    const profile = await siteProfile(store, input.campusId);
    if (profile) {
      ctx = { baseline: profile.baseline, campusName: profile.campus.name };
    }
  }

  const answer = copilotAsk(input.question, ctx);

  let traceId: number | null = null;
  if (input.campusId) {
    const trace = await store.createTrace({
      campusId: input.campusId,
      scenarioId: null,
      kind: "copilot",
      summary: input.question.slice(0, 120),
      inputHash: createHash("sha256").update(input.question).digest("hex"),
      modelVersion: MODEL_VERSION,
      factorVersion: FACTOR_VERSION,
      weights: null,
      mode: input.mode ?? null,
      citations: answer.citations,
      snapshot: { question: input.question, answer },
    });
    traceId = trace.id;
  }

  return { ...answer, traceId };
}