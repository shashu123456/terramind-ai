/**
 * Deterministic impact calculators.
 *
 * These functions are the ONLY source of numeric savings/carbon figures in
 * TerraMind. AI components consume their output; they never calculate.
 */

import {
  carbonScoreCeiling,
  capexScoreCeiling,
  energyTariff,
  gridEmissionFactor,
  wasteEmissionFactor,
  wasteHandlingCost,
  waterTariff,
} from "./factors";
import { getCatalogEntry } from "./catalog";
import type {
  CampusBaseline,
  CatalogEntry,
  ImpactRange,
  InterventionImpact,
  PortfolioResult,
} from "./types";

export const MAX_PAYBACK_YEARS = 999;

export function round(value: number, digits = 2): number {
  if (!Number.isFinite(value)) return 0;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

/** Non-negative range derived from a mid estimate and a spread. */
export function range(mid: number, spread: number): ImpactRange {
  const low = Math.max(0, round(mid * (1 - spread)));
  const high = round(mid * (1 + spread));
  return { low, mid: round(mid), high, unit: "kwh" as const };
}

export function validateBaseline(b: CampusBaseline): void {
  const values: Array<[string, number]> = [
    ["annualEnergyKwh", b.annualEnergyKwh],
    ["annualWaterKl", b.annualWaterKl],
    ["annualWasteKg", b.annualWasteKg],
    ["occupancy", b.occupancy],
    ["areaSqm", b.areaSqm],
  ];
  if (b.annualCarbonTco2e !== undefined) {
    values.push(["annualCarbonTco2e", b.annualCarbonTco2e]);
  }
  const problems = values
    .filter(([, v]) => Number.isNaN(v) || v < 0)
    .map(([k]) => k);
  if (problems.length > 0) {
    throw new Error(`Baseline is invalid: ${problems.join(", ")} must be ≥ 0`);
  }
  if (b.occupancy <= 0) throw new Error("Baseline is invalid: occupancy must be > 0");
  if (b.areaSqm <= 0) throw new Error("Baseline is invalid: areaSqm must be > 0");
}

/** Grid-emissions baseline when the campus did not supply a measured carbon figure. */
export function deriveAnnualCarbon(b: CampusBaseline): number {
  return b.annualCarbonTco2e ?? round((b.annualEnergyKwh * gridEmissionFactor()) / 1000);
}

export function addRanges(...items: ImpactRange[]): ImpactRange {
  const start: ImpactRange = { low: 0, mid: 0, high: 0, unit: items[0]?.unit ?? "kwh" };
  return items.reduce(
    (acc, item) => ({
      low: round(acc.low + item.low),
      mid: round(acc.mid + item.mid),
      high: round(acc.high + item.high),
      unit: acc.unit,
    }),
    start,
  );
}

export function paybackFor(capexInr: number, annualSavings: ImpactRange): ImpactRange {
  const safe = (v: number) =>
    v <= 0 ? MAX_PAYBACK_YEARS : Math.min(MAX_PAYBACK_YEARS, capexInr / v);
  // Lower payback occurs when savings are at the top of the range.
  return {
    low: round(safe(annualSavings.high), 1),
    mid: round(safe(annualSavings.mid), 1),
    high: round(safe(annualSavings.low), 1),
    unit: "years",
  };
}

function annualSavings(
  energyMid: number,
  waterMid: number,
  wasteMid: number,
): ImpactRange {
  const energy = energyMid * energyTariff();
  const water = waterMid * waterTariff();
  const waste = wasteMid * wasteHandlingCost();
  const inr = energy + water + waste;
  return { low: round(inr), mid: round(inr), high: round(inr), unit: "inr" };
}

export function calculateInterventionImpact(
  entry: CatalogEntry,
  baseline: CampusBaseline,
): InterventionImpact {
  validateBaseline(baseline);

  const energyMid = baseline.annualEnergyKwh * (entry.energyRate ?? 0);
  const waterMid = baseline.annualWaterKl * (entry.waterRate ?? 0);
  const wasteMid = baseline.annualWasteKg * (entry.wasteRate ?? 0);

  const energy = {
    low: round(Math.max(0, energyMid * (1 - entry.spread))),
    mid: round(energyMid),
    high: round(energyMid * (1 + entry.spread)),
    unit: "kwh",
  } as ImpactRange;
  const water = {
    low: round(Math.max(0, waterMid * (1 - entry.spread))),
    mid: round(waterMid),
    high: round(waterMid * (1 + entry.spread)),
    unit: "kl",
  } as ImpactRange;
  const waste = {
    low: round(Math.max(0, wasteMid * (1 - entry.spread))),
    mid: round(wasteMid),
    high: round(wasteMid * (1 + entry.spread)),
    unit: "kg",
  } as ImpactRange;

  const carbonEnergy = {
    low: round((energy.low * gridEmissionFactor()) / 1000),
    mid: round((energy.mid * gridEmissionFactor()) / 1000),
    high: round((energy.high * gridEmissionFactor()) / 1000),
    unit: "tco2e",
  } as ImpactRange;
  const carbonWaste = {
    low: round((waste.low * wasteEmissionFactor()) / 1000),
    mid: round((waste.mid * wasteEmissionFactor()) / 1000),
    high: round((waste.high * wasteEmissionFactor()) / 1000),
    unit: "tco2e",
  } as ImpactRange;
  const carbon = addRanges(carbonEnergy, carbonWaste);

  const savingsInr = annualSavings(energy.mid, water.mid, waste.mid);
  const payback = paybackFor(entry.capexInr, savingsInr);

  return {
    slug: entry.slug,
    title: entry.title,
    category: entry.category,
    phase: entry.phase,
    capexInr: entry.capexInr,
    energySavingsKwh: energy,
    waterSavingsKl: water,
    wasteReductionKg: waste,
    carbonReductionTco2e: carbon,
    savingsRate: { energy: entry.energyRate, water: entry.waterRate, waste: entry.wasteRate },
    confidence: entry.confidence,
    feasibility: entry.feasibility,
    paybackYears: payback,
    assumptions: entry.assumptions,
    sdgs: entry.sdgs,
    enabler: entry.enabler,
  };
}

export function sumInterventions(
  entries: CatalogEntry[],
  baseline: CampusBaseline,
): PortfolioResult | null {
  if (entries.length === 0) return null;
  const impacts = entries.map((e) => calculateInterventionImpact(e, baseline));

  const capexInr = entries.reduce((a, e) => a + e.capexInr, 0);
  const energy = addRanges(
    ...impacts.map((i) => i.energySavingsKwh).filter((i) => i.mid > 0),
  );
  const water = addRanges(
    ...impacts.map((i) => i.waterSavingsKl).filter((i) => i.mid > 0),
  );
  const waste = addRanges(
    ...impacts.map((i) => i.wasteReductionKg).filter((i) => i.mid > 0),
  );
  const carbon = addRanges(
    ...impacts.map((i) => i.carbonReductionTco2e).filter((i) => i.mid > 0),
  );

  const savingsInr = annualSavings(energy.mid, water.mid, waste.mid).mid || 1;

  return {
    slugs: entries.map((e) => e.slug),
    title: entries.map((e) => e.title.split(" ")[0]).join(" + ") || "Selected",
    capexInr,
    energySavingsKwh: energy,
    waterSavingsKl: water,
    wasteReductionKg: waste,
    carbonReductionTco2e: carbon,
    paybackYears: paybackFor(capexInr, { low: savingsInr, mid: savingsInr, high: savingsInr, unit: "inr" }),
    score: 0,
    tradeoffs: entries.flatMap((e) => e.assumptions).slice(0, 3),
    rationale: "",
  };
}

export function toCatalogEntry(slug: string): CatalogEntry {
  const entry = getCatalogEntry(slug);
  if (!entry) {
    throw new Error(`Unknown intervention: ${slug}`);
  }
  return entry;
}

export interface EngineBounds {
  carbonCeiling: number;
  capexCeiling: number;
}

export function engineBounds(): EngineBounds {
  return { carbonCeiling: carbonScoreCeiling(), capexCeiling: capexScoreCeiling() };
}