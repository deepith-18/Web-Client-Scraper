"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/header";
import {
  fetchExpenses,
  createExpense,
  updateExpense,
  deleteExpense,
  fetchFinancialAnalytics,
} from "@/lib/api-client";
import { CompanyExpense, FinancialAnalytics, MonthlyTrendDetail } from "@/types";
import {
  WalletCards,
  TrendingDown,
  TrendingUp,
  Plus,
  Search,
  Download,
  Calendar,
  Layers,
  Cpu,
  Server,
  PhoneCall,
  Globe2,
  Users,
  Wrench,
  Receipt,
  Edit3,
  Trash2,
  X,
  Check,
  AlertCircle,
  Building,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  PieChart,
} from "lucide-react";

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  ai_apis: {
    label: "AI APIs & Tokens",
    icon: Cpu,
    color: "text-purple-400",
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
  },
  cloud_deployments: {
    label: "Cloud & Deployments",
    icon: Server,
    color: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
  },
  telephony: {
    label: "Telephony & VoIP",
    icon: PhoneCall,
    color: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/20",
  },
  proxies_scraping: {
    label: "Proxies & Scraping",
    icon: Globe2,
    color: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/20",
  },
  payroll_team: {
    label: "Payroll & Commissions",
    icon: Users,
    color: "text-cyan-400",
    bg: "bg-cyan-500/10",
    border: "border-cyan-500/20",
  },
  software_tools: {
    label: "Software Subscriptions",
    icon: Wrench,
    color: "text-indigo-400",
    bg: "bg-indigo-500/10",
    border: "border-indigo-500/20",
  },
  operations: {
    label: "Operations & Misc",
    icon: Receipt,
    color: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  },
};

export default function FinanceDashboardPage() {
  const [expenses, setExpenses] = useState<CompanyExpense[]>([]);
  const [analytics, setAnalytics] = useState<FinancialAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [vendorFilter, setVendorFilter] = useState("all");

  // Create Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    title: "",
    category: "ai_apis",
    amount: "",
    currency: "INR",
    vendor: "",
    billing_type: "recurring_monthly",
    notes: "",
    expense_date: new Date().toISOString().split("T")[0],
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Edit Modal
  const [editingExpense, setEditingExpense] = useState<CompanyExpense | null>(
    null
  );
  const [editForm, setEditForm] = useState({
    title: "",
    category: "ai_apis",
    amount: "",
    currency: "INR",
    vendor: "",
    billing_type: "recurring_monthly",
    notes: "",
    expense_date: "",
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [expensesData, analyticsData] = await Promise.all([
        fetchExpenses(),
        fetchFinancialAnalytics(),
      ]);
      setExpenses(expensesData);
      setAnalytics(analyticsData);
    } catch (err: any) {
      console.error("Failed to load financial records:", err);
      showNotice(err.message || "Failed to load financial data", "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showNotice = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Vendor lists for dropdown filter
  const uniqueVendors = useMemo(() => {
    const set = new Set<string>();
    expenses.forEach((e) => {
      if (e.vendor) set.add(e.vendor);
    });
    return Array.from(set).sort();
  }, [expenses]);

  // Filtered expense ledger
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (categoryFilter !== "all" && e.category !== categoryFilter) return false;
      if (vendorFilter !== "all" && e.vendor !== vendorFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = e.title?.toLowerCase().includes(q);
        const matchesVendor = e.vendor?.toLowerCase().includes(q);
        const matchesNotes = e.notes?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesVendor && !matchesNotes) return false;
      }
      return true;
    });
  }, [expenses, categoryFilter, vendorFilter, searchQuery]);

  // Aggregate sum of filtered expenses
  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  }, [filteredExpenses]);

  // Handlers for Add
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.title.trim()) {
      showNotice("Expense title is required", "error");
      return;
    }
    const amt = parseFloat(addForm.amount);
    if (isNaN(amt) || amt <= 0) {
      showNotice("Please enter a valid expense amount greater than 0", "error");
      return;
    }

    try {
      setSubmittingAdd(true);
      await createExpense({
        title: addForm.title.trim(),
        category: addForm.category,
        amount: amt,
        currency: addForm.currency,
        vendor: addForm.vendor.trim() || undefined,
        billing_type: addForm.billing_type,
        notes: addForm.notes.trim() || undefined,
        expense_date: addForm.expense_date,
      });
      showNotice(`Expense "${addForm.title}" recorded successfully`, "success");
      setIsAddModalOpen(false);
      setAddForm({
        title: "",
        category: "ai_apis",
        amount: "",
        currency: "INR",
        vendor: "",
        billing_type: "recurring_monthly",
        notes: "",
        expense_date: new Date().toISOString().split("T")[0],
      });
      await loadData();
    } catch (err: any) {
      showNotice(err.message || "Failed to create expense", "error");
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Handlers for Edit
  const openEditModal = (expense: CompanyExpense) => {
    setEditingExpense(expense);
    setEditForm({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      currency: expense.currency || "INR",
      vendor: expense.vendor || "",
      billing_type: expense.billing_type || "recurring_monthly",
      notes: expense.notes || "",
      expense_date: expense.expense_date
        ? expense.expense_date.split("T")[0]
        : "",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;
    const amt = parseFloat(editForm.amount);
    if (isNaN(amt) || amt <= 0) {
      showNotice("Please enter a valid expense amount greater than 0", "error");
      return;
    }

    try {
      setSubmittingEdit(true);
      await updateExpense(editingExpense.id, {
        title: editForm.title.trim(),
        category: editForm.category,
        amount: amt,
        currency: editForm.currency,
        vendor: editForm.vendor.trim() || undefined,
        billing_type: editForm.billing_type,
        notes: editForm.notes.trim() || undefined,
        expense_date: editForm.expense_date,
      });
      showNotice("Expense updated successfully", "success");
      setEditingExpense(null);
      await loadData();
    } catch (err: any) {
      showNotice(err.message || "Failed to update expense", "error");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Handlers for Delete
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to permanently delete expense "${title}"?`)) {
      return;
    }
    try {
      setDeletingId(id);
      await deleteExpense(id);
      showNotice(`Expense "${title}" deleted`, "success");
      await loadData();
    } catch (err: any) {
      showNotice(err.message || "Failed to delete expense", "error");
    } finally {
      setDeletingId(null);
    }
  };

  // CSV Export
  const exportToCSV = () => {
    if (!filteredExpenses.length) {
      showNotice("No expenses to export", "error");
      return;
    }
    const headers = [
      "ID",
      "Date",
      "Title",
      "Category",
      "Vendor",
      "Amount",
      "Currency",
      "Billing Type",
      "Notes",
    ];
    const rows = filteredExpenses.map((e) => [
      e.id,
      e.expense_date ? e.expense_date.split("T")[0] : "",
      `"${(e.title || "").replace(/"/g, '""')}"`,
      e.category,
      `"${(e.vendor || "").replace(/"/g, '""')}"`,
      e.amount,
      e.currency,
      e.billing_type,
      `"${(e.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `company_expenses_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice("Expenses exported to CSV successfully", "success");
  };

  const formatCurrency = (amount: number, currency: string = "INR") => {
    const symbol = currency === "INR" ? "₹" : "$";
    return `${symbol}${amount.toLocaleString("en-IN")}`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header />

      <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto w-full">
        {/* TOP CONTROLS & NOTIFICATION */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                <WalletCards className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  Company Spending & Unit Economics
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Track AI token usage, cloud infrastructure, telephony, scraping proxies, and calculate client deal ROI.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition shadow-2xs"
              title="Refresh financial data"
            >
              <RefreshCw
                className={`h-4 w-4 ${refreshing ? "animate-spin text-blue-600 dark:text-blue-400" : ""}`}
              />
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-slate-700 transition shadow-2xs"
            >
              <Download className="h-3.5 w-3.5 text-slate-400" />
              Export CSV
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-lg shadow-blue-500/20 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              Record Expense
            </button>
          </div>
        </div>

        {notification && (
          <div
            className={`p-3 rounded-lg border text-xs font-medium flex items-center justify-between transition-all ${
              notification.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400" />
              )}
              <span>{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="hover:opacity-75"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        {/* 1. EXECUTIVE KPIS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Spend */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs transition">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Total Spend (All Time)</span>
              <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/20">
                <TrendingDown className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {analytics
                  ? formatCurrency(analytics.total_spend_all_time)
                  : "₹0"}
              </span>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {expenses.length} logged transactions
              </p>
            </div>
          </div>

          {/* This Month Burn */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs transition">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Current Month Burn</span>
              <div className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20">
                <Calendar className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {analytics
                  ? formatCurrency(analytics.total_spend_this_month)
                  : "₹0"}
              </span>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Avg monthly: {analytics ? formatCurrency(analytics.average_monthly_burn) : "₹0"}
              </p>
            </div>
          </div>

          {/* Deal Pipeline Revenue */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs transition">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Agreed Deals Revenue</span>
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20">
                <TrendingUp className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 tracking-tight">
                {analytics
                  ? formatCurrency(analytics.pipeline_deal_revenue)
                  : "₹0"}
              </span>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                {analytics?.total_clients_acquired || 0} website deals closed
              </p>
            </div>
          </div>

          {/* Net Profit */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs transition">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Net Profit (P&L)</span>
              <div
                className={`p-2 rounded-lg border ${
                  (analytics?.net_profit || 0) >= 0
                    ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20"
                    : "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-500/20"
                }`}
              >
                {(analytics?.net_profit || 0) >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
              </div>
            </div>
            <div className="mt-3">
              <span
                className={`text-2xl font-bold tracking-tight ${
                  (analytics?.net_profit || 0) >= 0
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-rose-600 dark:text-rose-400"
                }`}
              >
                {analytics ? formatCurrency(analytics.net_profit) : "₹0"}
              </span>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Margin: {analytics?.profit_margin_pct || 0}%
              </p>
            </div>
          </div>

          {/* CAC */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-700 shadow-2xs transition">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-medium">
              <span>Cost Per Client (CAC)</span>
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-500/20">
                <Target className="h-4 w-4" />
              </div>
            </div>
            <div className="mt-3">
              <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                {analytics
                  ? formatCurrency(analytics.cost_per_acquired_client)
                  : "₹0"}
              </span>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Acquisition efficiency
              </p>
            </div>
          </div>
        </div>

        {/* 2. VISUAL SPENDING GRAPHS & BREAKDOWNS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Category Distribution Breakdown */}
          <div className="lg:col-span-2 p-5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PieChart className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Spending Distribution by Category
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Total: {analytics ? formatCurrency(analytics.total_spend_all_time) : "₹0"}
              </span>
            </div>

            <div className="space-y-3.5 pt-2">
              {analytics?.category_breakdown &&
              analytics.category_breakdown.length > 0 ? (
                analytics.category_breakdown.map((cat) => {
                  const cfg =
                    CATEGORY_CONFIG[cat.category_key] || CATEGORY_CONFIG.operations;
                  const Icon = cfg.icon;
                  return (
                    <div key={cat.category_key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span
                            className={`p-1 rounded ${cfg.bg} ${cfg.color} border ${cfg.border}`}
                          >
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {cat.category_name || cfg.label}
                          </span>
                          <span className="text-[11px] text-slate-400 dark:text-slate-500">
                            ({cat.count} expense{cat.count > 1 ? "s" : ""})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-900 dark:text-slate-200 font-semibold">
                            {formatCurrency(cat.total_amount)}
                          </span>
                          <span className="text-slate-400 dark:text-slate-500 text-[11px] w-12 text-right">
                            {cat.percentage}%
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                          style={{ width: `${Math.min(cat.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  No categorized expenses recorded yet. Click "Record Expense" to add one.
                </div>
              )}
            </div>
          </div>

          {/* Top Vendors */}
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Top Paid Vendors
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">Services</span>
            </div>

            <div className="space-y-3 pt-2">
              {analytics?.top_vendors && analytics.top_vendors.length > 0 ? (
                analytics.top_vendors.map((vendor, idx) => (
                  <div
                    key={vendor.vendor}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-6 w-6 rounded-md bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {vendor.vendor}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                        {formatCurrency(vendor.total_amount)}
                      </span>
                      <p className="text-[10px] text-slate-400 dark:text-slate-500">
                        {vendor.percentage}%
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  No vendor data available.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Monthly Burn Rate Trend (6-Months) */}
        {analytics?.monthly_trends && analytics.monthly_trends.length > 0 && (
          <div className="p-5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                  Monthly Burn Rate Velocity (Last 6 Months)
                </h3>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                Monthly average: {formatCurrency(analytics.average_monthly_burn)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
              {analytics.monthly_trends.map((m: MonthlyTrendDetail) => {
                const maxSpend = Math.max(
                  ...analytics.monthly_trends.map((x: MonthlyTrendDetail) => x.total_spend),
                  1
                );
                const barHeightPercent = Math.round((m.total_spend / maxSpend) * 100);
                return (
                  <div
                    key={m.month_label}
                    className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between h-36"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                      <span>{m.month_label}</span>
                    </div>

                    {/* Bar visualization */}
                    <div className="w-full flex items-end justify-center h-16 my-1">
                      <div
                        className="w-8 rounded-t bg-gradient-to-t from-blue-600 to-indigo-500 transition-all duration-500"
                        style={{ height: `${Math.max(barHeightPercent, 8)}%` }}
                        title={`${m.month_label}: ${formatCurrency(m.total_spend)}`}
                      />
                    </div>

                    <div className="text-center font-mono font-bold text-xs text-slate-900 dark:text-white">
                      {formatCurrency(m.total_spend)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. EXPENSE LEDGER & CRUD TABLE */}
        <div className="rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 overflow-hidden space-y-4 p-5 shadow-2xs">
          {/* Controls Bar */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Company Expense Ledger
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Showing {filteredExpenses.length} of {expenses.length} records • Total Filtered Spend:{" "}
                <span className="font-mono text-slate-900 dark:text-white font-semibold">
                  {formatCurrency(filteredTotal)}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Search */}
              <div className="relative min-w-[200px] flex-1 sm:flex-initial">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search expense, vendor..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="all">All Categories</option>
                {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>

              {/* Vendor Filter */}
              <select
                value={vendorFilter}
                onChange={(e) => setVendorFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-200 focus:outline-none focus:border-blue-500 transition"
              >
                <option value="all">All Vendors</option>
                {uniqueVendors.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/80 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800 select-none">
                <tr>
                  <th className="py-3 px-4 font-semibold">Date</th>
                  <th className="py-3 px-4 font-semibold">Expense Title</th>
                  <th className="py-3 px-4 font-semibold">Category</th>
                  <th className="py-3 px-4 font-semibold">Vendor</th>
                  <th className="py-3 px-4 font-semibold">Billing Frequency</th>
                  <th className="py-3 px-4 font-semibold text-right">Amount</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium text-slate-700 dark:text-slate-300">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      Loading financial ledger...
                    </td>
                  </tr>
                ) : filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      No matching expenses found.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((expense) => {
                    const cfg =
                      CATEGORY_CONFIG[expense.category] ||
                      CATEGORY_CONFIG.operations;
                    const Icon = cfg.icon;
                    return (
                      <tr
                        key={expense.id}
                        className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group"
                      >
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {expense.expense_date
                            ? expense.expense_date.split("T")[0]
                            : "-"}
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 dark:text-white">
                            {expense.title}
                          </div>
                          {expense.notes && (
                            <div className="text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-xs">
                              {expense.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${cfg.bg} ${cfg.color} ${cfg.border}`}
                          >
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700 dark:text-slate-300 whitespace-nowrap font-medium">
                          {expense.vendor || "-"}
                        </td>
                        <td className="py-3 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded text-[10px] uppercase font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {expense.billing_type?.replace(/_/g, " ") || "one-time"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatCurrency(expense.amount, expense.currency)}
                        </td>
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5 opacity-80 group-hover:opacity-100 transition">
                            <button
                              onClick={() => openEditModal(expense)}
                              className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                              title="Edit Expense"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() =>
                                handleDelete(expense.id, expense.title)
                              }
                              disabled={deletingId === expense.id}
                              className="p-1.5 rounded hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition"
                              title="Delete Expense"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* CREATE EXPENSE MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Record Company Expense
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OpenAI GPT-4o API Batch Inference"
                  value={addForm.title}
                  onChange={(e) =>
                    setAddForm({ ...addForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Category *
                  </label>
                  <select
                    value={addForm.category}
                    onChange={(e) =>
                      setAddForm({ ...addForm, category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Vendor / Provider
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. OpenAI, AWS, Twilio"
                    value={addForm.vendor}
                    onChange={(e) =>
                      setAddForm({ ...addForm, vendor: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 4200"
                    value={addForm.amount}
                    onChange={(e) =>
                      setAddForm({ ...addForm, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 font-mono font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Currency
                  </label>
                  <select
                    value={addForm.currency}
                    onChange={(e) =>
                      setAddForm({ ...addForm, currency: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Billing Frequency
                  </label>
                  <select
                    value={addForm.billing_type}
                    onChange={(e) =>
                      setAddForm({ ...addForm, billing_type: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="recurring_monthly">Monthly Recurring</option>
                    <option value="one_time">One-Time</option>
                    <option value="usage_based">Usage-based / Pay-as-you-go</option>
                    <option value="annual">Annual Subscription</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Expense Date
                  </label>
                  <input
                    type="date"
                    value={addForm.expense_date}
                    onChange={(e) =>
                      setAddForm({ ...addForm, expense_date: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Notes / Invoice Reference
                </label>
                <textarea
                  rows={2}
                  placeholder="Notes, tax details, team member attribution, or invoice ref..."
                  value={addForm.notes}
                  onChange={(e) =>
                    setAddForm({ ...addForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
                >
                  {submittingAdd ? "Recording..." : "Record Expense"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT EXPENSE MODAL */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                Edit Company Expense
              </h3>
              <button
                onClick={() => setEditingExpense(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Expense Title *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.title}
                  onChange={(e) =>
                    setEditForm({ ...editForm, title: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Category *
                  </label>
                  <select
                    value={editForm.category}
                    onChange={(e) =>
                      setEditForm({ ...editForm, category: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Vendor / Provider
                  </label>
                  <input
                    type="text"
                    value={editForm.vendor}
                    onChange={(e) =>
                      setEditForm({ ...editForm, vendor: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.amount}
                    onChange={(e) =>
                      setEditForm({ ...editForm, amount: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 font-mono font-medium focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Currency
                  </label>
                  <select
                    value={editForm.currency}
                    onChange={(e) =>
                      setEditForm({ ...editForm, currency: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Billing Frequency
                  </label>
                  <select
                    value={editForm.billing_type}
                    onChange={(e) =>
                      setEditForm({ ...editForm, billing_type: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="recurring_monthly">Monthly Recurring</option>
                    <option value="one_time">One-Time</option>
                    <option value="usage_based">Usage-based / Pay-as-you-go</option>
                    <option value="annual">Annual Subscription</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                    Expense Date
                  </label>
                  <input
                    type="date"
                    value={editForm.expense_date}
                    onChange={(e) =>
                      setEditForm({ ...editForm, expense_date: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-semibold mb-1">
                  Notes / Invoice Reference
                </label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-lg shadow-blue-500/20 transition disabled:opacity-50"
                >
                  {submittingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
