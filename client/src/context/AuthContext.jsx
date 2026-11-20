import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { api, getToken, setToken, setUnauthorizedHandler } from "../lib/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // undefined: still checking the stored token. null: signed out.
  const [user, setUser] = useState(getToken() ? undefined : null);

  const signOut = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(signOut);
    if (!getToken()) return;
    api
      .get("/me")
      .then((res) => setUser(res.data))
      .catch(signOut);
  }, [signOut]);

  const value = useMemo(() => {
    const startSession = ({ data }) => {
      setToken(data.token);
      setUser(data.user);
      return data.user;
    };
    return {
      user,
      setUser,
      signOut,
      login: (credentials) => api.post("/auth/login", credentials).then(startSession),
      register: (details) => api.post("/auth/register", details).then(startSession),
      startDemo: (lang) => api.post("/auth/demo", { lang }, { timeout: 90000 }).then(startSession),
    };
  }, [user, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
