# Changelog

All notable changes to TerraMind AI are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/), and versions
adhere to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [1.0.0] - 2026-09-20

### Added

- **Explainable intervention-planning copilot** for campuses and institutional sites,
  built on one rule: the AI explains and orchestrates, registered calculators compute.
- **Demo mode** — fully offline, idempotently seeded Northbridge University workspace
  (Pune: 100,000 kWh/yr, 10,000 kL/yr, 20 t waste, derived 70 tCO₂e), JSON-file store,
  passwordless "Enter demo workspace" login. No API keys, no database.
- **Deterministic engine** (`packages/core`):
  - Versioned factor registry `india-demo-factors-v1.0` (grid factor, tariffs, score ceilings) with source/URL/`validFrom`.
  - 12-intervention catalog with rates, capex, uncertainty spreads, confidence,
    feasibility, prerequisites, SDG tags, and evidence anchors.
  - Calculators (`calculateInterventionImpact`, `sumInterventions`) producing
    `ImpactRange { low · mid · high }` for energy/water/waste/carbon and payback.
  - Portfolio optimizer: five named decision modes with visible weights, budget +
    prerequisite enforcement, Pareto front on (capex, carbon), rationale + trade-offs.
- **AI copilot** (`packages/ai`): guardrail refusal screening, deterministic
  grounding, RAG retrieval over a 16-entry evidence base with per-citation metadata,
  `LocalProvider` (offline) + OpenAI-compatible adapter (Granite/OpenAI/Ollama).
- **Decision traces**: every scenario run, copilot answer, and approval persists a
  trace (SHA-256 input hash, weights, model + factor versions, citations, snapshot,
  approval status).
- **Decision packets**: Markdown generator (`decision-packet-v1`) — scenario-estimate
  banner, executive summary, baseline & data-quality table, per-intervention impacts,
  ranking & trade-offs, factor registry, SDG touchpoints, responsible-AI notes.
- **tRPC v11 API** (Express): auth, campus (profile/baseline import), catalog,
  factors, scenario (run/save/list/approve/compare), copilot, traces, reports.
  Queries accept POST via `allowMethodOverride`. JWT (HS256) HttpOnly sessions.
- **Web app** (React 19 + Vite 7 + Tailwind v4): Carbon-inspired light/dark design
  system (`#172b3a` brand, IBM blue `#0f62fe` accent, Space Grotesk + DM Sans);
  Overview, Baseline, Interventions, Scenarios (run + Pareto chart + approve),
  Copilot (chat + citations + trace links), Trace, Reports (packet preview),
  Settings (factor registry + campus management); full dark mode + a11y labels.
- **Pen testing & health**: `/health`, `system.info`, GitHub Actions CI
  (install → check → lint → test → build → demo smoke boot).
- **Documentation**: README, architecture, installation, API reference, roadmap,
  contributing; MIT license; SECURITY policy.

### Fixed

- tRPC v11.19 method-override handling so query procedures accept POST from the
  web batch client (`allowMethodOverride: true`).
- Demo bootstrap idempotency (seed matched workspace/campus by name, not id).
- API `projectRoot` resolution anchored at the repo root (`.env`, `.data/demo.json`,
  and prod static path `apps/web/dist` resolved correctly).
- esbuild workspace-plugin path resolution in `scripts/build-api.mjs`.
- `upsertCoverage` issuing one delete instead of one per coverage row.
- Wouter `useRoute` called with a single path argument (v3.7.1 signature).

### Security

- Sessions signed with `jose` HS256; HttpOnly, SameSite=Lax cookie; `Secure` in prod.
- `JWT_SECRET` must be set in production (dev-only fallback warns).
- AI refusal patterns for forecasting/guarantee/certified-savings language.
- `.env*`, `.data/`, `.kilo/` git-ignored; no secrets shipped.

[1.0.0]: ../../release/tag/v1.0.0