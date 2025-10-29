import axios from "axios";

import { createLogger } from "@/shared/lib/logger";

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const logger = createLogger("api-client");

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

    const method = config.method?.toUpperCase() ?? "GET";
    logger.debug(
      {
        method,
        url: config.url,
      },
      "HTTP request dispatched"
    );

    return config;
  },
  (error) => {
    logger.error({ message: error.message }, "Failed to prepare HTTP request");
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => {
    const method = response.config?.method?.toUpperCase() ?? "GET";
    logger.info(
      {
        method,
        url: response.config?.url,
        statusCode: response.status,
      },
      "HTTP response received"
    );

    return response;
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response;
      const message = data?.error?.message ?? error.message;

      const method = error.response.config?.method?.toUpperCase() ?? "GET";
      const level = status >= 500 ? "error" : "warn";
      logger[level](
        {
          method,
          url: error.response.config?.url,
          statusCode: status,
        },
        "HTTP response contained an error"
      );

      return Promise.reject({
        status,
        message,
        data,
      });
    }

    logger.error(
      {
        message: error.message,
      },
      "Network error while awaiting HTTP response"
    );

    return Promise.reject({
      status: null,
      message: error.message,
      data: null,
    });
  }
);

export { apiClient };
