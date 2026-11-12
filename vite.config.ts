/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In iCloud Drive, node_modules is a symlink to node_modules.nosync (see scripts/icloud-nosync.sh).
// preserveSymlinks keeps Vite treating it as a normal node_modules folder.
export default defineConfig({
  plugins: [react()],
  resolve: { preserveSymlinks: true },
  test: { include: ['src/**/*.test.ts'] },
  build: { chunkSizeWarningLimit: 1600 },
})
