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
      include: ['src/**/*.{js}'],
      exclude: [
        'src/**/*.{test,spec}.{js,jsx}',
        '**/*.test.{js,jsx}',
        '**/*.spec.{js,jsx}',
      ],
    },
  },
  resolve: {
    alias: {
      '@opencloning/store': resolve(__dirname, './src'),
      '@opencloning/utils': resolve(__dirname, '../utils/src/utils'),
    },
  },
});
