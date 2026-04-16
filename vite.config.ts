import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'FORGE — Gym Tracker',
        short_name: 'FORGE',
        description: 'Your personal gym operating system',
        theme_color: '#2ecc71',
        background_color: '#080c09',
        display: 'standalone',
        orientation: 'portrait-primary',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  // Use app.html so the existing vanilla-JS index.html is untouched
  root: '.',
  publicDir: 'public',
  server: {
    port: 5173,
    open: '/app.html',
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      input: { app: 'app.html' },
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router'],
          'vendor-charts': ['recharts'],
          'vendor-supabase': ['@supabase/supabase-js'],
        },
      },
    },
  },
});
