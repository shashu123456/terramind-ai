import { describe, expect, it } from "vitest";
import { copilotAsk } from "../copilot";
import type { CampusBaseline } from "@terramind/shared";

const baseline: CampusBaseline = {
  annualEnergyKwh: 100000,
  annualWaterKl: 10000,
  annualWasteKg: 20000,
  occupancy: 1200,
  areaSqm: 20000,
};

describe("copilot guardrails", () => {
  it("refuses guarantee-style questions without producing numbers", () => {
    const answer = copilotAsk("Can you guarantee this bundle will save money?", {
      baseline,
    });
    expect(answer.grounded).toBe(true);
    expect(answer.provider).toBe("local");
    expect(answer.citations).toEqual([]);
    expect(answer.answer).toMatch(/forecasting/);
    expect(answer.limitation).toMatch(/guarantee/);
  });

  it("refuses certified-savings claims", () => {
    const answer = copilotAsk("Will LED give certified savings of at least 20%?", { baseline });
    expect(answer.answer).toMatch(/forecasting/);
  });
});

describe("copilot matching", () => {
  it("offers catalog topics when no action matches", () => {
    const answer = copilotAsk("hi", { baseline });
    expect(answer.answer).toMatch(/I can help you reason/);
    expect(answer.limitation).toMatch(/matched/);
  });

  it("uses evidence-linked citations for a matched action", () => {
    const answer = copilotAsk("What about LED lighting upgrades?", { baseline });
    expect(answer.citations.length).toBeGreaterThan(0);
    answer.citations.forEach((c) => {
      expect(c.title).toBeTruthy();
      expect(c.url).toMatch(/^https?:\/\//);
    });
  });

  it("computes scenario estimates only when a baseline exists", () => {
    const answer = copilotAsk("Tell me about rooftop solar", {
      baseline,
      campusName: "Northbridge University",
      budgetInr: 10000000,
    });
    expect(answer.answer).toMatch(/scenario estimate/);
    expect(answer.answer).toMatch(/Northbridge University/);
    expect(answer.answer).toMatch(/₹/);
    expect(answer.limitation).toMatch(/range/);
  });

  it("never fabricates numbers without a baseline", () => {
    const answer = copilotAsk("How much would solar save?", {});
    expect(answer.answer).toMatch(/catalog/);
    expect(answer.answer).toMatch(/baseline/);
  });
});