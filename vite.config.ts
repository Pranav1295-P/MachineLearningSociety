/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In iCloud Drive, node_modules is a symlink to node_modules.nosync (see scripts/icloud-nosync.sh).
// preserveSymlinks keeps Vite treating it as a normal node_modules folder.
export default defineConfig({
  plugins: [react()],
  resolve: { preserveSymlinks: true },
  // Vite only ignores folders named node_modules; without this, iCloud touching
  // files in node_modules.nosync triggers full page reloads.
  server: { watch: { ignored: ['**/node_modules.nosync/**'] } },
  test: { include: ['src/**/*.test.ts'] },
  build: { chunkSizeWarningLimit: 1600 },
})
