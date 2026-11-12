"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/lib/theme-context";
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
  ArrowRightLeft,
  WalletCards,
  LogOut,
  Sparkles
} from "lucide-react";

const adminNavigationItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Leads", href: "/leads", icon: Search },
  { name: "Discovery", href: "/discover", icon: Compass },
  { name: "Caller Desk", href: "/calling", icon: PhoneCall },
  { name: "Call History", href: "/calling/history", icon: History },
  { name: "Pipeline", href: "/pipeline", icon: FileCheck2 },
  { name: "Site Audits", href: "/audits", icon: Activity },
  { name: "Verification", href: "/verification", icon: ShieldCheck },
  { name: "Scoring Engine", href: "/scoring", icon: Layers },
  { name: "Outreach Studio", href: "/outreach", icon: Send },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Team", href: "/team", icon: Users },
  { name: "Expenses", href: "/finance", icon: WalletCards },
  { name: "Settings", href: "/settings", icon: Settings },
];

// Callers ONLY see caller tools: No admin modules, no spending, no overview dashboard
const callerNavigationItems = [
  { name: "Caller Desk", href: "/calling", icon: PhoneCall },
  { name: "Call History", href: "/calling/history", icon: History },
  { name: "Assigned Leads", href: "/leads", icon: Search },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, user } = useAuth();
  const [portal, setPortal] = useState<"admin" | "caller">("admin");

  const handleSignOut = () => {
    logout();
    localStorage.removeItem("demanex_token");
    localStorage.removeItem("demanex_user");
    localStorage.removeItem("demanex_portal_mode");
    // Redirect based on current role
    if (user?.role === "caller") {
      router.push("/caller");
    } else {
      router.push("/admin");
    }
  };

  useEffect(() => {
    // Strictly sync portal mode from the actual logged-in user's role
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
    // Only admins can switch portal view
    if (user?.role !== "admin") return;
    setPortal(mode);
    localStorage.setItem("demanex_portal_mode", mode);
  };

  // If user is caller, enforce caller navigation items only
  const currentNavItems = (user?.role === "caller" || portal === "caller")
    ? callerNavigationItems
    : adminNavigationItems;

  return (
    <aside className="w-64 bg-slate-950 dark:bg-[#070b14] text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800/90 dark:border-slate-800/60 z-30 select-none shadow-xl">
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-600/30">
            <Globe2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-tight text-base">Demanex</span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">B2B Outbound Engine</p>
          </div>
        </div>

        {/* Theme Toggle in Header */}
        <ThemeToggle className="scale-90" />
      </div>

      {/* PORTAL SWITCHER TABS — only visible to Admins */}
      {user?.role === "admin" && (
        <div className="mx-3 mt-3 p-1 bg-slate-900 border border-slate-800 rounded-lg flex items-center gap-1 text-xs">
          <button
            onClick={() => switchPortal("admin")}
            className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-center transition-all ${
              portal === "admin"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Admin Portal
          </button>
          <button
            onClick={() => switchPortal("caller")}
            className={`flex-1 py-1.5 px-2 rounded-md font-semibold text-center transition-all ${
              portal === "caller"
                ? "bg-emerald-600 text-white shadow-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Caller Portal
          </button>
        </div>
      )}

      {/* Caller Mode Pill for Callers */}
      {user?.role === "caller" && (
        <div className="mx-3 mt-3 px-3 py-2 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs text-emerald-400 font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PhoneCall className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
            <span>Caller Workspace</span>
          </div>
          <span className="text-[10px] text-emerald-300/80 bg-emerald-500/10 px-1.5 py-0.5 rounded">Active</span>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-3">
        <p className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
          {user?.role === "caller" || portal === "caller" ? "Workspace" : "Navigation"}
        </p>
        {currentNavItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? portal === "caller" || user?.role === "caller"
                    ? "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                    : "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`} />
                <span>{item.name}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User / Workspace Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 space-y-2">
        {/* User identity card */}
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 ${
            user?.role === "admin"
              ? "bg-gradient-to-br from-blue-600 to-indigo-600"
              : "bg-gradient-to-br from-emerald-600 to-teal-600"
          }`}>
            {user?.full_name ? user.full_name.slice(0, 2).toUpperCase() : user?.email?.slice(0, 2).toUpperCase() ?? "DX"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {user?.full_name || user?.email?.split("@")[0] || "Demanex User"}
            </p>
            <p className={`text-[11px] font-medium truncate ${user?.role === "admin" ? "text-blue-400" : "text-emerald-400"}`}>
              {user?.role === "admin" ? "Admin & Founder" : "Caller / Telecaller"}
            </p>
          </div>
        </div>

        {/* Admin Portal Toggle Link (Admins Only) */}
        {user?.role === "admin" && (
          <div className="p-1.5 rounded-lg bg-slate-900/40 border border-slate-800/60 flex items-center justify-between text-[11px]">
            <span className="text-slate-400">View:</span>
            <button
              onClick={() => switchPortal(portal === "admin" ? "caller" : "admin")}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
            >
              <span>{portal === "admin" ? "Admin Mode" : "Caller Mode"}</span>
              <ArrowRightLeft className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleSignOut}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-slate-900/40 border border-slate-800/60 text-slate-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all text-xs font-medium"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
