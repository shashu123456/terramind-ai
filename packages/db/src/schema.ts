import {
  double,
  index,
  int,
  json,
  longtext,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

export const workspaces = mysqlTable("workspaces", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  region: varchar("region", { length: 80 }),
  ownerId: int("owner_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  email: varchar("email", { length: 160 }),
  role: varchar("role", { length: 16 }).notNull().default("user"),
  authProvider: varchar("auth_provider", { length: 16 }).notNull().default("demo"),
  workspaceId: int("workspace_id"),
  lastSignedIn: timestamp("last_signed_in"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const campuses = mysqlTable(
  "campuses",
  {
    id: int("id").autoincrement().primaryKey(),
    workspaceId: int("workspace_id"),
    ownerId: int("owner_id"),
    name: varchar("name", { length: 120 }).notNull(),
    city: varchar("city", { length: 80 }).notNull(),
    country: varchar("country", { length: 60 }).notNull().default("India"),
    siteType: varchar("site_type", { length: 40 }).notNull().default("campus"),
    areaSqm: double("area_sqm").notNull(),
    occupancy: int("occupancy").notNull(),
    createdAt: timestamp("created_at").defaultNow(),
  },
  (t) => [index("campuses_workspace_idx").on(t.workspaceId)],
);

export const observations = mysqlTable("observations", {
  id: int("id").autoincrement().primaryKey(),
  campusId: int("campus_id").notNull(),
  metric: varchar("metric", { length: 20 }).notNull(),
  value: double("value").notNull(),
  unit: varchar("unit", { length: 12 }).notNull(),
  period: varchar("period", { length: 24 }),
  source: varchar("source", { length: 120 }),
  quality: varchar("quality", { length: 16 }).notNull().default("entered"),
  measuredAt: timestamp("measured_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const interventions = mysqlTable("interventions", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 40 }).notNull().unique(),
  title: varchar("title", { length: 120 }).notNull(),
  category: varchar("category", { length: 60 }).notNull(),
  phase: varchar("phase", { length: 20 }).notNull(),
  capexInr: double("capex_inr").notNull(),
  confidence: varchar("confidence", { length: 12 }).notNull(),
  feasibility: double("feasibility").notNull(),
  sparams: json("sparams"),
  sdgs: json("sdgs"),
  evidenceIds: json("evidence_ids"),
});

export const scenarios = mysqlTable("scenarios", {
  id: int("id").autoincrement().primaryKey(),
  campusId: int("campus_id").notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  horizonYears: int("horizon_years").notNull().default(5),
  budgetInr: double("budget_inr").notNull(),
  mode: varchar("mode", { length: 24 }).notNull().default("balanced"),
  weightCarbon: double("weight_carbon").notNull().default(0.5),
  weightCost: double("weight_cost").notNull().default(0.25),
  weightResilience: double("weight_resilience").notNull().default(0.25),
  interventionSlugs: json("intervention_slugs").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  runCount: int("run_count").notNull().default(0),
});

export const scenarioResults = mysqlTable("scenario_results", {
  id: int("id").autoincrement().primaryKey(),
  scenarioId: int("scenario_id").notNull(),
  batch: int("batch").notNull().default(1),
  portfolio: json("portfolio").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const decisionTraces = mysqlTable("decision_traces", {
  id: int("id").autoincrement().primaryKey(),
  campusId: int("campus_id"),
  scenarioId: int("scenario_id"),
  kind: varchar("kind", { length: 16 }).notNull(),
  summary: text("summary").notNull(),
  inputHash: varchar("input_hash", { length: 64 }).notNull(),
  modelVersion: varchar("model_version", { length: 60 }).notNull(),
  factorVersion: varchar("factor_version", { length: 60 }).notNull(),
  weights: json("weights"),
  mode: varchar("mode", { length: 24 }),
  citations: json("citations").notNull(),
  approvalStatus: varchar("approval_status", { length: 16 }).notNull().default("pending"),
  snapshot: json("snapshot"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const reports = mysqlTable("reports", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  markdown: longtext("markdown").notNull(),
  templateVersion: varchar("template_version", { length: 20 }).notNull().default("decision-packet-v1"),
  entityKind: varchar("entity_kind", { length: 16 }).notNull(),
  entityId: int("entity_id").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const schema = {
  workspaces,
  users,
  campuses,
  observations,
  interventions,
  scenarios,
  scenarioResults,
  decisionTraces,
  reports,
};

export type UserRow = typeof schema.users.$inferSelect;
export type ScenarioRow = typeof schema.scenarios.$inferSelect;
export type CampusRow = typeof schema.campuses.$inferSelect;
export type TraceRow = typeof schema.decisionTraces.$inferSelect;
export type ReportRow = typeof schema.reports.$inferSelect;