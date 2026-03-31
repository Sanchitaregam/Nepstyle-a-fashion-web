import api from "../api/apiClient";

export async function register({ username, email, password, password2 }) {
  const res = await api.post("/api/auth/register/", {
    username,
    email,
    password,
    password2,
  });
  if (res.data?.access) {
    localStorage.setItem("access_token", String(res.data.access).trim());
    localStorage.setItem("refresh_token", String(res.data.refresh).trim());
  }
  return res.data;
}

export async function login({ username, password }) {
  const res = await api.post("/api/auth/token/", { username, password });
  if (res.data?.access) {
    localStorage.setItem("access_token", String(res.data.access).trim());
    localStorage.setItem("refresh_token", String(res.data.refresh).trim());
  }
  return res.data;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
}

export function getAccessToken() {
  const t = localStorage.getItem("access_token");
  return t ? t.trim() : null;
}

