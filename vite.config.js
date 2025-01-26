import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',  // Changed from '/ponggame/' to './' to work both locally and on GitHub Pages
  server: {
    port: 3000,
    open: true
  },
  root: './', // Set the root directory
  build: {
    rollupOptions: {
      input: './index.html', // Ensure the entry point is index.html
    },
  },
});
