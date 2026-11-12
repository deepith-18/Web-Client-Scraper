"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { fetchSources, fetchDiscoveryJobs, createDiscoveryJob, fetchJobLogs, cancelDiscoveryJob, deleteDiscoveryJob, clearAllDiscoveryJobs } from "@/lib/api-client";
import { LeadSource, ScrapingJob } from "@/types";
import { getActiveUser, checkPermission } from "@/lib/permissions";
import {
  Compass,
  ArrowLeft,
  Sparkles,
  Layers,
  MapPin,
  Globe2,
  Server,
  Play,
  RotateCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  FileText,
  X,
  ExternalLink,
  UserCheck,
  Lock,
  ShieldAlert,
  Trash2,
} from "lucide-react";

const targetCategories = [
  "Restaurants and cafes",
  "Interior designers",
  "Dental clinics",
  "Coaching centres",
  "Real estate agencies",
  "Gyms and fitness centres",
  "Travel agencies",
  "Small manufacturers",
  "Salons and spas",
];

const presetMarkets = [
  { city: "Bengaluru", country: "India", state: "Karnataka" },
  { city: "Mumbai", country: "India", state: "Maharashtra" },
  { city: "Delhi", country: "India", state: "Delhi" },
  { city: "Austin", country: "United States", state: "Texas" },
  { city: "San Francisco", country: "United States", state: "California" },
  { city: "London", country: "United Kingdom", state: "Greater London" },
  { city: "Sydney", country: "Australia", state: "New South Wales" },
  { city: "Singapore", country: "Singapore", state: "Central" },
];

export default function DiscoverPage() {
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [jobName, setJobName] = useState("");
  const [targetCountry, setTargetCountry] = useState("India");
  const [targetCity, setTargetCity] = useState("Bengaluru");
  const [targetPostalCode, setTargetPostalCode] = useState("");
  const [targetCategory, setTargetCategory] = useState("Restaurants and cafes");
  const [selectedSourceType, setSelectedSourceType] = useState("open_osm");
  const [searchKeywords, setSearchKeywords] = useState("");

  // Logs modal state
  const [activeJobLogs, setActiveJobLogs] = useState<{ job: ScrapingJob; logs: any[] } | null>(null);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [srcs, jbs] = await Promise.all([
        fetchSources().catch(() => []),
        fetchDiscoveryJobs().catch(() => []),
      ]);
      setSources(srcs);
      setJobs(jbs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Poll for active jobs
  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === "running" || j.status === "pending");
    if (!hasActive) return;

    const interval = setInterval(async () => {
      try {
        const updatedJobs = await fetchDiscoveryJobs();
        setJobs(updatedJobs);

        // If logs modal open for a running job, refresh its logs
        if (activeJobLogs && (activeJobLogs.job.status === "running" || activeJobLogs.job.status === "pending")) {
          const freshLogs = await fetchJobLogs(activeJobLogs.job.id);
          const currentJob = updatedJobs.find((j) => j.id === activeJobLogs.job.id) || activeJobLogs.job;
          setActiveJobLogs({ job: currentJob, logs: freshLogs });
        }
      } catch (e) {
        console.error("Error polling discovery jobs", e);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [jobs, activeJobLogs]);

  const handlePresetSelect = (preset: { city: string; country: string }) => {
    setTargetCity(preset.city);
    setTargetCountry(preset.country);
    setJobName(`${targetCategory} in ${preset.city}, ${preset.country}`);
  };

  const handleCategorySelect = (cat: string) => {
    setTargetCategory(cat);
    setJobName(`${cat} in ${targetCity}, ${targetCountry}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const currentUser = getActiveUser();
    if (!checkPermission("can_discover")) {
      alert(`Access Restricted: ${currentUser?.full_name || "Your account"} does not have permission to execute lead discovery scrapers. Contact Deepith for access.`);
      return;
    }

    setSubmitting(true);
    try {
      const name = jobName || `${targetCategory} in ${targetCity}, ${targetCountry}`;
      const newJob = await createDiscoveryJob({
        job_name: name,
        target_country: targetCountry,
        target_city: targetCity,
        target_category: targetCategory,
        source_type: selectedSourceType,
        search_keywords: searchKeywords || undefined,
        user_id: currentUser?.id,
        user_name: currentUser?.full_name || currentUser?.email || "Deepith (Admin)",
      });
      setJobs((prev) => [newJob, ...prev]);
      setJobName("");
    } catch (err: any) {
      alert(err.message || "Failed to start job");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (jobId: string) => {
    try {
      await cancelDiscoveryJob(jobId);
      const updated = await fetchDiscoveryJobs();
      setJobs(updated);
    } catch (err) {
      console.error("Error cancelling job", err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      await deleteDiscoveryJob(jobId);
      setJobs((prev) => prev.filter((j) => j.id !== jobId));
    } catch (err) {
      console.error("Error deleting job", err);
    }
  };

  const handleClearAllJobs = async () => {
    if (!confirm("Are you sure you want to clear all discovery jobs and logs?")) return;
    try {
      await clearAllDiscoveryJobs();
      setJobs([]);
    } catch (err) {
      console.error("Error clearing jobs", err);
    }
  };

  const handleOpenLogs = async (job: ScrapingJob) => {
    setLoadingLogs(true);
    try {
      const logs = await fetchJobLogs(job.id);
      setActiveJobLogs({ job, logs });
    } catch (err) {
      console.error("Error fetching logs", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  return (
    <>
      <Header />

      <main className="p-8 space-y-8 flex-1">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-xs"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>Business Discovery Engine</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Worldwide Active
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Target prospective businesses by region, industry category, and authorized source registry
              </p>
            </div>
          </div>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RotateCw className="h-3.5 w-3.5" />
            <span>Refresh Jobs</span>
          </button>
        </div>

        {/* Discovery Launcher Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Compass className="h-4 w-4 text-blue-600" />
                <span>Configure Discovery Job</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Runs automated extraction, normalisation, duplicate checking, and opportunity scoring
              </p>
            </div>

            {/* Quick Market Presets */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Quick Market Presets (Bengaluru & Global Metros)
              </label>
              <div className="flex flex-wrap gap-2">
                {presetMarkets.map((preset) => {
                  const isSelected = targetCity === preset.city && targetCountry === preset.country;
                  return (
                    <button
                      type="button"
                      key={preset.city}
                      onClick={() => handlePresetSelect(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {preset.city}, {preset.country}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target Country
                </label>
                <input
                  type="text"
                  required
                  value={targetCountry}
                  onChange={(e) => setTargetCountry(e.target.value)}
                  placeholder="e.g. India, United States, UK"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Target City / Area
                </label>
                <input
                  type="text"
                  required
                  value={targetCity}
                  onChange={(e) => setTargetCity(e.target.value)}
                  placeholder="e.g. Bengaluru, Indiranagar, Austin"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Postal / PIN Code (Optional)
                </label>
                <input
                  type="text"
                  value={targetPostalCode}
                  onChange={(e) => setTargetPostalCode(e.target.value)}
                  placeholder="e.g. 560038 or 78701"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Target Category Pills */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Target Business Category
              </label>
              <div className="flex flex-wrap gap-2">
                {targetCategories.map((cat) => {
                  const isSelected = targetCategory === cat;
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => handleCategorySelect(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        isSelected
                          ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                          : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Authorized Data Sources */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Authorized Discovery Registry Source
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div
                  onClick={() => setSelectedSourceType("open_osm")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedSourceType === "open_osm"
                      ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Globe2 className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-bold text-slate-900">OpenStreetMap Overpass</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Global geospatial business database. Free, rate-limit friendly, zero CAPTCHAs.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedSourceType("google_places")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedSourceType === "google_places"
                      ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">Google Places API</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Direct API commercial directory with high-fidelity contact details.
                  </p>
                </div>

                <div
                  onClick={() => setSelectedSourceType("public_directory")}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    selectedSourceType === "public_directory"
                      ? "border-blue-600 bg-blue-50/40 ring-1 ring-blue-600"
                      : "border-slate-200 bg-slate-50/50 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Compass className="h-4 w-4 text-purple-600" />
                    <span className="text-xs font-bold text-slate-900">Public Business Crawler</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    SSRF-safe direct website crawler respecting robots.txt and rate limits.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition-all disabled:opacity-50"
              >
                <Play className="h-3.5 w-3.5" />
                <span>{submitting ? "Launching Engine..." : "Start Discovery Job"}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Discovery Jobs History */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Discovery Jobs</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Live processing states, qualified business discovery metrics, and activity logs
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">Auto-refreshes while jobs run</span>
              {jobs.length > 0 && (
                <button
                  onClick={handleClearAllJobs}
                  className="px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Clear All Jobs</span>
                </button>
              )}
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {jobs.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No discovery jobs executed yet. Launch one above to discover prospects!
              </div>
            ) : (
              jobs.map((job) => (
                <div key={job.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">{job.job_name}</span>
                        <span
                          className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                            job.status === "completed"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : job.status === "running"
                              ? "bg-blue-50 text-blue-700 border-blue-200 animate-pulse"
                              : job.status === "failed"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : job.status === "cancelled"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-1 flex-wrap">
                        <span>
                          {job.target_category} in {job.target_city}, {job.target_country}
                        </span>
                        <span>•</span>
                        <span>Created {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span>•</span>
                        <span className="font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200 flex items-center gap-1">
                          <UserCheck className="h-3 w-3" />
                          <span>{job.user_name || "Deepith (Admin)"}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900">{job.records_found} Discovered</p>
                        <p className="text-[11px] text-emerald-600 font-medium">
                          {job.records_qualified} Qualified Leads
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div
                          className={`h-full transition-all ${
                            job.status === "completed"
                              ? "bg-emerald-500"
                              : job.status === "failed"
                              ? "bg-rose-500"
                              : "bg-blue-600"
                          }`}
                          style={{ width: `${job.progress_pct}%` }}
                        ></div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenLogs(job)}
                          className="px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center gap-1.5"
                          title="View Execution Logs"
                        >
                          <FileText className="h-3.5 w-3.5 text-slate-500" />
                          <span>Logs</span>
                        </button>

                        {job.status === "completed" && job.records_qualified > 0 && (
                          <Link
                            href={`/?search=${encodeURIComponent(job.target_city)}`}
                            className="px-2.5 py-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 bg-blue-50 border border-blue-200 rounded-lg transition-colors flex items-center gap-1"
                          >
                            <span>View Leads</span>
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        )}

                        {(job.status === "running" || job.status === "pending") && (
                          <button
                            onClick={() => handleCancel(job.id)}
                            className="px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:text-rose-800 bg-rose-50 border border-rose-200 rounded-lg transition-colors"
                          >
                            Cancel
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteJob(job.id)}
                          title="Delete Job"
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-lg transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Real-time Job Logs Modal */}
      {activeJobLogs && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Execution Logs: {activeJobLogs.job.job_name}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Status: <span className="font-semibold uppercase">{activeJobLogs.job.status}</span> • Progress: {activeJobLogs.job.progress_pct}%
                </p>
              </div>
              <button
                onClick={() => setActiveJobLogs(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-2 flex-1 font-mono text-xs bg-slate-950 text-slate-200">
              {activeJobLogs.logs.length === 0 ? (
                <div className="text-slate-500 italic py-4 text-center">No logs generated yet.</div>
              ) : (
                activeJobLogs.logs.map((log: any) => (
                  <div key={log.id} className="flex items-start gap-2.5 leading-relaxed">
                    <span className="text-slate-500 shrink-0 text-[10px]">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                    <span
                      className={`text-[9px] font-bold uppercase px-1 rounded shrink-0 ${
                        log.level === "ERROR"
                          ? "bg-rose-900 text-rose-300"
                          : log.level === "WARN"
                          ? "bg-amber-900 text-amber-300"
                          : "bg-blue-900 text-blue-300"
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="text-slate-300 break-words">{log.message}</span>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setActiveJobLogs(null)}
                className="px-4 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
