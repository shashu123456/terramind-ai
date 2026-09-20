import { createHash } from "node:crypto";
import {
  calculateInterventionImpact,
  modeComposite,
  optimizePortfolio,
  toCatalogEntry,
  validateBaseline,
} from "@terramind/core";
import { FACTOR_VERSION, MODEL_VERSION } from "@terramind/shared";
import type { CampusBaseline, DecisionTrace, InterventionImpact, ScenarioDetail } from "@terramind/shared";
import type { DataStore } from "@terramind/db";

export interface ScenarioRunInput {
  campusId?: number;
  name?: string;
  baseline: CampusBaseline;
  interventionSlugs: string[];
  budgetInr: number;
  horizonYears: number;
  mode: string;
}

export interface ScenarioRunResult {
  detail: ScenarioDetail;
  trace: DecisionTrace;
}

function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

function generatedRunName(): string {
  return `Run · ${new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}`;
}

/**
 * Deterministic core for every scenario: validate inputs, label interventions,
 * optimise a portfolio under the chosen mode, persist scenario + results +
 * decision trace. AI is never involved in numbers.
 */
export async function runScenario(
  store: DataStore,
  input: ScenarioRunInput,
): Promise<ScenarioRunResult> {
  validateBaseline(input.baseline);
  const entries = input.interventionSlugs.map(toCatalogEntry);
  const { portfolios, mode } = optimizePortfolio(input.baseline, input.budgetInr, input.mode);
  const impacts: InterventionImpact[] = entries.map((e) =>
    calculateInterventionImpact(e, input.baseline),
  );

  let scenarioName: string | null = null;
  let scenarioId: number | null = null;
  if (input.campusId) {
    scenarioName = input.name ?? generatedRunName();
    const scenario = await store.createScenario({
      campusId: input.campusId,
      name: scenarioName,
      horizonYears: input.horizonYears,
      budgetInr: input.budgetInr,
      mode: mode.id,
      weights: mode.weights,
      interventionSlugs: input.interventionSlugs,
    });
    scenarioId = scenario.id;
    const batches = await store.listScenarioResults(scenarioId);
    await store.saveScenarioResult(scenarioId, batches.length + 1, portfolios);
    await store.bumpRunCount(scenarioId);
  }

  const trace = await store.createTrace({
    campusId: input.campusId ?? null,
    scenarioId,
    kind: "scenario",
    summary: `Scenario run (${entries.length} actions, ${mode.label})`,
    inputHash: sha256(JSON.stringify({ ...input, mode: mode.id })),
    modelVersion: MODEL_VERSION,
    factorVersion: FACTOR_VERSION,
    weights: mode.weights,
    mode: mode.id,
    citations: [],
    snapshot: {
      type: "scenario-run",
      baseline: input.baseline,
      budgetInr: input.budgetInr,
      horizonYears: input.horizonYears,
      mode: mode.id,
      interventionSlugs: input.interventionSlugs,
    },
  });

  const detail: ScenarioDetail = {
    id: scenarioId ?? -1,
    campusId: input.campusId ?? 0,
    name: scenarioName ?? "Ad-hoc analysis",
    status: "pending",
    horizonYears: input.horizonYears,
    budgetInr: input.budgetInr,
    interventionSlugs: input.interventionSlugs,
    mode: mode.id,
    weights: mode.weights,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    runCount: scenarioId ? 1 : 0,
    impacts,
    portfolios,
    modelVersion: MODEL_VERSION,
    factorVersion: FACTOR_VERSION,
  };

  return { detail, trace };
}

export function describeWeights(modeId: string): string {
  return modeComposite(modeId).def.why;
}