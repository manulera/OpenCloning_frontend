import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { testConfig } from '../../vitest.common.config';

export default defineConfig({
  test: {
    ...testConfig,
  },
  resolve: {
    alias: {
      '@opencloning/ui': resolve(__dirname, './src'),
      '@opencloning/store': resolve(__dirname, '../store/src'),
      '@opencloning/utils': resolve(__dirname, '../utils/src/utils'),
    },
  },
});
