"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { LeadModal } from "@/components/ui/lead-modal";
import { formatScoreTier } from "@/lib/utils";
import {
  fetchScoringPresets,
  fetchScoringWeights,
  recalculateAllScores,
  fetchScoringSummary,
  fetchBusinesses,
  updateBusinessStatus,
} from "@/lib/api-client";
import { Business, PresetProfile, ScoringWeightsConfig } from "@/types";
import {
  Layers,
  Sparkles,
  Sliders,
  RotateCw,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Shield,
  HelpCircle,
  Zap,
  X,
} from "lucide-react";

export default function LeadScoringPage() {
  const [presets, setPresets] = useState<PresetProfile[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>("balanced");
  const [weights, setWeights] = useState<ScoringWeightsConfig>({
    no_website: 30,
    website_unavailable: 25,
    poor_mobile: 15,
    missing_contact: 10,
    missing_info: 5,
    performance_issues: 5,
    identity_corroborated: 5,
    email_available: 5,
  });

  const [summary, setSummary] = useState<any>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);
  const [selectedLead, setSelectedLead] = useState<Business | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const [presetsData, weightsData, summaryData, bizData] = await Promise.all([
        fetchScoringPresets().catch(() => []),
        fetchScoringWeights().catch(() => null),
        fetchScoringSummary().catch(() => null),
        fetchBusinesses().catch(() => []),
      ]);

      setPresets(presetsData);
      if (weightsData) setWeights(weightsData);
      setSummary(summaryData);
      // Sort businesses by opportunity score descending
      const sorted = [...bizData].sort((a, b) => {
        const scoreA = a.lead_scores?.[0]?.total_opportunity_score || 0;
        const scoreB = b.lead_scores?.[0]?.total_opportunity_score || 0;
        return scoreB - scoreA;
      });
      setBusinesses(sorted);
    } catch (err: any) {
      console.error("Error loading scoring data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectPreset = (preset: PresetProfile) => {
    setSelectedPresetId(preset.id);
    setWeights(preset.weights);
  };

  const handleWeightChange = (key: keyof ScoringWeightsConfig, value: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: value,
    }));
    setSelectedPresetId("custom");
  };

  const handleRecalculateAll = async () => {
    setRecalculating(true);
    setNotification(null);
    try {
      const res = await recalculateAllScores({ weights });
      setNotification(
        `Successfully recalculated ${res.total_recalculated} businesses! High: ${res.tier_distribution.high}, Good: ${res.tier_distribution.good}, Medium: ${res.tier_distribution.medium}, Low: ${res.tier_distribution.low}`
      );
      await loadData();
    } catch (err: any) {
      setNotification(`Recalculation error: ${err.message}`);
    } finally {
      setRecalculating(false);
    }
  };

  const handleStatusUpdate = async (bizId: string, newStatus: string) => {
    try {
      const updated = await updateBusinessStatus(bizId, newStatus);
      setBusinesses((prev) => prev.map((b) => (b.id === bizId ? updated : b)));
      if (selectedLead?.id === bizId) {
        setSelectedLead(updated);
      }
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const filteredBusinesses = businesses.filter((b) => {
    if (selectedCity && !b.city.toLowerCase().includes(selectedCity.toLowerCase())) {
      return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <>
      <Header
        onSearchChange={setSearchQuery}
        selectedCity={selectedCity}
        onCitySelect={setSelectedCity}
      />

      <main className="p-8 space-y-8 flex-1">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 text-amber-600 rounded-lg">
                <Layers className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                Intelligent Lead Scoring Engine
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Module E: Configurable 0–100 point algorithm ranking high-urgency freelance web opportunities.
            </p>
          </div>

          <button
            onClick={handleRecalculateAll}
            disabled={recalculating}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white rounded-xl text-sm font-semibold shadow-md shadow-amber-600/20 transition-all disabled:opacity-50"
          >
            <RotateCw className={`h-4 w-4 ${recalculating ? "animate-spin" : ""}`} />
            <span>{recalculating ? "Recalculating Ranks..." : "Recalculate All Scores"}</span>
          </button>
        </div>

        {/* Notification Banner */}
        {notification && (
          <div className="p-4 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-600" />
              <span>{notification}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-amber-700 hover:text-amber-900 p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Priority Tier Distribution KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
            <span className="text-xs font-medium text-slate-500">Average Lead Score</span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-900">
                {summary?.average_opportunity_score || 0}
              </span>
              <span className="text-xs text-slate-400">/ 100 pts</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 shadow-xs">
            <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
              High Priority (80–100)
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-emerald-900">
                {summary?.high_priority_count || 0}
              </span>
              <span className="text-xs text-emerald-700">prospects</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/50 shadow-xs">
            <span className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-500"></span>
              Good Opportunity (60–79)
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-blue-900">
                {summary?.good_opportunity_count || 0}
              </span>
              <span className="text-xs text-blue-700">prospects</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 shadow-xs">
            <span className="text-xs font-semibold text-amber-800 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500"></span>
              Medium Priority (40–59)
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-amber-900">
                {summary?.medium_priority_count || 0}
              </span>
              <span className="text-xs text-amber-700">prospects</span>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 shadow-xs">
            <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-slate-400"></span>
              Low Priority (0–39)
            </span>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-2xl font-bold text-slate-800">
                {summary?.low_priority_count || 0}
              </span>
              <span className="text-xs text-slate-500">prospects</span>
            </div>
          </div>
        </div>

        {/* Strategy Presets Selector */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-600" />
              <span>1. Select Freelance Opportunity Strategy</span>
            </h2>
            <span className="text-xs text-slate-500">
              Adapts scoring weights to your freelance specialization
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {presets.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <div
                  key={preset.id}
                  onClick={() => handleSelectPreset(preset)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? "border-amber-500 bg-amber-50/40 shadow-sm ring-2 ring-amber-500/20"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-900">{preset.name}</span>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-amber-600"></span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {preset.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Configurable Weight Matrix (Sliders & Inputs) */}
        <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Sliders className="h-4 w-4 text-blue-600" />
                <span>2. Custom Weight Matrix Configuration (0–100 Pts Total)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Tune the point contribution of each technical deficiency and feasibility factor
              </p>
            </div>
            <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg border border-slate-200">
              Active Strategy: {selectedPresetId.toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {/* Factor 1: No Website */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>No Official Website</span>
                <span className="font-mono text-amber-600">+{weights.no_website} pts</span>
              </div>
              <input
                type="range"
                min="0"
                max="60"
                value={weights.no_website}
                onChange={(e) => handleWeightChange("no_website", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <span className="text-[10px] text-slate-400 block mt-1">Zero digital presence</span>
            </div>

            {/* Factor 2: Website Unavailable */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>Website Offline/Error</span>
                <span className="font-mono text-amber-600">+{weights.website_unavailable} pts</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={weights.website_unavailable}
                onChange={(e) => handleWeightChange("website_unavailable", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <span className="text-[10px] text-slate-400 block mt-1">HTTP 4xx/5xx or timeout</span>
            </div>

            {/* Factor 3: Poor Mobile Experience */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>Poor Mobile Experience</span>
                <span className="font-mono text-amber-600">+{weights.poor_mobile} pts</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                value={weights.poor_mobile}
                onChange={(e) => handleWeightChange("poor_mobile", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <span className="text-[10px] text-slate-400 block mt-1">Missing mobile viewport</span>
            </div>

            {/* Factor 4: Missing Contact Form */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>Missing Contact Form</span>
                <span className="font-mono text-amber-600">+{weights.missing_contact} pts</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={weights.missing_contact}
                onChange={(e) => handleWeightChange("missing_contact", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <span className="text-[10px] text-slate-400 block mt-1">No lead capture form</span>
            </div>

            {/* Factor 5: Performance Latency */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>Performance Latency</span>
                <span className="font-mono text-amber-600">+{weights.performance_issues} pts</span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                value={weights.performance_issues}
                onChange={(e) => handleWeightChange("performance_issues", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <span className="text-[10px] text-slate-400 block mt-1">Load time &gt; 3 seconds</span>
            </div>

            {/* Factor 6: Missing Business Info */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>Missing Business Info</span>
                <span className="font-mono text-amber-600">+{weights.missing_info} pts</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={weights.missing_info}
                onChange={(e) => handleWeightChange("missing_info", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <span className="text-[10px] text-slate-400 block mt-1">Incomplete directory details</span>
            </div>

            {/* Factor 7: Identity Corroborated */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>Identity Corroborated</span>
                <span className="font-mono text-amber-600">+{weights.identity_corroborated} pts</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={weights.identity_corroborated}
                onChange={(e) => handleWeightChange("identity_corroborated", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <span className="text-[10px] text-slate-400 block mt-1">Authentic physical listing</span>
            </div>

            {/* Factor 8: Public Email Available */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-800 mb-1">
                <span>Public Email Available</span>
                <span className="font-mono text-amber-600">+{weights.email_available} pts</span>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                value={weights.email_available}
                onChange={(e) => handleWeightChange("email_available", parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
              />
              <span className="text-[10px] text-slate-400 block mt-1">Viable for B2B proposal</span>
            </div>
          </div>
        </div>

        {/* Ranked Lead Opportunities Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Ranked Freelance Opportunities ({filteredBusinesses.length})
              </h2>
              <p className="text-xs text-slate-500">
                Sorted by lead opportunity score. Click any business to inspect evidence and pitch angle.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200/80 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Opportunity Rank</th>
                  <th className="py-3.5 px-4">Business</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Current Website</th>
                  <th className="py-3.5 px-4">Top Deficiencies Found</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBusinesses.map((biz, idx) => {
                  const scoreObj = biz.lead_scores?.[0];
                  const score = scoreObj?.total_opportunity_score || 0;
                  const tier = scoreObj?.priority_tier || "low";
                  const badge = formatScoreTier(score);
                  const audit = biz.website_audits?.[0];

                  return (
                    <tr
                      key={biz.id}
                      onClick={() => setSelectedLead(biz)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-slate-400 text-[11px]">#{idx + 1}</span>
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold border ${badge.badgeClass}`}
                          >
                            {score} pts ({badge.label})
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {biz.name}
                        </p>
                        <span className="text-[11px] text-slate-500">{biz.category}</span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {biz.city}, {biz.country}
                      </td>

                      <td className="py-3.5 px-4">
                        {biz.official_website ? (
                          <span className="text-blue-600 truncate max-w-[180px] block">
                            {biz.official_website}
                          </span>
                        ) : (
                          <span className="text-rose-600 font-semibold text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                            No Website Detected
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[280px]">
                          {!biz.official_website && (
                            <span className="text-[10px] font-medium bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">
                              +30 Turnkey
                            </span>
                          )}
                          {audit && !audit.is_mobile_friendly && (
                            <span className="text-[10px] font-medium bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200">
                              +15 Unresponsive
                            </span>
                          )}
                          {audit && !audit.has_contact_form && (
                            <span className="text-[10px] font-medium bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-200">
                              +10 No Form
                            </span>
                          )}
                          {audit && !audit.has_ssl && biz.official_website && (
                            <span className="text-[10px] font-medium bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded border border-rose-200">
                              No HTTPS
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                          <span>Inspect</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ethical Standards & Transparency Note */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl flex items-start gap-3">
          <Shield className="h-5 w-5 text-slate-500 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600 space-y-1">
            <p className="font-semibold text-slate-800">
              Responsible Scoring & Client Acquisition Standards
            </p>
            <p>
              Lead Opportunity Scores indicate technical and commercial potential based on verifiable website deficiencies and public directory listings. They are strictly separate from contact verification scores and do not represent verified purchasing intent. Always inspect evidence before reaching out.
            </p>
          </div>
        </div>
      </main>

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadModal
          business={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusUpdate={handleStatusUpdate}
          onRefresh={loadData}
        />
      )}
    </>
  );
}

