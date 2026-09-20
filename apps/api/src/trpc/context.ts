import type { inferAsyncReturnType } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { COOKIE_NAME } from "@terramind/shared";
import type { User } from "@terramind/shared";
import type { DataStore } from "@terramind/db";
import type { AppConfig } from "../config";
import { parseCookies, verifySession } from "../auth/session";

export async function createContext(
  opts: CreateExpressContextOptions,
  store: DataStore,
  config: AppConfig,
) {
  let user: User | null = null;

  const cookies = parseCookies(opts.req.headers.cookie);
  const token = cookies[COOKIE_NAME];
  if (token) {
    const session = await verifySession(token, config);
    if (session) {
      user = await store.getUserByOpenId(session.sub);
    }
  }

  return { req: opts.req, res: opts.res, store, config, user };
}

export type AppContext = inferAsyncReturnType<typeof createContext>;