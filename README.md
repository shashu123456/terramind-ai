# TerraMind AI

**An explainable intervention-planning copilot for campuses and institutional sites.**

TerraMind AI helps a campus, apartment portfolio, small factory, office, village, or
municipal team choose an implementable bundle of sustainability actions — using local
data, explicit assumptions, evidence-linked calculations, uncertainty ranges, and
stakeholder priorities.

> ⚠️ **Scenario estimate, not a forecast.** TerraMind AI produces conditional,
> transparently-modeled estimates. It never predicts, and it never lets the AI invent
> numbers. Every number in the product carries a unit, a provenance, a data-quality
> label, and a model/factor version.

## What makes it different

- **Deterministic engine, AI copilot.** Registered, versioned `calculators` compute.
  The LLM (local by default) *interprets, retrieves, and explains* — it can refuse,
  and it is architecturally prevented from fabricating figures.
- **Decision traces as a first-class object.** Every scenario run, copilot answer, and
  approval leaves an immutable trace: inputs, weights, model + factor versions,
  citations, snapshot, status.
- **Multi-objective ranking with visible weights.** Balanced, carbon-first, cost-first,
  payback-first, and resilience-first modes in front of a Pareto front — with an
  explanation of *why* the ranking is what it is.
- **Honest data labels.** `measured / entered / derived / modeled / not-available`
  quality tags on every metric. Missing data widens ranges; it never silently invents
  a number.
- **Offline-first, no API keys required.** The copilot ships with a local deterministic
  reasoning engine. An OpenAI-compatible HTTP adapter (`granite`, `openai`, `ollama`)
  is ready whenever you want to plug in a remote model — same guardrails apply.

## Demo

The default installation runs fully offline in **demo mode** with a pre-seeded campus
(Northbridge University, Pune — 100,000 kWh/yr, 10,000 kL/yr, 20 t waste, 70 tCO₂e):

```
pnpm install
pnpm setup        # creates .env + .data/
pnpm dev          # api on :3000, web on :5173
```

Open http://localhost:5173 and click **Enter demo workspace**. No signup, no keys.

Run it in production mode (single server, serves the built web app):

```
pnpm build
pnpm start        # http://localhost:3000
```

## Quick facts

| | |
|---|---|
| Web | React 19, Vite 7, Tailwind CSS v4, wouter, tRPC client |
| API | Express + tRPC v11, jose (JWT HS256), zod v4 |
| Storage | MySQL 8 via Drizzle (production) **or** JSON-file store (demo) |
| AI | Local deterministic copilot + OpenAI-compatible provider adapter |
| Language | TypeScript 5.9 (strict), pnpm workspaces monorepo |
| Tests | Vitest — 41 unit tests across `core` and `ai` packages |

## Monorepo layout

```
apps/
  web/    React SPA (Vite, tRPC client, Carbon-inspired design system)
  api/    Express + tRPC router surface (bundled with esbuild)
packages/
  shared/ cross-app DTOs, zod input schemas, formatters
  core/   deterministic engine: factor registry, catalog, calculators, portfolio
  ai/     copilot: local reasoning engine + RAG retrieval + provider adapters
  db/     Drizzle schema, MySQL + JSON stores, demo seeding
  ui/     shared brand atoms (Logo, KPI card, quality badges…)
deploy/   Dockerfile + docker-compose (API + MySQL 8)
docs/     architecture, installation, API, roadmap, contributing
.github/  CI workflow, issue + PR templates
```

## Documentation

- [Architecture](docs/architecture.md) — engine/AI separation, explainability model
- [Installation](docs/installation.md) — dev, production, Docker, MySQL
- [API reference](docs/api.md) — every tRPC procedure and its input schema
- [Roadmap](docs/roadmap.md) — production auth, remote LLMs, PostgreSQL, PDF exports
- [Contributing](docs/contributing.md) — how to add an intervention or factor

## License

MIT — see [LICENSE](LICENSE).