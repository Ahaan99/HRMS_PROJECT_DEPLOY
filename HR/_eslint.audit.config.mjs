// Audit-only ESLint flat config: crash-class rules only (no style noise).
// Run from "HRMS Merging":  node HR/node_modules/eslint/bin/eslint.js --no-config-lookup -c HR/_eslint.audit.config.mjs <dirs> -f json -o backend/scripts/_eslint-out.json
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";

export default [
  { ignores: ["**/dist/**", "**/node_modules/**", "**/*.config.js", "**/*.config.mjs", "**/public/**"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.browser, ...globals.es2021 },
    },
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...Object.fromEntries(Object.keys(js.configs.recommended.rules).map((r) => [r, "off"])),
      "no-undef": "error",
      "no-dupe-keys": "error",
      "no-dupe-args": "error",
      "no-duplicate-case": "error",
      "no-unreachable": "error",
      "no-const-assign": "error",
      "no-import-assign": "error",
      "no-self-assign": "error",
      "no-unsafe-negation": "error",
      "no-unsafe-optional-chaining": "error",
      "use-isnan": "error",
      "valid-typeof": "error",
      "getter-return": "error",
      "no-func-assign": "error",
      "no-obj-calls": "error",
      "no-setter-return": "error",
      "no-this-before-super": "error",
      "no-unsafe-finally": "error",
      "no-dupe-else-if": "error",
      "no-constant-binary-expression": "error",
      "no-loss-of-precision": "error",
      "for-direction": "error",
      "no-async-promise-executor": "error",
      "no-compare-neg-zero": "error",
      "no-cond-assign": "error",
      "no-redeclare": "error",
      "react-hooks/rules-of-hooks": "error",
    },
  },
];
