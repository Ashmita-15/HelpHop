import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    // Defaults to 5173; Vite picks the next free port if it's taken.
    port: Number(process.env.PORT) || 5173,
    // Lets the frontend call /api/* without hardcoding the backend URL.
    proxy: {
      '/api': {
        target: process.env.VITE_API_PROXY || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
