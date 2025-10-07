import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), svgr()],
    build: {
      target: 'esnext'
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'esnext'
      }
    },
    server: {
      proxy: {
        '/socket.io': {
          target: loadEnv(mode, process.cwd(), '').VITE_SOCKET_URL,
          ws: true,
          changeOrigin: true
        }
      }
    }
  };
});
