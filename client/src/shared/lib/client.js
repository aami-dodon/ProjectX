import axios from "axios";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use(
  (config) => {
    try {
      const token = window?.localStorage?.getItem("accessToken");
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    } catch {
      // Local storage is unavailable; proceed without attaching a token.
    }

    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.error?.message ?? error.message;
      return Promise.reject({
        status,
        message,
        data,
      });
    }

    return Promise.reject({
      status: null,
      message: error.message,
      data: null,
    });
  }
);

export { apiClient };
