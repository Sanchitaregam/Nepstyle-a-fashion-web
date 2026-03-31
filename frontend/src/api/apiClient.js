import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

/** Notify app that tokens were cleared (e.g. refresh failed). */
export function notifyAuthCleared() {
  window.dispatchEvent(new CustomEvent("auth:cleared"));
}

export const api = axios.create({
  baseURL,
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error, token = null) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
}

api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("access_token");
  const token = raw ? raw.trim() : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const authHeader =
      originalRequest.headers?.Authorization || originalRequest.headers?.authorization;
    const hadBearer = authHeader && String(authHeader).startsWith("Bearer ");

    // Only try refresh when a Bearer token was sent (avoid login/register 401)
    if (status === 401 && hadBearer && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshRaw = localStorage.getItem("refresh_token");
      const refresh = refreshRaw ? refreshRaw.trim() : null;

      if (!refresh) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        notifyAuthCleared();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;
      try {
        const { data } = await axios.post(`${baseURL}/api/auth/token/refresh/`, {
          refresh,
        });
        const newAccess = data.access;
        localStorage.setItem("access_token", newAccess);
        processQueue(null, newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        notifyAuthCleared();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
