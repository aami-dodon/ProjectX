import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import tsconfigPaths from 'vite-tsconfig-paths'
import { config as loadEnvConfig } from 'dotenv'

loadEnvConfig()

const DEFAULT_NODE_ENV = {
  development: 'development',
  production: 'production',
}

const parseBoolean = (value, defaultValue = false) => {
  if (typeof value !== 'string') return defaultValue
  const normalized = value.trim().toLowerCase()
  if (!normalized) return defaultValue
  return ['1', 'true', 'yes', 'on'].includes(normalized)
}

const resolveNodeEnv = mode => {
  if (mode === 'development') return DEFAULT_NODE_ENV.development
  if (mode === 'production') return DEFAULT_NODE_ENV.production
  const trimmed = typeof process.env.NODE_ENV === 'string'
    ? process.env.NODE_ENV.trim()
    : ''

  if (!trimmed) return DEFAULT_NODE_ENV.production
  if (trimmed === 'development') return DEFAULT_NODE_ENV.development
  return DEFAULT_NODE_ENV.production
}

export default defineConfig(({ mode }) => {
  const nodeEnv = resolveNodeEnv(mode)

  process.env.NODE_ENV = nodeEnv

  const port = parseInt(process.env.CLIENT_PORT) || 5173

  const allowedHosts = process.env.CLIENT_ALLOWED_HOSTS
    ? process.env.CLIENT_ALLOWED_HOSTS.split(',').map(h => h.trim())
    : []

  const preferSecureHmr = parseBoolean(process.env.CLIENT_USE_SECURE_HMR)
  const normalizedProtocol = typeof process.env.CLIENT_HMR_PROTOCOL === 'string'
    ? process.env.CLIENT_HMR_PROTOCOL.trim().toLowerCase()
    : undefined
  const hmrProtocol = ['ws', 'wss'].includes(normalizedProtocol)
    ? normalizedProtocol
    : preferSecureHmr
      ? 'wss'
      : 'ws'

  return {
    plugins: [
      react(),
      tailwindcss(),
      tsconfigPaths(),
    ],
    define: {
      'process.env.NODE_ENV': JSON.stringify(nodeEnv),
    },
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
  }
})
