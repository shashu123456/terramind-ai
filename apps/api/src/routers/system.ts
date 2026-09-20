import { z } from "zod";
import { APP_VERSION } from "@terramind/shared";
import type { AppInfo, SystemHealth } from "@terramind/shared";
import { publicProcedure, router } from "../trpc/trpc";

export const systemRouter = router({
  health: publicProcedure.query<SystemHealth>(({ ctx }) => ({
    status: "ok",
    uptimeSec: Math.floor(process.uptime()),
    mode: ctx.store.mode,
  })),
  info: publicProcedure.query<AppInfo>(({ ctx }) => ({
    version: APP_VERSION,
    mode: ctx.store.mode,
    llm: { provider: ctx.config.llm.provider, model: ctx.config.llm.model ?? null },
    demo: ctx.config.demoMode,
    now: new Date().toISOString(),
  })),
  echo: publicProcedure.input(z.object({ message: z.string().max(512) })).query(({ input }) => input.message),
});