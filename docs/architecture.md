# Architecture

TerraMind AI is built on one governing principle:

> **The AI explains and orchestrates. Registered models calculate. Evidence and traces
> make recommendations accountable.**

That single rule drives every structural decision in this codebase. If a number appears
in the UI, in a decision packet, or in a copilot answer, there is a deterministic
code path that produced it — and a trace that can reproduce it.

## Layers

```
┌──────────────────────────────────────────────────────────┐
│ apps/web   React SPA — Carbon-inspired design system      │
│            tRPC client (createTRPCReact, superjson)       │
├──────────────────────────────────────────────────────────┤
│ apps/api   Express + tRPC v11                             │
│            auth (JWT HS256, jose) · routers · services     │
│            report generator (decision packets, MD)        │
├──────────────────────────────────────────────────────────┤
│ packages/ai     copilot orchestrator, RAG retrieval,      │
│                 local engine + OpenAI-compatible adapter  │
│ packages/core   FACTORS · CATALOG · CALCULATORS · PORTFOLIO│
│ packages/db     DataStore interface: MySQL / JSON demo    │
├──────────────────────────────────────────────────────────┤
│ packages/shared DTOs · zod v4 input schemas · formatters  │
└──────────────────────────────────────────────────────────┘
```

Dependency flow is one-directional: `web → api → services → core/ai/db` and
everything on top of `shared`. `shared` never imports from `core`; the domain types
it re-exports are defined there so the DTO surface is a single source of truth.

## The deterministic engine (`packages/core`)

- **Factor registry** (`factors.ts`) — every assumption (grid emission factor,
  electricity/water tariff, waste handling cost, score ceilings) is a versioned
  `Factor` with scope, source, URL, and `validFrom`. Version `india-demo-factors-v1.0`.
- **Intervention catalog** (`catalog.ts`) — 12 buildable interventions, each with a
  percentage rate per metric, capital cost, spread (uncertainty), confidence,
  feasibility, prerequisites, SDG tags, and evidence IDs that anchor to the RAG
  knowledge base.
- **Calculators** (`calculators.ts`) — pure functions: `calculateInterventionImpact`
  (energy/water/waste/carbon ranges + payback + savings rate) and
  `sumInterventions` (portfolio aggregation). No randomness, no LLM, no I/O.
- **Portfolio optimizer** (`portfolio.ts`) — exhaustive enumeration over the catalog,
  prerequisite + budget enforcement, five named decision modes with *visible weights*,
  a Pareto front on (capex, carbon), and human-readable rationale per candidate.

## The AI copilot (`packages/ai`)

`copilotAsk(question, ctx)` is the only entry point. Decision flow:

1. **Guardrail screening** — refuse requests that imply forecasting (guarantees,
   certified savings, certainty).
2. **Grounded planning** — if a campus baseline exists, run the *real* engine
   (`sumInterventions`, `calculateInterventionImpact`) and describe the results.
3. **RAG retrieval** — score the 16-entry evidence knowledge base by tag + token
   overlap; every cited claim carries `id, title, publisher, url`.
4. **Labeling** — responses are always framed as *scenario estimates*, cite
   model + factor versions, and end with a verification tip.

A `LocalProvider` guarantees the copilot works with **no API keys**. The
`OpenAiCompatibleProvider` speaks the `/chat/completions` protocol so Granite,
OpenAI, or Ollama slot in behind the identical guardrails.

## The AI/calculation boundary — enforced, not just documented

- Inputs are validated by **zod v4 schemas** in `packages/shared` before they reach
  any engine code.
- The engine functions are **pure and deterministic**; their outputs carry ranges
  (`ImpactRange { low, mid, high, unit }`), never point guesses.
- The copilot **cannot write numbers from nowhere**: in grounded mode it formats
  engine output; outside grounded mode it refuses to produce quantified answers.
- Refusal patterns cover guarantees, certified savings, 100% claims.
- Every answer and run is persisted as a **DecisionTrace** with an `inputHash`
  (SHA-256 of the inputs) and a JSON snapshot.

## Explainability model

| Assertion | Where it comes from |
|---|---|
| "LED retrofits cut electricity ~12%" | Catalog entry rate + evidence ID `iod-doe-led` |
| "This campus uses 100,000 kWh/yr" | Baseline coverage, quality `entered`, source string |
| "Scenario estimate: 8,400 kWh/yr saved" | `calculateInterventionImpact` on the baseline |
| "Balanced mode preferred this bundle" | `scorePortfolio` with visible weights {0.5, 0.25, 0.25} |
| "Pareto options exist" | `paretoFront` over enumerated portfolios |
| "Why did the ranking change?" | `describeModeChange` — mode weights + rationale |

## Persistence (`packages/db`)

`DataStore` is a narrow interface implemented twice:

- `JsonStore` — demo mode. An idempotently-seeded JSON file at `.data/demo.json`.
- `MysqlStore` — production. Drizzle ORM over MySQL 8 (`users`, `workspaces`,
  `campuses`, `observations`, `interventions`, `scenarios`, `scenario_results`,
  `decision_traces`, `reports`).

The web + API never touch either implementation directly — only the `DataStore`
contract, so switching databases is a config change, not a code change.

## Decision packets (`apps/api/src/services/report.ts`)

`generateDecisionPacket` renders a Markdown deliverable: scenario-estimate banner,
executive summary, baseline & data-quality table, intervention-by-intervention
impacts, ranking & trade-offs, assumptions & factor registry, SDG touchpoints
(mappings, **never** measurements), limitations & responsible-AI notes, and the
decision-trace reference.

## Security

- Sessions are JWT (HS256) with an HttpOnly, SameSite=Lax cookie (`terramind_session`).
- All `/trpc` data procedures are behind a `protectedProcedure` (401 without a valid
  session); `system.*`, `interventions.list`, `factors.list`, and `auth.*` are public.
- `JWT_SECRET` must be set in production; a clearly-warned fallback exists for dev.
- No secrets are ever shipped; see [SECURITY.md](../SECURITY.md).