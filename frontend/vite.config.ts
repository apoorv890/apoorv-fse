import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import type { PluginOption } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        'audio-processor.worklet': path.resolve(__dirname, 'src/services/audio-processor.worklet.ts')
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name.includes('worklet') ? '[name].js' : 'assets/[name]-[hash].js'
        }
      }
    }
  },
  server: {
    headers: {
      // Required for AudioWorklet
      "Cross-Origin-Opener-Policy": "same-origin",
      "Cross-Origin-Embedder-Policy": "require-corp"
    }
  },
  worker: {
    format: 'es',
    plugins: () => [] // Return an empty array of plugins
  }
})
