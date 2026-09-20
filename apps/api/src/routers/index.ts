import { authRouter } from "./auth";
import { campusRouter } from "./campus";
import { copilotRouter } from "./copilot";
import { factorsRouter } from "./factors";
import { interventionsRouter } from "./interventions";
import { reportRouter } from "./report";
import { scenarioRouter } from "./scenario";
import { systemRouter } from "./system";
import { traceRouter } from "./trace";
import { router } from "../trpc/trpc";

export const appRouter = router({
  system: systemRouter,
  auth: authRouter,
  campus: campusRouter,
  interventions: interventionsRouter,
  factors: factorsRouter,
  scenario: scenarioRouter,
  trace: traceRouter,
  report: reportRouter,
  copilot: copilotRouter,
});

export type AppRouter = typeof appRouter;