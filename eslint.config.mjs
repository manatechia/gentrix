import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

const reactHooksRecommendedRules = {
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'error',
};

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.nx/**',
      '.pnpm-store/**',
      'coverage/**',
      'tmp/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx,mts,cts}'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            '*.config.*',
            'prisma.config.ts',
            'apps/frontend/vite.config.mts',
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
      'no-duplicate-imports': 'error',
    },
  },
  {
    files: ['**/*.{js,mjs,cjs}'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  {
    files: ['apps/frontend/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      ...reactHooksRecommendedRules,
    },
  },
  {
    files: ['apps/backend/**/*.{ts,tsx}', 'libs/**/*.{ts,tsx}', 'prisma.config.ts'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
);
