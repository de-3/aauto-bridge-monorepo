module.exports = {
  root: true,
  parserOptions: {
    sourceType: 'module',
  },

  // extends: ['@metamask/eslint-config'],

  overrides: [
    {
      files: ['**/*.js'],
      extends: ['@metamask/eslint-config-nodejs'],
    },

    {
      files: ['**/*.{ts,tsx}'],
      extends: ['@metamask/eslint-config-typescript'],
      rules: {
        '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
        'jsdoc/require-jsdoc': 'off',
        'jsdoc/require-description': 'off',
        'jsdoc/require-returns': 'off',
        'jsdoc/require-param-description': 'off',
        'import/no-unassigned-import': 'off',
        '@typescript-eslint/ban-types': 'off',
        '@typescript-eslint/no-shadow': 'off',
        '@typescript-eslint/ban-ts-comment': 'off',
      },
    },

    {
      files: ['**/*.test.ts', '**/*.test.js'],
      extends: ['@metamask/eslint-config-jest'],
      rules: {
        '@typescript-eslint/no-shadow': [
          'error',
          { allow: ['describe', 'expect', 'it'] },
        ],
      },
    },
  ],

  ignorePatterns: [
    '!.prettierrc.js',
    '**/!.eslintrc.js',
    '**/dist*/',
    '**/*__GENERATED__*',
    '**/build',
    '**/public',
    '**/.cache',
  ],
}
