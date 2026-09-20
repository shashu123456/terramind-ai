import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const DIR = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(DIR, "src"),
    },
  },
  envDir: DIR,
  build: {
    outDir: path.resolve(DIR, "dist"),
    emptyOutDir: true,
  },
  server: {
    host: true,
    port: 5173,
    proxy: {
      "/trpc": "http://localhost:3000",
      "/health": "http://localhost:3000",
    },
  },
});