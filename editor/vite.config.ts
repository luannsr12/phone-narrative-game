import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // The icon set (lucide) + React Flow make a single ~520 kB chunk; fine for an
  // internal editor loaded once, so quiet Vite's >500 kB advisory.
  build: { chunkSizeWarningLimit: 1200 },
  server: {
    fs: {
      // Allows importing ../src/story/story.json (the game's live story)
      // so "Carregar do jogo" works in dev.
      allow: ['..'],
    },
  },
});
