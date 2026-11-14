"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { LeadModal } from "@/components/ui/lead-modal";
import {
  fetchBusinesses,
  auditUrlDirect,
  updateBusinessStatus,
} from "@/lib/api-client";
import { Business } from "@/types";
import {
  Activity,
  Globe,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Search,
  ExternalLink,
  Code2,
  Zap,
  ArrowRight,
} from "lucide-react";

export default function WebsiteAuditsPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedLead, setSelectedLead] = useState<Business | null>(null);

  // Live URL Scanner State
  const [scanUrl, setScanUrl] = useState("");
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchBusinesses();
      setBusinesses(data);
    } catch (err) {
      console.error("Failed to load audits data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleLiveScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanUrl.trim()) return;

    setScanning(true);
    setScanResult(null);
    setScanError(null);

    try {
      let formattedUrl = scanUrl.trim();
      if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
        formattedUrl = `https://${formattedUrl}`;
      }
      const res = await auditUrlDirect(formattedUrl);
      setScanResult(res);
    } catch (err: any) {
      setScanError(err.message || "Audit failed to complete");
    } finally {
      setScanning(false);
    }
  };

  const auditedBusinesses = businesses.filter((b) => b.website_audits && b.website_audits.length > 0);

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

  return (
    <>
      <Header
        onSearchChange={setSearchQuery}
        selectedCity={selectedCity}
        onCitySelect={setSelectedCity}
      />

      <main className="p-8 space-y-8 flex-1">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-lg">
              <Activity className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Website Opportunity Audits</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Module D: Automated technical diagnostics identifying responsive, security, performance, and lead capture deficiencies.
          </p>
        </div>

        {/* Live URL Audit Tool */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span>On-Demand Website Opportunity Analyzer</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Enter any business URL to run real-time SSRF-safe diagnostic inspection.
            </p>
          </div>

          <form onSubmit={handleLiveScan} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="e.g. https://example-business.com"
              value={scanUrl}
              onChange={(e) => setScanUrl(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800"
            />
            <button
              type="submit"
              disabled={scanning || !scanUrl.trim()}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{scanning ? "Analyzing Site..." : "Run Audit"}</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </form>

          {scanError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {scanResult && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700/70 space-y-3 mt-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Target: {scanResult.final_url || scanResult.target_url}
                </span>
                <span
                  className={`text-xs font-bold px-2 py-0.5 rounded border ${
                    scanResult.is_reachable
                      ? "bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800"
                      : "bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800"
                  }`}
                >
                  {scanResult.is_reachable ? "Reachable" : "Unreachable / Error"}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">SSL Security</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1">
                    {scanResult.has_ssl ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Active HTTPS
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Insecure HTTP
                      </span>
                    )}
                  </span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Mobile Viewport</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1">
                    {scanResult.is_mobile_friendly ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Responsive
                      </span>
                    ) : (
                      <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Missing Viewport
                      </span>
                    )}
                  </span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Contact Form</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-1">
                    {scanResult.has_contact_form ? (
                      <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Present
                      </span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> Not Detected
                      </span>
                    )}
                  </span>
                </div>

                <div className="p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
                  <span className="text-[11px] text-slate-400 dark:text-slate-500 block font-medium">Initial Latency</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 mt-1 block">
                    {scanResult.load_time_ms ? `${scanResult.load_time_ms} ms` : "N/A"}
                  </span>
                </div>
              </div>

              {scanResult.opportunities_identified?.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 block">
                    Opportunities Identified:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {scanResult.opportunities_identified.map((opp: string) => (
                      <span
                        key={opp}
                        className="px-2 py-0.5 rounded text-[11px] font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                      >
                        {opp.replace(/_/g, " ")}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Recent Website Audits Database */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                Audited Businesses ({auditedBusinesses.length})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Discovered businesses with complete technical audit records
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-6">Business</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Website</th>
                  <th className="py-3.5 px-4">SSL</th>
                  <th className="py-3.5 px-4">Mobile</th>
                  <th className="py-3.5 px-4">Lead Form</th>
                  <th className="py-3.5 px-4">Opportunities</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {auditedBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      No businesses audited yet. Inspect any lead to run an audit.
                    </td>
                  </tr>
                ) : (
                  auditedBusinesses.map((biz) => {
                    const audit = biz.website_audits[0];
                    return (
                      <tr
                        key={biz.id}
                        onClick={() => setSelectedLead(biz)}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">
                          {biz.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400">
                          {biz.city}, {biz.country}
                        </td>
                        <td className="py-3.5 px-4 text-blue-600 dark:text-blue-400 truncate max-w-[160px]">
                          {biz.official_website || "No Website"}
                        </td>
                        <td className="py-3.5 px-4">
                          {audit.has_ssl ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">HTTPS</span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold">Insecure</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {audit.is_mobile_friendly ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Responsive</span>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 font-semibold">Broken</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {audit.has_contact_form ? (
                            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Yes</span>
                          ) : (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">None</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            {audit.opportunities_identified?.length || 0} issues
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold text-xs">
                            Inspect
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

      {/* Lead Modal */}
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

