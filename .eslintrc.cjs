module.exports = {
  root: true,
  env: {
    es2022: true,
    node: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'prettier'],
  ignorePatterns: ['node_modules/', 'playwright-report/', 'test-results/', 'dist/', 'coverage/'],
  rules: {
    'no-empty': ['error', { allowEmptyCatch: true }],
  },
  overrides: [
    {
      files: ['test-elements/fixtures/**/*.ts'],
      rules: {
        'no-empty-pattern': 'off',
      },
    },
    {
      files: ['tests/**/*.ts'],
      extends: ['plugin:playwright/recommended'],
    },
  ],
};
