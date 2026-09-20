/** Domain types shared between the API, engine and the web app. */

/** Named ranking modes exposed by the portfolio engine. */
export type DecisionMode =
  | "balanced"
  | "carbon-first"
  | "cost-first"
  | "payback-first"
  | "resilience-first";

export type ImpactUnit = "kwh" | "kl" | "kg" | "tco2e" | "inr" | "years";

export interface ImpactRange {
  low: number;
  mid: number;
  high: number;
  unit: ImpactUnit;
}

/** The numeric baseline a campus enters along with its data provenance elsewhere. */
export interface CampusBaseline {
  annualEnergyKwh: number;
  annualWaterKl: number;
  annualWasteKg: number;
  annualCarbonTco2e?: number;
  occupancy: number;
  areaSqm: number;
}

export interface InterventionImpact {
  slug: string;
  title: string;
  category: string;
  phase: string;
  capexInr: number;
  energySavingsKwh: ImpactRange;
  waterSavingsKl: ImpactRange;
  wasteReductionKg: ImpactRange;
  carbonReductionTco2e: ImpactRange;
  savingsRate: { energy?: number; water?: number; waste?: number };
  confidence: Confidence;
  feasibility: number;
  paybackYears: ImpactRange;
  assumptions: string[];
  sdgs: number[];
  enabler?: boolean;
}

export interface PortfolioResult {
  slugs: string[];
  title: string;
  capexInr: number;
  energySavingsKwh: ImpactRange;
  waterSavingsKl: ImpactRange;
  wasteReductionKg: ImpactRange;
  carbonReductionTco2e: ImpactRange;
  paybackYears: ImpactRange;
  score: number;
  tradeoffs: string[];
  rationale: string;
}

export interface Weights {
  carbon: number;
  cost: number;
  resilience: number;
}

export const DEFAULT_WEIGHTS: Weights = { carbon: 0.5, cost: 0.25, resilience: 0.25 };

/** Which sustainability domain a metric belongs to. */
export type MetricKey = "energy" | "water" | "waste" | "carbon";

/** Provenance of a baseline value — mirror of the observations.quality enum. */
export type DataQuality = "measured" | "entered" | "derived" | "modeled" | "not-available";

export type Confidence = "high" | "medium" | "low";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export type TraceKind = "scenario" | "copilot";

export interface User {
  id: number;
  openId: string;
  name: string;
  email?: string | null;
  role: "user" | "admin";
  authProvider: "demo";
  workspaceId?: number | null;
  lastSignedIn?: string | null;
}

export interface WorkspaceSummary {
  id: number;
  name: string;
  region?: string | null;
  ownerId: number;
}

export interface CampusSummary {
  id: number;
  name: string;
  city: string;
  country: string;
  siteType: string;
  areaSqm: number;
  occupancy: number;
  ownerId: number;
  workspaceId?: number | null;
}

export interface MetricObservation {
  id: number;
  campusId: number;
  metric: string;
  value: number;
  unit: string;
  period?: string | null;
  source?: string | null;
  quality: DataQuality;
  measuredAt?: string;
}

export interface MetricCoverage {
  metric: MetricKey;
  value: number;
  unit: string;
  quality: DataQuality;
  source?: string | null;
  period?: string | null;
}

/** Aggregated site profile: baseline values plus provenance per metric. */
export interface SiteProfile {
  campus: CampusSummary;
  coverage: MetricCoverage[];
  baseline: CampusBaseline;
  dataCompleteness: number;
}

export interface InterventionSummary {
  slug: string;
  title: string;
  category: string;
  description: string;
  capexInr: number;
  capexNote?: string;
  confidence: Confidence;
  feasibility: number;
  energyRate?: number;
  waterRate?: number;
  wasteRate?: number;
  prerequisites: string[];
  evidence: string[];
  sdgs: number[];
  phase: string;
  enabler?: boolean;
}

export interface ScenarioSummary {
  id: number;
  campusId: number;
  name: string;
  status: ApprovalStatus;
  horizonYears: number;
  budgetInr: number;
  interventionSlugs: string[];
  mode: DecisionMode;
  weights: { carbon: number; cost: number; resilience: number };
  createdAt: string;
  updatedAt: string;
  runCount: number;
}

export interface ScenarioDetail extends ScenarioSummary {
  impacts: InterventionImpact[];
  portfolios: PortfolioResult[];
  modelVersion: string;
  factorVersion: string;
}

export interface CopilotCitation {
  id: string;
  title: string;
  publisher: string;
  url: string;
  publishedAt?: string | null;
}

export interface CopilotAnswer {
  answer: string;
  citations: CopilotCitation[];
  provider: "local" | "granite" | "openai" | "ollama";
  model: string;
  grounded: boolean;
  limitation: string | null;
  traceId?: number | null;
}

export interface DecisionTrace {
  id: number;
  campusId?: number | null;
  scenarioId?: number | null;
  kind: TraceKind | "approval";
  summary: string;
  inputHash: string;
  modelVersion: string;
  factorVersion: string;
  weights: { carbon: number; cost: number; resilience: number } | null;
  mode: DecisionMode | null;
  citations: CopilotCitation[];
  approvalStatus: ApprovalStatus;
  snapshot?: string | null;
  createdAt: string;
}

export interface DecisionPacket {
  markdown: string;
  title: string;
  generatedAt: string;
  templateVersion: string;
  entity: { kind: "scenario" | "trace" | "campus"; id: number };
}

export interface ReportSummary {
  id: number;
  title: string;
  generatedAt: string;
  templateVersion: string;
  entity: { kind: "scenario" | "trace" | "campus"; id: number };
}

export interface FactorView {
  key: string;
  label: string;
  value: number;
  unit: string;
  scope: string;
  source: string;
  sourceUrl?: string | null;
  validFrom: string;
  version: string;
  notes?: string;
}

export interface AppInfo {
  version: string;
  mode: "demo" | "mysql";
  llm: { provider: string; model: string | null };
  demo: boolean;
  now: string;
}

export interface SystemHealth {
  status: "ok";
  uptimeSec: number;
  mode: "demo" | "mysql";
}