
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  plugins: [],
    resolve: {
      extensions: ['.js', '.ts', '.json'],
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      target: 'esnext',
      outDir: 'build',
    },
    server: {
      port: 3000,
      open: true,
    },
  });