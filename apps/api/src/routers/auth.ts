import { demoLoginSchema } from "@terramind/shared";
import type { DemoSeedResult } from "@terramind/db";
import { publicProcedure, router } from "../trpc/trpc";
import { demoLogin } from "../auth/provider";
import { clearSessionCookie, sessionCookie, signSession } from "../auth/session";

export const authRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user),
  demoLogin: publicProcedure
    .input(demoLoginSchema)
    .mutation<DemoSeedResult>(async ({ ctx }) => {
      const result = await demoLogin(ctx.store);
      const token = await signSession(
        {
          sub: result.user.openId,
          uid: result.user.id,
          name: result.user.name,
          role: result.user.role,
        },
        ctx.config,
      );
      ctx.res.setHeader("Set-Cookie", sessionCookie(token, ctx.config));
      return result;
    }),
  logout: publicProcedure.mutation(async ({ ctx }) => {
    ctx.res.setHeader("Set-Cookie", clearSessionCookie());
    return { ok: true };
  }),
});