/**
 * Builds the TerraMind API into a self-contained production bundle.
 *
 * Bundles the workspace packages (@terramind/*) into the output file while
 * keeping all third-party dependencies (`node_modules`) external so they are
 * resolved from the installed dependency tree at runtime.
 */
import { build } from "esbuild";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspacePackages = {
  "@terramind/shared": "packages/shared/src/index.ts",
  "@terramind/core": "packages/core/src/index.ts",
  "@terramind/ai": "packages/ai/src/index.ts",
  "@terramind/db": "packages/db/src/index.ts",
  "@terramind/ui": "packages/ui/src/index.tsx",
};

const start = Date.now();

await build({
  entryPoints: [path.join(root, "apps/api/src/index.ts")],
  outfile: path.join(root, "apps/api/dist/index.js"),
  bundle: true,
  platform: "node",
  format: "esm",
  target: "node20",
  sourcemap: false,
  minify: true,
  packages: "external",
  logLevel: "info",
  plugins: [
    {
      name: "terramind-workspace",
      setup(b) {
        const matcher = new RegExp(
          `^(${Object.keys(workspacePackages).join("|")})$`,
        );
        b.onResolve({ filter: matcher }, (args) => ({
          path: path.resolve(root, workspacePackages[args.path]),
          namespace: "file",
        }));
      },
    },
  ],
});

console.log(`[build] API bundle written in ${Date.now() - start}ms`);