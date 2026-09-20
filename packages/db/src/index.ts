export { schema } from "./schema";
export { JsonStore } from "./store/json-store";
export { MysqlStore } from "./store/mysql-store";
export type { DataStore } from "./store/types";
export type {
  CreateCampusInput,
  CreateReportInput,
  CreateScenarioInput,
  CreateTraceInput,
  CreateUserInput,
  CreateWorkspaceInput,
  ScenarioResultBatch,
} from "./store/types";
export { ensureDemoBootstrap, DEMO_BASELINE, DEMO_COVERAGE } from "./seed";
export type { DemoSeedResult } from "./seed";
export { seedInterventions } from "./store/seed-interventions";

import { JsonStore } from "./store/json-store";
import { MysqlStore } from "./store/mysql-store";
import type { DataStore } from "./store/types";

export interface StoreConfig {
  databaseUrl?: string;
  demoFile?: string;
}

/**
 * Picks the persistence layer. Blank DATABASE_URL => demo JSON store;
 * a real DATABASE_URL => MySQL via drizzle.
 */
export async function getStore(config: StoreConfig): Promise<DataStore> {
  if (config.databaseUrl) {
    return MysqlStore.connect(config.databaseUrl);
  }
  return JsonStore.load({ file: config.demoFile || "", seed: () => undefined });
}