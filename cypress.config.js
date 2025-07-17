import { defineConfig } from 'cypress';
import fs from 'fs';
import istanbul from 'vite-plugin-istanbul';
import { execSync } from 'child_process';
import { ViteEjsPlugin } from 'vite-plugin-ejs';

// Function to get git tag information
function getGitTag() {
  try {
    return execSync('git describe --tags').toString().trim();
  } catch (error) {
    return 'unknown';
  }
}

export default defineConfig({
  e2e: {
    setupNodeEvents(on, config) {
      on('task', {
        readFileMaybe(filename) {
          if (fs.existsSync(filename)) {
            return fs.readFileSync(filename,
              'utf8');
          }

          return null;
        },
        moveFile({ from, to }) {
          fs.renameSync(from, to);
          return null;
        },
      });
      if (process.env.VITE_COVERAGE) {
        try {
          import('@cypress/code-coverage/task.js').then((task) => task.default(on, config));
        } catch (error) {
          console.warn('Could not load code coverage task:', error.message);
        }
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
    env: {
      GIT_TAG: getGitTag(),
    },
  },

  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig: {
        mode: 'test',
        plugins: [
          (process.env.VITE_COVERAGE) && istanbul({
            include: 'src/*',
            exclude: ['node_modules',
              'tests/'],
            extension: ['.js', '.jsx'],
            requireEnv: true,
          }),
          ViteEjsPlugin({
            umami_website_id: process.env.VITE_UMAMI_WEBSITE_ID,
          }),
        ],
        optimizeDeps: {
          entries: ['src/**/*.jsx', 'src/**/*.js', 'cypress/**/*.js'],
        },
        define: {
          __APP_VERSION__: JSON.stringify(getGitTag()),
        },
      },
    },
    setupNodeEvents(on, config) {
      if (process.env.VITE_COVERAGE) {
        try {
          import('@cypress/code-coverage/task.js').then((task) => task.default(on, config));
        } catch (error) {
          console.warn('Could not load code coverage task:', error.message);
        }
      }
      return config;
    },
  },

  retries: {
    runMode: 2,
  },
});
