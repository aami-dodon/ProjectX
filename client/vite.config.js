import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const port = parseInt(process.env.CLIENT_PORT) || 5173

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/ui': path.resolve(__dirname, './src/shared/components/ui'),
      '@/lib': path.resolve(__dirname, './src/shared/lib'),
      '@/hooks': path.resolve(__dirname, './src/shared/hooks'),
      '@/layout': path.resolve(__dirname, './src/shared/components/layout'),
    },
  },
  server: {
    port,
  },
})
