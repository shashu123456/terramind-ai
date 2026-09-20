# syntax=docker/dockerfile:1
FROM node:22-alpine AS build

WORKDIR /t

RUN corepack enable

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY patches ./patches
COPY tsconfig.base.json ./
COPY apps ./apps
COPY packages ./packages
COPY scripts ./scripts

RUN pnpm install --frozen-lockfile

RUN pnpm --filter @terramind/web build
RUN pnpm --filter @terramind/api build

# ---- runtime ----
FROM node:22-alpine

WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable

COPY --from=build /t/package.json /t/pnpm-workspace.yaml /t/pnpm-lock.yaml ./
COPY --from=build /t/patches ./patches
COPY --from=build /t/apps/api/package.json ./apps/api/package.json
COPY --from=build /t/apps/web/dist ./apps/web/dist
COPY --from=build /t/apps/api/dist ./apps/api/dist
COPY --from=build /t/packages ./packages

RUN pnpm install --prod --frozen-lockfile --filter @terramind/api

EXPOSE 3000

CMD ["node", "apps/api/dist/index.js"]