/**
 * Versioned Factor & Model Registry.
 *
 * Every numeric rule that shapes a recommendation lives here as a versioned
 * record with a source and validity window. Calculators consume the registry,
 * never hardcoded constants, so a "tCO2e" figure is always attributable.
 */

export const FACTOR_VERSION = "india-demo-factors-v1.0";

export interface Factor {
  key: string;
  label: string;
  value: number;
  unit: string;
  scope: string;
  source: string;
  sourceUrl?: string;
  validFrom: string;
  version: string;
  notes?: string;
}

export const FACTORS: Factor[] = [
  {
    key: "grid-emission-factor",
    label: "Grid emission factor (India)",
    value: 0.7,
    unit: "kgCO2e/kWh",
    scope: "India (national average, demo)",
    source: "Central Electricity Authority (approx. national average)",
    sourceUrl: "https://cea.nic.in/",
    validFrom: "2023-01-01",
    version: FACTOR_VERSION,
    notes:
      "Single demo factor for conversion of electricity savings to CO₂e. Replace with the CEA baseline/CO₂ database value for the utility region in production.",
  },
  {
    key: "waste-landfill-emission",
    label: "Waste diverted from landfill",
    value: 0.3,
    unit: "tCO2e/t",
    scope: "India (default, demo)",
    source: "IPCC default for mixed municipal solid waste (approx.)",
    sourceUrl: "https://www.ipcc-nggip.iges.or.jp/",
    validFrom: "2023-01-01",
    version: FACTOR_VERSION,
    notes:
      "Applies to waste segregated from landfill via segregation/composting. Does not account for methane capture or compost process emissions.",
  },
  {
    key: "energy-tariff",
    label: "Commercial electricity tariff",
    value: 7.5,
    unit: "INR/kWh",
    scope: "India (typical commercial, demo)",
    source: "State discom commercial tariff band (illustrative)",
    validFrom: "2023-01-01",
    version: FACTOR_VERSION,
    notes:
      "Used only to estimate a simple payback. Replace with the campus utility tariff for the site.",
  },
  {
    key: "water-tariff",
    label: "Water supply tariff",
    value: 60,
    unit: "INR/kL",
    scope: "Pune municipal (approx., demo)",
    source: "Local municipal water tariff (approximation)",
    validFrom: "2023-01-01",
    version: FACTOR_VERSION,
    notes:
      "Used only to estimate simple payback for water-saving actions.",
  },
  {
    key: "waste-handling-cost",
    label: "Waste handling cost",
    value: 1.5,
    unit: "INR/kg",
    scope: "India (approx., demo)",
    source: "Market survey estimate (illustrative)",
    validFrom: "2023-01-01",
    version: FACTOR_VERSION,
    notes:
      "Per-kg collection/transport/disposal cost averted by diverting waste.",
  },
  {
    key: "carbon-score-ceiling",
    label: "Carbon score normalisation ceiling",
    value: 500,
    unit: "tCO2e/yr",
    scope: "Product-internal",
    source: "TerraMind internal ranking scale",
    validFrom: "2023-01-01",
    version: FACTOR_VERSION,
    notes:
      "Annual emissions above which an option is considered to fully satisfy the carbon objective (score 1.0).",
  },
  {
    key: "capex-score-ceiling",
    label: "Capex score normalisation ceiling",
    value: 50_000_000,
    unit: "INR",
    scope: "Product-internal",
    source: "TerraMind internal ranking scale",
    validFrom: "2023-01-01",
    version: FACTOR_VERSION,
    notes:
      "Budget above which an option is considered to fully exhaust the cost objective.",
  },
];

export function listFactors(): Factor[] {
  return [...FACTORS];
}

export function getFactor(key: string): Factor {
  const factor = FACTORS.find((f) => f.key === key);
  if (!factor) {
    throw new Error(`Unknown factor: ${key}`);
  }
  return factor;
}

export function gridEmissionFactor(): number {
  return getFactor("grid-emission-factor").value;
}

export function wasteEmissionFactor(): number {
  return getFactor("waste-landfill-emission").value;
}

export function energyTariff(): number {
  return getFactor("energy-tariff").value;
}

export function waterTariff(): number {
  return getFactor("water-tariff").value;
}

export function wasteHandlingCost(): number {
  return getFactor("waste-handling-cost").value;
}

export function carbonScoreCeiling(): number {
  return getFactor("carbon-score-ceiling").value;
}

export function capexScoreCeiling(): number {
  return getFactor("capex-score-ceiling").value;
}