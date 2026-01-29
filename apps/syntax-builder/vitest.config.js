import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: '../../tests/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
    coverage: {
      provider: 'istanbul',
      reporter: ['json', 'html'],
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/**/*.{test,spec}.{js,jsx}',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
      ],
    },
  },
  resolve: {
    alias: {
      '@opencloning/ui': resolve(__dirname, '../../packages/ui/src'),
      '@opencloning/store': resolve(__dirname, '../../packages/store/src'),
      '@opencloning/utils': resolve(__dirname, '../../packages/utils/src/utils'),
    },
  },
});

