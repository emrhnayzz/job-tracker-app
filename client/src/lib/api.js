import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

const TOKEN_KEY = "token";
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) =>
  token ? localStorage.setItem(TOKEN_KEY, token) : localStorage.removeItem(TOKEN_KEY);

// One client for the whole app: it adds the token to every request and signs
// the user out when the server no longer accepts it.
export const api = axios.create({ baseURL: API_URL });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let onUnauthorized = () => {};
export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthRoute = error.config?.url?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthRoute) onUnauthorized();
    return Promise.reject(error);
  }
);

// The API runs on a free host that sleeps when idle. Calling this early
// starts the wake-up before the visitor clicks anything.
export const wakeServer = () => api.get("/health", { timeout: 60000 }).catch(() => {});

export const errorCode = (error) => error.response?.data?.error || (error.response ? "server_error" : "network_error");

export const fileUrl = (relativePath) => (relativePath ? `${API_URL}/${relativePath}` : null);
