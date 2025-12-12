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
      '@opencloning/utils': resolve(__dirname, './src/utils'),
      '@opencloning/store': resolve(__dirname, '../store/src'),
    },
  },
});
