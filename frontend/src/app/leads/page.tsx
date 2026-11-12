"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { LeadModal } from "@/components/ui/lead-modal";
import { formatScoreTier } from "@/lib/utils";
import { fetchBusinesses, updateBusinessStatus, createManualBusiness, clearAllBusinesses } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { Business } from "@/types";
import {
  Search,
  Filter,
  Download,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Globe,
  SlidersHorizontal,
  FileSpreadsheet,
  Plus,
  X,
  AlertCircle,
  CheckCircle2,
  Trash2,
} from "lucide-react";

export default function LeadExplorerPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [websiteFilter, setWebsiteFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Business | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Cafes & Restaurants",
    custom_category: "",
    official_website: "",
    city: "Bengaluru",
    state_province: "Karnataka",
    country: "India",
    address_line1: "",
    description: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await fetchBusinesses();
      setBusinesses(data);
    } catch (err) {
      console.error("Failed to load leads", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleClearAllLeads = async () => {
    if (!window.confirm("Are you sure you want to delete all leads? This action cannot be undone.")) {
      return;
    }
    setClearing(true);
    try {
      await clearAllBusinesses();
      await loadData();
      setSelectedLead(null);
    } catch (err) {
      console.error("Failed to clear leads", err);
      alert("Failed to clear leads. Please try again.");
    } finally {
      setClearing(false);
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

  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.city.trim()) {
      setCreateError("Business name and city are required.");
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const finalCategory =
        formData.category === "Other" && formData.custom_category.trim()
          ? formData.custom_category.trim()
          : formData.category;

      const payload = {
        name: formData.name.trim(),
        category: finalCategory,
        city: formData.city.trim(),
        state_province: formData.state_province.trim() || undefined,
        country: formData.country.trim() || "India",
        official_website: formData.official_website.trim() || undefined,
        address_line1: formData.address_line1.trim() || undefined,
        description: formData.description.trim() || undefined,
      };

      const created = await createManualBusiness(payload);
      setIsCreateModalOpen(false);
      setFormData({
        name: "",
        category: "Cafes & Restaurants",
        custom_category: "",
        official_website: "",
        city: "Bengaluru",
        state_province: "Karnataka",
        country: "India",
        address_line1: "",
        description: "",
      });
      await loadData();
      setSelectedLead(created);
    } catch (err: any) {
      setCreateError(err.message || "Failed to create prospect. Please check inputs.");
    } finally {
      setCreateLoading(false);
    }
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    businesses.forEach((b) => set.add(b.category));
    return Array.from(set);
  }, [businesses]);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((b) => {
      if (selectedCity && !b.city.toLowerCase().includes(selectedCity.toLowerCase())) {
        return false;
      }
      if (categoryFilter !== "all" && b.category !== categoryFilter) {
        return false;
      }
      if (statusFilter !== "all" && b.crm_status !== statusFilter) {
        return false;
      }
      const scoreObj = b.lead_scores?.[0];
      const tier = scoreObj?.priority_tier || "low";
      if (priorityFilter !== "all" && tier !== priorityFilter) {
        return false;
      }
      if (websiteFilter === "has_website" && !b.official_website) {
        return false;
      }
      if (websiteFilter === "no_website" && b.official_website) {
        return false;
      }
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = b.name.toLowerCase().includes(q);
        const matchCat = b.category.toLowerCase().includes(q);
        const matchCity = b.city.toLowerCase().includes(q);
        const matchDomain = (b.official_website || "").toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchCity && !matchDomain) {
          return false;
        }
      }
      return true;
    });
  }, [businesses, selectedCity, categoryFilter, priorityFilter, statusFilter, websiteFilter, searchQuery]);

  const exportToCSV = () => {
    if (filteredBusinesses.length === 0) return;

    const headers = [
      "ID",
      "Business Name",
      "Category",
      "City",
      "Country",
      "Official Website",
      "Opportunity Score",
      "Priority Tier",
      "CRM Status",
      "Emails",
      "Phones",
      "Discovered At",
    ];

    const rows = filteredBusinesses.map((b) => {
      const scoreObj = b.lead_scores?.[0];
      const emails = b.contacts?.filter((c) => c.contact_type === "email").map((c) => c.normalized_value).join("; ") || "";
      const phones = b.contacts?.filter((c) => c.contact_type === "phone").map((c) => c.raw_value).join("; ") || "";

      return [
        `"${b.id}"`,
        `"${b.name.replace(/"/g, '""')}"`,
        `"${b.category}"`,
        `"${b.city}"`,
        `"${b.country}"`,
        `"${b.official_website || ""}"`,
        scoreObj?.total_opportunity_score ?? 0,
        `"${scoreObj?.priority_tier || "low"}"`,
        `"${b.crm_status}"`,
        `"${emails}"`,
        `"${phones}"`,
        `"${b.created_at}"`,
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `demanex-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Header
        onSearchChange={setSearchQuery}
        selectedCity={selectedCity}
        onCitySelect={setSelectedCity}
      />

      <main className="p-8 space-y-6 flex-1">
        {/* Page Title & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lead Explorer</h1>
            <p className="text-xs text-slate-500 mt-1">
              Browse, filter, and export verified business prospects across global metros.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setCreateError(null);
                setIsCreateModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Lead</span>
            </button>
            <button
              onClick={exportToCSV}
              disabled={filteredBusinesses.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
            >
              <Download className="h-4 w-4 text-slate-500" />
              <span>Export CSV ({filteredBusinesses.length})</span>
            </button>
            {isAdmin && businesses.length > 0 && (
              <button
                onClick={handleClearAllLeads}
                disabled={clearing}
                className="flex items-center gap-2 px-3 py-2 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-400 rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                title="Clear all leads from database"
              >
                <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span>{clearing ? "Clearing..." : "Clear All"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <span>Filters:</span>
          </div>

          {/* Priority Filter */}
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Priority Tiers</option>
            <option value="high">High Priority (80-100)</option>
            <option value="good">Good Opportunity (60-79)</option>
            <option value="medium">Medium Priority (40-59)</option>
            <option value="low">Low Priority (0-39)</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All CRM Stages</option>
            <option value="new">New</option>
            <option value="researching">Researching</option>
            <option value="qualified">Qualified</option>
            <option value="contact_permitted">Contact Permitted</option>
            <option value="contacted">Contacted</option>
            <option value="interested">Interested</option>
            <option value="meeting_scheduled">Meeting Scheduled</option>
            <option value="proposal_sent">Proposal Sent</option>
            <option value="negotiation">Negotiation</option>
            <option value="converted">Converted</option>
            <option value="not_interested">Not Interested</option>
            <option value="do_not_contact">Do Not Contact</option>
          </select>

          {/* Website Presence Filter */}
          <select
            value={websiteFilter}
            onChange={(e) => setWebsiteFilter(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Web Presences</option>
            <option value="no_website">No Website (Turnkey Pitch)</option>
            <option value="has_website">Has Website (Audit & Redesign)</option>
          </select>

          {(categoryFilter !== "all" || priorityFilter !== "all" || statusFilter !== "all" || websiteFilter !== "all" || selectedCity || searchQuery) && (
            <button
              onClick={() => {
                setCategoryFilter("all");
                setPriorityFilter("all");
                setStatusFilter("all");
                setWebsiteFilter("all");
                setSelectedCity("");
                setSearchQuery("");
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2 py-1 ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Leads Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3.5 px-6">Business</th>
                  <th className="py-3.5 px-4">Location</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Website</th>
                  <th className="py-3.5 px-4">Opportunity Score</th>
                  <th className="py-3.5 px-4">Public Email / Phone</th>
                  <th className="py-3.5 px-4">CRM Status</th>
                  <th className="py-3.5 px-6 text-right">Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      Loading prospects...
                    </td>
                  </tr>
                ) : filteredBusinesses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400">
                      No records match the current filters.
                    </td>
                  </tr>
                ) : (
                  filteredBusinesses.map((biz) => {
                    const scoreObj = biz.lead_scores?.[0];
                    const score = scoreObj?.total_opportunity_score || 0;
                    const badge = formatScoreTier(score);
                    const email = biz.contacts?.find((c) => c.contact_type === "email");
                    const phone = biz.contacts?.find((c) => c.contact_type === "phone");

                    return (
                      <tr
                        key={biz.id}
                        onClick={() => setSelectedLead(biz)}
                        className="hover:bg-slate-50/70 cursor-pointer transition-colors"
                      >
                        <td className="py-3.5 px-6 font-semibold text-slate-900">
                          {biz.name}
                        </td>
                        <td className="py-3.5 px-4 text-slate-500">
                          {biz.city}, {biz.country}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] font-medium text-slate-700">
                            {biz.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {biz.official_website ? (
                            <span className="text-blue-600 truncate max-w-[160px] block">
                              {biz.official_website}
                            </span>
                          ) : (
                            <span className="text-rose-600 font-semibold text-[11px] bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                              No Website
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${badge.badgeClass}`}>
                            {score} pts
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-[11px]">
                          {email ? (
                            <span className="text-slate-800 font-medium truncate block max-w-[140px]">
                              {email.normalized_value}
                            </span>
                          ) : phone ? (
                            <span className="text-slate-500 font-mono text-[10px]">
                              {phone.raw_value}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">None</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {biz.crm_status.replace(/_/g, " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-6 text-right">
                          <button className="text-blue-600 hover:text-blue-800 font-semibold text-xs inline-flex items-center gap-1">
                            <span>Open</span>
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

      {/* Create Lead Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 tracking-tight">Add New Prospect</h3>
                <p className="text-xs text-slate-500">
                  Manually register a prospect for automated scoring and opportunity auditing.
                </p>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateLead} className="p-6 space-y-4 overflow-y-auto flex-1">
              {createError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2.5 text-xs text-red-700">
                  <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
                  <span>{createError}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Business Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zen Design Studio"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white"
                  >
                    <option value="Cafes & Restaurants">Cafes & Restaurants</option>
                    <option value="Clinics & Healthcare">Clinics & Healthcare</option>
                    <option value="Boutiques & Retail">Boutiques & Retail</option>
                    <option value="Interior Designers">Interior Designers</option>
                    <option value="Fitness & Gyms">Fitness & Gyms</option>
                    <option value="Co-working & Offices">Co-working & Offices</option>
                    <option value="Bakeries & Sweet Shops">Bakeries & Sweet Shops</option>
                    <option value="Salons & Spas">Salons & Spas</option>
                    <option value="Law Firms & Consultants">Law Firms & Consultants</option>
                    <option value="Other">Other (Custom)</option>
                  </select>
                </div>

                {formData.category === "Other" && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700">Custom Category</label>
                    <input
                      type="text"
                      placeholder="Specify category"
                      value={formData.custom_category}
                      onChange={(e) => setFormData({ ...formData, custom_category: e.target.value })}
                      className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Official Website <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="https://example.com"
                  value={formData.official_website}
                  onChange={(e) => setFormData({ ...formData, official_website: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium font-mono text-[11px]"
                />
                <p className="text-[10px] text-slate-400">
                  If left blank, our scoring engine classifies it as a turnkey website prospect (+30 opportunity points).
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Bengaluru"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">State / Region</label>
                  <input
                    type="text"
                    placeholder="Karnataka"
                    value={formData.state_province}
                    onChange={(e) => setFormData({ ...formData, state_province: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700">Country</label>
                  <input
                    type="text"
                    placeholder="India"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Address / Neighborhood</label>
                <input
                  type="text"
                  placeholder="e.g. 100 Feet Rd, Indiranagar"
                  value={formData.address_line1}
                  onChange={(e) => setFormData({ ...formData, address_line1: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Description / Freelance Notes</label>
                <textarea
                  rows={2}
                  placeholder="Initial notes on client needs, observations, or source..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {createLoading ? (
                    <span>Registering Prospect...</span>
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      <span>Save & Calculate Score</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal */}
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

