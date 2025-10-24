import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const toTrimmedString = (value) => {
  if (value === undefined || value === null) return undefined;
  const stringValue = String(value).trim();
  return stringValue.length > 0 ? stringValue : undefined;
};

const requireEnvValue = (key) => {
  const value = toTrimmedString(process.env[key]);
  if (value === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const requireNumberEnv = (key) => {
  const value = requireEnvValue(key);
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    throw new Error(`Environment variable ${key} must be a valid number, received "${value}"`);
  }
  return numeric;
};

const requireListEnv = (key) => {
  const value = requireEnvValue(key);
  const items = value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  if (!items.length) {
    throw new Error(`Environment variable ${key} must contain at least one value`);
  }
  return items;
};

export default defineConfig(({ mode }) => {
  const rootEnv = loadEnv(mode, repoRoot, '');
  Object.assign(process.env, rootEnv); // pull repo-level .env into this Vite config

  const clientPort = requireNumberEnv('CLIENT_PORT');
  const serverPort = requireNumberEnv('SERVER_PORT');
  const apiPrefix = requireEnvValue('API_PREFIX');
  const trimmedPrefix = apiPrefix.startsWith('/') ? apiPrefix : `/${apiPrefix}`;
  const clientAllowedHosts = requireListEnv('CLIENT_ALLOWED_HOSTS');

  process.env.VITE_CLIENT_PORT = String(clientPort);
  process.env.VITE_SERVER_PORT = String(serverPort);
  process.env.VITE_API_PREFIX = trimmedPrefix;
  process.env.VITE_API_URL = requireEnvValue('VITE_API_URL');

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
