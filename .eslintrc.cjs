module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: [
    'eslint:recommended',
    'prettier',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'js/', 'css/', 'sw.js'],
  parser: '@typescript-eslint/parser',
  rules: {},
};
