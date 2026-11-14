import { createContext, useContext, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("schoolsync_user") || localStorage.getItem("eduplus_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (identifier, password, loginType) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/login", { identifier, password, loginType });
      localStorage.setItem("schoolsync_token", data.token);
      localStorage.setItem("schoolsync_user", JSON.stringify(data));
      localStorage.setItem("eduplus_token", data.token);
      localStorage.setItem("eduplus_user", JSON.stringify(data));
      setUser(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.post("/auth/register", payload);
      localStorage.setItem("schoolsync_token", data.token);
      localStorage.setItem("schoolsync_user", JSON.stringify(data));
      localStorage.setItem("eduplus_token", data.token);
      localStorage.setItem("eduplus_user", JSON.stringify(data));
      setUser(data);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem("schoolsync_token");
    localStorage.removeItem("schoolsync_user");
    localStorage.removeItem("eduplus_token");
    localStorage.removeItem("eduplus_user");
    setUser(null);
  };

  const updateUser = (data) => {
    const updated = { ...user, ...data };
    localStorage.setItem("schoolsync_user", JSON.stringify(updated));
    localStorage.setItem("eduplus_user", JSON.stringify(updated));
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{ user, login, register, logout, updateUser, loading, error }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
