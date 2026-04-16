import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Rewrites React Router paths to app.html BEFORE Vite serves index.html
function spaFallback(): Plugin {
  const REACT_ROUTES = ['/log', '/stats', '/history', '/social', '/coach', '/nutrition', '/more'];
  return {
    name: 'spa-fallback-to-app-html',
    configureServer(server) {
      // No return — runs BEFORE Vite's built-in middleware
      server.middlewares.use((req, _res, next) => {
        const url = req.url?.split('?')[0] ?? '';
        if (REACT_ROUTES.some((r) => url === r || url.startsWith(r + '/'))) {
          req.url = '/app.html';
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    spaFallback(),
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
