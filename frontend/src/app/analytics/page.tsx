"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { MetricsCard } from "@/components/ui/metrics-card";
import { fetchAnalytics, fetchBusinesses } from "@/lib/api-client";
import { AnalyticsOverview, Business } from "@/types";
import {
  BarChart3,
  Users,
  Globe,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  Layers,
  Award,
} from "lucide-react";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const [aData, bData] = await Promise.all([
          fetchAnalytics().catch(() => null),
          fetchBusinesses().catch(() => []),
        ]);
        setAnalytics(aData);
        setBusinesses(bData);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <>
      <Header />

      <main className="p-8 space-y-8 flex-1">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <BarChart3 className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Analytics</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Conversion tracking, category concentrations, and lead opportunity distribution.
          </p>
        </div>

        {/* Core KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricsCard
            title="Total Discovered"
            value={analytics?.total_discovered_businesses ?? businesses.length}
            subtitle="Verified public business entries"
            icon={Users}
            color="blue"
          />
          <MetricsCard
            title="Zero Web Presence"
            value={analytics?.businesses_without_websites ?? 0}
            subtitle="Prime turnkey website opportunities"
            icon={Globe}
            trend="+30 Pts"
            color="rose"
          />
          <MetricsCard
            title="Technical Deficiencies"
            value={analytics?.website_improvement_opportunities ?? 0}
            subtitle="Unresponsive, no SSL, slow speed"
            icon={AlertCircle}
            color="amber"
          />
          <MetricsCard
            title="Qualified Leads"
            value={analytics?.qualified_leads ?? 0}
            subtitle="Ready for freelance outreach"
            icon={CheckCircle2}
            color="emerald"
          />
        </div>

        {/* Opportunity Tiers Distribution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
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

          {/* Category Distribution */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Award className="h-4 w-4 text-indigo-600" />
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

