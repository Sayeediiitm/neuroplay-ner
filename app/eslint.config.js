import js from "@eslint/js";
import tseslint from "typescript-eslint";

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      // Disallow any diagnostic claims in string literals (belt-and-suspenders)
      "no-restricted-syntax": [
        "warn",
        {
          selector: "Literal[value=/diagnos|cure|treatment|prescription|dosage/i]",
          message: "NeuroPlay NER must not make diagnostic or treatment claims.",
        },
      ],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/no-explicit-any": "error",
    },
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  }
);
