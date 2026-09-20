# Contributing

Thanks for contributing to TerraMind AI. The project is deliberately small, typed,
and deterministic-first — keep it that way.

## Ground rules

1. **No AI-computed numbers.** The AI explains and orchestrates; the registered,
   tested calculators in `packages/core` are the only source of numbers.
2. **Every number has provenance.** A new intervention or factor arrives with a
   source, a URL, a version, and (for factors) a `validFrom`.
3. **Ranges, not guesses.** Impact is expressed as `ImpactRange { low, mid, high }`,
   never a point estimate.
4. **New evidence lands in the RAG base.** A catalog entry's `evidence: string[]`
   must reference IDs that exist in `packages/ai/src/rag/knowledge.ts`.
5. **Match the design system.** Use `packages/ui` atoms and the CSS variables in
   `apps/web/src/index.css` (brand `#172b3a`, IBM blue `#0f62fe`, semantic tokens).

## Workflow

1. Fork and branch (`feat/…`, `fix/…`).
2. Make the change with tests.
3. Run the full gate locally:

   ```bash
   pnpm install
   pnpm check     # strict tsc, all workspaces
   pnpm lint      # eslint flat config
   pnpm test      # vitest (core + ai today)
   pnpm build     # vite web + esbuild api
   ```

4. Open a PR against `main`. CI runs the same gate.

## Adding an intervention

1. Add a slug to `INTERVENTION_SLUGS` (`packages/core/src/types.ts`).
2. Add the `CatalogEntry` to `INTERVENTION_CATALOG` (`catalog.ts`): rate per metric,
   capex, spread, confidence, feasibility, phase, prerequisites, SDGs, evidence IDs.
3. If it needs new evidence, add the `EvidenceEntry` to the RAG knowledge base and
   reference its ID.
4. Add calculator/portfolio tests where the new action changes engine behavior
   (e.g. prerequisites in `portfolio.test.ts`).
5. If it changes economics, bump `FACTOR_VERSION` and update the factor tests.

## Adding a factor

Edit `packages/core/src/factors.ts`:

- `key` (stable identifier), `label`, `value`, `unit`, `scope`, `source`,
  `sourceUrl?`, `validFrom`, `version`, `notes?`.
- Export an accessor (`getFactor` + a typed getter) and add a test that pins the
  value and unit.

Bump `FACTOR_VERSION` — traces and packets will then record the new version.

## Testing

- Engine code: pure function tests under `packages/core/src/__tests__/`.
- Copilot: behavior tests under `packages/ai/src/__tests__/` (refusals, grounding,
  citations).
- Add `*` to any package and it is picked up by the root `vitest.config.ts`.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/):

```
feat(core): add smart-glass intervention
fix(api): seed Northbridge coverage idempotently
docs(README): document demo mode
test(core): pin LED payback range
```