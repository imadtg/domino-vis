import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginReact from "eslint-plugin-react";
import { defineConfig, globalIgnores } from "eslint/config";

export default defineConfig([
  // global ignores applied first
  globalIgnores(["node_modules/**", ".next/**", "public/wasm/**", "dist/**"]),

  {
    files: ["**/*.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: { globals: globals.browser },
  },

  tseslint.configs.recommended,
  pluginReact.configs.flat.recommended,
]);
