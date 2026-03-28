import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import formatjs from "eslint-plugin-formatjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      formatjs
    },
    rules: {
      "formatjs/no-literal-string-in-jsx": ["error"],
      "formatjs/enforce-id": ["error"],
      "react/jsx-no-literals": ["error", {"noStrings": true, "allowedStrings": [], "ignoreProps": true, "noAttributeStrings": false }]
    }
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
