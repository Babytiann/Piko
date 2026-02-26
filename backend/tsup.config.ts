import path from 'node:path';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  outDir: 'dist',
  outExtension: () => ({ js: '.mjs' }),
  target: 'node22',
  sourcemap: true,
  clean: true,
  esbuildOptions(options) {
    options.alias = {
      ...options.alias,
      '@': path.resolve(__dirname),
    };
  },
});
