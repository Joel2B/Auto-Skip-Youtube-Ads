const js = require("@eslint/js");
const tsParser = require("@typescript-eslint/parser");
const tsPlugin = require("@typescript-eslint/eslint-plugin");
const globals = require("globals");
const prettier = require("eslint-config-prettier");

const tsFiles = ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"];

module.exports = [
    {
        ignores: ["node_modules/**", "dist/**"],
    },
    js.configs.recommended,
    ...tsPlugin.configs["flat/recommended"],
    {
        files: tsFiles,
        languageOptions: {
            parser: tsParser,
            ecmaVersion: 2021,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.es2021,
                chrome: "readonly",
            },
        },
    },
    prettier,
];
