import react from '@vitejs/plugin-react';
import { ViteEjsPlugin } from 'vite-plugin-ejs';
import { loadEnv } from 'vite';

import { resolve } from 'path';
import fs from 'fs';
import istanbul from 'vite-plugin-istanbul';

import { baseDefine } from '../../base.config.js';

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
    resolve: {
      alias: {
        '@opencloning/ui': resolve(__dirname, '../../packages/ui/src'),
        '@opencloning/store': resolve(__dirname, '../../packages/store/src'),
        '@opencloning/utils': resolve(__dirname, '../../packages/utils/src/utils'),
      },
    },
    plugins: [
      react(),
      (env.VITE_COVERAGE) && istanbul({
        include: [
          'packages/*/src/**/*',
          'apps/*/src/**/*'
        ],
        extension: ['.js', '.jsx'],
        cwd: resolve(__dirname, '../..'),
      }),
      ViteEjsPlugin({
        umami_website_id: env.VITE_UMAMI_WEBSITE_ID,
      }),
      {
        name: 'copy-config',
        // Copy config file immediately when plugin loads
        configResolved() {
          try {
            const configPath = resolve(__dirname, 'public', configFileName);
            const destPath = resolve(__dirname, 'public', 'config.json');

            if (fs.existsSync(configPath)) {
              fs.copyFileSync(configPath, destPath);
              console.log(`Config file copied from ${configFileName} to config.json`);
            } else {
              console.warn(`Config file ${configFileName} not found at ${configPath}`);
            }
          } catch (error) {
            console.error('Failed to copy config file:', error);
          }
        },
        // When building the project, copy the config file to the build folder
        writeBundle() {
          try {
            const configPath = resolve(__dirname, 'public', configFileName);
            const destPath = resolve(__dirname, 'build', 'config.json');

            if (fs.existsSync(configPath)) {
              fs.copyFileSync(configPath, destPath);
              console.log(`Config file copied from ${configFileName} to build/config.json`);
            }
          } catch (error) {
            console.error('Failed to copy config file:', error);
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
    define: baseDefine,
    build: {
      outDir: 'build',
    },
  };
};
