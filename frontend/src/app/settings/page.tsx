"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import {
  fetchSuppressionList,
  addToSuppression,
  deleteFromSuppression,
  fetchSources,
  purgeAllTemporaryData,
} from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { LeadSource } from "@/types";
import {
  Settings,
  ShieldAlert,
  Plus,
  Trash2,
  Database,
  Lock,
  FileCheck2,
  AlertCircle,
  X,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [suppressionList, setSuppressionList] = useState<any[]>([]);
  const [sources, setSources] = useState<LeadSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [purging, setPurging] = useState(false);

  // New suppression input
  const [newValue, setNewValue] = useState("");
  const [newType, setNewType] = useState("domain");
  const [newReason, setNewReason] = useState("Opt-out request");
  const [adding, setAdding] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handlePurgeAll = async () => {
    if (!window.confirm("Are you sure you want to purge all temporary scraped data and discovery jobs? Real user accounts and suppression lists will be preserved.")) {
      return;
    }
    setPurging(true);
    setStatusMessage(null);
    try {
      const res = await purgeAllTemporaryData();
      setStatusMessage(res.message || "All temporary data, discovery jobs, and test leads purged successfully.");
    } catch (err: any) {
      setStatusMessage(`Error purging data: ${err.message}`);
    } finally {
      setPurging(false);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [suppData, sourceData] = await Promise.all([
        fetchSuppressionList().catch(() => []),
        fetchSources().catch(() => []),
      ]);
      setSuppressionList(suppData);
      setSources(sourceData);
    } catch (err) {
      console.error("Failed to load settings data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddSuppression = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newValue.trim()) return;

    setAdding(true);
    setStatusMessage(null);
    try {
      await addToSuppression({
        value: newValue.trim(),
        suppression_type: newType,
        reason: newReason,
      });
      setStatusMessage(`Added '${newValue}' to suppression list. Relevant leads marked 'Do Not Contact'.`);
      setNewValue("");
      await loadData();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteSuppression = async (id: string) => {
    try {
      await deleteFromSuppression(id);
      await loadData();
    } catch (err: any) {
      setStatusMessage(`Error removing: ${err.message}`);
    }
  };

  return (
    <>
      <Header />

      <main className="p-8 space-y-8 flex-1">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg">
              <Settings className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Platform Settings & Compliance</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage global suppression records (Do-Not-Contact lists), authorized data registries, and privacy safeguards.
          </p>
        </div>

        {statusMessage && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-300 text-xs rounded-lg flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Suppression List Manager */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                <span>Global Suppression List (Opt-Out Registry)</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Any domain, business name, or email in this list is automatically suppressed and excluded from outreach.
              </p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 rounded-full border border-rose-200 dark:border-rose-800/60">
              {suppressionList.length} Suppressed Records
            </span>
          </div>

          <form onSubmit={handleAddSuppression} className="flex flex-col sm:flex-row gap-3 pt-2">
            <input
              type="text"
              placeholder="e.g. competitor.com or contact@domain.com"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
            >
              <option value="domain">Domain</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="business_name">Business Name</option>
            </select>
            <input
              type="text"
              placeholder="Reason for suppression"
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 focus:outline-none w-48"
            />
            <button
              type="submit"
              disabled={adding || !newValue.trim()}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center justify-center gap-1.5 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{adding ? "Adding..." : "Add to Suppression"}</span>
            </button>
          </form>

          {/* List Table */}
          <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mt-3">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Suppressed Value</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Reason</th>
                  <th className="py-2.5 px-4">Requested At</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {suppressionList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      No records suppressed.
                    </td>
                  </tr>
                ) : (
                  suppressionList.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900 dark:text-white">
                        {item.value}
                      </td>
                      <td className="py-2.5 px-4 capitalize text-slate-500 dark:text-slate-400">{item.suppression_type}</td>
                      <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">{item.reason || "General suppression"}</td>
                      <td className="py-2.5 px-4 text-slate-400 dark:text-slate-500 font-mono text-[11px]">
                        {item.requested_at ? new Date(item.requested_at).toLocaleDateString() : ""}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => handleDeleteSuppression(item.id)}
                          className="text-rose-600 dark:text-rose-400 hover:text-rose-800 dark:hover:text-rose-300 p-1"
                          title="Remove from suppression"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Authorized Discovery Sources Status */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
            <Database className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span>Authorized Public Data Registries</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Compliant business directories and geospatial open data sources currently configured for extraction.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            {sources.map((src) => (
              <div key={src.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900 dark:text-white">{src.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      src.is_authorized
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {src.is_authorized ? "Active" : "Disabled"}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">{src.description}</p>
                <div className="text-[10px] font-medium text-slate-400 dark:text-slate-500">
                  Reliability: {src.reliability_score * 100}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Agency Data Reset & Purge (Admins Only) */}
        {isAdmin && (
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/60 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-rose-600 dark:text-rose-400" />
                  <span>Platform Data Reset & Cleanup</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
                  Quickly purge all temporary discovery jobs, scraped leads, audits, call logs, and scoring runs.
                  User accounts and suppression rules will remain untouched so your team can start fresh with real client data.
                </p>
              </div>
              <button
                onClick={handlePurgeAll}
                disabled={purging}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span>{purging ? "Purging System Data..." : "Purge All Scraped Data"}</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

