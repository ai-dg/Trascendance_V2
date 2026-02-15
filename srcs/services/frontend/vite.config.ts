import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: path.resolve(__dirname, 'srcs/public'),
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'srcs/public/index.html')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'srcs/public/scripts/ts'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
});
