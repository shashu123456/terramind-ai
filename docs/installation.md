# Installation

## Prerequisites

- **Node.js** ≥ 20.19 (tested on Node 25)
- **pnpm** 10.x (`corepack enable` or `npm i -g pnpm@10`)
- Optional: **Docker** + Docker Compose for the MySQL path

## 1. Demo mode (recommended first run)

Fully offline. No database, no API keys.

```bash
pnpm install
pnpm setup        # creates .env (if missing) and .data/
pnpm dev          # api :3000 (tsx watch) + web :5173 (Vite)
```

Open http://localhost:5173 → **Enter demo workspace**.

`pnpm setup` writes `.env.example` → `.env`. The demo store persists to
`.data/demo.json` (git-ignored). Demo logins are idempotent: the Northbridge
University workspace, campus, and baseline coverage are seeded exactly once.

## 2. Production / single-server mode

```bash
pnpm install
pnpm build        # vite → apps/web/dist, esbuild → apps/api/dist
pnpm start        # single Node server serving the SPA + tRPC on :3000
```

Open http://localhost:3000. SPA deep links (e.g. `/scenarios`) fall back to
`index.html`; `/health` and `/trpc/*` are excluded from the fallback.

## 3. MySQL 8 (production database)

1. Run MySQL 8 (locally or via the included Docker Compose).
2. Set `DATABASE_URL=mysql://user:pass@host:3306/terramind` in `.env`.
3. Push the schema (Drizzle):

   ```bash
   pnpm --filter @terramind/db db:push
   ```

4. Start normally. The API detects `DATABASE_URL` and switches from the JSON
   store to the MySQL store, seeding the intervention catalog on boot.

## 4. Docker (bundled MySQL)

```bash
pnpm docker:up     # docker compose -f deploy/docker-compose.yml up --build
```

Starts MySQL 8 (health-checked) + the API on http://localhost:3000. Both stages
build in Docker with pnpm `--frozen-lockfile`; the runtime image runs
`apps/api/dist/index.js` with production-only dependencies.
The compose file is validated; the Docker engine was not available on the
development machine, so the image build itself is unverified at this time.

## Environment reference

| Variable | Default | Meaning |
|---|---|---|
| `PORT` | `3000` | API/production port |
| `DEMO_MODE` | `true` when no `DATABASE_URL` | Force the JSON demo store |
| `DATABASE_URL` | — | MySQL connection string; switches to `mysql` mode |
| `JWT_SECRET` | dev-only fallback (warns) | Session signing secret; **must** be set in prod |
| `LLM_PROVIDER` | `local` | `local` \| `granite` \| `openai` \| `ollama` |
| `LLM_BASE_URL` / `LLM_API_KEY` / `LLM_MODEL` | — | OpenAI-compatible provider config |
| `DEMO_FILE_PATH` | `.data/demo.json` | JSON demo store location (root-relative) |

## The decision engine offline

In `local` mode the copilot needs no external service: it runs the deterministic
calculators and RAG retrieval in-process. This is the default and requires zero
configuration or network access.

## Troubleshooting

- **405 on tRPC POSTs** — every `.query` accepts POST thanks to
  `allowMethodOverride: true` in `apps/api/src/index.ts`. Rebuild after edits:
  `node scripts/build-api.mjs`.
- **`apps/web/dist` not served** — run `pnpm build` first; the API serves it only
  when it exists.
- **Stale demo data** — delete `.data/demo.json` and restart; it re-seeds.

## Verification

```bash
pnpm check     # tsc across api, web, and all packages
pnpm lint      # eslint — 0 errors
pnpm test      # vitest — 41 unit tests
pnpm build     # web (vite) + api (esbuild)
pnpm verify    # check + lint + test + build
```