import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import prettier from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

/** Feature modules (src/features/<name>). Keep in sync with the directory. */
const FEATURES = [
  'auth',
  'dashboard',
  'products',
  'warehouses',
  'inventory',
  'requests',
  'suppliers',
  'forecast',
  'alerts',
  'areas',
  'users',
  'search',
];

/* ------------------------------------------------------------------ *
 * Layer rules (README §5): app ──► features ──► shared ──► core
 * ------------------------------------------------------------------ */
const forbid = (layers, message) => ({
  'no-restricted-imports': ['error', { patterns: [{ group: layers, message }] }],
});

const coreRules = forbid(
  ['@/app/**', '@/features/**', '@/shared/**'],
  'core must not import from app, features or shared.',
);

const sharedRules = forbid(
  ['@/app/**', '@/features/**'],
  'shared must not import from app or features.',
);

const featureRules = (name) =>
  forbid(
    ['@/app/**', ...FEATURES.filter((f) => f !== name).map((f) => `@/features/${f}/**`)],
    `A feature must not import from app or from another feature. Move shared code to shared/ or compose it in app/.`,
  );

/* ------------------------------------------------------------------ *
 * Local rule: no literal colors in className (README §8).
 * ------------------------------------------------------------------ */
const PALETTE =
  'white|black|slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose';
const PREFIXES =
  'bg|text|border|ring|fill|stroke|from|via|to|outline|divide|shadow|decoration|caret|accent';
const LITERAL_COLOR = new RegExp(
  `(?:^|[\\s:!])(?:${PREFIXES})-(?:${PALETTE})(?:-\\d{2,3})?(?:/\\d+)?(?=$|[\\s"'\`])|-\\[(?:#|rgb|hsl|oklch)`,
);

const noLiteralColors = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      literal:
        'Literal color "{{match}}" in className. Use a semantic theme token (bg-surface, text-fg, border-line, bg-primary…) so dark mode works.',
    },
  },
  create(context) {
    const insideClassName = (node) =>
      context.sourceCode
        .getAncestors(node)
        .some((a) => a.type === 'JSXAttribute' && a.name?.name === 'className');

    const check = (node, text) => {
      const match = LITERAL_COLOR.exec(text);
      if (match && insideClassName(node)) {
        context.report({ node, messageId: 'literal', data: { match: match[0].trim() } });
      }
    };

    return {
      Literal(node) {
        if (typeof node.value === 'string') check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.raw);
      },
    };
  },
};

const pangoPlugin = { rules: { 'no-literal-colors': noLiteralColors } };

export default defineConfig([
  globalIgnores(['dist', 'node_modules']),

  js.configs.recommended,
  tseslint.configs.recommended,

  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'default', format: ['camelCase'], leadingUnderscore: 'allow' },
        { selector: 'variable', format: ['camelCase', 'PascalCase', 'UPPER_CASE'] },
        { selector: 'function', format: ['camelCase', 'PascalCase'] },
        // PascalCase parameters/imports are allowed for component references (e.g. `Page`, `React`).
        { selector: 'parameter', format: ['camelCase', 'PascalCase'], leadingUnderscore: 'allow' },
        { selector: 'import', format: ['camelCase', 'PascalCase'] },
        { selector: 'typeLike', format: ['PascalCase'] },
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: { regex: '^I[A-Z]', match: false },
        },
        { selector: 'enumMember', format: ['PascalCase', 'UPPER_CASE'] },
        // Object/type keys mirror external shapes (HTTP headers, DTOs, CSS-in-JS): not enforced.
        {
          selector: ['objectLiteralProperty', 'typeProperty', 'objectLiteralMethod'],
          format: null,
        },
      ],
    },
  },

  // React
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      jsxA11y.flatConfigs.recommended,
    ],
  },

  // Named exports everywhere in src; only pages may use `export default` (React.lazy).
  {
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/features/*/pages/**'],
    rules: {
      'no-restricted-exports': [
        'error',
        {
          restrictDefaultExports: {
            direct: true,
            named: true,
            defaultFrom: true,
            namedFrom: true,
            namespaceFrom: true,
          },
        },
      ],
    },
  },

  // The route table is not a component module; Fast Refresh does not apply to it.
  {
    files: ['src/app/router.tsx'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },

  // No literal colors in className
  {
    files: ['src/**/*.tsx'],
    plugins: { pango: pangoPlugin },
    rules: { 'pango/no-literal-colors': 'error' },
  },

  // Dependency rules per layer
  { files: ['src/core/**/*.{ts,tsx}'], rules: coreRules },
  // Inside core, the HTTP client is the lowest level: auth plugs into it, never the reverse.
  {
    files: ['src/core/api/**/*.{ts,tsx}'],
    rules: forbid(
      ['@/app/**', '@/features/**', '@/shared/**', '@/core/auth/**'],
      'core/api must not import from core/auth: the session is injected with configureHttpAuth.',
    ),
  },
  { files: ['src/shared/**/*.{ts,tsx}'], rules: sharedRules },
  ...FEATURES.map((name) => ({
    files: [`src/features/${name}/**/*.{ts,tsx}`],
    rules: featureRules(name),
  })),

  // Tooling files (Node)
  {
    files: ['*.config.{js,ts}'],
    languageOptions: { globals: globals.node },
  },

  // Must be last: disables rules that conflict with Prettier
  prettier,
]);
