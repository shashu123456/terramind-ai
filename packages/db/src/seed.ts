import type { CampusBaseline, MetricCoverage } from "@terramind/shared";
import type { DataStore } from "./store/types";

export interface DemoSeedResult {
  user: NonNullable<Awaited<ReturnType<DataStore["getUserByOpenId"]>>>;
  workspace: NonNullable<Awaited<ReturnType<DataStore["getWorkspace"]>>>;
  campus: NonNullable<Awaited<ReturnType<DataStore["getCampus"]>>>;
}

export const DEMO_ADMIN_OPEN_ID = "demo-owner";
export const DEMO_ADMIN_NAME = "Chief Sustainability Officer";

export const DEMO_BASELINE: CampusBaseline = {
  annualEnergyKwh: 100_000,
  annualWaterKl: 10_000,
  annualWasteKg: 20_000,
  annualCarbonTco2e: 70,
  occupancy: 1_200,
  areaSqm: 20_000,
};

export const DEMO_COVERAGE: MetricCoverage[] = [
  {
    metric: "energy",
    value: DEMO_BASELINE.annualEnergyKwh,
    unit: "kwh",
    quality: "entered",
    source: "Annual energy bill (FY 2025-26)",
    period: "2025-04-01:2026-03-31",
  },
  {
    metric: "water",
    value: DEMO_BASELINE.annualWaterKl,
    unit: "kl",
    quality: "entered",
    source: "Pune water utility statement",
    period: "2025-04-01:2026-03-31",
  },
  {
    metric: "waste",
    value: DEMO_BASELINE.annualWasteKg,
    unit: "kg",
    quality: "entered",
    source: "Waste audit estimate",
    period: "2025 calendar year",
  },
  {
    metric: "carbon",
    value: DEMO_BASELINE.annualCarbonTco2e!,
    unit: "tco2e",
    quality: "derived",
    source: "Derived from grid electricity (CEA 0.7 kgCO2e/kWh)",
    period: "2025-04-01:2026-03-31",
  },
];

/**
 * Bootstraps the demo workspace the first time the JSON store boots (or any
 * empty store). Idempotent: returns existing rows on repeat calls.
 */
export async function ensureDemoBootstrap(store: DataStore): Promise<DemoSeedResult> {
  let user = await store.getUserByOpenId(DEMO_ADMIN_OPEN_ID);
  if (!user) {
    user = await store.createUser({ openId: DEMO_ADMIN_OPEN_ID, name: DEMO_ADMIN_NAME, role: "admin" });
  } else {
    await store.touchUser(user.id);
  }

  const DEMO_NAME = "Northbridge University";
  let workspace = (await store.listWorkspacesForOwner(user.id)).find(
    (w) => w.name === DEMO_NAME,
  );
  if (!workspace) {
    workspace = await store.createWorkspace({
      name: DEMO_NAME,
      region: "Pune, Maharashtra",
      ownerId: user.id,
    });
  }
  if (!workspace) {
    throw new Error("Demo bootstrap failed: no workspace seeded");
  }

  let campus = (await store.listCampuses(workspace.id)).find(
    (c) => c.name === DEMO_NAME,
  );
  if (!campus) {
    campus = await store.createCampus({
      workspaceId: workspace.id,
      ownerId: user.id,
      name: DEMO_NAME,
      city: "Pune",
      country: "India",
      siteType: "university",
      areaSqm: DEMO_BASELINE.areaSqm,
      occupancy: DEMO_BASELINE.occupancy,
    });
  }

  await store.upsertCoverage(campus.id, DEMO_COVERAGE);

  return { user, workspace, campus };
}