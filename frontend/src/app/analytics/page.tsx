"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { MetricsCard } from "@/components/ui/metrics-card";
import { fetchAnalytics, fetchBusinesses, fetchAcceptanceAnalytics } from "@/lib/api-client";
import { AnalyticsOverview, Business, AcceptanceAnalytics } from "@/types";
import {
  BarChart3,
  Users,
  Globe,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Layers,
  Award,
  PhoneCall,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
} from "lucide-react";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [acceptanceStats, setAcceptanceStats] = useState<AcceptanceAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [aData, bData, acceptData] = await Promise.all([
          fetchAnalytics().catch(() => null),
          fetchBusinesses().catch(() => []),
          fetchAcceptanceAnalytics().catch(() => null),
        ]);
        setAnalytics(aData);
        setBusinesses(bData);
        setAcceptanceStats(acceptData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <>
      <Header />

      <main className="p-6 md:p-8 space-y-8 flex-1">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Conversion Analytics</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Track which business types accept websites the most, caller conversion rates, and pipeline distribution.
          </p>
        </div>

        {/* Core Conversion KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricsCard
            title="Total Discovered"
            value={analytics?.total_discovered_businesses ?? businesses.length}
            subtitle="Verified public business entries"
            icon={Users}
            color="blue"
          />
          <MetricsCard
            title="Accepted Clients"
            value={acceptanceStats?.total_accepted ?? 0}
            subtitle="Agreed to website proposal"
            icon={ThumbsUp}
            color="emerald"
          />
          <MetricsCard
            title="Overall Acceptance Rate"
            value={`${acceptanceStats?.overall_acceptance_rate_pct ?? 0}%`}
            subtitle="Agreed vs. declined calls"
            icon={TrendingUp}
            color="indigo"
          />
          <MetricsCard
            title="Top Converting Type"
            value={acceptanceStats?.best_converting_category || "N/A"}
            subtitle="Highest client acceptance %"
            icon={Award}
            color="amber"
          />
        </div>

        {/* Which Business Type Accepts Most? (Table & Visual Bars) */}
        {acceptanceStats && (
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Award className="h-4 w-4 text-indigo-600" />
                  <span>Acceptance Rate by Business Category (Which Type Accepts Most)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Identifies which industries yield the highest positive response for website sales.
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-lg border border-indigo-200">
                {acceptanceStats.overall_calls} Total Calls Logged
              </span>
            </div>

            <div className="space-y-4 pt-1">
              {acceptanceStats.category_breakdown.map((cat, idx) => (
                <div key={cat.category} className="space-y-1.5 p-3 rounded-xl bg-slate-50/70 border border-slate-100">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[11px] font-bold text-slate-400">#{idx + 1}</span>
                      <span className="font-bold text-slate-900">{cat.category}</span>
                      {idx === 0 && cat.total_called > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                          <Sparkles className="h-3 w-3" /> Top Performer
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 font-mono text-xs">
                      <span className="text-emerald-700 font-bold">{cat.accepted_count} Accepted</span>
                      <span className="text-slate-300">/</span>
                      <span className="text-rose-600 font-medium">{cat.rejected_count} Declined</span>
                      <span className="text-slate-300">/</span>
                      <span className="font-bold text-indigo-600 text-sm">{cat.acceptance_rate_pct}% Rate</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-emerald-500 transition-all duration-500"
                      style={{
                        width: `${cat.total_called > 0 ? (cat.accepted_count / cat.total_called) * 100 : 0}%`,
                      }}
                      title={`${cat.accepted_count} Accepted`}
                    ></div>
                    <div
                      className="h-full bg-rose-400 transition-all duration-500"
                      style={{
                        width: `${cat.total_called > 0 ? (cat.rejected_count / cat.total_called) * 100 : 0}%`,
                      }}
                      title={`${cat.rejected_count} Declined`}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opportunity Tiers & Industry Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-600" />
              <span>Opportunity Score Distribution</span>
            </h2>
            <p className="text-xs text-slate-500">
              Breakdown of discovered businesses across priority tiers
            </p>

            <div className="space-y-3 pt-2">
              {(analytics?.opportunity_distribution || [
                { tier: "High Priority (80-100)", count: 0 },
                { tier: "Good Opportunity (60-79)", count: 0 },
                { tier: "Medium Priority (40-59)", count: 0 },
                { tier: "Low Priority (0-39)", count: 0 },
              ]).map((item) => {
                const total = analytics?.total_discovered_businesses || 1;
                const pct = Math.round((item.count / total) * 100);
                return (
                  <div key={item.tier} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800 capitalize">{item.tier}</span>
                      <span className="font-mono text-slate-500">
                        {item.count} leads ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Globe className="h-4 w-4 text-indigo-600" />
              <span>Target Category Volume</span>
            </h2>
            <p className="text-xs text-slate-500">
              Distribution of discovered businesses by industry sector
            </p>

            <div className="space-y-3 pt-2">
              {(analytics?.category_distribution || []).map((cat) => {
                const total = analytics?.total_discovered_businesses || 1;
                const pct = Math.round((cat.count / total) * 100);
                return (
                  <div key={cat.category} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">{cat.category}</span>
                      <span className="font-mono text-slate-500">
                        {cat.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(5, pct)}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
