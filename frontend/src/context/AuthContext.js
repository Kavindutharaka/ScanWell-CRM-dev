// src/context/AuthContext.js
import React, { createContext, useState, useEffect } from "react";
import api from "../config/axios";   // ← MUST use your configured axios!!

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permission, setPermission] = useState(null);
  const [loading, setLoading] = useState(true);

  const checkLoginStatus = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser({
        id: res.data.id,
        username: res.data.username,
        isAuthenticated: true
      });
      getPermission(res.data.id);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const getPermission = async(id)=>{
    try {
      const res = await api.get(`/auth/info/${id}`);
      console.log("this is permission: ", res);
      setPermission(res.data);
    } catch (err) {
      setPermission(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkLoginStatus();
  }, []);

  const login = (userData) => {
    setUser({ ...userData, isAuthenticated: true });
  };

  const logout = () => {
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, permission }}>
      {children}
    </AuthContext.Provider>
  );
};