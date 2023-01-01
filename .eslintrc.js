module.exports = {
  env: {
    es2022: true,
    node: true,
    'jest/globals': true,
  },
  extends: [
    'eslint:recommended',
    'plugin:node/recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:you-dont-need-lodash-underscore/all-warn',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'jest'],
  rules: {
    'node/no-unsupported-features/es-syntax': [
      'error',
      { ignores: ['modules'] },
    ],
    'node/no-missing-import': 'off',
    'dot-notation': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-extend-native': 'error',
    'no-var': 'error',
    'prefer-const': 'error',
    'no-useless-computed-key': 'warn',
    'no-throw-literal': 'error',
    'no-new': 'error',
    'array-callback-return': 'error',
    'no-constructor-return': 'error',
    'no-duplicate-imports': 'error',
    'no-promise-executor-return': 'error',
    'no-eq-null': 'error',
    'no-new-func': 'error',
    'no-proto': 'error',
    'no-useless-catch': 'error',
    'no-return-await': 'warn',
    'prefer-rest-params': 'error',
    'max-params': ['warn', 4],
    'node/no-path-concat': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/no-unused-vars': 'warn',
    '@typescript-eslint/no-empty-function': 'warn',
    'no-unused-vars': 'off',
    'node/no-sync': [
      'warn',
      {
        allowAtRootLevel: true,
      },
    ],

    // duo incompatibility with module aliases
    'node/no-missing-require': 'off',

    // IDK why this rule is not working good
    'node/no-unpublished-require': 'off',
    '@typescript-eslint/ban-ts-comment': 'warn',

    // 'you-dont-need-momentjs/no-require-moment': 'off',
    // 'you-dont-need-momentjs/no-moment-constructor': 'warn',

    'no-restricted-properties': [
      'warn',
      {
        object: '_',
        property: 'tap',
      },
      {
        property: 'prototype',
        message: 'use ES6 class methods',
      },
      {
        object: 'global',
        message: 'Do not use global object',
      },
    ],
  },
  overrides: [
    {
      // JavaScript only rules
      files: ['**/*.js'],
      rules: {
        '@typescript-eslint/ban-ts-comment': 'off',
        '@typescript-eslint/no-var-requires': 'off',
        '@typescript-eslint/no-this-alias': 'warn',
        'no-import-export/no-import-export': 'off',
      },
    },
    {
      // TypeScript only rules
      files: ['**/*.ts', '**/*.tsx'],
      rules: {
        'no-return-await': 'error',
        'no-useless-computed-key': 'error',
        // has some false positive with TSX files
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],
};
