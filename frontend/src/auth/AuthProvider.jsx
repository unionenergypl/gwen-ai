import {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";

import {
  apiFetch,
  getToken,
  setToken,
  clearToken
} from "../services/apiClient";

import { API_BASE } from "./authConfig";
import LoginPage from "../components/Auth/LoginPage";

const AuthContext = createContext(null);

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("checking");

  useEffect(() => {
    let active = true;

    async function checkSession() {
      if (!getToken()) {
        if (active) setStatus("unauthenticated");
        return;
      }

      try {
        const response = await apiFetch("/api/auth/me");

        if (!response.ok) {
          clearToken();
          if (active) setStatus("unauthenticated");
          return;
        }

        const data = await response.json();

        if (active) {
          setUser(data.user);
          setStatus("authenticated");
        }
      } catch (error) {
        console.error("Session validation failed:", error);
        clearToken();

        if (active) setStatus("unauthenticated");
      }
    }

    checkSession();

    return () => {
      active = false;
    };
  }, []);

  async function login(username, password) {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ username, password })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Login failed.");
    }

    setToken(data.token);
    setUser(data.user);
    setStatus("authenticated");
  }

  function logout() {
    clearToken();
    setUser(null);
    setStatus("unauthenticated");
  }

  if (status === "checking") {
    return <div style={{ padding: 30 }}>Checking Gwen session...</div>;
  }

  if (status === "unauthenticated") {
    return (
      <AuthContext.Provider value={{ login, logout, user }}>
        <LoginPage />
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={{ login, logout, user }}>
      {children}
    </AuthContext.Provider>
  );
}