# API reference

All API traffic is a single tRPC v11 router mounted at **`/trpc`** on the API server
(`:3000` in dev and prod). Requests use the superjson transformer.

**Request shape** (POST, `Content-Type: application/json`):

```json
{ "json": <input or null> }
```

Queries and mutations both accept POST (the server sets `allowMethodOverride: true`).
Queries also accept plain GET. Protected procedures return HTTP 401 with
`{ "message": "Please login (10001)" }` when the session cookie is missing or
expired.

Responses follow the tRPC envelope: `{ "result": { "data": <output> } }`.

## Authentication

| Procedure | Type | Input | Output |
|---|---|---|---|
| `auth.me` | query | — | `User \| null` (session user, or null when anonymous) |
| `auth.demoLogin` | mutation | `{ name? }` | `DemoSeedResult` (`{ user, workspace, campus }`); sets `terramind_session` cookie |
| `auth.logout` | mutation | — | `{ ok: true }`; clears the cookie |

The demo login is idempotent: repeated logins never duplicate the workspace or campus.
Production auth is on the [roadmap](roadmap.md).

## System

| Procedure | Type | Output |
|---|---|---|
| `system.health` | query | `{ status: "ok", mode: "demo" \| "mysql", uptimeSec }` |
| `system.info` | query | `AppInfo` (`version`, `mode`, `llm: { provider, model }`, `demo`, `now`) |

## Campus

| Procedure | Type | Input | Output |
|---|---|---|---|
| `campus.list` | query (protected) | — | `CampusSummary[]` (scoped to the session workspace) |
| `campus.get` | query (protected) | `{ id }` | `SiteProfile \| null` |
| `campus.create` | mutation (protected) | `campusInput` | `CampusSummary` |
| `campus.importBaseline` | mutation (protected) | `{ campusId, baseline }` | `SiteProfile` |

`campusInput` = `name, city, country="India", siteType="campus", areaSqm=20000, occupancy=1200`.
`SiteProfile` = `{ campus, coverage: MetricCoverage[], baseline, dataCompleteness }`.

`importBaseline.baseline` accepts `energyKwh?/waterKl?/wasteKg?/carbonTco2e?` each with a
matching `*Quality` label (`measured | entered | derived | modeled | not-available`).
At least one metric must be present, and it must include `energy`, `water`, or `waste`
for the engine to be usable.

## Catalog & factors (public)

| Procedure | Type | Output |
|---|---|---|
| `interventions.list` | query | `InterventionSummary[]` (12 actions) |
| `factors.list` | query | `FactorView[]` (versioned factor registry) |
| `scenario.modes` | query | `DecisionModeDef[]` (5 modes w/ weights + rationale) |

## Scenario engine

| Procedure | Type | Input | Output |
|---|---|---|---|
| `scenario.run` | mutation (protected) | `scenarioRunInput` | `{ detail: ScenarioDetail, trace: DecisionTrace }` |
| `scenario.save` | mutation (protected) | `scenarioRunInput + { campusId, name }` | same, plus a persisted scenario |
| `scenario.list` | query (protected) | `{ campusId }` | `ScenarioSummary[]` |
| `scenario.get` | query (protected) | `{ id }` | scenario + `impacts`, `portfolios`, `batches`, versions |
| `scenario.approve` | mutation (protected) | `{ id, status: "approved" \| "rejected" }` | updated scenario + an `approval` trace |
| `scenario.compare` | query (protected) | `{ a, b }` | both scenarios + `difference` (mode rationale) |
| `scenario.profile` | query (protected) | `{ campusId }` | `SiteProfile \| null` |

`scenarioRunInput`:
```ts
{
  campusId?: number,                 // persists the run when present
  baseline: CampusBaseline,          // energy/water/waste + optional carbon, occupancy, areaSqm
  interventionSlugs: string[],       // 1..24 from the catalog
  budgetInr?: number = 5_000_000,
  horizonYears?: number = 5,         // 1..30
  mode?: DecisionMode = "balanced",
  weights?: Partial<Weights>,        // optional override (validated 0..1)
}
```

Running a scenario always writes a `DecisionTrace` (kind `scenario`) with an
`inputHash` (SHA-256), the mode weights used, and a JSON snapshot — regardless of
whether it was saved to a campus.

## Copilot

| Procedure | Type | Input | Output |
|---|---|---|---|
| `copilot.ask` | mutation (protected) | `{ question, campusId?, mode? }` | `CopilotAnswer` (`answer`, `citations[]`, `provider`, `model`, `grounded`, `limitation`, `traceId?`) |

When `campusId` is provided, the answer is grounded in the campus profile and a
`copilot` trace is recorded with the citations. Questions that imply forecasting
(guarantees, certified savings, certainty) are refused with an explicit limitation.

## Decision traces

| Procedure | Type | Input | Output |
|---|---|---|---|
| `trace.list` | query (protected) | `{ campusId? }` | `DecisionTrace[]` |
| `trace.get` | query (protected) | `{ id }` | `DecisionTrace` |
| `trace.approve` | mutation (protected) | `{ id, status }` | updated `DecisionTrace` |

## Reports / decision packets

| Procedure | Type | Input | Output |
|---|---|---|---|
| `report.generate` | mutation (protected) | discriminated union (below) | `{ report, packet: DecisionPacket }` |
| `report.list` | query (protected) | — | `ReportSummary[]` |
| `report.get` | query (protected) | `{ id }` | `{ summary, markdown }` |

`report.generate` input (discriminated on `kind`):
```ts
{ kind: "scenario", scenarioId: number }
| { kind: "trace",   traceId: number }
| { kind: "campus",  campusId: number }
```

`packet.markdown` is the full decision-packet text (template `decision-packet-v1`):
scenario-estimate banner · executive summary · baseline & data quality ·
per-intervention impacts · ranking & trade-offs · assumptions & factor registry ·
SDG touchpoints · limitations & responsible-AI notes · trace reference.

## Error codes

| Code | Message (const) | Trigger |
|---|---|---|
| `10001` | Please login (10001) | Protected procedure, no valid session |
| `10003` | Database is not available | Store failure |
| `10004` | Not found | Missing entity |
| `10005` | Validation error | zod rejection (HTTP 400) |

## Via curl

```bash
# login
curl -c jar.txt -X POST http://127.0.0.1:3000/trpc/auth.demoLogin \
  -H "Content-Type: application/json" --data-binary '{"json":{}}'

# run a scenario (cookie jar)
curl -b jar.txt -X POST http://127.0.0.1:3000/trpc/scenario.run \
  -H "Content-Type: application/json" \
  --data-binary @scenario.json
```

The web client uses `createTRPCReact` with `httpBatchLink({ url: "/trpc", transformer: superjson })`.