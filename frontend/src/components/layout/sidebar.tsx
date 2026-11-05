"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  UserCheck,
  Users,
  History,
  Briefcase,
  Shield,
  ArrowRightLeft
} from "lucide-react";

const adminNavigationItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Team & Employees", href: "/team", icon: Users, badge: "Startup" },
  { name: "Caller Desk", href: "/calling", icon: PhoneCall, badge: "Calls" },
  { name: "Call Logs & CRUD", href: "/calling/history", icon: History, badge: "Logs" },
  { name: "Discover Businesses", href: "/discover", icon: Compass, badge: "Live" },
  { name: "Lead Explorer", href: "/leads", icon: Search },
  { name: "Website Audits", href: "/audits", icon: Activity },
  { name: "Verification Centre", href: "/verification", icon: ShieldCheck },
  { name: "Lead Scoring", href: "/scoring", icon: Layers, badge: "Engine" },
  { name: "CRM Pipeline", href: "/pipeline", icon: FileCheck2 },
  { name: "Outreach Studio", href: "/outreach", icon: Send },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

const callerNavigationItems = [
  { name: "Live Caller Desk", href: "/calling", icon: PhoneCall, badge: "Dial" },
  { name: "Call Logs & History", href: "/calling/history", icon: History, badge: "CRUD" },
  { name: "Prospect Directory", href: "/leads", icon: Search },
  { name: "Overview Dashboard", href: "/", icon: LayoutDashboard },
];

export function Sidebar() {
  const pathname = usePathname();
  const [portal, setPortal] = useState<"admin" | "caller">("admin");

  useEffect(() => {
    // Check saved preference or adapt to route
    const saved = localStorage.getItem("prospectiq_portal_mode");
    if (saved === "caller" || saved === "admin") {
      setPortal(saved);
    } else if (pathname.startsWith("/calling")) {
      setPortal("caller");
    }
  }, [pathname]);

  const switchPortal = (mode: "admin" | "caller") => {
    setPortal(mode);
    localStorage.setItem("prospectiq_portal_mode", mode);
  };

  const currentNavItems = portal === "admin" ? adminNavigationItems : callerNavigationItems;

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-30 select-none">
      {/* Brand Header */}
      <div className="p-4 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Globe2 className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-white tracking-tight text-base">ProspectIQ</span>
              <span className="text-[10px] font-semibold uppercase px-1 py-0.2 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                v1.1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium">Freelance Agency Engine</p>
          </div>
        </div>
      </div>

      {/* PORTAL SWITCHER TABS */}
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

      {/* Target Market Indicator */}
      <div className="px-3.5 py-2.5 mx-3 my-2.5 rounded-lg bg-slate-900/60 border border-slate-800/70 flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <div className="text-[11px]">
          <div className="text-slate-200 font-medium flex items-center gap-1">
            <span>{portal === "admin" ? "Admin Workspace" : "Caller Workspace"}</span>
            <span className="text-[10px] text-slate-400">• BLR & Global</span>
          </div>
          <div className="text-slate-400 text-[10px]">
            {portal === "admin" ? "Full Agency & Team Control" : "Focused Telephony Queue"}
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-1">
        <p className="px-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
          {portal === "admin" ? "Administrative Modules" : "Telephony Desk"}
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
                  ? portal === "admin"
                    ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                    : "bg-emerald-600 text-white shadow-sm shadow-emerald-600/30"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-slate-800 text-slate-300 border border-slate-700"
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User / Workspace Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
        <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className={`h-8 w-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
            portal === "admin"
              ? "bg-gradient-to-br from-blue-600 to-indigo-600"
              : "bg-gradient-to-br from-emerald-600 to-teal-600"
          }`}>
            {portal === "admin" ? "DN" : "TC"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">
              {portal === "admin" ? "Deepith" : "Team Caller"}
            </p>
            <p className="text-[11px] text-blue-400 font-medium truncate">
              {portal === "admin" ? "Lead Admin & Developer" : "Telecaller / SDR"}
            </p>
          </div>
        </div>

        <div className="p-1.5 rounded-lg bg-slate-900/40 border border-slate-800/60 flex items-center justify-between text-[11px]">
          <span className="text-slate-400">Portal View:</span>
          <button
            onClick={() => switchPortal(portal === "admin" ? "caller" : "admin")}
            className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 transition-colors"
          >
            <span>{portal === "admin" ? "Admin Mode" : "Caller Mode"}</span>
            <ArrowRightLeft className="h-3 w-3" />
          </button>
        </div>
      </div>
    </aside>
  );
}


