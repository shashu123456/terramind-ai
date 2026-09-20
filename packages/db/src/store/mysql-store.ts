import { createHash } from "node:crypto";
import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import { createPool, type Pool } from "mysql2/promise";
import { desc, eq, sql } from "drizzle-orm";
import type {
  ApprovalStatus,
  CampusSummary,
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
import {
  campuses,
  decisionTraces,
  interventions,
  observations,
  reports,
  scenarioResults,
  scenarios,
  users,
  workspaces,
  schema as dbSchema,
} from "../schema";
import type {
  CreateCampusInput,
  CreateReportInput,
  CreateScenarioInput,
  CreateTraceInput,
  CreateUserInput,
  DataStore,
  ScenarioResultBatch,
} from "./types";

function hash(input: string): string {
  return createHash("sha1").update(input).digest("hex");
}

export class MysqlStore implements DataStore {
  readonly mode = "mysql" as const;
  private pool: Pool;
  /** Exposed for tooling/seeders; routers should use the DataStore surface. */
  db: MySql2Database<typeof dbSchema>;

  private constructor(pool: Pool) {
    this.pool = pool;
    this.db = drizzle(pool, { schema: dbSchema, mode: "default" });
  }

  static async connect(databaseUrl: string): Promise<MysqlStore> {
    const pool = createPool({ uri: databaseUrl, connectionLimit: 5 });
    const store = new MysqlStore(pool);
    await store.pool.query("SELECT 1");
    return store;
  }

  async ready(): Promise<boolean> {
    try {
      await this.pool.query("SELECT 1");
      return true;
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }

  private toUser(row: typeof users.$inferSelect): User {
    return {
      id: row.id,
      openId: row.openId,
      name: row.name,
      email: row.email ?? null,
      role: row.role === "admin" ? "admin" : "user",
      authProvider: "demo",
      lastSignedIn: row.lastSignedIn ? new Date(row.lastSignedIn).toISOString() : null,
    };
  }

  async getUserByOpenId(openId: string): Promise<User | null> {
    const rows = await this.db.select().from(users).where(eq(users.openId, openId)).limit(1);
    return rows[0] ? this.toUser(rows[0]) : null;
  }

  async createUser(input: CreateUserInput): Promise<User> {
    await this.db
      .insert(users)
      .values({
        openId: input.openId,
        name: input.name,
        email: input.email ?? null,
        role: input.role ?? "user",
        authProvider: "demo",
        workspaceId: input.workspaceId ?? null,
        lastSignedIn: new Date(),
      });
    const created = await this.getUserByOpenId(input.openId);
    if (!created) throw new Error("Failed to create user");
    return created;
  }

  async touchUser(id: number): Promise<void> {
    await this.db.update(users).set({ lastSignedIn: new Date() }).where(eq(users.id, id));
  }

  async getWorkspace(id: number): Promise<WorkspaceSummary | null> {
    const rows = await this.db.select().from(workspaces).where(eq(workspaces.id, id)).limit(1);
    const r = rows[0];
    return r
      ? { id: r.id, name: r.name, region: r.region ?? null, ownerId: r.ownerId ?? 0 }
      : null;
  }

  async listWorkspacesForOwner(ownerId: number): Promise<WorkspaceSummary[]> {
    const rows = await this.db.select().from(workspaces).where(eq(workspaces.ownerId, ownerId));
    return rows.map((r) => ({ id: r.id, name: r.name, region: r.region ?? null, ownerId: r.ownerId ?? 0 }));
  }

  async createWorkspace(input: {
    name: string;
    region?: string | null;
    ownerId: number;
  }): Promise<WorkspaceSummary> {
    const [id] = await this.db
      .insert(workspaces)
      .values({ name: input.name, region: input.region ?? null, ownerId: input.ownerId })
      .$returningId();
    const created = await this.getWorkspace(id.id);
    if (!created) throw new Error("Failed to create workspace");
    return created;
  }

  private toCampus(row: typeof campuses.$inferSelect): CampusSummary {
    return {
      id: row.id,
      workspaceId: row.workspaceId ?? null,
      ownerId: row.ownerId ?? 0,
      name: row.name,
      city: row.city,
      country: row.country,
      siteType: row.siteType,
      areaSqm: row.areaSqm,
      occupancy: row.occupancy,
    };
  }

  async listCampuses(workspaceId?: number | null): Promise<CampusSummary[]> {
    const rows = workspaceId != null
      ? await this.db.select().from(campuses).where(eq(campuses.workspaceId, workspaceId))
      : await this.db.select().from(campuses);
    return rows.map((r) => this.toCampus(r));
  }

  async getCampus(id: number): Promise<CampusSummary | null> {
    const rows = await this.db.select().from(campuses).where(eq(campuses.id, id)).limit(1);
    return rows[0] ? this.toCampus(rows[0]) : null;
  }

  async createCampus(input: CreateCampusInput): Promise<CampusSummary> {
    const [id] = await this.db
      .insert(campuses)
      .values({
        workspaceId: input.workspaceId ?? null,
        ownerId: input.ownerId,
        name: input.name,
        city: input.city,
        country: input.country ?? "India",
        siteType: input.siteType ?? "campus",
        areaSqm: input.areaSqm,
        occupancy: input.occupancy,
      })
      .$returningId();
    const campus = await this.getCampus(id.id);
    if (!campus) throw new Error("Failed to create campus");
    return campus;
  }

  async getCoverage(campusId: number): Promise<MetricCoverage[]> {
    const rows = await this.db.select().from(observations).where(eq(observations.campusId, campusId));
    return rows.map((r) => ({
      metric: r.metric as MetricCoverage["metric"],
      value: r.value,
      unit: r.unit,
      quality: r.quality as MetricCoverage["quality"],
      source: r.source ?? null,
      period: r.period ?? null,
    }));
  }

  async upsertCoverage(campusId: number, coverage: MetricCoverage[]): Promise<void> {
    await this.db.delete(observations).where(eq(observations.campusId, campusId));
    if (coverage.length > 0) {
      await this.db.insert(observations).values(
        coverage.map((c) => ({
          campusId,
          metric: c.metric,
          value: c.value,
          unit: c.unit,
          period: c.period ?? null,
          source: c.source ?? null,
          quality: c.quality,
        })),
      );
    }
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
    const rows = await this.db.select().from(interventions).where(eq(interventions.slug, slug)).limit(1);
    const r = rows[0];
    return r
      ? {
          slug: r.slug,
          title: r.title,
          category: r.category,
          description: "",
          capexInr: r.capexInr,
          confidence: r.confidence as InterventionSummary["confidence"],
          feasibility: r.feasibility,
          phase: r.phase,
          prerequisites: [],
          evidence: (r.evidenceIds as string[]) ?? [],
          sdgs: (r.sdgs as number[]) ?? [],
        }
      : null;
  }

  private iso(d: Date | null | undefined): string {
    return d ? new Date(d).toISOString() : new Date().toISOString();
  }

  private toScenario(row: typeof scenarios.$inferSelect): ScenarioSummary {
    return {
      id: row.id,
      campusId: row.campusId,
      name: row.name,
      status: row.status as ScenarioSummary["status"],
      horizonYears: row.horizonYears,
      budgetInr: row.budgetInr,
      interventionSlugs: (row.interventionSlugs as string[]) ?? [],
      mode: row.mode as ScenarioSummary["mode"],
      weights: { carbon: row.weightCarbon, cost: row.weightCost, resilience: row.weightResilience },
      createdAt: this.iso(row.createdAt),
      updatedAt: this.iso(row.updatedAt),
      runCount: row.runCount,
    };
  }

  async listScenarios(campusId: number): Promise<ScenarioSummary[]> {
    const rows = await this.db.select().from(scenarios).where(eq(scenarios.campusId, campusId));
    return rows.map((r) => this.toScenario(r));
  }

  async getScenario(id: number): Promise<ScenarioSummary | null> {
    const rows = await this.db.select().from(scenarios).where(eq(scenarios.id, id)).limit(1);
    return rows[0] ? this.toScenario(rows[0]) : null;
  }

  async createScenario(input: CreateScenarioInput): Promise<ScenarioSummary> {
    const weight = input.weights;
    const [id] = await this.db
      .insert(scenarios)
      .values({
        campusId: input.campusId,
        name: input.name,
        horizonYears: input.horizonYears,
        budgetInr: input.budgetInr,
        mode: input.mode,
        weightCarbon: weight.carbon,
        weightCost: weight.cost,
        weightResilience: weight.resilience,
        interventionSlugs: input.interventionSlugs,
      })
      .$returningId();
    const created = await this.getScenario(id.id);
    if (!created) throw new Error("Failed to create scenario");
    return created;
  }

  async updateScenarioStatus(id: number, status: ApprovalStatus): Promise<void> {
    await this.db.update(scenarios).set({ status, updatedAt: new Date() }).where(eq(scenarios.id, id));
  }

  async bumpRunCount(id: number): Promise<void> {
    await this.db
      .update(scenarios)
      .set({ runCount: sql`${scenarios.runCount} + 1`, updatedAt: new Date() })
      .where(eq(scenarios.id, id));
  }

  async listScenarioResults(scenarioId: number): Promise<ScenarioResultBatch[]> {
    const rows = await this.db
      .select()
      .from(scenarioResults)
      .where(eq(scenarioResults.scenarioId, scenarioId))
      .orderBy(desc(scenarioResults.batch));
    const byBatch = new Map<number, PortfolioResult[]>();
    for (const r of rows) {
      byBatch.set(r.batch, [...(byBatch.get(r.batch) ?? []), ...(r.portfolio as unknown as PortfolioResult[])]);
    }
    return [...byBatch.entries()].map(([batch, portfolios]) => ({ batch, portfolios: portfolios.slice(0, 8) }));
  }

  async saveScenarioResult(scenarioId: number, batch: number, portfolios: PortfolioResult[]): Promise<void> {
    await this.db.insert(scenarioResults).values({
      scenarioId,
      batch,
      portfolio: portfolios as unknown as string,
    });
  }

  private toTrace(row: typeof decisionTraces.$inferSelect): DecisionTrace {
    return {
      id: row.id,
      campusId: row.campusId ?? null,
      scenarioId: row.scenarioId ?? null,
      kind: row.kind as DecisionTrace["kind"],
      summary: row.summary,
      inputHash: row.inputHash,
      modelVersion: row.modelVersion,
      factorVersion: row.factorVersion,
      weights: (row.weights as DecisionTrace["weights"]) ?? null,
      mode: (row.mode ?? null) as DecisionTrace["mode"],
      citations: (row.citations as DecisionTrace["citations"]) ?? [],
      approvalStatus: row.approvalStatus as DecisionTrace["approvalStatus"],
      snapshot: (row.snapshot as unknown as string | null) ?? null,
      createdAt: this.iso(row.createdAt),
    };
  }

  async listTraces(campusId?: number | null): Promise<DecisionTrace[]> {
    const rows = campusId != null
      ? await this.db.select().from(decisionTraces).where(eq(decisionTraces.campusId, campusId)).orderBy(desc(decisionTraces.id))
      : await this.db.select().from(decisionTraces).orderBy(desc(decisionTraces.id));
    return rows.map((r) => this.toTrace(r));
  }

  async getTrace(id: number): Promise<DecisionTrace | null> {
    const rows = await this.db.select().from(decisionTraces).where(eq(decisionTraces.id, id)).limit(1);
    return rows[0] ? this.toTrace(rows[0]) : null;
  }

  async createTrace(input: CreateTraceInput): Promise<DecisionTrace> {
    const [id] = await this.db
      .insert(decisionTraces)
      .values({
        campusId: input.campusId ?? null,
        scenarioId: input.scenarioId ?? null,
        kind: input.kind,
        summary: input.summary,
        inputHash: hash(JSON.stringify(input.snapshot ?? input.summary)),
        modelVersion: input.modelVersion,
        factorVersion: input.factorVersion,
        weights: (input.weights as unknown as string) ?? null,
        mode: input.mode,
        citations: input.citations as unknown as string,
        snapshot: input.snapshot as unknown as string,
      })
      .$returningId();
    const created = await this.getTrace(id.id);
    if (!created) throw new Error("Failed to create trace");
    return created;
  }

  async updateTraceApproval(id: number, status: ApprovalStatus): Promise<void> {
    await this.db.update(decisionTraces).set({ approvalStatus: status }).where(eq(decisionTraces.id, id));
  }

  private toReport(r: typeof reports.$inferSelect): ReportSummary {
    return {
      id: r.id,
      title: r.title,
      generatedAt: this.iso(r.createdAt),
      templateVersion: r.templateVersion,
      entity: { kind: r.entityKind as "scenario" | "trace" | "campus", id: r.entityId },
    };
  }

  async listReports(): Promise<ReportSummary[]> {
    const rows = await this.db.select().from(reports).orderBy(desc(reports.id));
    return rows.map((r) => this.toReport(r));
  }

  async getReport(id: number): Promise<{ report: ReportSummary; markdown: string } | null> {
    const rows = await this.db.select().from(reports).where(eq(reports.id, id)).limit(1);
    return rows[0] ? { report: this.toReport(rows[0]), markdown: rows[0].markdown } : null;
  }

  async createReport(input: CreateReportInput): Promise<ReportSummary> {
    const [id] = await this.db
      .insert(reports)
      .values({
        title: input.title,
        markdown: input.markdown,
        templateVersion: input.templateVersion,
        entityKind: input.entity.kind,
        entityId: input.entity.id,
      })
      .$returningId();
    const created = await this.getReport(id.id);
    if (!created) throw new Error("Failed to create report");
    return created.report;
  }
}