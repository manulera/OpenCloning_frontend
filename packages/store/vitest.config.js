import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { testConfig } from '../../vitest.common.config';

export default defineConfig({
  test: {
    ...testConfig,
  },
  resolve: {
    alias: {
      '@opencloning/store': resolve(__dirname, './src'),
      '@opencloning/utils': resolve(__dirname, '../utils/src/utils'),
    },
  },
});
