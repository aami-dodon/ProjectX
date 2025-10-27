import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'

const port = parseInt(process.env.CLIENT_PORT) || 5173

const allowedHosts = process.env.CLIENT_ALLOWED_HOSTS
  ? process.env.CLIENT_ALLOWED_HOSTS.split(',').map(h => h.trim())
  : []

const parseBoolean = (value, defaultValue = false) => {
  if (typeof value !== 'string') return defaultValue
  const normalized = value.trim().toLowerCase()
  if (!normalized) return defaultValue
  return ['1', 'true', 'yes', 'on'].includes(normalized)
}

const preferSecureHmr = parseBoolean(process.env.CLIENT_USE_SECURE_HMR)
const normalizedProtocol = typeof process.env.CLIENT_HMR_PROTOCOL === 'string'
  ? process.env.CLIENT_HMR_PROTOCOL.trim().toLowerCase()
  : undefined
const hmrProtocol = ['ws', 'wss'].includes(normalizedProtocol)
  ? normalizedProtocol
  : preferSecureHmr
    ? 'wss'
    : 'ws'

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
      protocol: hmrProtocol,
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
