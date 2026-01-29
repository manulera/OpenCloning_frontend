import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { testConfig } from '../../vitest.common.config';

export default defineConfig({
  test: {
    ...testConfig,
  },
  resolve: {
    alias: {
      '@opencloning/ui': resolve(__dirname, '../../packages/ui/src'),
      '@opencloning/store': resolve(__dirname, '../../packages/store/src'),
      '@opencloning/utils': resolve(__dirname, '../../packages/utils/src/utils'),
    },
  },
});

