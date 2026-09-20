import { describe, expect, it } from "vitest";
import {
  addRanges,
  calculateInterventionImpact,
  deriveAnnualCarbon,
  engineBounds,
  paybackFor,
  range,
  round,
  sumInterventions,
  toCatalogEntry,
  validateBaseline,
} from "../calculators";
import { getCatalogEntry } from "../catalog";
import type { CampusBaseline } from "@terramind/shared";

const baseline: CampusBaseline = {
  annualEnergyKwh: 100000,
  annualWaterKl: 10000,
  annualWasteKg: 20000,
  occupancy: 1200,
  areaSqm: 20000,
};

describe("round & range", () => {
  it("rounds to 2 decimal places", () => {
    expect(round(1.236)).toBe(1.24);
    expect(round(1.234)).toBe(1.23);
    expect(round(12345, 0)).toBe(12345);
  });

  it("rolls NaN to 0", () => {
    expect(round(Number.NaN)).toBe(0);
  });

  it("builds a non-negative symmetric range", () => {
    expect(range(100, 0.1)).toEqual({ low: 90, mid: 100, high: 110, unit: "kwh" });
    expect(range(100, 1.2).low).toBe(0);
  });

  it("sums ranges component-wise", () => {
    const a = { low: 10, mid: 20, high: 30, unit: "kwh" as const };
    const b = { low: 1, mid: 2, high: 3, unit: "kwh" as const };
    expect(addRanges(a, b)).toEqual({ low: 11, mid: 22, high: 33, unit: "kwh" });
  });
});

describe("baseline validation", () => {
  it("accepts a valid baseline", () => {
    expect(() => validateBaseline(baseline)).not.toThrow();
  });

  it("rejects negative values", () => {
    expect(() =>
      validateBaseline({ ...baseline, annualEnergyKwh: -1 }),
    ).toThrow(/annualEnergyKwh/);
  });

  it("rejects zero occupancy", () => {
    expect(() => validateBaseline({ ...baseline, occupancy: 0 })).toThrow(
      /occupancy must be > 0/,
    );
  });
});

describe("deriveAnnualCarbon", () => {
  it("derives grid carbon when a measured figure is absent", () => {
    expect(deriveAnnualCarbon(baseline)).toBe(70);
  });

  it("keeps a supplied measured carbon figure", () => {
    expect(deriveAnnualCarbon({ ...baseline, annualCarbonTco2e: 55 })).toBe(55);
  });
});

describe("paybackFor", () => {
  it("computes range where lower payback corresponds to higher savings", () => {
    const result = paybackFor(1200000, { low: 70000, mid: 90000, high: 110000, unit: "inr" });
    expect(result.low).toBe(10.9);
    expect(result.mid).toBe(13.3);
    expect(result.high).toBe(17.1);
    expect(result.unit).toBe("years");
  });

  it("caps payback beyond the horizon at MAX_PAYBACK_YEARS", () => {
    const result = paybackFor(5000000, { low: 0, mid: 0, high: 0, unit: "inr" });
    expect(result.mid).toBe(999);
  });
});

describe("calculateInterventionImpact", () => {
  it("computes LED impacts deterministically", () => {
    const led = getCatalogEntry("led-controls")!;
    const impact = calculateInterventionImpact(led, baseline);
    expect(impact.energySavingsKwh.mid).toBe(12000); // 12% of 100,000 kWh
    expect(impact.energySavingsKwh.low).toBe(10200);
    expect(impact.energySavingsKwh.high).toBe(13800);
    expect(impact.carbonReductionTco2e.mid).toBe(8.4); // 12,000 * 0.7 / 1000
    expect(impact.carbonReductionTco2e.low).toBe(7.14);
    expect(impact.carbonReductionTco2e.high).toBe(9.66);
    expect(impact.capexInr).toBe(1200000);
    expect(impact.paybackYears.mid).toBeCloseTo(13.3, 1); // 1.2M / (12,000 * 7.5)
    expect(impact.savingsRate.energy).toBe(0.12);
  });

  it("combines energy AND waste carbon", () => {
    const composting = getCatalogEntry("composting")!;
    const impact = calculateInterventionImpact(composting, baseline);
    expect(impact.wasteReductionKg.mid).toBe(3600);
    expect(impact.carbonReductionTco2e.mid).toBeCloseTo((3600 * 0.3) / 1000, 6);
    // energy saves nothing, so carbon is waste-only
    expect(impact.energySavingsKwh.mid).toBe(0);
  });

  it("throws on an unknown slug", () => {
    expect(() => toCatalogEntry("does-not-exist")).toThrow(/Unknown intervention/);
  });
});

describe("sumInterventions", () => {
  it("returns null for an empty selection", () => {
    expect(sumInterventions([], baseline)).toBeNull();
  });

  it("aggregates a LED + solar bundle", () => {
    const led = getCatalogEntry("led-controls")!;
    const solar = getCatalogEntry("rooftop-solar")!;
    const result = sumInterventions([led, solar], baseline)!;
    expect(result.capexInr).toBe(1200000 + 4200000);
    expect(result.slugs).toEqual(["led-controls", "rooftop-solar"]);
    expect(result.energySavingsKwh.mid).toBe(12000 + 22000);
    expect(result.carbonReductionTco2e.mid).toBeCloseTo(8.4 + 15.4, 6);
    expect(result.paybackYears.mid).toBeGreaterThan(0);
    expect(result.score).toBe(0); // scored later by portfolio.ts
    expect(result.tradeoffs.length).toBeGreaterThan(0);
  });
});

describe("engineBounds", () => {
  it("exposes the scoring ceilings used for factor normalisation", () => {
    expect(engineBounds()).toEqual({ carbonCeiling: 500, capexCeiling: 50000000 });
  });
});