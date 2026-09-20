## Summary

<!-- One paragraph: what this changes and why. -->

## Checklist

- [ ] Typecheck: `pnpm check`
- [ ] Lint: `pnpm lint` (0 errors)
- [ ] Tests: `pnpm test` (all green)
- [ ] Build: `pnpm build`
- [ ] No AI-computed numbers introduced — engine computations live in `packages/core` with tests
- [ ] New interventions/factors carry source + version + evidence IDs present in the RAG base
- [ ] New UI follows `packages/ui` atoms + index.css tokens (light/dark)
- [ ] Decision trace coverage considered (runs / copilot answers / approvals)
- [ ] CHANGELOG updated under [Unreleased]

## Test plan

<!-- What did you run / verify, including the demo smoke: login → campus profile →
scenario run → report → copilot? -->

## Screenshots (if UI)

## Related issues
<!-- Closes #… -->