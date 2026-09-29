module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    sourceType: 'module',
    ecmaVersion: 2021,
    ecmaFeatures: { jsx: true },
  },
  plugins: ['@typescript-eslint', 'react', 'react-hooks'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  env: {
    es2021: true,
  },
  settings: {
    react: { version: 'detect' },
  },
  ignorePatterns: ['.eslintrc.js', 'node_modules', '.expo'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    // React Native no usa <a>/<img>, y el JSX runtime automatico de Expo no
    // requiere `import React` en cada archivo.
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'off',
  },
};
