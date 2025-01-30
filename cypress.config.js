const { defineConfig } = require('cypress');
const fs = require('fs');
const istanbul = require('vite-plugin-istanbul');

module.exports = defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        readFileMaybe(filename) {
          if (fs.existsSync(filename)) {
            return fs.readFileSync(filename, 'utf8');
          }

          return null;
        },
      });
      if (process.env.VITE_COVERAGE) {
        require('@cypress/code-coverage/task')(on, config);
      }

      // Filter specs by test group if specified
      if (process.env.CYPRESS_TEST_GROUP) {
        config.specPattern = `cypress/e2e/group-${process.env.CYPRESS_TEST_GROUP}/**/*.cy.{js,jsx}`;
      }

      return config;
    },
    baseUrl: 'http://localhost:3000',
    experimentalStudio: true,
    numTestsKeptInMemory: 2,
  },

  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig: {
        plugins: [
          (process.env.VITE_COVERAGE) && istanbul({
            include: 'src/*',
            exclude: ['node_modules', 'tests/'],
            extension: ['.js', '.jsx'],
            requireEnv: true,
          }),
        ],
      },
    },
    setupNodeEvents(on, config) {
      if (process.env.VITE_COVERAGE) {
        require('@cypress/code-coverage/task')(on, config);
      }
      return config;
    },
  },

  retries: {
    runMode: 2,
  },
});
