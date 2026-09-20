import { ensureDemoBootstrap } from "@terramind/db";
import type { DataStore } from "@terramind/db";

/**
 * Demo auth provider: passwordless, single-workspace, fully offline.
 * Production auth providers (email/SSO) are a roadmap extension; the tRPC
 * surface is intentionally the same shape so swapping providers never
 * changes the client contract.
 */
export async function demoLogin(store: DataStore): ReturnType<typeof ensureDemoBootstrap> {
  return ensureDemoBootstrap(store);
}