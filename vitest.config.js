import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      provider: 'istanbul',
      reporter: ['json', 'html'],
      include: [
        'packages/*/src/**/*.{js,jsx}',
        'apps/*/src/**/*.{js,jsx}',
      ],
      exclude: [
        'node_modules/**',
        '**/node_modules/**',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
        '**/tests/**',
        '**/cypress/**',
        '**/coverage/**',
        '**/.nyc_output/**',
        '**/dist/**',
        '**/build/**',
      ],
    },
    projects: [
      'packages/store',
      'packages/utils',
      'packages/ui',
      'apps/syntax-builder',
    ],
  },
});
