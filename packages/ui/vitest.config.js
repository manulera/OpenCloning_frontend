import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: '../../tests/setup.js',
    include: ['src/**/*.{test,spec}.{js,jsx}'],
  },
  resolve: {
    alias: {
      '@opencloning/ui': resolve(__dirname, './src'),
      '@opencloning/store': resolve(__dirname, '../store/src'),
      '@opencloning/utils': resolve(__dirname, '../utils/src/utils'),
    },
  },
});
