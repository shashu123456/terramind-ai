import { publicProcedure, router } from "../trpc/trpc";

export const interventionsRouter = router({
  list: publicProcedure.query(({ ctx }) => ctx.store.listInterventions()),
});