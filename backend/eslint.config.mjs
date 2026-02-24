import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';

const eslintConfig = defineConfig([
  js.configs.recommended,
  globalIgnores(['dist/**', '.vercel/**', 'node_modules/**']),
  {
    rules: {
      'no-unused-vars': 'off', // TypeScript handles this
      'no-console': 'off',
    },
  },
]);

export default eslintConfig;
