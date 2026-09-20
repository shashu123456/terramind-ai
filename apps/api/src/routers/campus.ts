import { z } from "zod";
import { campusInputSchema } from "@terramind/shared";
import type { MetricCoverage } from "@terramind/shared";
import { protectedProcedure, router } from "../trpc/trpc";
import { siteProfile } from "../services/profile";

export const campusRouter = router({
  list: protectedProcedure.query(({ ctx }) =>
    ctx.store.listCampuses(ctx.user.workspaceId ?? null),
  ),
  get: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(({ ctx, input }) => siteProfile(ctx.store, input.id)),
  create: protectedProcedure
    .input(campusInputSchema)
    .mutation(async ({ ctx, input }) =>
      ctx.store.createCampus({
        ownerId: ctx.user.id,
        workspaceId: ctx.user.workspaceId ?? null,
        ...input,
      }),
    ),
  importBaseline: protectedProcedure
    .input(
      z.object({
        campusId: z.number().int().positive(),
        baseline: z.object({
          gradient: z.boolean().optional(),
          energyKwh: z.number().min(0).optional(),
          energyQuality: z.string().optional(),
          waterKl: z.number().min(0).optional(),
          waterQuality: z.string().optional(),
          wasteKg: z.number().min(0).optional(),
          wasteQuality: z.string().optional(),
          carbonTco2e: z.number().min(0).optional(),
          carbonQuality: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const b = input.baseline;
      const coverage: MetricCoverage[] = [];
      if (b.energyKwh !== undefined) {
        coverage.push({
          metric: "energy",
          value: b.energyKwh,
          unit: "kwh",
          quality: (b.energyQuality as MetricCoverage["quality"]) ?? "entered",
        });
      }
      if (b.waterKl !== undefined) {
        coverage.push({
          metric: "water",
          value: b.waterKl,
          unit: "kl",
          quality: (b.waterQuality as MetricCoverage["quality"]) ?? "entered",
        });
      }
      if (b.wasteKg !== undefined) {
        coverage.push({
          metric: "waste",
          value: b.wasteKg,
          unit: "kg",
          quality: (b.wasteQuality as MetricCoverage["quality"]) ?? "entered",
        });
      }
      if (b.carbonTco2e !== undefined) {
        coverage.push({
          metric: "carbon",
          value: b.carbonTco2e,
          unit: "tco2e",
          quality: (b.carbonQuality as MetricCoverage["quality"]) ?? "derived",
        });
      }
      if (coverage.length === 0) {
        throw new Error("No baseline values provided.");
      }
      await ctx.store.upsertCoverage(input.campusId, coverage);
      return siteProfile(ctx.store, input.campusId);
    }),
});