/**
 * TerraMind AI one-time setup.
 *
 *  - Creates a `.env` from `.env.example` when none exists.
 *  - Ensures the local demo data directory exists.
 *  - Prints the quick-start commands.
 *
 * Run:  node scripts/setup.mjs   (or:  pnpm setup)
 */
import { cpSync, existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const envExample = path.join(root, ".env.example");
const envFile = path.join(root, ".env");
const dataDir = path.join(root, ".data");

if (!existsSync(envFile)) {
  cpSync(envExample, envFile);
  console.log("[setup] Created .env from .env.example");
} else {
  console.log("[setup] .env already exists — leaving it untouched");
}

mkdirSync(dataDir, { recursive: true });
console.log("[setup] Ensured local data directory: .data/");

console.log("");
console.log("TerraMind AI is ready. Next steps:");
console.log("  pnpm install        install dependencies (if not already done)");
console.log("  pnpm dev            start the full app (API + web)");
console.log("  → open http://localhost:5173");
console.log("");
console.log("The app runs in offline demo mode by default — no MySQL, no AI keys.");
console.log("For the Docker/MySQL production path see deploy/docker-compose.yml.");