import type { CampusBaseline, MetricCoverage, SiteProfile } from "@terramind/shared";
import type { DataStore } from "@terramind/db";

const INPUT_METRICS = ["energy", "water", "waste"] as const;

/**
 * Aggregates a campus record + its observation coverage into a SiteProfile —
 * the exact shape the copilot and report generator ground on.
 */
export async function siteProfile(
  store: DataStore,
  campusId: number,
): Promise<SiteProfile | null> {
  const campus = await store.getCampus(campusId);
  if (!campus) return null;

  const coverage = await store.getCoverage(campusId);
  const byMetric = new Map(coverage.map((c) => [c.metric, c]));
  const energy = byMetric.get("energy");
  const water = byMetric.get("water");
  const waste = byMetric.get("waste");
  if (!energy || !water || !waste) return null;

  const baseline: CampusBaseline = {
    annualEnergyKwh: energy.value,
    annualWaterKl: water.value,
    annualWasteKg: waste.value,
    annualCarbonTco2e: byMetric.get("carbon")?.value,
    occupancy: campus.occupancy,
    areaSqm: campus.areaSqm,
  };

  const known = INPUT_METRICS.filter(
    (m) => (byMetric.get(m)?.quality ?? "not-available") !== "not-available",
  ).length;
  const dataCompleteness = Math.round((known / INPUT_METRICS.length) * 100);

  return { campus, coverage, baseline, dataCompleteness };
}

export function coverageOf(coverage: MetricCoverage[]): Omit<CampusBaseline, "occupancy" | "areaSqm"> {
  const byMetric = new Map(coverage.map((c) => [c.metric, c]));
  return {
    annualEnergyKwh: byMetric.get("energy")?.value ?? 0,
    annualWaterKl: byMetric.get("water")?.value ?? 0,
    annualWasteKg: byMetric.get("waste")?.value ?? 0,
    annualCarbonTco2e: byMetric.get("carbon")?.value,
  };
}