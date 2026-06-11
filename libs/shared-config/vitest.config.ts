import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    pool: 'forks',
    environment: 'node',
    include: ['src/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { lines: 85, branches: 80, functions: 85, statements: 85 },
    },
  },
});
