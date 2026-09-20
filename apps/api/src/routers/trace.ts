import { z } from "zod";
import type { ApprovalStatus } from "@terramind/shared";
import { protectedProcedure, router } from "../trpc/trpc";

export const traceRouter = router({
  list: protectedProcedure
    .input(z.object({ campusId: z.number().int().positive().optional() }))
    .query(({ ctx, input }) => ctx.store.listTraces(input.campusId ?? null)),
  get: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .query(({ ctx, input }) => ctx.store.getTrace(input.id)),
  approve: protectedProcedure
    .input(z.object({ id: z.number().int().positive(), status: z.enum(["approved", "rejected"]) }))
    .mutation(async ({ ctx, input }) => {
      const trace = await ctx.store.getTrace(input.id);
      if (!trace) throw new Error("Trace not found.");
      await ctx.store.updateTraceApproval(input.id, input.status as ApprovalStatus);
      return ctx.store.getTrace(input.id);
    }),
});