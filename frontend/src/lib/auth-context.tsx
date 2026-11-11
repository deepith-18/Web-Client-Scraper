"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { UserResponse } from "@/types";

interface AuthContextProps {
  user: UserResponse | null;
  setActiveUser: (user: UserResponse | null) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check Demanex user in storage
    const storedUser = localStorage.getItem("demanex_user") || localStorage.getItem("prospectiq_user");
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        // Normalize to demanex_user key
        localStorage.setItem("demanex_user", storedUser);
      } catch {}
    }
    setLoading(false);
  }, []);

  const setActiveUser = (u: UserResponse | null) => {
    setUser(u);
    if (u) {
      localStorage.setItem("demanex_user", JSON.stringify(u));
    } else {
      localStorage.removeItem("demanex_user");
      localStorage.removeItem("prospectiq_user");
    }
  };

  const logout = () => {
    localStorage.removeItem("demanex_token");
    localStorage.removeItem("demanex_user");
    localStorage.removeItem("demanex_portal_mode");
    localStorage.removeItem("prospectiq_token");
    localStorage.removeItem("prospectiq_user");
    localStorage.removeItem("prospectiq_portal_mode");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setActiveUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
};
