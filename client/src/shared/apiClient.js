const API_BASE_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:4000/api';

const buildUrl = (path) => {
  if (path.startsWith('http')) {
    return path;
  }
  return `${API_BASE_URL}${path}`;
};

const request = async (path, { method = 'GET', body, headers = {}, raw = false } = {}) => {
  const options = {
    method,
    headers: { ...headers },
  };

  if (body instanceof FormData) {
    options.body = body;
  } else if (body !== undefined) {
    options.body = JSON.stringify(body);
    options.headers['Content-Type'] = 'application/json';
  }

  let response;
  try {
    response = await fetch(buildUrl(path), options);
  } catch (error) {
    const networkError = new Error('Network request failed');
    networkError.details = { cause: error.message };
    throw networkError;
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error?.message ?? 'Request failed';
    const error = new Error(message);
    error.details = errorBody?.error ?? errorBody;
    throw error;
  }

  if (raw) {
    return response;
  }

  return response.json();
};

export { request };
