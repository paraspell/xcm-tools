// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import reactPlugin from "eslint-plugin-react";
import tsDocsPlugin from "eslint-plugin-tsdoc";
import globals from "globals";

export default tseslint.config(
  {
    settings: {
      react: {
        version: "18.3.1",
      },
    },
  },
  {
    ignores: [
      "eslint.config.js",
      "**/dist/",
      "**/.turbo/",
      "**/vitest.*.ts",
      "**/vite.config.ts",
      "**/rollup.config.js",
      "**/*spec.ts",
      "**/client/",
      "**/postcss.config.cjs",
      "**/codegen.ts",
      "**/playwright.config.ts",
      "**/e2e/",
      "**/coverage/",
      "**/scripts/",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  prettierConfig,
  {
    plugins: {
      tsdoc: tsDocsPlugin,
    },
    languageOptions: {
      parserOptions: {
        project: ["./packages/*/tsconfig*.json", "./apps/*/tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "no-console": "error",
      "tsdoc/syntax": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "all",
          argsIgnorePattern: "^_",
          caughtErrors: "all",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: false,
          fixStyle: "separate-type-imports",
        },
      ],
    },
  },
  {
    files: ["**/*.test.ts"],
    rules: {
      "@typescript-eslint/no-unsafe-assignment": "off",
    },
  },
  {
    files: [
      "apps/{playground,visualizator-fe,landing-page}/**/*.ts",
      "apps/{playground,visualizator-fe,landing-page}/**/*.tsx",
    ],
    ...reactPlugin.configs.flat?.recommended,
    rules: {
      ...reactPlugin.configs.flat?.recommended.rules,
      ...reactPlugin.configs.flat["jsx-runtime"].rules,
      "react/prop-types": "off",
      "react/no-unknown-property": "off",
    },
    languageOptions: {
      ...reactPlugin.configs.flat?.recommended.languageOptions,
      parserOptions: {
        ...reactPlugin.configs.flat?.recommended.languageOptions.parserOptions,
        ...reactPlugin.configs.flat["jsx-runtime"].languageOptions
          .parserOptions,
      },
      globals: {
        ...globals.serviceworker,
        ...globals.browser,
      },
    },
  }
);
