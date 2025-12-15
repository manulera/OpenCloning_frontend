import react from '@vitejs/plugin-react';
import { baseDefine } from '../../base.config.js';

export default () => {
  return {
    plugins: [react()],
    server: {
      port: 3001,
    },
    define: baseDefine,
  };
};
