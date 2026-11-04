"use client";

import Link from "next/link";
import { Search, Plus, MapPin, Globe, Sparkles } from "lucide-react";

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
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between sticky top-0 z-20">
      {/* Search Input */}
      <div className="flex items-center gap-4 flex-1 max-w-lg">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by name, category, website, or address..."
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
      </div>

      {/* Global Location Filters & CTA */}
      <div className="flex items-center gap-3">
        {/* Location selector pills */}
        <div className="hidden lg:flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
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
                    ? "bg-white text-blue-700 shadow-xs border border-slate-200/80"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {loc.label}
              </button>
            );
          })}
        </div>

        {/* Action Button */}
        <Link
          href="/discover"
          className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-xs px-3.5 py-2 rounded-lg shadow-sm shadow-blue-500/20 transition-all"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Launch Discovery</span>
        </Link>
      </div>
    </header>
  );
}

