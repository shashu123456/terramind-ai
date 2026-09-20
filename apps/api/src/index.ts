import "dotenv/config";
import { existsSync } from "node:fs";
import path from "node:path";
import express from "express";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { getStore, MysqlStore, seedInterventions } from "@terramind/db";
import { loadConfig, projectRoot } from "./config";
import { createContext } from "./trpc/context";
import { appRouter } from "./routers";

async function main() {
  const config = loadConfig();
  const store = await getStore({
    databaseUrl: config.databaseUrl,
    demoFile: config.demoFile,
  });
  await store.ready();

  if (store instanceof MysqlStore) {
    await seedInterventions(store);
    console.log(`[api] MySQL store ready (interventions seeded).`);
  }

  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.use(
    "/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext: (opts) => createContext(opts, store, config),
      allowMethodOverride: true,
    }),
  );

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", mode: store.mode, uptimeSec: Math.floor(process.uptime()) });
  });

  if (config.isProd) {
    const webDist = path.resolve(projectRoot, "apps", "web", "dist");
    if (existsSync(webDist)) {
      app.use(express.static(webDist));
      app.get(/^\/(?!trpc|health).*/, (_req, res) => {
        res.sendFile(path.join(webDist, "index.html"));
      });
      console.log(`[api] Serving web build from ${webDist}`);
    } else {
      console.warn(`[api] Web build not found at ${webDist} — API only.`);
    }
  }

  app.listen(config.port, () => {
    console.log(
      `[api] TerraMind AI (${config.isProd ? "production" : "development"}) on :${config.port} (mode: ${store.mode})`,
    );
  });
}

main().catch((err) => {
  console.error("[api] Fatal startup error:", err);
  process.exit(1);
});