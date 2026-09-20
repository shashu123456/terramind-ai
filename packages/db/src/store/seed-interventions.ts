import { listCatalog } from "@terramind/core";
import { interventions } from "../schema";
import { MysqlStore } from "./mysql-store";

/**
 * Seeds the interventions table in MySQL from the catalog. Called by the API
 * bootstrap in mysql mode; the JSON store reads the catalog directly and does
 * not need this.
 */
export async function seedInterventions(store: MysqlStore): Promise<void> {
  const db = store.db;
  const entries = listCatalog();
  for (const e of entries) {
    await db
      .insert(interventions)
      .values({
        slug: e.slug,
        title: e.title,
        category: e.category,
        phase: e.phase,
        capexInr: e.capexInr,
        confidence: e.confidence,
        feasibility: e.feasibility,
        sparams: { energyRate: e.energyRate, waterRate: e.waterRate, wasteRate: e.wasteRate, spread: e.spread },
        sdgs: e.sdgs,
        evidenceIds: e.evidence,
      })
      .onDuplicateKeyUpdate({ set: { title: e.title, capexInr: e.capexInr } });
  }
}