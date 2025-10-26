import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL;

if (!baseURL) {
  throw new Error('VITE_API_URL must be defined at build time');
}

const api = axios.create({
  baseURL,
  timeout: 10000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.error?.message || error.message || 'Unexpected error while communicating with the API';
    return Promise.reject(new Error(message));
  },
);

export default api;
