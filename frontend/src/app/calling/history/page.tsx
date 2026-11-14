"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/header";
import {
  fetchCallLogs,
  createCallLog,
  updateCallLog,
  deleteCallLog,
  fetchBusinessCallHistory,
  fetchCallLogsStats,
  fetchBusinesses
} from "@/lib/api-client";
import { CallLog, CallLogStats, Business } from "@/types";
import {
  PhoneCall,
  Phone,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  Filter,
  Download,
  Plus,
  Edit3,
  Trash2,
  History,
  MapPin,
  Globe,
  Briefcase,
  AlertCircle,
  Check,
  Copy,
  ChevronRight,
  X,
  ArrowLeft,
  Sparkles,
  TrendingUp,
  FileText
} from "lucide-react";

export default function CallLogsHistoryPage() {
  const [callLogs, setCallLogs] = useState<CallLog[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [stats, setStats] = useState<CallLogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [outcomeFilter, setOutcomeFilter] = useState("all");
  const [copiedPhoneId, setCopiedPhoneId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Edit Call Log Modal State
  const [editingCall, setEditingCall] = useState<CallLog | null>(null);
  const [editForm, setEditForm] = useState({
    outcome: "agreed",
    duration_seconds: 120,
    caller_name: "",
    project_type: "",
    agreed_budget: "",
    notes: "",
    decline_reason: "",
    scheduled_callback_at: ""
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete Call Log State
  const [deletingCall, setDeletingCall] = useState<CallLog | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Audit History Modal State (viewing all calls for a business)
  const [historyBiz, setHistoryBiz] = useState<{ id: string; name: string } | null>(null);
  const [historyLogs, setHistoryLogs] = useState<CallLog[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Manual Log Call Modal State
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualForm, setManualForm] = useState({
    business_id: "",
    phone_number: "",
    outcome: "agreed",
    duration_seconds: 180,
    caller_name: "Team Caller",
    project_type: "Turnkey Website Build",
    agreed_budget: "₹25,000 - ₹50,000",
    notes: "",
    decline_reason: "",
    scheduled_callback_at: ""
  });
  const [submittingManual, setSubmittingManual] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [logsData, statsData, bizData] = await Promise.all([
        fetchCallLogs({ limit: 300 }),
        fetchCallLogsStats(),
        fetchBusinesses()
      ]);
      setCallLogs(logsData);
      setStats(statsData);
      setBusinesses(bizData);
    } catch (err: any) {
      console.error("Failed to load call history", err);
      showNotification(err.message || "Failed to load call history", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const copyPhoneNumber = (phone: string, id: string) => {
    navigator.clipboard.writeText(phone);
    setCopiedPhoneId(id);
    setTimeout(() => setCopiedPhoneId(null), 2000);
  };

  // Filter Call Logs
  const filteredLogs = useMemo(() => {
    return callLogs.filter((c) => {
      if (outcomeFilter !== "all") {
        if (outcomeFilter === "agreed" && !["agreed", "accepted"].includes(c.outcome)) return false;
        if (outcomeFilter === "declined" && !["declined", "rejected"].includes(c.outcome)) return false;
        if (outcomeFilter === "callback" && !["callback_scheduled", "callback"].includes(c.outcome)) return false;
        if (outcomeFilter === "no_answer" && !["no_answer", "gatekeeper", "wrong_number"].includes(c.outcome)) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = c.business_name?.toLowerCase().includes(q) ?? false;
        const matchPhone = c.phone_number.toLowerCase().includes(q);
        const matchCaller = c.caller_name?.toLowerCase().includes(q) ?? false;
        const matchNotes = c.notes?.toLowerCase().includes(q) ?? false;
        const matchCity = c.business_city?.toLowerCase().includes(q) ?? false;
        if (!matchName && !matchPhone && !matchCaller && !matchNotes && !matchCity) return false;
      }

      return true;
    });
  }, [callLogs, outcomeFilter, searchQuery]);

  // Open Edit Modal
  const openEditModal = (call: CallLog) => {
    setEditingCall(call);
    setEditForm({
      outcome: call.outcome,
      duration_seconds: call.duration_seconds || 120,
      caller_name: call.caller_name || "Team Caller",
      project_type: call.project_type || "",
      agreed_budget: call.agreed_budget || "",
      notes: call.notes || "",
      decline_reason: call.decline_reason || "",
      scheduled_callback_at: call.scheduled_callback_at ? call.scheduled_callback_at.substring(0, 16) : ""
    });
  };

  // Handle Edit Submit
  const handleUpdateCall = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCall) return;

    setSubmittingEdit(true);
    try {
      await updateCallLog(editingCall.id, {
        outcome: editForm.outcome,
        duration_seconds: Number(editForm.duration_seconds),
        caller_name: editForm.caller_name,
        project_type: editForm.project_type,
        agreed_budget: editForm.agreed_budget,
        notes: editForm.notes,
        decline_reason: editForm.decline_reason,
        scheduled_callback_at: editForm.scheduled_callback_at ? new Date(editForm.scheduled_callback_at).toISOString() : undefined
      });
      showNotification("Call log successfully updated");
      setEditingCall(null);
      loadData();
    } catch (err: any) {
      showNotification(err.message || "Failed to update call log", "error");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Handle Delete Call Log
  const handleDeleteCall = async () => {
    if (!deletingCall) return;

    setSubmittingDelete(true);
    try {
      await deleteCallLog(deletingCall.id);
      showNotification("Call log record removed");
      setDeletingCall(null);
      loadData();
    } catch (err: any) {
      showNotification(err.message || "Failed to delete call log", "error");
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Open Audit History Drawer
  const openHistoryDrawer = async (businessId: string, businessName: string) => {
    setHistoryBiz({ id: businessId, name: businessName });
    setLoadingHistory(true);
    try {
      const history = await fetchBusinessCallHistory(businessId);
      setHistoryLogs(history);
    } catch (err) {
      console.error("Failed to load business history", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle Manual Log Submit
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualForm.business_id || !manualForm.phone_number) {
      showNotification("Please select a business and enter a phone number", "error");
      return;
    }

    setSubmittingManual(true);
    try {
      await createCallLog({
        business_id: manualForm.business_id,
        phone_number: manualForm.phone_number,
        outcome: manualForm.outcome,
        duration_seconds: Number(manualForm.duration_seconds),
        caller_name: manualForm.caller_name,
        project_type: manualForm.project_type,
        agreed_budget: manualForm.agreed_budget,
        notes: manualForm.notes,
        decline_reason: manualForm.decline_reason,
        scheduled_callback_at: manualForm.scheduled_callback_at ? new Date(manualForm.scheduled_callback_at).toISOString() : undefined
      });
      showNotification("Manual call logged successfully");
      setIsManualModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotification(err.message || "Failed to log call", "error");
    } finally {
      setSubmittingManual(false);
    }
  };

  // Export CSV
  const exportToCSV = () => {
    if (filteredLogs.length === 0) {
      showNotification("No call logs to export", "error");
      return;
    }

    const headers = [
      "ID",
      "Date",
      "Business Name",
      "Category",
      "City",
      "Phone",
      "Caller",
      "Outcome",
      "Duration (s)",
      "Project Type",
      "Agreed Budget",
      "Notes"
    ];

    const rows = filteredLogs.map((c) => [
      c.id,
      new Date(c.created_at).toLocaleString(),
      `"${c.business_name || ""}"`,
      `"${c.business_category || ""}"`,
      `"${c.business_city || ""}"`,
      c.phone_number,
      `"${c.caller_name || ""}"`,
      c.outcome,
      c.duration_seconds,
      `"${c.project_type || ""}"`,
      `"${c.agreed_budget || ""}"`,
      `"${(c.notes || "").replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `demanex_call_history_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Call history exported to CSV");
  };

  const getOutcomeBadge = (outcome: string) => {
    switch (outcome.toLowerCase()) {
      case "agreed":
      case "accepted":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="h-3 w-3 text-emerald-600" />
            Agreed to Website
          </span>
        );
      case "declined":
      case "rejected":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="h-3 w-3 text-rose-600" />
            Declined
          </span>
        );
      case "callback_scheduled":
      case "callback":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="h-3 w-3 text-amber-600" />
            Callback Scheduled
          </span>
        );
      case "no_answer":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            No Answer
          </span>
        );
      case "gatekeeper":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
            Gatekeeper Block
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {outcome}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header />

      <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
              notification.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              )}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <Link
                href="/calling"
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Return to Live Caller Desk</span>
              </Link>
              <span className="text-slate-300 dark:text-slate-700">•</span>
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-md">
                Full CRUD Audit Trail
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              Call Logs & Interaction History
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Complete chronological registry of all cold calls made. Review agreed deal budgets, edit notes, inspect client audit histories, and export reports.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={exportToCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-2xs transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setIsManualModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Log Manual Call</span>
            </button>
          </div>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Today's Calls</span>
              <PhoneCall className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats?.total_calls_today ?? 0}</div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">Logged today</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">All-Time Calls</span>
              <History className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats?.total_calls_all_time ?? 0}</div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">Total outreach logged</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Confirmed Agreed</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{stats?.total_agreed ?? 0}</div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">Sent to Deepith</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Scheduled Callbacks</span>
              <Clock className="h-4 w-4 text-amber-500" />
            </div>
            <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-2">{stats?.total_callbacks ?? 0}</div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">Follow-up reminders</span>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Win Rate %</span>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">{stats?.acceptance_rate ?? 0}%</div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">Top: {stats?.top_converting_category || "Cafes"}</span>
          </div>
        </div>

        {/* Search, Filter Tabs & Call Logs Table */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-50/70 dark:bg-slate-900/60">
            {/* Outcome Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
              {[
                { id: "all", label: "All Calls" },
                { id: "agreed", label: "Agreed (Accepted)" },
                { id: "callback", label: "Scheduled Callbacks" },
                { id: "declined", label: "Declined" },
                { id: "no_answer", label: "No Answer / Gatekeeper" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setOutcomeFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                    outcomeFilter === tab.id
                      ? "bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-2xs border border-slate-200 dark:border-slate-700"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-800/60"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search business, phone, caller, notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 placeholder-slate-400"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Date & Time</th>
                  <th className="py-3.5 px-4">Prospect Business</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Caller</th>
                  <th className="py-3.5 px-4">Outcome</th>
                  <th className="py-3.5 px-4">Scope & Budget</th>
                  <th className="py-3.5 px-4">Notes & Details</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      Loading call activity logs...
                    </td>
                  </tr>
                ) : filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                      No call records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((call) => (
                    <tr key={call.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 dark:text-slate-400">
                        <div className="font-medium text-slate-700 dark:text-slate-300">
                          {new Date(call.created_at).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            year: "numeric"
                          })}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-slate-500">
                          {new Date(call.created_at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                          {call.duration_seconds > 0 && ` • ${Math.floor(call.duration_seconds / 60)}m ${call.duration_seconds % 60}s`}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 dark:text-white">{call.business_name || "Unknown"}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{call.business_category}</span>
                          {call.business_city && (
                            <>
                              <span>•</span>
                              <span>{call.business_city}</span>
                            </>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <a
                            href={`tel:${call.phone_number}`}
                            className="font-mono text-xs font-semibold text-blue-600 hover:underline"
                          >
                            {call.phone_number}
                          </a>
                          <button
                            onClick={() => copyPhoneNumber(call.phone_number, call.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 rounded"
                            title="Copy number"
                          >
                            {copiedPhoneId === call.id ? (
                              <Check className="h-3 w-3 text-emerald-600" />
                            ) : (
                              <Copy className="h-3 w-3" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 dark:text-slate-300">
                        {call.caller_name || "Team Caller"}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">{getOutcomeBadge(call.outcome)}</td>

                      <td className="py-3.5 px-4">
                        {call.project_type || call.agreed_budget ? (
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">{call.project_type || "Turnkey Build"}</span>
                            {call.agreed_budget && (
                              <span className="block text-[11px] font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                {call.agreed_budget}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        {call.notes ? (
                          <p className="text-slate-700 dark:text-slate-300 truncate" title={call.notes}>
                            {call.notes}
                          </p>
                        ) : call.decline_reason ? (
                          <p className="text-rose-700 dark:text-rose-400 truncate" title={call.decline_reason}>
                            Decline: {call.decline_reason}
                          </p>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500">No notes</span>
                        )}
                        {call.scheduled_callback_at && (
                          <div className="text-[11px] text-amber-700 dark:text-amber-400 font-medium flex items-center gap-1 mt-0.5">
                            <Clock className="h-3 w-3" />
                            <span>
                              Callback: {new Date(call.scheduled_callback_at).toLocaleString("en-IN", {
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit"
                              })}
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openHistoryDrawer(call.business_id, call.business_name || "Business")}
                            title="View Client Call History"
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                          >
                            <History className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => openEditModal(call)}
                            title="Edit Call Log"
                            className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingCall(call)}
                            title="Delete Call Log"
                            className="p-1.5 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* MODAL 1: EDIT CALL LOG */}
      {editingCall && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Call Log Entry</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingCall.business_name} ({editingCall.phone_number})</p>
              </div>
              <button
                onClick={() => setEditingCall(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateCall} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Call Outcome</label>
                  <select
                    value={editForm.outcome}
                    onChange={(e) => setEditForm({ ...editForm, outcome: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="agreed">Agreed to Website (Accepted)</option>
                    <option value="callback_scheduled">Callback Scheduled</option>
                    <option value="declined">Declined</option>
                    <option value="no_answer">No Answer</option>
                    <option value="gatekeeper">Gatekeeper Block</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Seconds)</label>
                  <input
                    type="number"
                    value={editForm.duration_seconds}
                    onChange={(e) => setEditForm({ ...editForm, duration_seconds: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Scope</label>
                  <input
                    type="text"
                    placeholder="Turnkey Website Build"
                    value={editForm.project_type}
                    onChange={(e) => setEditForm({ ...editForm, project_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Agreed Budget</label>
                  <input
                    type="text"
                    placeholder="₹25,000 - ₹50,000"
                    value={editForm.agreed_budget}
                    onChange={(e) => setEditForm({ ...editForm, agreed_budget: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              {editForm.outcome === "callback_scheduled" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Scheduled Callback Time</label>
                  <input
                    type="datetime-local"
                    value={editForm.scheduled_callback_at}
                    onChange={(e) => setEditForm({ ...editForm, scheduled_callback_at: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              )}

              {editForm.outcome === "declined" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Decline Reason</label>
                  <input
                    type="text"
                    placeholder="Already has agency, no budget, etc."
                    value={editForm.decline_reason}
                    onChange={(e) => setEditForm({ ...editForm, decline_reason: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Call Notes</label>
                <textarea
                  rows={3}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCall(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submittingEdit ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DELETE CALL LOG */}
      {deletingCall && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-xl p-6 space-y-4">
            <div className="h-10 w-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Delete Call Log Entry?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to delete the record for{" "}
                <span className="font-semibold text-slate-800">{deletingCall.business_name}</span>? This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingCall(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCall}
                disabled={submittingDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                {submittingDelete ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: AUDIT HISTORY DRAWER */}
      {historyBiz && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-end">
          <div className="bg-white h-full max-w-md w-full border-l border-slate-200 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                  Client Audit Trail
                </span>
                <h3 className="font-bold text-slate-900 text-base mt-0.5">{historyBiz.name}</h3>
              </div>
              <button
                onClick={() => setHistoryBiz(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingHistory ? (
                <div className="py-12 text-center text-slate-400 text-xs">Loading client call trail...</div>
              ) : historyLogs.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">No previous call records for this client.</div>
              ) : (
                <div className="space-y-4">
                  {historyLogs.map((h, idx) => (
                    <div key={h.id} className="relative pl-6 pb-4 border-l-2 border-slate-200 last:border-0">
                      <div className="absolute -left-1.5 top-0.5 h-3 w-3 rounded-full bg-blue-600 border-2 border-white"></div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-900">
                          {new Date(h.created_at).toLocaleString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                        {getOutcomeBadge(h.outcome)}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">Caller: {h.caller_name || "Team Caller"}</div>
                      {h.agreed_budget && (
                        <div className="text-xs font-bold text-emerald-600 mt-1">Budget: {h.agreed_budget}</div>
                      )}
                      {h.notes && (
                        <p className="text-xs text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 mt-2">
                          {h.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: MANUAL CALL LOG */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Record Manual Call Log</h3>
                <p className="text-xs text-slate-500 mt-0.5">Log an outbound or inbound call interaction directly.</p>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Prospect Business</label>
                <select
                  required
                  value={manualForm.business_id}
                  onChange={(e) => {
                    const selBiz = businesses.find((b) => b.id === e.target.value);
                    const phone = selBiz?.contacts?.find((c) => c.contact_type === "phone")?.raw_value || "";
                    setManualForm({
                      ...manualForm,
                      business_id: e.target.value,
                      phone_number: phone
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                >
                  <option value="">-- Choose Business --</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.city} • {b.category})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number Called</label>
                  <input
                    type="text"
                    required
                    placeholder="+91..."
                    value={manualForm.phone_number}
                    onChange={(e) => setManualForm({ ...manualForm, phone_number: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Outcome</label>
                  <select
                    value={manualForm.outcome}
                    onChange={(e) => setManualForm({ ...manualForm, outcome: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="agreed">Agreed to Website (Accepted)</option>
                    <option value="callback_scheduled">Callback Scheduled</option>
                    <option value="declined">Declined</option>
                    <option value="no_answer">No Answer</option>
                    <option value="gatekeeper">Gatekeeper Block</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Project Scope</label>
                  <input
                    type="text"
                    value={manualForm.project_type}
                    onChange={(e) => setManualForm({ ...manualForm, project_type: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Agreed Budget</label>
                  <input
                    type="text"
                    value={manualForm.agreed_budget}
                    onChange={(e) => setManualForm({ ...manualForm, agreed_budget: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Caller Notes & Next Steps</label>
                <textarea
                  rows={2}
                  placeholder="Key talking points, decision maker name..."
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingManual}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submittingManual ? "Saving..." : "Save Call Log"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

