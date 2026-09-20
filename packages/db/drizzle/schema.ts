import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, index } from "drizzle-orm/mysql-core";

export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export const campuses = mysqlTable("campuses", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  name: varchar("name", { length: 160 }).notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  country: varchar("country", { length: 100 }).notNull().default("India"),
  siteType: varchar("siteType", { length: 60 }).notNull().default("campus"),
  areaSqm: decimal("areaSqm", { precision: 14, scale: 2 }),
  occupancy: int("occupancy"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ ownerIdx: index("campuses_owner_idx").on(table.ownerId) }));

export const observations = mysqlTable("observations", {
  id: int("id").autoincrement().primaryKey(),
  campusId: int("campusId").notNull(),
  metric: varchar("metric", { length: 80 }).notNull(),
  value: decimal("value", { precision: 16, scale: 4 }).notNull(),
  unit: varchar("unit", { length: 40 }).notNull(),
  period: varchar("period", { length: 40 }).notNull(),
  source: varchar("source", { length: 160 }),
  quality: mysqlEnum("quality", ["measured", "entered", "derived", "modeled"]).notNull().default("entered"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ campusIdx: index("observations_campus_idx").on(table.campusId) }));

export const interventions = mysqlTable("interventions", {
  id: int("id").autoincrement().primaryKey(),
  slug: varchar("slug", { length: 80 }).notNull().unique(),
  title: varchar("title", { length: 140 }).notNull(),
  category: varchar("category", { length: 60 }).notNull(),
  description: text("description").notNull(),
  capexInr: decimal("capexInr", { precision: 14, scale: 2 }),
  confidence: mysqlEnum("confidence", ["high", "medium", "low"]).notNull().default("medium"),
  calculatorVersion: varchar("calculatorVersion", { length: 40 }).notNull().default("v1.0"),
  evidence: text("evidence").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export const scenarios = mysqlTable("scenarios", {
  id: int("id").autoincrement().primaryKey(),
  campusId: int("campusId").notNull(),
  name: varchar("name", { length: 140 }).notNull(),
  status: mysqlEnum("status", ["draft", "ran", "approved"]).notNull().default("draft"),
  horizonYears: int("horizonYears").notNull().default(5),
  budgetInr: decimal("budgetInr", { precision: 14, scale: 2 }),
  interventionSlugs: text("interventionSlugs").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({ campusIdx: index("scenarios_campus_idx").on(table.campusId) }));

export const decisionTraces = mysqlTable("decision_traces", {
  id: int("id").autoincrement().primaryKey(),
  campusId: int("campusId").notNull(),
  scenarioId: int("scenarioId"),
  inputHash: varchar("inputHash", { length: 128 }).notNull(),
  modelVersion: varchar("modelVersion", { length: 60 }).notNull(),
  factorVersion: varchar("factorVersion", { length: 60 }).notNull(),
  citations: text("citations").notNull(),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({ campusIdx: index("decision_traces_campus_idx").on(table.campusId) }));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Campus = typeof campuses.$inferSelect;
export type Intervention = typeof interventions.$inferSelect;
export type Scenario = typeof scenarios.$inferSelect;
export type DecisionTrace = typeof decisionTraces.$inferSelect;
