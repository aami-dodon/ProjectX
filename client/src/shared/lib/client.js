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

// In-flight refresh request shared across callers to avoid stampedes
let refreshRequest = null;

apiClient.interceptors.request.use(
  (config) => {
    try {
      // Skip attaching bearer for explicit opt-out (e.g., refresh calls)
      if (!config._skipAuthRefresh) {
        const token = window?.localStorage?.getItem("accessToken");
        if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
        }
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
  async (error) => {
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

      // Attempt silent token refresh on 401s for non-auth endpoints
      const originalConfig = error.response.config || {};
      const isAuthEndpoint = typeof originalConfig.url === "string" &&
        (/\/api\/auth\/login/.test(originalConfig.url) || /\/api\/auth\/refresh/.test(originalConfig.url) || /\/api\/auth\/logout/.test(originalConfig.url));

      if (status === 401 && !originalConfig._retry && !isAuthEndpoint) {
        originalConfig._retry = true;

        try {
          // Start (or await) a single refresh request for this burst of 401s
          if (!refreshRequest) {
            const refreshToken = window?.localStorage?.getItem("refreshToken");
            if (!refreshToken) {
              throw new Error("No refresh token available");
            }

            refreshRequest = apiClient.post(
              "/api/auth/refresh",
              { refreshToken },
              { _skipAuthRefresh: true }
            )
              .then((res) => res?.data)
              .then((payload) => {
                if (!payload?.accessToken) {
                  throw new Error("Refresh payload missing access token");
                }

                try {
                  window?.localStorage?.setItem("accessToken", payload.accessToken);
                  if (payload.refreshToken) {
                    window?.localStorage?.setItem("refreshToken", payload.refreshToken);
                  }
                  if (payload.user) {
                    window?.localStorage?.setItem("user", JSON.stringify(payload.user));
                  }
                  window?.dispatchEvent?.(new Event("px:user-updated"));
                } catch (storageError) {
                  logger.warn({ message: String(storageError) }, "Failed to persist refreshed tokens");
                }

                return payload.accessToken;
              })
              .finally(() => {
                // Ensure the next 401 burst can trigger a fresh refresh
                setTimeout(() => {
                  refreshRequest = null;
                }, 0);
              });
          }

          const newAccessToken = await refreshRequest;

          // Retry the original request with the new token
          originalConfig.headers = {
            ...(originalConfig.headers || {}),
            Authorization: `Bearer ${newAccessToken}`,
          };

          return apiClient(originalConfig);
        } catch (refreshError) {
          logger.error(
            { message: refreshError.message },
            "Failed to refresh access token"
          );

          try {
            window?.localStorage?.removeItem("accessToken");
            window?.localStorage?.removeItem("refreshToken");
            window?.localStorage?.removeItem("user");
            window?.dispatchEvent?.(new Event("px:user-updated"));
          } catch (storageError) {
            logger.warn(
              { message: String(storageError) },
              "Failed to clear auth state after refresh failure"
            );
          }

          return Promise.reject(refreshError);
        }
      }

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
