import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const parsePort = (value, fallback) => {
  if (!value) return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const parseString = (value, fallback = undefined) => {
  if (value === undefined) return fallback;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : fallback;
};

const parseList = (value, fallback = []) => {
  const source = parseString(value);
  if (!source) return Array.isArray(fallback) ? fallback : [fallback].filter(Boolean);
  return source
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
};

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, repoRoot, '');
  Object.assign(process.env, rootEnv); // pull repo-level .env into this Vite config

  const clientPort = parsePort(process.env.CLIENT_PORT, 5173);
  const apiPrefix = process.env.API_PREFIX ?? '/api';
  const trimmedPrefix = apiPrefix.startsWith('/') ? apiPrefix : `/${apiPrefix}`;
  const serverPort = process.env.SERVER_PORT ?? process.env.PORT;
  const normalizedServerUrl =
    process.env.SERVER_URL ?? (serverPort ? `http://localhost:${serverPort}` : undefined);
  const clientAllowedHosts = parseList(process.env.CLIENT_ALLOWED_HOSTS, ['localhost']);

  if (!process.env.VITE_CLIENT_PORT && process.env.CLIENT_PORT) {
    process.env.VITE_CLIENT_PORT = process.env.CLIENT_PORT;
  }

  if (!process.env.VITE_SERVER_PORT && serverPort) {
    process.env.VITE_SERVER_PORT = serverPort;
  }

  if (!process.env.VITE_SERVER_URL && normalizedServerUrl) {
    const sanitizedBase = normalizedServerUrl.endsWith('/')
      ? normalizedServerUrl.slice(0, -1)
      : normalizedServerUrl;
    process.env.VITE_SERVER_URL = `${sanitizedBase}${trimmedPrefix}`;
  }

  if (!process.env.VITE_API_URL && process.env.VITE_SERVER_URL) {
    process.env.VITE_API_URL = process.env.VITE_SERVER_URL;
  }

  if (!process.env.VITE_API_PREFIX) {
    process.env.VITE_API_PREFIX = trimmedPrefix;
  }

  return {
    envDir: repoRoot,
    plugins: [react()],
    server: {
      port: clientPort,
      host: '0.0.0.0',
      allowedHosts: clientAllowedHosts,
    },
    preview: {
      host: '0.0.0.0',
      allowedHosts: clientAllowedHosts,
    },
  };
});
