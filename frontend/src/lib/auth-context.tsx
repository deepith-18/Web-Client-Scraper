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
        setLoading(false);
        return;
      } catch {}
    }

    // Default to the founder administrator account so the app never shows a blank lock screen
    const defaultAdmin: UserResponse = {
      id: "eedf59f7-bd50-4c1e-8f78-8557dca75881",
      email: "admin@demanex.io",
      full_name: "Deepith .N",
      role: "admin",
      is_active: true,
      permissions: {
        can_discover: true,
        can_call: true,
        can_view_leads: true,
        can_edit_leads: true,
        can_delete_leads: true,
        can_export_data: true,
        can_view_audits: true,
        can_manage_templates: true,
        can_manage_team: true,
        can_view_analytics: true,
      },
      created_at: new Date().toISOString(),
    };
    setUser(defaultAdmin);
    localStorage.setItem("demanex_user", JSON.stringify(defaultAdmin));
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
