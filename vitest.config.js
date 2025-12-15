import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      'packages/store',
      'packages/utils',
      'packages/ui',
    ],
  },
});
