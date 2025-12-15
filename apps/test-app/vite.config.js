import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

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

  return {
    plugins: [react()],
    server: {
      port: 3001,
    },
    define: {
      __APP_VERSION__: JSON.stringify(getGitTag(env.VITE_GIT_TAG)),
    },
  };
};
