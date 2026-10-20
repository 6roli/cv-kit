import { defineConfig } from 'vite';

// Plain static build: index.html + bundled JS/CSS/fonts + everything in /public.
export default defineConfig({
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Fonts are emitted as files (never inlined as data: URLs) so the CSP can stay strict.
    assetsInlineLimit: 0,
  },
  server: {
    host: 'localhost',
    port: 5173,
  },
  preview: {
    host: 'localhost',
    port: 4173,
  },
});
