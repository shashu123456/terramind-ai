import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

const hereDir = path.dirname(fileURLToPath(import.meta.url));
export const projectRoot = path.resolve(hereDir, "..", "..", "..");

dotenv.config({ path: path.join(projectRoot, ".env") });
dotenv.config();

export interface LlmConfig {
  provider: "local" | "granite" | "openai" | "ollama";
  baseUrl?: string;
  apiKey?: string;
  model?: string;
}

export interface AppConfig {
  port: number;
  isProd: boolean;
  demoMode: boolean;
  databaseUrl?: string;
  jwtSecret: string;
  llm: LlmConfig;
  demoFile: string;
}

const DEV_FALLBACK_SECRET = "dev-only-insecure-secret-change-me";

export function loadConfig(): AppConfig {
  const isProd = process.env.NODE_ENV === "production";
  const databaseUrl = process.env.DATABASE_URL || undefined;
  const demoMode = process.env.DEMO_MODE === "true" || !databaseUrl;

  const jwtSecret = process.env.JWT_SECRET || DEV_FALLBACK_SECRET;
  if (isProd && !process.env.JWT_SECRET) {
    console.warn("[config] WARNING: JWT_SECRET is not set in production. Using an insecure fallback — set JWT_SECRET.");
  }

  return {
    port: Number(process.env.PORT || 3000),
    isProd,
    demoMode,
    databaseUrl,
    jwtSecret,
    llm: {
      provider: (process.env.LLM_PROVIDER as LlmConfig["provider"]) || "local",
      baseUrl: process.env.LLM_BASE_URL || undefined,
      apiKey: process.env.LLM_API_KEY || undefined,
      model: process.env.LLM_MODEL || undefined,
    },
    demoFile: path.resolve(projectRoot, process.env.DEMO_FILE_PATH || ".data/demo.json"),
  };
}