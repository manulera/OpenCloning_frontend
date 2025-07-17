import react from '@vitejs/plugin-react';
import { ViteEjsPlugin } from 'vite-plugin-ejs';
import { loadEnv } from 'vite';

import { resolve } from 'path';
import fs from 'fs';
import istanbul from 'vite-plugin-istanbul';
import { execSync } from 'child_process';

// Function to get git tag information
function getGitTag(backup) {
  try {
    // This works locally and in CI, but not in docker
    return execSync('git describe --tags').toString().trim();
  } catch (error) {
    return backup || 'unknown';
  }
}

export default ({ mode }) => {
  const env = loadEnv(mode, process.cwd());

  // Determine the config file to use based on the mode and the presence of the ELABFTW API read key
  let configFileName;
  if (mode === 'production') {
    configFileName = 'config.prod.json';
  } else if (mode === 'development' && env.VITE_ELABFTW_API_READ_KEY) {
    configFileName = 'config.elabftw.json';
  } else {
    configFileName = 'config.dev.json';
  }

  return {
    logLevel: env.VITE_LOG_LEVEL,
    plugins: [
      react(),
      (env.VITE_COVERAGE) && istanbul({
        include: 'src/*',
        exclude: ['node_modules', 'tests/'],
        extension: ['.js', '.jsx'],
        requireEnv: true,
      }),
      ViteEjsPlugin({
        umami_website_id: env.VITE_UMAMI_WEBSITE_ID,
      }),
      {
        name: 'copy-config',
        // When running the dev server, copy the config file to the public folder
        // as config.json so it can be fetched by the frontend
        configureServer(server) {
          try {
            const configPath = resolve(__dirname, 'public', configFileName);
            const destPath = resolve(__dirname, 'public', 'config.json');

            // Check if source file exists
            if (!fs.existsSync(configPath)) {
              console.warn(`Config file ${configFileName} not found at ${configPath}`);
              return;
            }

            fs.copyFileSync(configPath, destPath);
            console.log(`Config file copied from ${configFileName} to config.json`);
          } catch (error) {
            console.error('Failed to copy config file:', error);
          }
        },
        // When building the project, copy the config file to the build folder
        // as config.json so it can be fetched by the frontend
        writeBundle() {
          try {
            const configPath = resolve(__dirname, 'public', configFileName);
            const destPath = resolve(__dirname, 'build', 'config.json');

            // Check if source file exists
            if (!fs.existsSync(configPath)) {
              console.warn(`Config file ${configFileName} not found at ${configPath}`);
              return;
            }

            fs.copyFileSync(configPath, destPath);
            console.log(`Config file copied from ${configFileName} to build/config.json`);
          } catch (error) {
            console.error('Failed to copy config file:', error);
          }
        },
        // Add a hook that runs when the server starts to ensure config is copied
        buildStart() {
          try {
            const configPath = resolve(__dirname, 'public', configFileName);
            const destPath = resolve(__dirname, 'public', 'config.json');

            if (fs.existsSync(configPath)) {
              fs.copyFileSync(configPath, destPath);
              console.log(`Config file copied on build start`);
            }
          } catch (error) {
            console.error('Failed to copy config file on build start:', error);
          }
        },
      },
    ],
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-redux',
        '@mui/material',

      ],
      esbuildOptions: {
        loader: {
          '.js': 'jsx',
        },
      },
    },
    define: {
    // used to be global: {}
    // changed it because it was giving problems with yarn build, it would
    // replace global as an object field in a file by {}, creating a syntax error.
    // Some people in stackoverflow said to use global: 'window', but that replaced
    // the word window in the scripts, creating other problems.
    // global: {},
    // Create an env variable with the git tag
      __APP_VERSION__: JSON.stringify(getGitTag(env.VITE_GIT_TAG)),
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './tests/setup.js',
      coverage: {
        provider: 'v8',
      },
    },
    build: {
      outDir: 'build',
    },
  };
};
