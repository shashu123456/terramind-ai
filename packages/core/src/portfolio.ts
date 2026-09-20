/**
 * Portfolio & multi-objective ranking engine.
 *
 * Implements the product's requirement that rankings be transparent: every
 * score is a weighted combination of named objectives, every mode exposes its
 * weights, and the Pareto front shows alternatives a user may prefer even if
 * the numeric top-8 does not.
 */

import { round, sumInterventions, MAX_PAYBACK_YEARS } from "./calculators";
import { carbonScoreCeiling, capexScoreCeiling } from "./factors";
import { listCatalog } from "./catalog";
import type {
  CampusBaseline,
  CatalogEntry,
  DecisionModeDef,
  PortfolioResult,
  Weights,
} from "./types";

const CONFIDENCE_RANK: Record<string, number> = { high: 1, medium: 0.8, low: 0.6 };

export interface ModeComposite {
  def: DecisionModeDef;
  weights: Weights;
  costFactor: "cost" | "payback";
}

const MODES: Record<string, ModeComposite> = {
  balanced: {
    def: {
      id: "balanced",
      label: "Balanced portfolio",
      description: "Sensible blend of carbon, cost and resilience for a general budget decision.",
      weights: { carbon: 0.5, cost: 0.25, resilience: 0.25 },
      why: "Scores each option with equal emphasis between impact and practical ability to deliver.",
    },
    weights: { carbon: 0.5, cost: 0.25, resilience: 0.25 },
    costFactor: "payback",
  },
  "carbon-first": {
    def: {
      id: "carbon-first",
      label: "Largest carbon reduction",
      description: "Prioritises annual tCO2e avoided above all else.",
      weights: { carbon: 1, cost: 0, resilience: 0 },
      why: "Carbon is the only objective — a high-capex, high-impact action can win here.",
    },
    weights: { carbon: 1, cost: 0, resilience: 0 },
    costFactor: "cost",
  },
  "cost-first": {
    def: {
      id: "cost-first",
      label: "Lowest cost",
      description: "Favours low capital outlay; useful for a constrained first budget.",
      weights: { carbon: 0.2, cost: 0.7, resilience: 0.1 },
      why: "Halves the ranking penalty for cost, so cheaper bundles rise to the top.",
    },
    weights: { carbon: 0.2, cost: 0.7, resilience: 0.1 },
    costFactor: "cost",
  },
  "payback-first": {
    def: {
      id: "payback-first",
      label: "Fastest payback",
      description: "Favours actions whose savings repay capital the soonest.",
      weights: { carbon: 0.2, cost: 0.6, resilience: 0.2 },
      why: "Ranking uses payback instead of absolute capex — a mid-cost action with big savings can lead.",
    },
    weights: { carbon: 0.2, cost: 0.6, resilience: 0.2 },
    costFactor: "payback",
  },
  "resilience-first": {
    def: {
      id: "resilience-first",
      label: "Highest resilience",
      description: "Favours high feasibility and confidence — actions a cautious committee will approve.",
      weights: { carbon: 0.2, cost: 0.2, resilience: 0.6 },
      why: "Feasibility and confidence dominate, so proven, low-risk actions rise.",
    },
    weights: { carbon: 0.2, cost: 0.2, resilience: 0.6 },
    costFactor: "cost",
  },
};

export function getModes(): DecisionModeDef[] {
  return Object.values(MODES).map((m) => m.def);
}

export function modeComposite(mode: string): ModeComposite {
  return MODES[mode] ?? MODES["balanced"]!;
}

/** Normalised factors (0..1) describing one candidate portfolio. */
interface RankingFactors {
  carbon: number;
  cost: number;
  payback: number;
  resilience: number;
}

function resilienceScore(p: PortfolioResult): number {
  const avgFeasibility =
    p.slugs
      .map((s) => listCatalog().find((e) => e.slug === s))
      .filter((e): e is CatalogEntry => Boolean(e))
      .reduce((sum, e) => sum + e.feasibility * (CONFIDENCE_RANK[e.confidence] ?? 0.7), 0) /
    Math.max(p.slugs.length, 1);
  return round(Math.min(1, avgFeasibility), 3);
}

export function factorsFor(p: PortfolioResult): RankingFactors {
  return {
    carbon: Math.min(1, p.carbonReductionTco2e.mid / carbonScoreCeiling()),
    cost: Math.max(0, 1 - p.capexInr / capexScoreCeiling()),
    payback: p.paybackYears.mid >= MAX_PAYBACK_YEARS ? 0 : 1 / (1 + p.paybackYears.mid),
    resilience: resilienceScore(p),
  };
}

export function scorePortfolio(p: PortfolioResult, mode: ModeComposite): number {
  const f = factorsFor(p);
  const costFactor = mode.costFactor === "payback" ? f.payback : f.cost;
  const w = mode.weights;
  return round(
    w.carbon * f.carbon + w.cost * costFactor + w.resilience * f.resilience,
    4,
  );
}

function rationale(mode: DecisionModeDef, p: PortfolioResult): string {
  const lead = p.slugs.length === 1 ? "single action" : "bundle";
  return `${mode.label} ranked this ${lead} with score ${p.score.toFixed(2)} (weights: carbon ${(
    mode.weights.carbon * 100
  ).toFixed(0)}%, cost ${(mode.weights.cost * 100).toFixed(0)}%, resilience ${(
    mode.weights.resilience * 100
  ).toFixed(0)}%).`;
}

function tradeoffsFor(p: PortfolioResult): string[] {
  const lines: string[] = [];
  if (p.paybackYears.mid > 5) {
    lines.push(`Simple payback ~${p.paybackYears.mid} yr limits near-term cash flow.`);
  }
  if (p.slugs.some((s) => ["hvac-optimization", "wastewater-reuse", "rooftop-solar"].includes(s))) {
    lines.push("Bundle includes a lower-confidence action; validate with a feasibility study.");
  }
  const catalog = listCatalog();
  const primary = catalog.find((e) => e.slug === p.slugs[0]);
  if (primary?.assumptions[0]) lines.push(primary.assumptions[0]);
  return lines.slice(0, 4);
}

function subsetValid(selected: CatalogEntry[]): boolean {
  const chosen = new Set(selected.map((e) => e.slug));
  return selected.every((e) => e.prerequisites.every((dep) => chosen.has(dep)));
}

/**
 * Brute-force portfolio optimisation over the (small) catalog:
 * enumerate feasible, budget-constrained bundles, score under the chosen mode,
 * keep the top-N. Also returns the Pareto front over (capex, carbon).
 */
export function optimizePortfolio(
  baseline: CampusBaseline,
  budgetInr: number,
  modeId: string,
): { portfolios: PortfolioResult[]; pareto: PortfolioResult[]; mode: DecisionModeDef } {
  const mode = modeComposite(modeId).def;
  const candidates = listCatalog().filter((e) => !e.enabler);

  const bundles: PortfolioResult[] = [];
  const n = candidates.length;
  const total = 2 ** n;

  for (let mask = 1; mask < total; mask++) {
    const selected = candidates.filter((_, i) => mask & 2 ** i);
    if (!subsetValid(selected)) continue;
    const result = sumInterventions(selected, baseline);
    if (!result) continue;
    if (result.capexInr > budgetInr) continue;
    bundles.push(result);
  }

  const composites = bundles.map((p) => {
    const score = scorePortfolio(p, modeComposite(modeId));
    return { ...p, score };
  });

  composites.sort((a, b) => b.score - a.score);
  const top = composites.slice(0, 8).map((p) => ({
    ...p,
    rationale: rationale(mode, p),
    tradeoffs: tradeoffsFor(p),
  }));

  // Ensure the best single action is never missing from the shortlist.
  const bestSingle = composites
    .filter((p) => p.slugs.length === 1)
    .sort((a, b) => b.score - a.score)[0];
  if (bestSingle && !top.some((p) => p.slugs.length === 1)) {
    top[top.length - 1] = {
      ...bestSingle,
      rationale: rationale(mode, bestSingle),
      tradeoffs: tradeoffsFor(bestSingle),
    };
  }

  const pareto = paretoFront(composites).map((p) => ({
    ...p,
    rationale: rationale(mode, p),
    tradeoffs: tradeoffsFor(p),
  }));

  return { portfolios: top, pareto, mode };
}

/** Non-dominated set: no other candidate has both lower capex and higher carbon. */
export function paretoFront<
  T extends { capexInr: number; carbonReductionTco2e: { mid: number } },
>(candidates: T[]): T[] {
  const out: T[] = [];
  for (const a of candidates) {
    const dominated = candidates.some(
      (b) =>
        b.capexInr <= a.capexInr + 0.01 &&
        b.carbonReductionTco2e.mid >= a.carbonReductionTco2e.mid - 0.01 &&
        (b.capexInr < a.capexInr - 0.01 || b.carbonReductionTco2e.mid > a.carbonReductionTco2e.mid + 0.01),
    );
    if (!dominated) out.push(a);
  }
  return out.sort((a, b) => a.capexInr - b.capexInr);
}

export function describeModeChange(from: string, to: string): string {
  if (from === to) return "The ranking was not re-computed — no mode change.";
  return (
    `Switched from ${modeComposite(from).def.label} to ${modeComposite(to).def.label}. ` +
    modeComposite(to).def.why
  );
}

export function portfolioSlugs(p: PortfolioResult): string {
  return p.slugs.join(", ");
}