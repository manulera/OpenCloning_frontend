import react from '@vitejs/plugin-react';
import { ViteEjsPlugin } from 'vite-plugin-ejs';
import { loadEnv } from 'vite';

import { resolve } from 'path';
import fs from 'fs';
import istanbul from 'vite-plugin-istanbul';


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
        configResolved() {
          // Copy config file immediately when plugin loads
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
      {
        name: 'copy-example-collection',
        configResolved() {
          if (process.env.NODE_ENV === 'development') {
            console.log('Copying example collection folder to public folder');
            const exampleCollectionPath = resolve(__dirname, 'local_files_example', 'collection');
            if (fs.existsSync(exampleCollectionPath)) {
              fs.cpSync(exampleCollectionPath, resolve(__dirname, 'public', 'collection'), { recursive: true });
            }
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
    build: {
      outDir: 'build',
    },
  };
};
