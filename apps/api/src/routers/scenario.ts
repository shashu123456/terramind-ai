import { z } from "zod";
import {
  FACTOR_VERSION,
  MODEL_VERSION,
  scenarioRunInputSchema,
  scenarioSaveInputSchema,
} from "@terramind/shared";
import type { ApprovalStatus } from "@terramind/shared";
import { protectedProcedure, publicProcedure, router } from "../trpc/trpc";
import { runScenario, describeWeights } from "../services/scenario";
import { siteProfile } from "../services/profile";
import { calculateInterventionImpact, getModes, toCatalogEntry } from "@terramind/core";

export const scenarioRouter = router({
  modes: publicProcedure.query(() => getModes()),
  list: protectedProcedure
    .input(z.object({ campusId: z.number().int().positive() }))
    .query(({ ctx, input }) => ctx.store.listScenarios(input.campusId)),
  get: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const scenario = await ctx.store.getScenario(input.id);
      if (!scenario) return null;
      const batches = await ctx.store.listScenarioResults(scenario.id);
      const latest = batches.sort((a, b) => a.batch - b.batch).at(-1);
      const profile = await siteProfile(ctx.store, scenario.campusId);
      const impacts = profile
        ? scenario.interventionSlugs.map((slug) =>
            calculateInterventionImpact(toCatalogEntry(slug), profile.baseline),
          )
        : [];
      return {
        ...scenario,
        impacts,
        portfolios: latest?.portfolios ?? [],
        batches,
        modelVersion: MODEL_VERSION,
        factorVersion: FACTOR_VERSION,
      };
    }),
  run: protectedProcedure
    .input(scenarioRunInputSchema)
    .mutation(({ ctx, input }) =>
      runScenario(ctx.store, {
        campusId: input.campusId,
        baseline: input.baseline,
        interventionSlugs: input.interventionSlugs,
        budgetInr: input.budgetInr,
        horizonYears: input.horizonYears,
        mode: input.mode,
      }),
    ),
  save: protectedProcedure
    .input(scenarioSaveInputSchema)
    .mutation(({ ctx, input }) =>
      runScenario(ctx.store, {
        campusId: input.campusId,
        name: input.name,
        baseline: input.baseline,
        interventionSlugs: input.interventionSlugs,
        budgetInr: input.budgetInr,
        horizonYears: input.horizonYears,
        mode: input.mode,
      }),
    ),
  compare: protectedProcedure
    .input(z.object({ a: z.number().int().positive(), b: z.number().int().positive() }))
    .query(async ({ ctx, input }) => {
      const [sa, sb] = await Promise.all([
        ctx.store.getScenario(input.a),
        ctx.store.getScenario(input.b),
      ]);
      if (!sa || !sb) return null;
      return {
        a: { name: sa.name, mode: sa.mode, budgetInr: sa.budgetInr, createdAt: sa.createdAt },
        b: { name: sb.name, mode: sb.mode, budgetInr: sb.budgetInr, createdAt: sb.createdAt },
        difference: describeWeights(sa.mode) !== describeWeights(sb.mode) ? describeWeights(sb.mode) : "Same weights",
      };
    }),
  profile: protectedProcedure
    .input(z.object({ campusId: z.number().int().positive() }))
    .query(({ ctx, input }) => siteProfile(ctx.store, input.campusId)),
  approve: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["approved", "rejected"]) }))
    .mutation(async ({ ctx, input }) => {
      const scenario = await ctx.store.getScenario(input.id);
      if (!scenario) throw new Error("Scenario not found.");
      await ctx.store.updateScenarioStatus(input.id, input.status as ApprovalStatus);
      await ctx.store.createTrace({
        campusId: scenario.campusId,
        scenarioId: scenario.id,
        kind: "approval",
        summary: `Scenario "${scenario.name}" ${input.status}`,
        inputHash: input.status,
        modelVersion: MODEL_VERSION,
        factorVersion: FACTOR_VERSION,
        weights: scenario.weights,
        mode: scenario.mode,
        citations: [],
        snapshot: { target: "scenario", from: scenario.status, to: input.status },
      });
      return ctx.store.getScenario(input.id);
    }),
});