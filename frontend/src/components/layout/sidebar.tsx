"use client";

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
} from "lucide-react";

const navigationItems = [
  { name: "Overview", href: "/", icon: LayoutDashboard },
  { name: "Discover Businesses", href: "/discover", icon: Compass, badge: "Live" },
  { name: "Lead Explorer", href: "/leads", icon: Search },
  { name: "Website Audits", href: "/audits", icon: Activity },
  { name: "Verification Centre", href: "/verification", icon: ShieldCheck },
  { name: "Lead Scoring", href: "/scoring", icon: Layers, badge: "Engine" },
  { name: "CRM Pipeline", href: "/pipeline", icon: FileCheck2 },
  { name: "Outreach Manager", href: "/outreach", icon: Send },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Globe2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-lg">ProspectIQ</span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Freelance Client Engine</p>
          </div>
        </div>
      </div>

      {/* Target Market Indicator */}
      <div className="px-4 py-3 mx-3 my-3 rounded-lg bg-slate-900/90 border border-slate-800 flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <div className="text-xs">
          <div className="text-slate-200 font-medium flex items-center gap-1.5">
            <span>Global Coverage</span>
            <span className="text-[10px] text-slate-400">• BLR & Worldwide</span>
          </div>
          <div className="text-[11px] text-slate-400">Direct Public & Geospatial</div>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto pt-1">
        <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          Core Platform
        </p>
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group ${
                isActive
                  ? "bg-blue-600 text-white shadow-sm shadow-blue-600/30"
                  : "text-slate-400 hover:text-slate-100 hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`h-4 w-4 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-200"}`} />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User / Workspace Footer */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/60">
        <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs">
            AR
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-200 truncate">Alex Rivera</p>
            <p className="text-[11px] text-slate-400 truncate">Freelance Web Studio</p>
          </div>
        </div>
      </div>
    </aside>
  );
}

