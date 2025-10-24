import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default ({ mode }) => {
  const envDir = path.resolve(__dirname, '..');
  const env = loadEnv(mode, envDir, '');

  const requiredKeys = ['VITE_API_URL', 'CLIENT_PORT', 'CLIENT_ALLOWED_HOSTS'];
  requiredKeys.forEach((key) => {
    if (!env[key]) {
      throw new Error(`${key} must be defined in .env`);
    }
  });

  const clientPort = Number.parseInt(env.CLIENT_PORT, 10);
  if (Number.isNaN(clientPort) || clientPort <= 0) {
    throw new Error('CLIENT_PORT must be a positive integer');
  }

  const allowedHosts = env.CLIENT_ALLOWED_HOSTS.split(',')
    .map((host) => host.trim())
    .filter(Boolean);

  if (allowedHosts.length === 0) {
    throw new Error('CLIENT_ALLOWED_HOSTS must include at least one host');
  }

  return defineConfig({
    plugins: [react()],
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },
    server: {
      port: clientPort,
      host: '0.0.0.0',
      allowedHosts,
    },
    preview: {
      port: clientPort,
      host: '0.0.0.0',
    },
    envDir,
  });
};
