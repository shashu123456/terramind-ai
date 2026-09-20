# Roadmap

The v1.0.0 build is a fully offline, explainable, single-workspace copilot with a
local decision engine. Everything below builds on the seams already left in the
architecture — the AI/calculation boundary, the `DataStore` contract, the factor
registry, and the decision-trace model.

## Near term

- **Production authentication.** Replace the demo login with a provider abstraction:
  email-code or SSO (OIDC), organization invites, and workspace membership with
  `viewer / editor / admin` roles (`User.role` and `User.workspaceId` are modeled).
- **Remote LLM wiring.** `OpenAiCompatibleProvider` already speaks Granite / OpenAI /
  Ollama; enable it behind a per-workspace toggle and surface a provider model-card
  in the decision trace.
- **PDF decision packets.** Render the existing Markdown via a headless printer so
  packets ship as sealed documents.
- **Multi-site portfolio analysis.** Compare portfolios across an owner's campuses
  (the `Workspace → Campuses` model supports it).

## Medium term

- **PostgreSQL store.** `DataStore` is implementation-agnostic; add a `PgStore`
  beside `MysqlStore`/`JsonStore`.
- **Time-series baselines.** Store monthly `MetricObservation`s, derive seasonality,
  and quantify year-over-year drift in coverage.
- **Scenario diffing.** Structured before/after comparison of two saved scenarios
  (not just the mode-change rationale `scenario.compare` provides today).

## Longer term

- **On-field verification loop.** After adoption, compare measured site data against
  the modeled estimate and fold the deviation back into the factor registry — the
  honest `measured vs modeled` story made continuous.
- **Community factor registry.** Allow teams to publish region-specific factor packs
  (e.g. `germany-tariffs-v1`, `delhi-grid-v2`) with versioning and import.
- **i18n.** Factor-sheet + packet localization (English first, Hindi/Marathi next).