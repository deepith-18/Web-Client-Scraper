"use client";

import { useEffect, useState, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { MetricsCard } from "@/components/ui/metrics-card";
import { LeadModal } from "@/components/ui/lead-modal";
import { CardSkeleton, TableRowSkeleton } from "@/components/ui/skeleton";
import { formatScoreTier } from "@/lib/utils";
import { fetchAnalytics, fetchBusinesses, updateBusinessStatus, fetchAcceptanceAnalytics } from "@/lib/api-client";
import { Business, AnalyticsOverview, AcceptanceAnalytics } from "@/types";
import {
  Users,
  AlertCircle,
  Globe,
  ShieldCheck,
  CheckCircle2,
  TrendingUp,
  ExternalLink,
  ChevronRight,
  Filter,
  Sparkles,
  ThumbsUp,
  PhoneCall,
  Code2,
  Award,
  ArrowUpRight,
} from "lucide-react";

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Business | null>(null);
  const [acceptanceStats, setAcceptanceStats] = useState<AcceptanceAnalytics | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [analyticsData, bizData, acceptData] = await Promise.all([
        fetchAnalytics().catch(() => null),
        fetchBusinesses().catch(() => []),
        fetchAcceptanceAnalytics().catch(() => null),
      ]);
      setAnalytics(analyticsData);
      setBusinesses(bizData);
      setAcceptanceStats(acceptData);
    } catch (err) {
      console.error("Error loading dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStatusUpdate = async (bizId: string, newStatus: string) => {
    try {
      const updated = await updateBusinessStatus(bizId, newStatus);
      setBusinesses((prev) => prev.map((b) => (b.id === bizId ? updated : b)));
      if (selectedLead?.id === bizId) {
        setSelectedLead(updated);
      }
      // Refresh analytics
      fetchAnalytics().then(setAnalytics).catch(() => {});
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  // Filtered Leads
  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      // City search
      if (selectedCity && !b.city.toLowerCase().includes(selectedCity.toLowerCase())) {
        return false;
      }
      // Category filter
      if (categoryFilter !== "all" && b.category !== categoryFilter) {
        return false;
      }
      // Priority filter
      const scoreObj = b.lead_scores?.[0];
      const tier = scoreObj?.priority_tier || "low";
      if (priorityFilter !== "all" && tier !== priorityFilter) {
        return false;
      }
      // Search query
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = b.name.toLowerCase().includes(q);
        const matchesCat = b.category.toLowerCase().includes(q);
        const matchesCity = b.city.toLowerCase().includes(q);
        const matchesDomain = (b.official_website || "").toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesCity && !matchesDomain) {
          return false;
        }
      }
      return true;
    });
  }, [businesses, selectedCity, categoryFilter, priorityFilter, searchQuery]);

  // Unique categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    businesses.forEach((b) => set.add(b.category));
    return Array.from(set);
  }, [businesses]);

  // Clients accepted by caller, ready for Deepith
  const acceptedClients = useMemo(() => {
    return businesses.filter((b) =>
      ["interested", "meeting_scheduled", "proposal_sent", "negotiation", "converted"].includes(b.crm_status)
    );
  }, [businesses]);

  return (
    <>
      <Header
        onSearchChange={setSearchQuery}
        selectedCity={selectedCity}
        onCitySelect={setSelectedCity}
      />

      <main className="p-8 space-y-8 flex-1">
        {/* Dashboard Header Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Pipeline Overview</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live prospect acquisition and conversion across active target markets.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs text-slate-500 dark:text-slate-400">Market:</span>
            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
              {selectedCity || "Global Metros"}
            </span>
          </div>
        </div>

        {/* Analytics KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {loading ? (
            <>
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
              <CardSkeleton />
            </>
          ) : (
            <>
              <MetricsCard
                title="Total Discovered"
                value={analytics?.total_discovered_businesses ?? businesses.length}
                subtitle="Verified listings"
                icon={Users}
                color="blue"
              />
              <MetricsCard
                title="No Website"
                value={analytics?.businesses_without_websites ?? 0}
                subtitle="Prime build opportunities"
                icon={Globe}
                trend="+30 Score"
                color="rose"
              />
              <MetricsCard
                title="Audits Flagged"
                value={analytics?.website_improvement_opportunities ?? 0}
                subtitle="Performance & mobile issues"
                icon={AlertCircle}
                color="amber"
              />
              <MetricsCard
                title="Qualified Leads"
                value={analytics?.qualified_leads ?? 0}
                subtitle="Ready for outreach"
                icon={CheckCircle2}
                color="emerald"
              />
            </>
          )}
        </div>

        {/* High-Intent / Accepted Leads Queue */}
        <div className="p-6 bg-slate-900 dark:bg-[#0b101b] text-white rounded-xl border border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                <h2 className="text-sm font-semibold tracking-tight text-white flex items-center gap-2">
                  <span>Hot Leads & Accepted Proposals</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    {acceptedClients.length} active
                  </span>
                </h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Prospects marked as interested or ready for pitch wireframes and proposal follow-ups.
              </p>
            </div>

            <a
              href="/calling"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition-colors self-start sm:self-auto flex items-center gap-1.5"
            >
              <PhoneCall className="h-3.5 w-3.5" />
              <span>Caller Desk</span>
            </a>
          </div>

          {acceptedClients.length === 0 ? (
            <div className="p-6 text-center bg-slate-950/40 rounded-lg border border-slate-800 text-xs text-slate-400">
              <p className="font-medium text-slate-300">No active deals in the accepted queue yet.</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Outbound call outcomes and verified positive responses will appear here for follow-up.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {acceptedClients.slice(0, 6).map((client) => {
                const phone = client.contacts?.find((c) => c.contact_type === "phone")?.raw_value;
                const score = client.lead_scores?.[0]?.total_opportunity_score ?? 0;

                return (
                  <div
                    key={client.id}
                    className="p-4 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl space-y-3 transition-colors backdrop-blur-xs flex flex-col justify-between"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-white text-sm truncate">{client.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">
                          {score} PTS
                        </span>
                      </div>

                      <p className="text-xs text-slate-300">
                        {client.category} · {client.city}
                      </p>

                      {phone && (
                        <p className="text-[11px] font-mono text-emerald-300 flex items-center gap-1">
                          <PhoneCall className="h-3 w-3" />
                          <span>{phone}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-400">
                        {client.official_website ? "Redesign Prospect" : "Turnkey Website"}
                      </span>
                      <button
                        onClick={() => setSelectedLead(client)}
                        className="text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center gap-1"
                      >
                        <span>View Audit & Pitch</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Acceptance Analytics: Which Business Type Accepts Most? */}
        {acceptanceStats && (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Which Business Type Accepts Most? (Acceptance Rate by Category)
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Real-time conversion tracking showing which business types agree to websites the most.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 dark:text-slate-500">Top Converting:</span>
                <span className="px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs font-bold flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" />
                  <span>{acceptanceStats.best_converting_category}</span>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              {acceptanceStats.category_breakdown.slice(0, 4).map((cat) => (
                <div key={cat.category} className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/60 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-white truncate">{cat.category}</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400 font-mono text-sm">{cat.acceptance_rate_pct}%</span>
                  </div>

                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 dark:bg-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${Math.max(8, cat.acceptance_rate_pct)}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                    <span className="text-emerald-700 dark:text-emerald-400 font-medium">{cat.accepted_count} agreed</span>
                    <span className="text-rose-600 dark:text-rose-400 font-medium">{cat.rejected_count} declined</span>
                    <span>{cat.total_called} called</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leads Management Section */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden" id="leads">
          {/* Table Header & Controls */}
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>Qualified Business Prospects</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  {filteredBusinesses.length} leads
                </span>
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Evaluated with multi-metric opportunity scoring and public contact provenance
              </p>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Priority filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="dark:bg-slate-800">All Priorities</option>
                  <option value="high" className="dark:bg-slate-800">High (80-100)</option>
                  <option value="good" className="dark:bg-slate-800">Good (60-79)</option>
                  <option value="medium" className="dark:bg-slate-800">Medium (40-59)</option>
                  <option value="low" className="dark:bg-slate-800">Low (0-39)</option>
                </select>
              </div>

              {/* Category filter */}
              <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg">
                <span className="text-slate-400 dark:text-slate-500 font-medium">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-transparent font-medium text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value="all" className="dark:bg-slate-800">All Categories</option>
                  {categories.map((c) => (
                    <option key={c} value={c} className="dark:bg-slate-800">
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-6">Business & Location</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Website Presence</th>
                  <th className="py-3.5 px-4">Opportunity Score</th>
                  <th className="py-3.5 px-4">Public Contacts</th>
                  <th className="py-3.5 px-4">CRM Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRowSkeleton key={i} cols={7} />
                  ))
                ) : filteredBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                      No businesses matching criteria. Try adjusting your filters or launching a new Discovery Job.
                    </td>
                  </tr>
                ) : (
                  filteredBusinesses.map((biz) => {
                    const scoreObj = biz.lead_scores?.[0];
                    const totalScore = scoreObj?.total_opportunity_score ?? 0;
                    const tier = formatScoreTier(totalScore);
                    const email = biz.contacts?.find((c) => c.contact_type === "email");
                    const phone = biz.contacts?.find((c) => c.contact_type === "phone");

                    return (
                      <tr key={biz.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        {/* Name & Location */}
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-900 dark:text-white text-sm">{biz.name}</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                            {biz.city}, {biz.country}
                          </div>
                        </td>

                        {/* Category */}
                        <td className="py-4 px-4 font-medium text-slate-600 dark:text-slate-400">
                          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300">
                            {biz.category}
                          </span>
                        </td>

                        {/* Website Presence */}
                        <td className="py-4 px-4">
                          {biz.official_website ? (
                            <a
                              href={biz.official_website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1 font-medium text-[11px] max-w-[180px] truncate"
                            >
                              <span className="truncate">{biz.normalized_domain || biz.official_website}</span>
                              <ExternalLink className="h-3 w-3 shrink-0" />
                            </a>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold text-[11px] bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-800">
                              No Website (+30 pts)
                            </span>
                          )}
                        </td>

                        {/* Opportunity Score */}
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded font-bold text-xs border ${tier.badgeClass}`}>
                              {totalScore}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {tier.label.split(" ")[0]}
                            </span>
                          </div>
                        </td>

                        {/* Contacts */}
                        <td className="py-4 px-4 text-[11px]">
                          {email && (
                            <div className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[150px]">
                              {email.normalized_value}
                            </div>
                          )}
                          {phone && (
                            <div className="text-slate-500 dark:text-slate-400 font-mono text-[10px]">
                              {phone.raw_value}
                            </div>
                          )}
                          {!email && !phone && (
                            <span className="text-slate-400 dark:text-slate-500 italic">None found yet</span>
                          )}
                        </td>

                        {/* CRM Status */}
                        <td className="py-4 px-4">
                          <span className="capitalize px-2.5 py-1 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {biz.crm_status.replace(/_/g, " ")}
                          </span>
                        </td>

                        {/* Action */}
                        <td className="py-4 px-6 text-right">
                          <button
                            onClick={() => setSelectedLead(biz)}
                            className="inline-flex items-center gap-1 bg-slate-900 hover:bg-blue-600 text-white font-medium text-xs px-3 py-1.5 rounded-lg transition-colors shadow-xs"
                          >
                            <span>Inspect & Audit</span>
                            <ChevronRight className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Lead Detail Modal */}
      <LeadModal
        business={selectedLead}
        onClose={() => setSelectedLead(null)}
        onStatusUpdate={handleStatusUpdate}
      />
    </>
  );
}

