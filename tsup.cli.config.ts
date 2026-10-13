import { defineConfig } from 'tsup';

/** CLI bundle: ESM only, no declarations, keeps dist from the library build. */
export default defineConfig({
  entry: { cli: 'cli/index.ts' },
  format: ['esm'],
  sourcemap: true,
  clean: false,
  target: 'es2022',
});
