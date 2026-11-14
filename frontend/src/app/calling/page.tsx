"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import { LeadModal } from "@/components/ui/lead-modal";
import { CallerDeskSkeleton } from "@/components/ui/skeleton";
import {
  fetchBusinesses,
  updateBusinessStatus,
  addBusinessNote,
  createBusinessTask,
  addToSuppression,
  createCallLog,
} from "@/lib/api-client";
import { Business } from "@/types";
import {
  PhoneCall,
  Phone,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Globe,
  SlidersHorizontal,
  ChevronRight,
  UserCheck,
  Calendar,
  FileText,
  AlertCircle,
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  ArrowRight,
  X,
  History,
} from "lucide-react";

export default function CallerDeskPage() {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedLead, setSelectedLead] = useState<Business | null>(null);

  // Accept / Reject Dialog states
  const [acceptModalBiz, setAcceptModalBiz] = useState<Business | null>(null);
  const [acceptForm, setAcceptForm] = useState({
    project_type: "Turnkey Website Build",
    agreed_budget: "Standard Quote (₹25,000 - ₹50,000)",
    client_notes: "",
  });

  const [rejectModalBiz, setRejectModalBiz] = useState<Business | null>(null);
  const [rejectForm, setRejectForm] = useState({
    reason: "Already has existing web agency / developer",
    add_to_suppression: false,
    notes: "",
  });

  const [callbackModalBiz, setCallbackModalBiz] = useState<Business | null>(null);
  const [callbackDate, setCallbackDate] = useState("");
  const [callbackNotes, setCallbackNotes] = useState("");

  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  const phoneLeads = useMemo(() => {
    return businesses
      .filter((b) => {
        if (b.is_suppressed) return false;
        const hasPhone = b.contacts?.some((c) => c.contact_type === "phone" && c.raw_value);
        if (!hasPhone) return false;

        if (selectedCity && !b.city.toLowerCase().includes(selectedCity.toLowerCase())) {
          return false;
        }

        if (statusFilter !== "all" && b.crm_status !== statusFilter) {
          return false;
        }

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchName = b.name.toLowerCase().includes(q);
          const matchCat = b.category.toLowerCase().includes(q);
          const matchCity = b.city.toLowerCase().includes(q);
          const matchPhone = b.contacts?.some((c) => c.raw_value.toLowerCase().includes(q));
          if (!matchName && !matchCat && !matchCity && !matchPhone) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const scoreA = a.lead_scores?.[0]?.total_opportunity_score ?? 0;
        const scoreB = b.lead_scores?.[0]?.total_opportunity_score ?? 0;
        return scoreB - scoreA;
      });
  }, [businesses, selectedCity, statusFilter, searchQuery]);

  const kpis = useMemo(() => {
    const totalToCall = businesses.filter((b) => b.contacts?.some((c) => c.contact_type === "phone")).length;
    const acceptedCount = businesses.filter((b) =>
      ["interested", "meeting_scheduled", "proposal_sent", "converted"].includes(b.crm_status)
    ).length;
    const rejectedCount = businesses.filter((b) =>
      ["not_interested", "do_not_contact"].includes(b.crm_status)
    ).length;
    const callbacksCount = businesses.filter((b) => b.crm_status === "contact_permitted").length;

    const totalDecided = acceptedCount + rejectedCount;
    const acceptanceRate = totalDecided > 0 ? Math.round((acceptedCount / totalDecided) * 100) : 0;

    return { totalToCall, acceptedCount, rejectedCount, callbacksCount, acceptanceRate };
  }, [businesses]);

  const copyPhone = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // 1. Submit ACCEPT
  const handleConfirmAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptModalBiz) return;
    setSubmitting(true);
    try {
      const phoneVal = acceptModalBiz.contacts?.find((c) => c.contact_type === "phone")?.raw_value || "";
      await createCallLog({
        business_id: acceptModalBiz.id,
        phone_number: phoneVal,
        outcome: "agreed",
        duration_seconds: 180,
        caller_name: "Team Caller",
        project_type: acceptForm.project_type,
        agreed_budget: acceptForm.agreed_budget,
        notes: acceptForm.client_notes || "Client agreed to website proposal. Ready for Deepith to review and draft pitch.",
      });

      const updated = await updateBusinessStatus(acceptModalBiz.id, "interested");
      setBusinesses((prev) => prev.map((b) => (b.id === acceptModalBiz.id ? updated : b)));
      setActionSuccess(`Great work! ${acceptModalBiz.name} marked as ACCEPTED. Handed off to Deepith for proposal!`);
      setAcceptModalBiz(null);
      setAcceptForm({
        project_type: "Turnkey Website Build",
        agreed_budget: "Standard Quote (₹25,000 - ₹50,000)",
        client_notes: "",
      });
    } catch (err: any) {
      alert("Error updating lead: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 2. Submit REJECT
  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectModalBiz) return;
    setSubmitting(true);
    try {
      const phoneVal = rejectModalBiz.contacts?.find((c) => c.contact_type === "phone")?.raw_value || "";
      await createCallLog({
        business_id: rejectModalBiz.id,
        phone_number: phoneVal,
        outcome: "declined",
        duration_seconds: 60,
        caller_name: "Team Caller",
        decline_reason: rejectForm.reason,
        notes: rejectForm.notes,
        add_to_suppression: rejectForm.add_to_suppression,
      });

      const statusToSet = rejectForm.add_to_suppression ? "do_not_contact" : "not_interested";
      const updated = await updateBusinessStatus(rejectModalBiz.id, statusToSet);

      if (rejectForm.add_to_suppression && rejectModalBiz.official_website) {
        await addToSuppression({
          value: rejectModalBiz.normalized_domain || rejectModalBiz.official_website,
          suppression_type: "domain",
          reason: `Caller logged: ${rejectForm.reason}`,
        });
      }

      setBusinesses((prev) => prev.map((b) => (b.id === rejectModalBiz.id ? updated : b)));
      setActionSuccess(`Recorded decline for ${rejectModalBiz.name}.`);
      setRejectModalBiz(null);
      setRejectForm({
        reason: "Already has existing web agency / developer",
        add_to_suppression: false,
        notes: "",
      });
    } catch (err: any) {
      alert("Error updating lead: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Submit CALLBACK
  const handleConfirmCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!callbackModalBiz || !callbackDate) return;
    setSubmitting(true);
    try {
      const phoneVal = callbackModalBiz.contacts?.find((c) => c.contact_type === "phone")?.raw_value || "";
      await createCallLog({
        business_id: callbackModalBiz.id,
        phone_number: phoneVal,
        outcome: "callback_scheduled",
        caller_name: "Team Caller",
        scheduled_callback_at: new Date(callbackDate).toISOString(),
        notes: callbackNotes || "Scheduled follow-up callback",
      });

      await updateBusinessStatus(callbackModalBiz.id, "contact_permitted");
      await createBusinessTask(
        callbackModalBiz.id,
        `Callback for ${callbackModalBiz.name}: ${callbackNotes || "Scheduled follow-up call"}`,
        new Date(callbackDate).toISOString()
      );

      await loadData();
      setActionSuccess(`Callback scheduled for ${callbackModalBiz.name} on ${new Date(callbackDate).toLocaleString()}.`);
      setCallbackModalBiz(null);
      setCallbackDate("");
      setCallbackNotes("");
    } catch (err: any) {
      alert("Error scheduling callback: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <>
      <Header
        onSearchChange={setSearchQuery}
        selectedCity={selectedCity}
        onCitySelect={setSelectedCity}
      />

      <main className="p-6 md:p-8 space-y-6 flex-1">
        {/* Top Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold rounded-xl shadow-md shadow-emerald-500/20">
                <PhoneCall className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Caller Desk</h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Call scraped leads, record whether they <span className="font-semibold text-emerald-600 dark:text-emerald-400">Accept</span> or <span className="font-semibold text-rose-600 dark:text-rose-400">Reject</span>, and hand off accepted clients directly to Deepith.
            </p>
          </div>

          <div className="flex items-center gap-2.5 text-xs">
            <Link
              href="/calling/history"
              className="px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-semibold rounded-xl shadow-2xs flex items-center gap-1.5 transition-all"
            >
              <History className="h-4 w-4 text-teal-600 dark:text-teal-400" />
              <span>Call Logs & CRUD History</span>
            </Link>
            <span className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold text-slate-700 dark:text-slate-200 shadow-2xs flex items-center gap-1.5">
              <UserCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Teammate Calling Desk</span>
            </span>
          </div>
        </div>

        {/* Action Success Alert */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">{actionSuccess}</span>
            </div>
            <button
              onClick={() => setActionSuccess(null)}
              className="text-emerald-700 dark:text-emerald-300 hover:text-emerald-900 dark:hover:text-emerald-100 font-bold"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* High-Contrast KPIs Bar */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
          <div className="p-4 bg-white dark:bg-[#0c121e] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Leads to Call</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{kpis.totalToCall}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Verified numbers</p>
          </div>

          <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 shadow-2xs">
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">Accepted (Agreed)</span>
            <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1">{kpis.acceptedCount}</p>
            <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400/80 mt-0.5">Waiting for Deepith</p>
          </div>

          <div className="p-4 bg-rose-50/70 dark:bg-rose-950/30 rounded-xl border border-rose-200/80 dark:border-rose-800/50 shadow-2xs">
            <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 uppercase tracking-wider">Declined (Rejected)</span>
            <p className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1">{kpis.rejectedCount}</p>
            <p className="text-[11px] text-rose-800/80 dark:text-rose-400/80 mt-0.5">Logged with reasons</p>
          </div>

          <div className="p-4 bg-teal-50/70 dark:bg-teal-950/30 rounded-xl border border-teal-200/80 dark:border-teal-800/50 shadow-2xs">
            <span className="text-[11px] font-semibold text-teal-800 dark:text-teal-300 uppercase tracking-wider">Callbacks</span>
            <p className="text-2xl font-bold text-teal-700 dark:text-teal-400 mt-1">{kpis.callbacksCount}</p>
            <p className="text-[11px] text-teal-800/80 dark:text-teal-400/80 mt-0.5">Scheduled on calendar</p>
          </div>

          <div className="p-4 bg-white dark:bg-[#0c121e] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs col-span-2 lg:col-span-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Acceptance Rate</span>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">{kpis.acceptanceRate}%</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">Agreed vs. Rejected</p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-white dark:bg-[#0c121e] rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-slate-400 dark:text-slate-500" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">Filter Queue:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-1.5 font-medium text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-teal-500"
            >
              <option value="all">All Prospects</option>
              <option value="new">Uncalled Only (New)</option>
              <option value="interested">Accepted (Agreed)</option>
              <option value="contact_permitted">Callbacks Scheduled</option>
              <option value="not_interested">Declined (Rejected)</option>
            </select>
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            Showing <span className="font-bold text-slate-900 dark:text-white">{phoneLeads.length}</span> leads with verified phone numbers
          </div>
        </div>

        {/* High-Value Calling Leads Feed */}
        <div className="space-y-4">
          {loading ? (
            <CallerDeskSkeleton count={4} />
          ) : phoneLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-400 dark:text-slate-400 bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
              No matching prospects found. Try adjusting your filter or run Discovery to scrape more leads.
            </div>
          ) : (
            phoneLeads.map((biz) => {
              const primaryPhone = biz.contacts?.find((c) => c.contact_type === "phone")?.raw_value || "";
              const cleanPhone = primaryPhone.replace(/[^0-9+]/g, "");
              const scoreObj = biz.lead_scores?.[0];
              const score = scoreObj?.total_opportunity_score ?? 0;
              const hasWebsite = Boolean(biz.official_website);
              const isAccepted = ["interested", "meeting_scheduled", "proposal_sent", "converted"].includes(
                biz.crm_status
              );
              const isRejected = ["not_interested", "do_not_contact"].includes(biz.crm_status);

              return (
                <div
                  key={biz.id}
                  className={`p-6 rounded-2xl border transition-all ${
                    isAccepted
                      ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/60 ring-1 ring-emerald-500/20"
                      : isRejected
                      ? "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60 opacity-60"
                      : "bg-white dark:bg-[#0c121e] border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    {/* Left: Lead Identity & Category */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-slate-900 dark:text-white text-base">{biz.name}</h3>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-slate-200 dark:border-slate-700">
                          {biz.category}
                        </span>
                        {isAccepted && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-xs">
                            <Check className="h-3.5 w-3.5" />
                            ACCEPTED · Waiting for Deepith
                          </span>
                        )}
                        {isRejected && (
                          <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                            DECLINED
                          </span>
                        )}
                        {!isAccepted && !isRejected && (
                          <span className="text-xs font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800/60">
                            {score} Opportunity Pts
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {biz.city}, {biz.country}
                        </span>
                        <span className="flex items-center gap-1">
                          <Globe className="h-3.5 w-3.5 text-slate-400" />
                          {hasWebsite ? (
                            <a
                              href={biz.official_website}
                              target="_blank"
                              rel="noreferrer"
                              className="text-teal-600 dark:text-teal-400 hover:underline truncate max-w-[200px]"
                            >
                              {biz.official_website}
                            </a>
                          ) : (
                            <span className="text-rose-600 dark:text-rose-400 font-bold">No Website Found</span>
                          )}
                        </span>
                      </div>

                      {/* Cheat-Sheet Pitch Guidance */}
                      <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        <span className="font-bold text-slate-900 dark:text-white">Calling Pitch Tip: </span>
                        {!hasWebsite ? (
                          <span>
                            "Hello, we noticed {biz.name} does not have an official website listed on Google Maps. We specialize in building fast, mobile-friendly websites so customers in {biz.city} can find you and book directly. Can we prepare a quick wireframe quotation for you?"
                          </span>
                        ) : (
                          <span>
                            "Hello, we reviewed your website ({biz.official_website}) and spotted a few mobile layout and security optimizations that could increase your direct client inquiries. Would you be open to a quick proposal?"
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Right: Phone & Big ACCEPT / REJECT Buttons */}
                    <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-3 shrink-0">
                      {/* Prominent Dial Link */}
                      <div className="flex items-center gap-2">
                        <a
                          href={`tel:${cleanPhone}`}
                          className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white rounded-xl text-sm font-bold shadow-xs transition-colors flex items-center gap-2 font-mono"
                          title="Click to dial immediately"
                        >
                          <Phone className="h-4 w-4 text-emerald-400" />
                          <span>{primaryPhone}</span>
                        </a>

                        <button
                          onClick={() => copyPhone(primaryPhone, biz.id)}
                          className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
                          title="Copy phone"
                        >
                          {copiedPhoneId === biz.id ? (
                            <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </button>
                      </div>

                      {/* BIG SATISFYING ACCEPT / REJECT BUTTONS */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setAcceptModalBiz(biz)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5"
                          title="Client agreed to do a website!"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          <span>ACCEPT · Client Agreed</span>
                        </button>

                        <button
                          onClick={() => setRejectModalBiz(biz)}
                          className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-slate-200 dark:border-slate-700 hover:border-rose-200 dark:hover:border-rose-800/60 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                          title="Client declined or not interested"
                        >
                          <ThumbsDown className="h-4 w-4 text-rose-500" />
                          <span>REJECT</span>
                        </button>

                        <button
                          onClick={() => setCallbackModalBiz(biz)}
                          className="p-2 bg-white dark:bg-slate-800 hover:bg-teal-50 dark:hover:bg-teal-950/40 text-teal-700 dark:text-teal-300 border border-slate-200 dark:border-slate-700 hover:border-teal-200 dark:hover:border-teal-800/60 rounded-xl transition-all"
                          title="Schedule callback"
                        >
                          <Clock className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => setSelectedLead(biz)}
                          className="p-2 text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="View all details"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* 1. ACCEPT CONFIRMATION MODAL */}
      {acceptModalBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c121e] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-emerald-600 dark:bg-emerald-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ThumbsUp className="h-5 w-5" />
                <h3 className="text-base font-bold tracking-tight">Confirm Accepted Lead</h3>
              </div>
              <button
                onClick={() => setAcceptModalBiz(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmAccept} className="p-6 space-y-4">
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-900 dark:text-emerald-200">
                <span className="font-bold text-sm block mb-0.5">{acceptModalBiz.name}</span>
                <span>{acceptModalBiz.category} · {acceptModalBiz.city}</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Agreed Project Type</label>
                <select
                  value={acceptForm.project_type}
                  onChange={(e) => setAcceptForm({ ...acceptForm, project_type: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-800 dark:text-slate-100"
                >
                  <option value="Turnkey Website Build">Turnkey Website Build (New Site from Scratch)</option>
                  <option value="Mobile & Performance Redesign">Mobile & Performance Redesign (Modernize existing)</option>
                  <option value="E-Commerce & Online Store">E-Commerce & Online Store / Catalog</option>
                  <option value="Appointment & Booking Portal">Appointment & Booking Portal</option>
                  <option value="Landing Page & Lead Funnel">Landing Page & Lead Funnel</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Estimated Budget Range</label>
                <select
                  value={acceptForm.agreed_budget}
                  onChange={(e) => setAcceptForm({ ...acceptForm, agreed_budget: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-800 dark:text-slate-100"
                >
                  <option value="Standard Quote (₹25,000 - ₹50,000)">Standard Quote (₹25,000 - ₹50,000)</option>
                  <option value="Starter Build (₹15,000 - ₹25,000)">Starter Build (₹15,000 - ₹25,000)</option>
                  <option value="Premium Custom (₹50,000 - ₹1,00,000+)">Premium Custom (₹50,000 - ₹1,00,000+)</option>
                  <option value="Custom Quotation Required">Custom Quotation Required</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Call Notes for Deepith (What they asked for, owner name, etc.):
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Spoke to owner Mr. Ramesh. Wants clean design with WhatsApp booking button. Send proposal by tomorrow."
                  value={acceptForm.client_notes}
                  onChange={(e) => setAcceptForm({ ...acceptForm, client_notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium resize-none text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAcceptModalBiz(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>{submitting ? "Confirming..." : "Confirm & Send to Deepith"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. REJECT CONFIRMATION MODAL */}
      {rejectModalBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c121e] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-rose-600 dark:bg-rose-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ThumbsDown className="h-5 w-5" />
                <h3 className="text-base font-bold tracking-tight">Record Declined Lead</h3>
              </div>
              <button
                onClick={() => setRejectModalBiz(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmReject} className="p-6 space-y-4">
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl text-xs text-rose-900 dark:text-rose-200">
                <span className="font-bold text-sm block mb-0.5">{rejectModalBiz.name}</span>
                <span>{rejectModalBiz.category} · {rejectModalBiz.city}</span>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Reason for Decline</label>
                <select
                  value={rejectForm.reason}
                  onChange={(e) => setRejectForm({ ...rejectForm, reason: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg font-medium text-slate-800 dark:text-slate-100"
                >
                  <option value="Already has existing web agency / developer">Already has web agency / developer</option>
                  <option value="No budget for website this quarter">No budget for website right now</option>
                  <option value="Not interested in digital presence">Not interested in website / online presence</option>
                  <option value="Wrong number / Permanently closed">Wrong number or business permanently closed</option>
                  <option value="Do Not Call / Requested Opt-Out">Requested Do-Not-Call (Opt-Out)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Caller Notes (Optional):</label>
                <input
                  type="text"
                  placeholder="e.g. Person said they only use Instagram, don't want website."
                  value={rejectForm.notes}
                  onChange={(e) => setRejectForm({ ...rejectForm, notes: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              <label className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rejectForm.add_to_suppression}
                  onChange={(e) => setRejectForm({ ...rejectForm, add_to_suppression: e.target.checked })}
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                />
                <span>Add to Global Do-Not-Contact list (permanently block future scraping/calling)</span>
              </label>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectModalBiz(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                >
                  {submitting ? "Logging..." : "Log Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. CALLBACK MODAL */}
      {callbackModalBiz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#0c121e] rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 bg-teal-600 dark:bg-teal-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <h3 className="text-base font-bold tracking-tight">Schedule Callback</h3>
              </div>
              <button
                onClick={() => setCallbackModalBiz(null)}
                className="text-white/80 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCallback} className="p-6 space-y-4">
              <div className="p-3 bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800/60 rounded-xl text-xs text-teal-900 dark:text-teal-200 font-bold">
                {callbackModalBiz.name}
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Callback Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  value={callbackDate}
                  onChange={(e) => setCallbackDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Notes for Callback</label>
                <input
                  type="text"
                  placeholder="e.g. Owner is in surgery, call back at 4:30 PM"
                  value={callbackNotes}
                  onChange={(e) => setCallbackNotes(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 font-medium text-slate-800 dark:text-slate-100 placeholder-slate-400"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCallbackModalBiz(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-semibold hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold"
                >
                  {submitting ? "Saving..." : "Save Callback Reminder"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Full Lead Modal */}
      {selectedLead && (
        <LeadModal
          business={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusUpdate={async (bizId, newStatus) => {
            const updated = await updateBusinessStatus(bizId, newStatus);
            setBusinesses((prev) => prev.map((b) => (b.id === bizId ? updated : b)));
            if (selectedLead?.id === bizId) setSelectedLead(updated);
          }}
          onRefresh={loadData}
        />
      )}
    </>
  );
}
