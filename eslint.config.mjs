import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig({
    files: ['src/**/*.ts'],
    extends: [
        js.configs.recommended,
        tseslint.configs.recommended,
    ],
    plugins: {
        '@stylistic': stylistic,
    },
    rules: {
        '@stylistic/semi': ['error', 'always'],
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
    },
});
