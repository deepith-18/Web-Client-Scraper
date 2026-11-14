"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
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
  User,
  Radio,
  SlidersHorizontal,
  Headphones,
  Compass,
  ArrowRight,
  Zap
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";

interface HeaderProps {
  onSearchChange?: (val: string) => void;
  selectedCity?: string;
  onCitySelect?: (city: string) => void;
}

const popularLocations = [
  { label: "All Worldwide", value: "", count: "Global", flag: "🌐" },
  { label: "Bengaluru, India", value: "Bengaluru", count: "India Hub", flag: "🇮🇳" },
  { label: "Austin, TX (USA)", value: "Austin", count: "US Metro", flag: "🇺🇸" },
  { label: "London, UK", value: "London", count: "UK / Europe", flag: "🇬🇧" },
  { label: "Sydney, Australia", value: "Sydney", count: "APAC", flag: "🇦🇺" },
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

  const currentMarket = popularLocations.find((l) => l.value === selectedCity) || popularLocations[0];

  return (
    <header className="h-16 bg-white/85 dark:bg-[#070b14]/85 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-20 transition-all duration-200 shadow-2xs">
      {/* ── 1. Search Bar & Engine Telemetry Pulse ─────────────── */}
      <div className="flex items-center gap-3 flex-1 max-w-xl">
        <div className="relative w-full group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Search leads, phone numbers, target categories..."
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-10 pr-14 py-2 bg-slate-100/70 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-xl text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 dark:focus:border-blue-500 transition-all font-medium"
          />
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-mono text-slate-400 shadow-2xs">
            <Command className="h-2.5 w-2.5" />
            <span>K</span>
          </div>
        </div>

        {/* Live System Activity Ticker Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/60 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800 text-xs shrink-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
            Outbound Engine
          </span>
          <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
            Active
          </span>
        </div>
      </div>

      {/* ── 2. Center: Creative Market Selector Pill ───────────── */}
      <div className="hidden md:flex items-center gap-2 mx-4">
        <div className="relative" ref={marketMenuRef}>
          <button
            type="button"
            onClick={() => setIsMarketMenuOpen(!isMarketMenuOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-900/90 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all shadow-2xs group"
          >
            <span className="text-sm">{currentMarket.flag}</span>
            <span className="text-slate-500 dark:text-slate-400 font-normal">Market:</span>
            <span className="text-slate-900 dark:text-white font-bold">{currentMarket.label}</span>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors ml-0.5" />
          </button>

          {isMarketMenuOpen && (
            <div className="absolute left-0 mt-2 w-64 bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-1.5 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider flex items-center justify-between">
                <span>Select Outreach Hub</span>
                <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
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
                        <span className="text-sm">{loc.flag}</span>
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

      {/* ── 3. Right: Contextual Quick Action + Theme + User Menu ── */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Contextual Action Button with glowing gradient styling */}
        {user?.role === "admin" ? (
          pathname === "/discover" ? (
            <Link
              href="/leads"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
            >
              <Search className="h-3.5 w-3.5 text-blue-200" />
              <span className="hidden sm:inline">View Leads</span>
            </Link>
          ) : (
            <Link
              href="/discover"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02]"
            >
              <Sparkles className="h-3.5 w-3.5 text-blue-200" />
              <span className="hidden sm:inline">Launch Discovery</span>
            </Link>
          )
        ) : (
          pathname === "/calling" ? (
            <Link
              href="/leads"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              <Search className="h-3.5 w-3.5 text-emerald-200" />
              <span className="hidden sm:inline">Assigned Leads</span>
            </Link>
          ) : (
            <Link
              href="/calling"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-xs shadow-md shadow-emerald-500/20 transition-all hover:scale-[1.02]"
            >
              <PhoneCall className="h-3.5 w-3.5 text-emerald-200" />
              <span className="hidden sm:inline">Open Dial Desk</span>
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
            className="flex items-center gap-2 p-1.5 pr-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0c121e] hover:bg-slate-50 dark:hover:bg-slate-800/80 text-xs transition-all shadow-2xs"
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
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="p-2.5 border-b border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                  {user?.full_name || "Demanex User"}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
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
                  className="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors font-medium"
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
                  className="w-full flex items-center justify-between px-3 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 rounded-xl transition-colors"
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
