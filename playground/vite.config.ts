import { defineConfig } from 'vite'
import { envInject } from 'vite-plugin-env-inject'

export default defineConfig({
  plugins: [envInject()],
  build: {
    ssr: 'src/entry.ts',
    outDir: 'dist',
    rollupOptions: {
      output: {
        format: 'esm',
      },
    },
  },
})
