// @ts-check

import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import prettierConfig from "eslint-config-prettier";
import reactPlugin from "eslint-plugin-react";
import tsDocsPlugin from "eslint-plugin-tsdoc";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import globals from "globals";
import { defineConfig } from "eslint/config";

const arrowFunctionRules = [
  {
    selector:
      "FunctionExpression:not(MethodDefinition > FunctionExpression, Property[method=true] > FunctionExpression)",
    message: "Use arrow functions instead of function expressions.",
  },
  {
    selector: "FunctionDeclaration",
    message:
      "Use arrow functions assigned to variables instead of function declarations.",
  },
];

export default defineConfig(
  {
    settings: {
      react: {
        version: "19.2.4",
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
      "simple-import-sort": simpleImportSort,
    },
    languageOptions: {
      parserOptions: {
        projectService: true,
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
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "prefer-arrow-callback": "error",
      "no-restricted-syntax": ["error", ...arrowFunctionRules],
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
      "apps/{playground,visualizer-fe,site,lightspell-site}/**/*.ts",
      "apps/{playground,visualizer-fe,site,lightspell-site}/**/*.tsx",
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
  },
  {
    files: ["apps/xcm-api/**/*.{ts,tsx}", "packages/*/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        ...arrowFunctionRules,
        {
          selector: "NewExpression[callee.name='Error']",
          message:
            'Using plain "new Error()" is forbidden in this project. Please use a specific error class that extends Error. Do not forget to handle it in the XCM-API afterwards.',
        },
        {
          selector: "CallExpression[callee.name='Error']",
          message:
            'Calling "Error()" directly is forbidden in this project). Please use a specific error class that extends Error. Do not forget to handle it in the XCM-API afterwards.',
        },
      ],
    },
  },
  {
    files: [
      "apps/xcm-api/**/*.test.ts",
      "packages/*/**/*.test.ts",
      "packages/xcm-analyser/**/*.ts",
    ],
    rules: {
      "no-restricted-syntax": "off",
    },
  },
);
