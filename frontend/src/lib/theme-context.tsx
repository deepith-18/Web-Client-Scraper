"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

type Theme = "dark" | "light";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("demanex_theme") as Theme | null;
    if (saved === "light" || saved === "dark") {
      setThemeState(saved);
      applyTheme(saved);
    } else {
      // Default to dark for a high-tech startup feel
      setThemeState("dark");
      applyTheme("dark");
    }
  }, []);

  const applyTheme = (t: Theme) => {
    if (typeof document !== "undefined") {
      const root = document.documentElement;
      if (t === "dark") {
        root.classList.add("dark");
        root.classList.remove("light");
      } else {
        root.classList.add("light");
        root.classList.remove("dark");
      }
    }
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("demanex_theme", t);
    applyTheme(t);
  };

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label="Toggle light/dark theme"
      title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
      className={`p-2 rounded-lg border transition-all flex items-center justify-center gap-1.5 text-xs font-medium ${
        theme === "dark"
          ? "bg-slate-900 border-slate-700 text-amber-300 hover:bg-slate-800 hover:border-slate-600 shadow-sm"
          : "bg-slate-100 border-slate-300 text-slate-700 hover:bg-slate-200 hover:border-slate-400 shadow-sm"
      } ${className}`}
    >
      {theme === "dark" ? (
        <>
          <Sun className="h-4 w-4 text-amber-400 animate-in spin-in-180 duration-200" />
          <span className="hidden md:inline text-slate-200 text-[11px]">Light</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 text-indigo-600 animate-in spin-in-180 duration-200" />
          <span className="hidden md:inline text-slate-700 text-[11px]">Dark</span>
        </>
      )}
    </button>
  );
}
