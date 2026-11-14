"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Plus, Globe, Shield, User, PhoneCall, LogOut, ChevronDown, Check } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/lib/theme-context";
import { useRouter } from "next/navigation";

interface HeaderProps {
  onSearchChange?: (val: string) => void;
  selectedCity?: string;
  onCitySelect?: (city: string) => void;
}

const popularLocations = [
  { label: "All Worldwide", value: "" },
  { label: "Bengaluru, India", value: "Bengaluru" },
  { label: "Austin, TX (USA)", value: "Austin" },
  { label: "London, UK", value: "London" },
  { label: "Sydney, Australia", value: "Sydney" },
];

export function Header({ onSearchChange, selectedCity = "", onCitySelect }: HeaderProps) {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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

  return (
    <header className="h-16 bg-white dark:bg-[#070b14] border-b border-slate-200/90 dark:border-slate-800/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs transition-colors">
      {/* Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search leads, phone numbers, categories..."
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-lg text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
        </div>
      </div>

      {/* Center Market Filter Pills */}
      <div className="hidden xl:flex items-center bg-slate-100/90 dark:bg-slate-900 p-1 rounded-lg border border-slate-200/80 dark:border-slate-800 text-xs">
        <div className="flex items-center gap-1.5 px-2 text-slate-500 dark:text-slate-400 font-medium">
          <Globe className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
          <span>Market:</span>
        </div>
        {popularLocations.map((loc) => {
          const isSelected = selectedCity === loc.value;
          return (
            <button
              key={loc.label}
              onClick={() => onCitySelect && onCitySelect(loc.value)}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${isSelected
                  ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-xs border border-slate-200 dark:border-slate-700"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
            >
              {loc.label}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Theme Toggle & Active User Menu */}
      <div className="flex items-center gap-3">
        {/* Light / Dark Mode Toggle */}
        <ThemeToggle />

        {/* Real User Profile Pill */}
        <div className="relative">
          <button
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs transition-all shadow-xs"
          >
            <div
              className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${user?.role === "admin"
                  ? "bg-gradient-to-tr from-blue-600 to-indigo-600"
                  : "bg-gradient-to-tr from-emerald-600 to-teal-600"
                }`}
            >
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "D"}
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs leading-none">
                {user?.full_name || user?.email?.split("@")[0] || "User"}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 font-medium leading-none">
                {user?.role === "admin" ? "Admin · Full Access" : "Caller · Telephony Desk"}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-0.5" />
          </button>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 p-2 text-xs">
              <div className="p-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{user?.full_name || "Demanex User"}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{user?.email}</p>
                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {user?.role === "admin" ? (
                    <>
                      <Shield className="h-3 w-3 text-blue-500" />
                      <span>Administrator</span>
                    </>
                  ) : (
                    <>
                      <PhoneCall className="h-3 w-3 text-emerald-500" />
                      <span>Caller Workspace</span>
                    </>
                  )}
                </div>
              </div>

              <div className="py-1">
                {user?.role === "admin" ? (
                  <>
                    <Link
                      href="/finance"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                    >
                      Company Spending
                    </Link>
                    <Link
                      href="/team"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                    >
                      Team & Permissions
                    </Link>
                  </>
                ) : (
                  <Link
                    href="/calling/history"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
                  >
                    My Call History
                  </Link>
                )}
              </div>

              <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 font-medium transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic CTA button based on Role */}
        {user?.role === "admin" ? (
          <Link
            href="/discover"
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg shadow-sm shadow-blue-500/20 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Launch Discovery</span>
          </Link>
        ) : (
          <Link
            href="/calling"
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg shadow-sm shadow-emerald-500/20 transition-all"
          >
            <PhoneCall className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Caller Desk</span>
          </Link>
        )}
      </div>
    </header>
  );
}
