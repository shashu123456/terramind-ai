import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
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
import { listCatalog } from "@terramind/core";
import type {
  CreateCampusInput,
  CreateReportInput,
  CreateScenarioInput,
  CreateTraceInput,
  CreateUserInput,
  DataStore,
  ScenarioResultBatch,
} from "./types";

interface DbShape {
  seq: number;
  users: User[];
  workspaces: WorkspaceSummary[];
  campuses: CampusSummary[];
  observations: Array<MetricCoverage & { campusId: number; id: number }>;
  scenarios: ScenarioSummary[];
  scenarioResults: Array<{ id: number; scenarioId: number; batch: number; portfolios: PortfolioResult[] }>;
  traces: DecisionTrace[];
  reports: Array<{ report: ReportSummary; markdown: string }>;
}

function sha1(input: string): string {
  // Node has no built-in sync tiny hash without crypto; use a simple FNV-1a.
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
}

export class JsonStore implements DataStore {
  readonly mode = "demo" as const;
  private data: DbShape;
  private readonly file: string;
  private readonly persist: boolean;

  constructor(opts: { seed: () => void; file?: string }) {
    this.file = opts.file ?? "";
    this.persist = Boolean(opts.file);
    this.data = {
      seq: 1,
      users: [],
      workspaces: [],
      campuses: [],
      observations: [],
      scenarios: [],
      scenarioResults: [],
      traces: [],
      reports: [],
    };
    opts.seed();
  }

  static load(opts: { file?: string; seed: () => void }): JsonStore {
    if (opts.file) {
      try {
        const raw = readFileSync(opts.file, "utf8");
        const parsed = JSON.parse(raw) as DbShape;
        const store = new JsonStore({ file: opts.file, seed: () => undefined });
        store.data = { ...store.data, ...parsed, seq: parsed.seq || 1 };
        store.data.workspaces = parsed.workspaces ?? [];
        return store;
      } catch {
        const store = new JsonStore(opts);
        store.commit();
        return store;
      }
    }
    return new JsonStore(opts);
  }

  private nextId(): number {
    return this.data.seq++;
  }

  private commit(): void {
    if (!this.persist) return;
    try {
      mkdirSync(dirname(this.file), { recursive: true });
      writeFileSync(this.file, JSON.stringify(this.data, null, 2), "utf8");
    } catch {
      // Demo persistence is best-effort; never crash a router on disk I/O.
    }
  }

  async ready(): Promise<boolean> {
    return true;
  }

  async getUserByOpenId(openId: string): Promise<User | null> {
    return this.data.users.find((u) => u.openId === openId) ?? null;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    const now = new Date().toISOString();
    const user: User = {
      id: this.nextId(),
      openId: input.openId,
      name: input.name,
      email: input.email ?? null,
      role: input.role ?? "user",
      authProvider: "demo",
      workspaceId: input.workspaceId ?? null,
      lastSignedIn: now,
    };
    this.data.users.push(user);
    this.commit();
    return user;
  }

  async touchUser(id: number): Promise<void> {
    const u = this.data.users.find((x) => x.id === id);
    if (u) {
      u.lastSignedIn = new Date().toISOString();
      this.commit();
    }
  }

  async getWorkspace(id: number): Promise<WorkspaceSummary | null> {
    return this.data.workspaces.find((w) => w.id === id) ?? null;
  }

  async listWorkspacesForOwner(ownerId: number): Promise<WorkspaceSummary[]> {
    return this.data.workspaces.filter((w) => w.ownerId === ownerId);
  }

  async createWorkspace(input: {
    name: string;
    region?: string | null;
    ownerId: number;
  }): Promise<WorkspaceSummary> {
    const workspace: WorkspaceSummary = {
      id: this.nextId(),
      name: input.name,
      region: input.region ?? null,
      ownerId: input.ownerId,
    };
    this.data.workspaces.push(workspace);
    this.commit();
    return workspace;
  }

  async listCampuses(workspaceId?: number | null): Promise<CampusSummary[]> {
    return this.data.campuses.filter((c) => (workspaceId != null ? c.workspaceId === workspaceId : true));
  }

  async getCampus(id: number): Promise<CampusSummary | null> {
    return this.data.campuses.find((c) => c.id === id) ?? null;
  }

  async createCampus(input: CreateCampusInput): Promise<CampusSummary> {
    const campus: CampusSummary = {
      id: this.nextId(),
      workspaceId: input.workspaceId ?? null,
      ownerId: input.ownerId,
      name: input.name,
      city: input.city,
      country: input.country ?? "India",
      siteType: input.siteType ?? "campus",
      areaSqm: input.areaSqm,
      occupancy: input.occupancy,
    };
    this.data.campuses.push(campus);
    this.commit();
    return campus;
  }

  async getCoverage(campusId: number): Promise<MetricCoverage[]> {
    return this.data.observations
      .filter((o) => o.campusId === campusId)
      .map(({ campusId: _c, id: _i, ...rest }) => rest)
      .sort((a, b) => a.metric.localeCompare(b.metric));
  }

  async upsertCoverage(campusId: number, coverage: MetricCoverage[]): Promise<void> {
    const others = this.data.observations.filter((o) => o.campusId !== campusId);
    const next = coverage.map((c) => ({ ...c, campusId, id: this.nextId() }));
    this.data.observations = [...others, ...next];
    this.commit();
  }

  async listInterventions(): Promise<InterventionSummary[]> {
    return listCatalog().map((e) => ({
      slug: e.slug,
      title: e.title,
      category: e.category,
      description: e.description,
      capexInr: e.capexInr,
      capexNote: e.capexNote,
      confidence: e.confidence,
      feasibility: e.feasibility,
      energyRate: e.energyRate,
      waterRate: e.waterRate,
      wasteRate: e.wasteRate,
      prerequisites: e.prerequisites,
      evidence: e.evidence,
      sdgs: e.sdgs,
      phase: e.phase,
      enabler: e.enabler ?? false,
    }));
  }

  async getIntervention(slug: string): Promise<InterventionSummary | null> {
    const all = await this.listInterventions();
    return all.find((i) => i.slug === slug) ?? null;
  }

  async listScenarios(campusId: number): Promise<ScenarioSummary[]> {
    return this.data.scenarios.filter((s) => s.campusId === campusId);
  }

  async getScenario(id: number): Promise<ScenarioSummary | null> {
    return this.data.scenarios.find((s) => s.id === id) ?? null;
  }

  async createScenario(input: CreateScenarioInput): Promise<ScenarioSummary> {
    const now = new Date().toISOString();
    const scenario: ScenarioSummary = {
      id: this.nextId(),
      campusId: input.campusId,
      name: input.name,
      status: "pending",
      horizonYears: input.horizonYears,
      budgetInr: input.budgetInr,
      interventionSlugs: input.interventionSlugs,
      mode: input.mode as ScenarioSummary["mode"],
      weights: input.weights,
      createdAt: now,
      updatedAt: now,
      runCount: 0,
    };
    this.data.scenarios.push(scenario);
    this.commit();
    return scenario;
  }

  async updateScenarioStatus(id: number, status: ApprovalStatus): Promise<void> {
    const s = this.data.scenarios.find((x) => x.id === id);
    if (s) {
      s.status = status;
      s.updatedAt = new Date().toISOString();
      this.commit();
    }
  }

  async bumpRunCount(id: number): Promise<void> {
    const s = this.data.scenarios.find((x) => x.id === id);
    if (s) {
      s.runCount += 1;
      s.updatedAt = new Date().toISOString();
      this.commit();
    }
  }

  async listScenarioResults(scenarioId: number): Promise<ScenarioResultBatch[]> {
    const rows = this.data.scenarioResults.filter((r) => r.scenarioId === scenarioId);
    const byBatch = new Map<number, PortfolioResult[]>();
    for (const r of rows) {
      byBatch.set(r.batch, [...(byBatch.get(r.batch) ?? []), ...r.portfolios]);
    }
    return [...byBatch.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([batch, portfolios]) => ({ batch, portfolios: portfolios.slice(0, 8) }));
  }

  async saveScenarioResult(scenarioId: number, batch: number, portfolios: PortfolioResult[]): Promise<void> {
    this.data.scenarioResults.push({ id: this.nextId(), scenarioId, batch, portfolios });
    this.commit();
  }

  async listTraces(campusId?: number | null): Promise<DecisionTrace[]> {
    return this.data.traces.filter((t) => (campusId != null ? t.campusId === campusId : true));
  }

  async getTrace(id: number): Promise<DecisionTrace | null> {
    return this.data.traces.find((t) => t.id === id) ?? null;
  }

  async createTrace(input: CreateTraceInput): Promise<DecisionTrace> {
    const trace: DecisionTrace = {
      id: this.nextId(),
      campusId: input.campusId ?? null,
      scenarioId: input.scenarioId ?? null,
      kind: input.kind,
      summary: input.summary,
      inputHash: sha1(JSON.stringify(input.snapshot ?? input.summary)),
      modelVersion: input.modelVersion,
      factorVersion: input.factorVersion,
      weights: input.weights,
      mode: input.mode as DecisionTrace["mode"],
      citations: input.citations,
      approvalStatus: "pending",
      snapshot: input.snapshot ? JSON.stringify(input.snapshot) : null,
      createdAt: new Date().toISOString(),
    };
    this.data.traces.push(trace);
    this.commit();
    return trace;
  }

  async updateTraceApproval(id: number, status: ApprovalStatus): Promise<void> {
    const t = this.data.traces.find((x) => x.id === id);
    if (t) t.approvalStatus = status;
    this.commit();
  }

  async listReports(): Promise<ReportSummary[]> {
    return this.data.reports.map((r) => r.report);
  }

  async getReport(id: number): Promise<{ report: ReportSummary; markdown: string } | null> {
    const r = this.data.reports.find((x) => x.report.id === id);
    return r ? { report: r.report, markdown: r.markdown } : null;
  }

  async createReport(input: CreateReportInput): Promise<ReportSummary> {
    const report: ReportSummary = {
      id: this.nextId(),
      title: input.title,
      generatedAt: new Date().toISOString(),
      templateVersion: input.templateVersion,
      entity: input.entity,
    };
    this.data.reports.push({ report, markdown: input.markdown });
    this.commit();
    return report;
  }
}

export { sha1 };
export type { CopilotCitation };