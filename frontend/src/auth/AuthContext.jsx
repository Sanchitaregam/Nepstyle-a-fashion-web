import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import api from "../api/apiClient";
import { getAccessToken, login, logout, register } from "./auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [accessToken, setAccessToken] = useState(getAccessToken());
  const [user, setUser] = useState(null);

  const refreshUser = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return null;
    }
    try {
      const res = await api.get("/api/auth/me/");
      setUser(res.data);
      return res.data;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [accessToken, refreshUser]);

  useEffect(() => {
    function onCleared() {
      setAccessToken(null);
      setUser(null);
    }
    window.addEventListener("auth:cleared", onCleared);
    return () => window.removeEventListener("auth:cleared", onCleared);
  }, []);

  const value = useMemo(() => {
    return {
      accessToken,
      user,
      isAuthenticated: !!accessToken,
      refreshUser,
      async doLogin(credentials) {
        const data = await login(credentials);
        setAccessToken(data.access);
        await refreshUser();
        return data;
      },
      async doRegister(payload) {
        const data = await register(payload);
        setAccessToken(data.access);
        await refreshUser();
        return data;
      },
      doLogout() {
        logout();
        setAccessToken(null);
        setUser(null);
      },
    };
  }, [accessToken, user, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
