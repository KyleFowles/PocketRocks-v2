// FILE: .eslintrc.cjs

/** @type {import("eslint").Linter.Config} */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "next/typescript"],
  rules: {
    // Stop blocking progress on legacy/transition typing.
    "@typescript-eslint/no-explicit-any": "off",

    // This rule is loud and often false-positive for auth/provider patterns.
    "react-hooks/set-state-in-effect": "off",

    // Keep as a warning so you still get signal without being blocked.
    "react-hooks/exhaustive-deps": "warn",
  },
};
