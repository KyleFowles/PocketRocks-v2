// FILE: eslint.config.mjs

import js from "@eslint/js";
import nextPlugin from "@next/eslint-plugin-next";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [
  // Ignore build outputs + config files that use CJS (module.exports)
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "dist/**",

      // Config files (CJS)
      ".eslintrc.cjs",
      "postcss.config.js",
      "tailwind.config.js",
      "next.config.js",
      "next.config.ts",
      "next.config.mjs",

      // If you have these, ignore them too
      "vitest.config.*",
      "jest.config.*",
      "eslint.config.*",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: {
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
      "@next/next": nextPlugin,
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    settings: {
      react: { version: "detect" },
    },
    rules: {
      // Next rules
      ...nextPlugin.configs.recommended.rules,
      ...nextPlugin.configs["core-web-vitals"].rules,

      // Hooks rules
      ...reactHooksPlugin.configs.recommended.rules,

      // Keep moving: allow any for now
      "@typescript-eslint/no-explicit-any": "off",

      // Prevent config-file "module is not defined" noise in general
      "no-undef": "off",
    },
  },
];
