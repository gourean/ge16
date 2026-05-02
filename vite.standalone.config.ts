import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    viteSingleFile(),
  ],
  build: {
    // Ensure large audio files (up to 50MB total) are inlined as Base64
    assetsInlineLimit: 100_000_000, 
    chunkSizeWarningLimit: 100_000_000,
    cssCodeSplit: false,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  // Use VITE_STANDALONE=true during this build
  define: {
    'import.meta.env.VITE_STANDALONE': JSON.stringify('true'),
  },
  base: './',
});
