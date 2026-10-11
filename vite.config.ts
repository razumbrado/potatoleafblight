import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  optimizeDeps: {
    include: ['@tensorflow/tfjs', '@teachablemachine/image'],
  },
  build: {
    // TensorFlow.js is large but only downloaded when the detection workspace opens.
    chunkSizeWarningLimit: 2100,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          tensorflow: ['@tensorflow/tfjs', '@teachablemachine/image'],
          charts: ['recharts'],
        },
      },
    },
  },
  server: {
    port: 5173,
    // Listen on the local network so phones on the same Wi-Fi can open the app.
    host: true,
    // Open the app in the default browser when the dev server starts.
    open: true,
  },
});
