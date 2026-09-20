import { describe, expect, it } from "vitest";
import { factorsFor, getModes, modeComposite, optimizePortfolio, paretoFront, scorePortfolio } from "../portfolio";
import type { CampusBaseline } from "@terramind/shared";

const baseline: CampusBaseline = {
  annualEnergyKwh: 100000,
  annualWaterKl: 10000,
  annualWasteKg: 20000,
  occupancy: 1200,
  areaSqm: 20000,
};

describe("decision modes", () => {
  it("exposes the five named modes with explicit weights", () => {
    const modes = getModes();
    expect(modes.map((m) => m.id)).toEqual([
      "balanced",
      "carbon-first",
      "cost-first",
      "payback-first",
      "resilience-first",
    ]);
    modes.forEach((m) => {
      const total = m.weights.carbon + m.weights.cost + m.weights.resilience;
      expect(total).toBeCloseTo(1, 6);
    });
  });

  it("falls back to balanced for unknown modes", () => {
    expect(modeComposite("nope").def.id).toBe("balanced");
  });
});

describe("scoring", () => {
  const ledOnly =
    optimizePortfolio(baseline, 5000000, "balanced").portfolios.find(
      (p) => p.slugs.length === 1 && p.slugs[0] === "led-controls",
    )!;

  it("normalises cost against the capex ceiling in an increasing direction", () => {
    const f = factorsFor(ledOnly);
    expect(f.cost).toBeGreaterThan(0);
    expect(f.cost).toBeLessThanOrEqual(1);
    expect(f.carbon).toBeGreaterThan(0);
    expect(f.resilience).toBeGreaterThan(0);
  });

  it("ignores no-op enablers in resilience", () => {
    const f = factorsFor(ledOnly);
    expect(f.resilience).toBeCloseTo(0.88, 2);
  });

  it("multi-objective score is a weighted sum in [0,1]", () => {
    const score = scorePortfolio(ledOnly, modeComposite("carbon-first"));
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe("optimizePortfolio", () => {
  it("returns top 8 bundles within budget, sorted by score", () => {
    const { portfolios, mode } = optimizePortfolio(baseline, 50000000, "balanced");
    expect(mode.id).toBe("balanced");
    expect(portfolios.length).toBeGreaterThan(0);
    expect(portfolios.length).toBeLessThanOrEqual(8);
    portfolios.forEach((p) => {
      expect(p.capexInr).toBeLessThanOrEqual(50000000);
      expect(p.score).toBeGreaterThan(0);
      expect(p.tradeoffs.length).toBeGreaterThan(0);
    });
    for (let i = 1; i < portfolios.length; i++) {
      expect(portfolios[i - 1].score).toBeGreaterThanOrEqual(portfolios[i].score);
    }
  });

  it("always surfaces the best single action", () => {
    const { portfolios } = optimizePortfolio(baseline, 50000000, "balanced");
    expect(portfolios.some((p) => p.slugs.length === 1)).toBe(true);
  });

  it("respects prerequisites (compost implies segregation)", () => {
    const { portfolios } = optimizePortfolio(baseline, 50000000, "balanced");
    portfolios.forEach((p) => {
      if (p.slugs.includes("composting")) {
        expect(p.slugs).toContain("waste-segregation");
      }
      if (p.slugs.includes("wastewater-reuse")) {
        expect(p.slugs).toContain("low-flow-fixtures");
      }
    });
  });

  it("raises no enabler-only bundles (EV readiness is not ranked alone)", () => {
    const { portfolios } = optimizePortfolio(baseline, 50000000, "balanced");
    portfolios.forEach((p) => {
      if (p.slugs.includes("ev-charging-readiness")) {
        expect(p.slugs.length).toBeGreaterThan(1);
      }
    });
  });

  it("scales down to a small budget", () => {
    const { portfolios } = optimizePortfolio(baseline, 500000, "balanced");
    expect(portfolios.length).toBeGreaterThan(0);
    portfolios.forEach((p) => expect(p.capexInr).toBeLessThanOrEqual(500000));
  });

  it("produces a Pareto front sorted by capex", () => {
    const { pareto } = optimizePortfolio(baseline, 50000000, "balanced");
    expect(pareto.length).toBeGreaterThan(0);
    for (let i = 1; i < pareto.length; i++) {
      expect(pareto[i - 1].capexInr).toBeLessThanOrEqual(pareto[i].capexInr);
    }
  });
});

describe("paretoFront", () => {
  it("keeps only non-dominated points", () => {
    const front = paretoFront([
      { capexInr: 100, carbonReductionTco2e: { mid: 10 } },
      { capexInr: 200, carbonReductionTco2e: { mid: 5 } },
      { capexInr: 300, carbonReductionTco2e: { mid: 20 } },
    ]);
    expect(front.map((p) => p.capexInr)).toEqual([100, 300]);
  });
});