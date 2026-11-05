"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Plus, Globe, Shield, User, ChevronDown, Check } from "lucide-react";
import { getActiveUser, setActiveUser } from "@/lib/permissions";
import { fetchTeamMembers } from "@/lib/api-client";
import { TeamMember } from "@/types";

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
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    setCurrentUser(getActiveUser());
    fetchTeamMembers().then(setTeamMembers).catch(() => {});

    const handleUserChange = () => {
      setCurrentUser(getActiveUser());
    };
    window.addEventListener("user-changed", handleUserChange);
    return () => window.removeEventListener("user-changed", handleUserChange);
  }, []);

  const handleSelectUser = (member: any) => {
    setActiveUser(member);
    setCurrentUser(member);
    setIsDropdownOpen(false);
  };

  const getPermissionSummary = () => {
    if (!currentUser) return "";
    if (currentUser.role === "admin") return "Admin · Full Access";
    const activePermCount = Object.values(currentUser.permissions || {}).filter(Boolean).length;
    return `${currentUser.role.toUpperCase()} · ${activePermCount} permissions`;
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-8 flex items-center justify-between sticky top-0 z-20 shadow-2xs">
      {/* Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-md">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads, categories, phone numbers..."
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
          />
        </div>
      </div>

      {/* Center Market Filter Pills */}
      <div className="hidden xl:flex items-center bg-slate-100/80 p-1 rounded-lg border border-slate-200/80 text-xs">
        <div className="flex items-center gap-1.5 px-2 text-slate-500 font-medium">
          <Globe className="h-3.5 w-3.5 text-blue-600" />
          <span>Market:</span>
        </div>
        {popularLocations.map((loc) => {
          const isSelected = selectedCity === loc.value;
          return (
            <button
              key={loc.label}
              onClick={() => onCitySelect && onCitySelect(loc.value)}
              className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                isSelected
                  ? "bg-white text-blue-700 shadow-2xs border border-slate-200"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {loc.label}
            </button>
          );
        })}
      </div>

      {/* Right Controls: Active Persona Switcher & CTA */}
      <div className="flex items-center gap-3">
        {/* Dynamic Persona Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs transition-all shadow-2xs"
          >
            <div className={`h-6 w-6 rounded-full flex items-center justify-center font-bold text-[10px] text-white ${
              currentUser?.role === "admin" ? "bg-blue-600" : "bg-emerald-600"
            }`}>
              {currentUser?.full_name ? currentUser.full_name.charAt(0) : "U"}
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-semibold text-slate-900 text-xs leading-none">
                {currentUser?.full_name || "Deepith"}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium leading-none">
                {getPermissionSummary()}
              </div>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 text-xs animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1.5 border-b border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Switch Active Persona (Simulate RBAC)
                </span>
              </div>

              <div className="mt-1 space-y-1 max-h-60 overflow-y-auto">
                {/* Admin Persona */}
                <button
                  onClick={() =>
                    handleSelectUser({
                      id: "admin-default",
                      full_name: "Deepith",
                      email: "admin@prospectiq.io",
                      role: "admin",
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
                        can_view_analytics: true
                      }
                    })
                  }
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                    currentUser?.role === "admin" ? "bg-blue-50 text-blue-900" : "hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  <div>
                    <div className="font-semibold flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-blue-600" />
                      <span>Deepith (Lead Admin)</span>
                    </div>
                    <span className="text-[10px] text-slate-400">admin@prospectiq.io • All Features</span>
                  </div>
                  {currentUser?.role === "admin" && <Check className="h-4 w-4 text-blue-600" />}
                </button>

                {/* Team Members List */}
                {teamMembers.map((m) => {
                  const isSelected = currentUser?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleSelectUser(m)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors ${
                        isSelected ? "bg-emerald-50 text-emerald-900" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <div>
                        <div className="font-semibold flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-emerald-600" />
                          <span>{m.full_name || m.email}</span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          {m.role.toUpperCase()} • {Object.values(m.permissions || {}).filter(Boolean).length} permissions
                        </span>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-emerald-600" />}
                    </button>
                  );
                })}
              </div>

              <div className="pt-2 mt-1 border-t border-slate-100 px-2 text-[10px] text-slate-400">
                <Link href="/team" onClick={() => setIsDropdownOpen(false)} className="text-blue-600 font-semibold hover:underline">
                  Configure Granular Permissions in /team
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        <Link
          href="/discover"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg shadow-sm shadow-blue-500/20 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Launch Discovery</span>
        </Link>
      </div>
    </header>
  );
}
