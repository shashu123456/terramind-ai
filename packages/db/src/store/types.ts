import type {
  ApprovalStatus,
  CampusSummary,
  CopilotCitation,
  DecisionTrace,
  InterventionSummary,
  MetricCoverage,
  PortfolioResult,
  ReportSummary,
  ScenarioSummary,
  User,
  WorkspaceSummary,
} from "@terramind/shared";

export interface CreateWorkspaceInput {
  name: string;
  region?: string | null;
  ownerId: number;
}

export interface CreateUserInput {
  openId: string;
  name: string;
  email?: string | null;
  role?: "user" | "admin";
  workspaceId?: number | null;
}

export interface CreateCampusInput {
  workspaceId?: number | null;
  ownerId: number;
  name: string;
  city: string;
  country?: string;
  siteType?: string;
  areaSqm: number;
  occupancy: number;
}

export interface CreateScenarioInput {
  campusId: number;
  name: string;
  horizonYears: number;
  budgetInr: number;
  mode: string;
  weights: { carbon: number; cost: number; resilience: number };
  interventionSlugs: string[];
}

export interface CreateTraceInput {
  campusId?: number | null;
  scenarioId?: number | null;
  kind: "scenario" | "copilot" | "approval";
  summary: string;
  inputHash: string;
  modelVersion: string;
  factorVersion: string;
  weights: { carbon: number; cost: number; resilience: number } | null;
  mode: string | null;
  citations: CopilotCitation[];
  snapshot?: Record<string, unknown> | null;
}

export interface CreateReportInput {
  title: string;
  markdown: string;
  templateVersion: string;
  entity: { kind: "scenario" | "trace" | "campus"; id: number };
}

export interface ScenarioResultBatch {
  batch: number;
  portfolios: PortfolioResult[];
}

/**
 * Persistence boundary. Demo mode uses an in-memory/JSON store; production
 * uses MySQL via drizzle. All routers depend only on this interface.
 */
export interface DataStore {
  readonly mode: "demo" | "mysql";
  ready(): Promise<boolean>;

  // users
  getUserByOpenId(openId: string): Promise<User | null>;
  createUser(input: CreateUserInput): Promise<User>;
  touchUser(id: number): Promise<void>;

  // workspaces
  getWorkspace(id: number): Promise<WorkspaceSummary | null>;
  listWorkspacesForOwner(ownerId: number): Promise<WorkspaceSummary[]>;
  createWorkspace(input: CreateWorkspaceInput): Promise<WorkspaceSummary>;

  // campuses
  listCampuses(workspaceId?: number | null): Promise<CampusSummary[]>;
  getCampus(id: number): Promise<CampusSummary | null>;
  createCampus(input: CreateCampusInput): Promise<CampusSummary>;

  // baseline observations
  getCoverage(campusId: number): Promise<MetricCoverage[]>;
  upsertCoverage(campusId: number, coverage: MetricCoverage[]): Promise<void>;

  // interventions
  listInterventions(): Promise<InterventionSummary[]>;
  getIntervention(slug: string): Promise<InterventionSummary | null>;

  // scenarios
  listScenarios(campusId: number): Promise<ScenarioSummary[]>;
  getScenario(id: number): Promise<ScenarioSummary | null>;
  createScenario(input: CreateScenarioInput): Promise<ScenarioSummary>;
  updateScenarioStatus(id: number, status: ApprovalStatus): Promise<void>;
  bumpRunCount(id: number): Promise<void>;
  listScenarioResults(scenarioId: number): Promise<ScenarioResultBatch[]>;
  saveScenarioResult(scenarioId: number, batch: number, portfolios: PortfolioResult[]): Promise<void>;

  // decision traces
  listTraces(campusId?: number | null): Promise<DecisionTrace[]>;
  getTrace(id: number): Promise<DecisionTrace | null>;
  createTrace(input: CreateTraceInput): Promise<DecisionTrace>;
  updateTraceApproval(id: number, status: ApprovalStatus): Promise<void>;

  // reports
  listReports(): Promise<ReportSummary[]>;
  getReport(id: number): Promise<{ report: ReportSummary; markdown: string } | null>;
  createReport(input: CreateReportInput): Promise<ReportSummary>;
}