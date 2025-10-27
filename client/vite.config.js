import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const port = parseInt(process.env.CLIENT_PORT) || 5173

const allowedHosts = process.env.CLIENT_ALLOWED_HOSTS
  ? process.env.CLIENT_ALLOWED_HOSTS.split(',').map(h => h.trim())
  : []

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: [
      { find: '@/layout', replacement: path.resolve(__dirname, './src/shared/components/layout') },
      { find: '@/ui', replacement: path.resolve(__dirname, './src/shared/components/ui') },
      { find: '@/lib', replacement: path.resolve(__dirname, './src/shared/lib') },
      { find: '@/hooks', replacement: path.resolve(__dirname, './src/shared/hooks') },
      { find: '@/components', replacement: path.resolve(__dirname, './src/shared/components/') },
      { find: '@', replacement: path.resolve(__dirname, './src') },
    ],
    extensions: ['.js', '.jsx', '.json', '.ts', '.tsx'],
  },
  server: {
    port,
    host: true,
    allowedHosts,
    hmr: {
      clientPort: port,
      protocol: 'ws',
    },
  },
  // Fix preload mismatch warning in some Cloudflare setups
  build: {
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
      },
    },
  },
})
