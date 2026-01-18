import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default [
  // 1. Global ignores
  {
    ignores: [
      'dist/',
      'android/',
      'node_modules/',
    ],
  },

  // 2. Apply recommended configs globally
  js.configs.recommended,
  ...tseslint.configs.recommended,

  // 3. Specific config for your React/TypeScript files
  {
    files: ['src/**/*.{ts,tsx}'], // Lint only files in the src directory
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // Enable JSX parsing
        },
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      // Get all the recommended rules from the hooks plugin
      ...reactHooks.configs.recommended.rules,
      // Add the required rule for Vite + React Refresh
      'react-refresh/only-export-components': 'warn',
    },
  },

  // 4. Specific config for the Service Worker files
  {
    files: ['public/sw.js', 'public/firebase-messaging-sw.js'],
    languageOptions: {
      globals: {
        ...globals.serviceworker,
        // Agregamos variables globales específicas de los scripts importados de Firebase
        firebase: 'readonly',
        importScripts: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      // Desactivamos reglas de TypeScript que no aplican a JS plano en public/
      '@typescript-eslint/no-unused-vars': 'off',
      'no-undef': 'off' // Permitimos variables globales definidas en importScripts
    }
  },
];
