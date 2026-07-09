import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Root-level CommonJS dev/debug scripts — not part of Next.js app source
    "dump-pdf-stream.js",
    "extract-cell-geometry.js",
    "extract-coords.js",
    "inspect-pdf.js",
  ]),
]);

export default eslintConfig;
