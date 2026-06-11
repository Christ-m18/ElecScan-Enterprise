import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    pool: 'forks',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { lines: 90, branches: 85, functions: 90, statements: 90 },
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/**/index.ts'],
    },
  },
});
