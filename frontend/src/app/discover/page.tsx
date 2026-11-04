"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { fetchSources, fetchDiscoveryJobs, createDiscoveryJob } from "@/lib/api-client";
import { LeadSource, ScrapingJob } from "@/types";
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
      });
      setJobs((prev) => [newJob, ...prev]);
      setJobName("");
    } catch (err) {
      console.error("Failed to start job", err);
    } finally {
      setSubmitting(false);
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
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
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
          <div className="p-5 border-b border-slate-200">
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Recent Discovery Jobs</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Live processing states, qualified business discovery metrics, and activity logs
            </p>
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
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : job.status === "failed"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {job.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                        <span>
                          {job.target_category} in {job.target_city}, {job.target_country}
                        </span>
                        <span>•</span>
                        <span>Created {new Date(job.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-xs font-bold text-slate-900">{job.records_found} Discovered</p>
                        <p className="text-[11px] text-emerald-600 font-medium">
                          {job.records_qualified} Qualified Leads
                        </p>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-28 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
                        <div
                          className="bg-blue-600 h-full transition-all"
                          style={{ width: `${job.progress_pct}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </>
  );
}

