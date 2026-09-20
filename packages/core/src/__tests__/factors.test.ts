import { describe, expect, it } from "vitest";
import {
  capexScoreCeiling,
  carbonScoreCeiling,
  energyTariff,
  getFactor,
  gridEmissionFactor,
  wasteEmissionFactor,
  wasteHandlingCost,
  waterTariff,
  FACTOR_VERSION,
} from "../factors";

describe("factor registry", () => {
  it("exposes versioned India demo factors", () => {
    expect(FACTOR_VERSION).toMatch(/^india-demo-factors-v/);
  });

  it("grid emission factor is 0.7 kgCO2e/kWh (CEA India approximation)", () => {
    expect(gridEmissionFactor()).toBe(0.7);
    const f = getFactor("grid-emission-factor");
    expect(f?.value).toBe(0.7);
    expect(f?.unit).toBe("kgCO2e/kWh");
    expect(f?.source).toBeTruthy();
  });

  it("exposes tariffs used by the calculators", () => {
    expect(energyTariff()).toBe(7.5); // INR/kWh commercial
    expect(waterTariff()).toBe(60); // INR/kL monsoon-inclusive
    expect(wasteHandlingCost()).toBe(1.5); // INR/kg
  });

  it("exposes waste landfill emissions factor", () => {
    expect(wasteEmissionFactor()).toBe(0.3);
  });

  it("exposes normalisation ceilings", () => {
    expect(carbonScoreCeiling()).toBe(500);
    expect(capexScoreCeiling()).toBe(50000000);
  });

  it("throws on unknown factor keys (typo safety)", () => {
    expect(() => getFactor("nope")).toThrow(/Unknown factor: nope/);
  });
});