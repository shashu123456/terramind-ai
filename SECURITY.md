# Security Policy

## Scope

TerraMind AI is an explainable decision-support tool. It processes campus-level
sustainability data (energy, water, waste, carbon) and produces scenario estimates
and decision packets. It does **not** hold financial accounts, PII beyond an
operator name/email, or personal health data.

We still treat it as a networked application with a session system, a tRPC surface,
and (optionally) a MySQL database, and we accept security reports accordingly.

## Reporting a vulnerability

Do **not** open a public issue. Report privately to the maintainers at
`security@terramind.ai` (or the private fork point of your deployment).

Please include:

- Affected version (see `APP_VERSION` in `packages/shared/src/const.ts`).
- Repro steps or a minimal request/response pair.
- Impact, and whether you tested against demo (JSON) or MySQL mode.

You should receive an acknowledgement within 72 hours and a triage within a week.

## Guiding principles

1. **No secrets in the repo.** `.env*`, `.data/`, `.kilo/` are git-ignored. If you
   find a committed secret, treat it as a disclosure: rotate immediately and report.
2. **Session hygiene.** All data procedures are behind a JWT-verified session
   (HttpOnly, SameSite=Lax, `Secure` in production). `JWT_SECRET` must be set in
   production — the dev fallback is documented as insecure.
3. **The AI cannot fabricate numbers.** Guardrails refuse forecasting/guarantee
   language; engine output is the only numeric source. This is a correctness and
   trust boundary, not just a feature.
4. **Principle of least privilege for data.** Campus data is scoped to the session
   workspace in the MySQL store; the demo store is single-workspace by design.

## Disclosures

- **2026-09-20** — Initial release review. No open issues. Dev-only `JWT_SECRET`
  fallback prints a startup warning; production requires an explicit secret.
- Docker MySQL uses default root credentials in `deploy/docker-compose.yml` —
  override `MYSQL_ROOT_PASSWORD` / `MYSQL_PASSWORD` / `JWT_SECRET` outside of a
  concrete deployment.