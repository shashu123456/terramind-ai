import { copilotAskSchema } from "@terramind/shared";
import { protectedProcedure, router } from "../trpc/trpc";
import { askCopilot } from "../services/copilot";

export const copilotRouter = router({
  ask: protectedProcedure
    .input(copilotAskSchema)
    .mutation(({ ctx, input }) =>
      askCopilot(ctx.store, {
        campusId: input.campusId,
        question: input.question,
        mode: input.mode,
      }),
    ),
});