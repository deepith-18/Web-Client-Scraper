"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Compass,
  Search,
  ShieldCheck,
  Activity,
  Layers,
  Send,
  BarChart3,
  Settings,
  Globe2,
  FileCheck2,
  PhoneCall,
  Users,
  History,
  WalletCards,
  LogOut,
  Sun,
  Moon,
  ChevronRight,
  Shield,
  Headphones
} from "lucide-react";

interface NavSection {
  title: string;
  items: {
    name: string;
    href: string;
    icon: any;
    badge?: string;
  }[];
}

const adminSections: NavSection[] = [
  {
    title: "Prospecting & Audits",
    items: [
      { name: "Overview", href: "/", icon: LayoutDashboard },
      { name: "Leads Directory", href: "/leads", icon: Search },
      { name: "Discovery Engine", href: "/discover", icon: Compass },
      { name: "Website Audits", href: "/audits", icon: Activity },
    ],
  },
  {
    title: "Telephony & Deals",
    items: [
      { name: "Caller Desk", href: "/calling", icon: PhoneCall },
      { name: "Call Logs & History", href: "/calling/history", icon: History },
      { name: "Deals Pipeline", href: "/pipeline", icon: FileCheck2 },
      { name: "Outreach Studio", href: "/outreach", icon: Send },
    ],
  },
  {
    title: "Operations & Admin",
    items: [
      { name: "Scoring Engine", href: "/scoring", icon: Layers },
      { name: "Verification", href: "/verification", icon: ShieldCheck },
      { name: "Analytics", href: "/analytics", icon: BarChart3 },
      { name: "Team & Callers", href: "/team", icon: Users },
      { name: "Company Spend", href: "/finance", icon: WalletCards },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

const callerSections: NavSection[] = [
  {
    title: "Caller Workspace",
    items: [
      { name: "Live Caller Desk", href: "/calling", icon: PhoneCall },
      { name: "Call History & Logs", href: "/calling/history", icon: History },
      { name: "Assigned Leads", href: "/leads", icon: Search },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const currentPath = pathname || "";
  const router = useRouter();
  const { logout, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [portal, setPortal] = useState<"admin" | "caller">("admin");

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

  useEffect(() => {
    if (user) {
      const roleMode = user.role === "admin" ? "admin" : "caller";
      setPortal(roleMode);
      localStorage.setItem("demanex_portal_mode", roleMode);
    } else {
      const saved = localStorage.getItem("demanex_portal_mode");
      if (saved === "caller" || saved === "admin") setPortal(saved);
    }
  }, [user, pathname]);

  const switchPortal = (mode: "admin" | "caller") => {
    if (user?.role !== "admin") return;
    setPortal(mode);
    localStorage.setItem("demanex_portal_mode", mode);
    if (mode === "caller" && pathname === "/") {
      router.push("/calling");
    }
  };

  const currentSections =
    user?.role === "caller" || portal === "caller" ? callerSections : adminSections;

  return (
    <aside className="w-64 bg-white dark:bg-[#070b14] border-r border-slate-200 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 flex flex-col h-screen fixed left-0 top-0 z-30 select-none shadow-sm transition-colors duration-200">
      {/* ── Brand Header ─────────────────────────────────────── */}
      <div className="p-4 border-b border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-blue-500/25 group-hover:scale-105 transition-transform">
            <Globe2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base leading-none">
                Demanex
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" title="Engine Live" />
            </div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-0.5 leading-none">
              B2B Outbound Engine
            </p>
          </div>
        </Link>
      </div>

      {/* ── Admin / Caller Portal Segmented Slider (Admins Only) ── */}
      {user?.role === "admin" && (
        <div className="px-3 pt-3">
          <div className="p-1 bg-slate-100 dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl flex items-center gap-1 text-xs">
            <button
              onClick={() => switchPortal("admin")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-semibold text-xs transition-all ${
                portal === "admin"
                  ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/60 dark:border-slate-700"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Shield className="h-3.5 w-3.5" />
              <span>Admin</span>
            </button>
            <button
              onClick={() => switchPortal("caller")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg font-semibold text-xs transition-all ${
                portal === "caller"
                  ? "bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-xs border border-slate-200/60 dark:border-slate-700"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
              }`}
            >
              <Headphones className="h-3.5 w-3.5" />
              <span>Caller</span>
            </button>
          </div>
        </div>
      )}

      {/* Caller Role Pill (Callers Only) */}
      {user?.role === "caller" && (
        <div className="px-3 pt-3">
          <div className="px-3 py-2 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/20 rounded-xl text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PhoneCall className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span>Caller Telephony Desk</span>
            </div>
            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded font-bold">
              Dialer
            </span>
          </div>
        </div>
      )}

      {/* ── Categorized Navigation Links ─────────────────────── */}
      <nav className="flex-1 px-3 space-y-4 overflow-y-auto py-3">
        {currentSections.map((sec) => (
          <div key={sec.title} className="space-y-1">
            <div className="px-3 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {sec.title}
            </div>
            {sec.items.map((item) => {
              const isActive =
                currentPath === item.href ||
                (item.href !== "/" && currentPath.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                    isActive
                      ? portal === "caller" || user?.role === "caller"
                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-semibold border-l-2 border-emerald-600 dark:border-emerald-500 shadow-2xs"
                        : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 font-semibold border-l-2 border-blue-600 dark:border-blue-500 shadow-2xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/70 dark:hover:bg-slate-900/60"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      className={`h-4 w-4 transition-colors ${
                        isActive
                          ? portal === "caller" || user?.role === "caller"
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-blue-600 dark:text-blue-400"
                          : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                      }`}
                    />
                    <span>{item.name}</span>
                  </div>
                  {isActive && (
                    <ChevronRight className="h-3 w-3 opacity-60 text-current" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* ── Executive Bottom Dock ────────────────────────────── */}
      <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-950/50 space-y-2">
        {/* User Card linking to Profile */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <Link
            href="/profile"
            className="flex items-center gap-2.5 flex-1 min-w-0 p-1 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors group"
            title="Open Account Profile & Preferences"
          >
            <div
              className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-xs ${
                user?.role === "admin"
                  ? "bg-gradient-to-tr from-teal-500 to-cyan-600"
                  : "bg-gradient-to-tr from-emerald-600 to-teal-600"
              }`}
            >
              {user?.full_name
                ? user.full_name.charAt(0).toUpperCase()
                : user?.email?.charAt(0).toUpperCase() ?? "D"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate leading-none group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
                {user?.full_name || user?.email?.split("@")[0] || "Demanex User"}
              </p>
              <p
                className={`text-[10px] font-medium mt-0.5 truncate leading-none ${
                  user?.role === "admin"
                    ? "text-teal-600 dark:text-teal-400"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                {user?.role === "admin" ? "Founder & Admin" : "Caller / Telecaller"}
              </p>
            </div>
          </Link>

          {/* Quick Theme Switcher Icon */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "Light" : "Dark"} mode`}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shrink-0"
          >
            {theme === "dark" ? (
              <Sun className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Moon className="h-3.5 w-3.5 text-indigo-600" />
            )}
          </button>

          {/* Quick Logout Button */}
          <button
            type="button"
            onClick={handleSignOut}
            aria-label="Sign out"
            title="Sign out of Demanex"
            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:border-rose-300 dark:hover:border-rose-900/60 dark:hover:text-rose-400 transition-colors shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
