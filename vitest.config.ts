import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: [
      "packages/*/src/**/*.{test,spec}.ts",
      "apps/api/src/**/*.{test,spec}.ts",
    ],
    coverage: {
      reporter: ["text", "html"],
      include: ["packages/*/src/**/*.ts", "apps/api/src/**/*.ts"],
    },
  },
});