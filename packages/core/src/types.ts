/** Typed domain model for the deterministic sustainability engine. */

import type {
  CampusBaseline,
  Confidence,
  DecisionMode,
  PortfolioResult,
  Weights,
} from "@terramind/shared";

export type {
  CampusBaseline,
  DecisionMode,
  ImpactRange,
  ImpactUnit,
  InterventionImpact,
  PortfolioResult,
  Weights,
} from "@terramind/shared";
export { DEFAULT_WEIGHTS } from "@terramind/shared";

/** Valid intervention slugs in the catalog. */
export const INTERVENTION_SLUGS = [
  "energy-monitoring",
  "led-controls",
  "occupancy-sensors",
  "hvac-optimization",
  "low-flow-fixtures",
  "rainwater-harvesting",
  "wastewater-reuse",
  "waste-segregation",
  "composting",
  "native-landscape",
  "ev-charging-readiness",
  "rooftop-solar",
] as const;

export type InterventionSlug = (typeof INTERVENTION_SLUGS)[number];

export interface CatalogEntry {
  slug: InterventionSlug;
  title: string;
  category: string;
  description: string;
  capexInr: number;
  capexNote?: string;
  confidence: Confidence;
  feasibility: number;
  /** Fraction of baseline energy saved per year (0..1). */
  energyRate?: number;
  /** Fraction of baseline water saved per year (0..1). */
  waterRate?: number;
  /** Fraction of baseline waste diverted per year (0..1). */
  wasteRate?: number;
  /** Uncertainty spread around the deterministic mid estimate. */
  spread: number;
  /** Recommended sequencing phase. */
  phase: "measure" | "reduce" | "generate" | "mobility";
  /** Slug dependencies that must also be present for a valid portfolio. */
  prerequisites: InterventionSlug[];
  /** IDs into the evidence knowledge base. */
  evidence: string[];
  /** Enabled SDG tags. */
  sdgs: number[];
  assumptions: string[];
  /** Pure enablers (EV readiness etc.) add capability, not direct impact. */
  enabler?: boolean;
}

export interface DecisionModeDef {
  id: DecisionMode;
  label: string;
  description: string;
  weights: Weights;
  /** Short explanation shown when the user switches modes. */
  why: string;
}

export interface PortfolioRun {
  baseline: CampusBaseline;
  mode: DecisionModeDef;
  weightsUsed: Weights;
  portfolios: PortfolioResult[];
  pareto: PortfolioResult[];
  modelVersion: string;
  factorVersion: string;
}