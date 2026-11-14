"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Globe,
  Shield,
  PhoneCall,
  LogOut,
  ChevronDown,
  Check,
  Sparkles,
  Command,
  Sun,
  Moon,
  ExternalLink,
  User
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useRouter, usePathname } from "next/navigation";

interface HeaderProps {
  onSearchChange?: (val: string) => void;
  selectedCity?: string;
  onCitySelect?: (city: string) => void;
}

const popularLocations = [
  { label: "All Worldwide", value: "", count: "Global" },
  { label: "Bengaluru, India", value: "Bengaluru", count: "India Hub" },
  { label: "Austin, TX (USA)", value: "Austin", count: "US Metro" },
  { label: "London, UK", value: "London", count: "UK / Europe" },
  { label: "Sydney, Australia", value: "Sydney", count: "APAC" },
];

export function Header({ onSearchChange, selectedCity = "", onCitySelect }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname() || "";
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMarketMenuOpen, setIsMarketMenuOpen] = useState(false);
  const marketMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (marketMenuRef.current && !marketMenuRef.current.contains(e.target as Node)) {
        setIsMarketMenuOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    logout();
    localStorage.removeItem("demanex_token");
    localStorage.removeItem("demanex_user");
    localStorage.removeItem("demanex_portal_mode");
    if (user?.role === "caller") {
      router.push("/caller");
    } else {
      router.push("/admin");
    }
  };

  const currentMarketLabel =
    popularLocations.find((l) => l.value === selectedCity)?.label || "All Worldwide";

  return (
    <header className="h-16 bg-white/90 dark:bg-[#070b14]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 transition-colors duration-200">
      {/* ── 1. Search Bar ────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-1 max-w-md">
        <div className="relative w-full group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search leads, phone numbers, categories..."
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-9 pr-14 py-2 bg-slate-100/80 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all font-medium"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-400">
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        </div>
      </div>

      {/* ── 2. Center: Sleek Market Selector Dropdown ─────────── */}
      <div className="hidden lg:flex items-center gap-2">
        <div className="relative" ref={marketMenuRef}>
          <button
            type="button"
            onClick={() => setIsMarketMenuOpen(!isMarketMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 hover:bg-slate-100 dark:hover:bg-slate-800/90 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-all shadow-2xs"
          >
            <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
            <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Market: {currentMarketLabel}</span>
            <ChevronDown className="h-3 w-3 text-slate-400" />
          </button>

          {isMarketMenuOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Select Active Market
              </div>
              <div className="py-1 space-y-0.5">
                {popularLocations.map((loc) => {
                  const isSelected = selectedCity === loc.value;
                  return (
                    <button
                      key={loc.label}
                      onClick={() => {
                        onCitySelect && onCitySelect(loc.value);
                        setIsMarketMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all ${
                        isSelected
                          ? "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold"
                          : "text-slate-700 dark:text-slate-300 hover:bg-slate-100/70 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Globe className="h-3.5 w-3.5 text-slate-400" />
                        <span>{loc.label}</span>
                      </div>
                      {isSelected ? (
                        <Check className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {loc.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── 3. Right: Fast Action + Theme Toggle + User Menu ─── */}
      <div className="flex items-center gap-3">
        {/* Contextual Quick Action Button */}
        {user?.role === "admin" ? (
          pathname === "/discover" ? (
            <Link
              href="/leads"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
            >
              <Search className="h-3.5 w-3.5 text-blue-200" />
              <span>View Leads</span>
            </Link>
          ) : (
            <Link
              href="/discover"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-200" />
              <span>Launch Discovery</span>
            </Link>
          )
        ) : (
          pathname === "/calling" ? (
            <Link
              href="/leads"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              <Search className="h-3.5 w-3.5 text-emerald-200" />
              <span>Assigned Leads</span>
            </Link>
          ) : (
            <Link
              href="/calling"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              <PhoneCall className="h-3.5 w-3.5 text-emerald-200" />
              <span>Open Dial Desk</span>
            </Link>
          )
        )}

        {/* Theme Toggle Button */}
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-2xs"
        >
          {theme === "dark" ? (
            <Sun className="h-4 w-4 text-amber-400 animate-in spin-in-180 duration-200" />
          ) : (
            <Moon className="h-4 w-4 text-indigo-600 animate-in spin-in-180 duration-200" />
          )}
        </button>

        {/* User Profile Pill & Dropdown */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-all shadow-2xs"
          >
            <div
              className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs text-white shadow-xs ${
                user?.role === "admin"
                  ? "bg-gradient-to-tr from-blue-600 to-indigo-600"
                  : "bg-gradient-to-tr from-emerald-600 to-teal-600"
              }`}
            >
              {user?.full_name
                ? user.full_name.charAt(0).toUpperCase()
                : user?.email?.charAt(0).toUpperCase() || "D"}
            </div>
            <div className="text-left hidden md:block">
              <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs leading-none">
                {user?.full_name || user?.email?.split("@")[0] || "User"}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium leading-none">
                {user?.role === "admin" ? "Admin" : "Caller"}
              </div>
            </div>
            <ChevronDown className="h-3 w-3 text-slate-400 ml-0.5" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                  {user?.full_name || "Demanex User"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                  {user?.email}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {user?.role === "admin" ? (
                    <>
                      <Shield className="h-3 w-3 text-blue-500" />
                      <span>Administrator</span>
                    </>
                  ) : (
                    <>
                      <PhoneCall className="h-3 w-3 text-emerald-500" />
                      <span>Telephony Caller</span>
                    </>
                  )}
                </div>
              </div>

              <div className="py-1 space-y-0.5">
                <Link
                  href="/profile"
                  onClick={() => setIsUserMenuOpen(false)}
                  className="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors font-medium"
                >
                  <span className="flex items-center gap-2">
                    <User className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                    <span>Account Profile</span>
                  </span>
                  <span className="text-[10px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800/60">
                    Live
                  </span>
                </Link>

                <button
                  onClick={toggleTheme}
                  className="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <span className="flex items-center gap-2">
                    {theme === "dark" ? (
                      <Sun className="h-3.5 w-3.5 text-amber-500" />
                    ) : (
                      <Moon className="h-3.5 w-3.5 text-indigo-500" />
                    )}
                    <span>Theme: {theme === "dark" ? "Dark Mode" : "Light Mode"}</span>
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400">Toggle</span>
                </button>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors font-medium"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
