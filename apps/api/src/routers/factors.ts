import { listFactors } from "@terramind/core";
import { publicProcedure, router } from "../trpc/trpc";

export const factorsRouter = router({
  list: publicProcedure.query(() => listFactors()),
});