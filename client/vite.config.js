import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const port = parseInt(process.env.CLIENT_PORT) || 5173

const allowedHosts = process.env.CLIENT_ALLOWED_HOSTS
  ? process.env.CLIENT_ALLOWED_HOSTS.split(',').map(h => h.trim())
  : []

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    tsconfigPaths(), 
  ],
  server: {
    port,
    host: true,
    allowedHosts,
    hmr: {
      clientPort: port,
      protocol: 'ws',
    },
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
})
