"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import {
  fetchOutreachRecords,
  fetchBusinesses,
  generateOutreachPitch,
  approveOutreach,
  markOutreachSent,
} from "@/lib/api-client";
import { Business } from "@/types";
import {
  Send,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  FileText,
  Mail,
  Edit3,
  Check,
  RotateCw,
  Plus,
  X,
} from "lucide-react";

export default function OutreachManagerPage() {
  const [outreachRecords, setOutreachRecords] = useState<any[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [records, bizList] = await Promise.all([
        fetchOutreachRecords().catch(() => []),
        fetchBusinesses().catch(() => []),
      ]);
      setOutreachRecords(records);
      setBusinesses(bizList);
      if (bizList.length > 0 && !selectedBusinessId) {
        setSelectedBusinessId(bizList[0].id);
      }
    } catch (err) {
      console.error("Failed to load outreach records", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleGeneratePitch = async () => {
    if (!selectedBusinessId) return;
    setGenerating(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await generateOutreachPitch(selectedBusinessId);
      setActionSuccess(`Generated customized pitch draft for ${res.recipient || "business"}!`);
      await loadData();
    } catch (err: any) {
      setActionError(err.message || "Failed to generate pitch");
    } finally {
      setGenerating(false);
    }
  };

  const handleApprove = async (outreachId: string) => {
    try {
      await approveOutreach(outreachId);
      setActionSuccess("Outreach draft approved! Ready for manual communication.");
      await loadData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  const handleMarkSent = async (outreachId: string) => {
    try {
      await markOutreachSent(outreachId);
      setActionSuccess("Marked outreach as sent and updated CRM status!");
      await loadData();
    } catch (err: any) {
      setActionError(err.message);
    }
  };

  return (
    <>
      <Header />

      <main className="p-8 space-y-8 flex-1">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <Send className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Outreach Manager</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Module G: Personalized proposal generator with required manual approval guardrail. Anti-spam compliant.
            </p>
          </div>
        </div>

        {/* Action Notifications */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-lg flex items-center justify-between">
            <span>{actionSuccess}</span>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {actionError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-lg flex items-center justify-between">
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="text-rose-700 hover:text-rose-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Generate Pitch Form */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Plus className="h-4 w-4 text-blue-600" />
            <span>Generate Evidence-Backed Outreach Draft</span>
          </h2>
          <p className="text-xs text-slate-500">
            Synthesizes concrete website audit findings and opportunity scores into a tailored B2B proposal.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={selectedBusinessId}
              onChange={(e) => setSelectedBusinessId(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {businesses.map((b) => (
                <option key={b.id} value={b.id} disabled={b.is_suppressed}>
                  {b.name} ({b.city}) {b.is_suppressed ? "- [SUPPRESSED]" : ""}
                </option>
              ))}
            </select>

            <button
              onClick={handleGeneratePitch}
              disabled={generating || !selectedBusinessId}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{generating ? "Drafting Pitch..." : "Generate Proposal Draft"}</span>
              <FileText className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Outreach Records Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Outreach Approval Queue ({outreachRecords.length})
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Manual Approval Required Before Sending</span>
            </div>
          </div>

          {outreachRecords.length === 0 ? (
            <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
              No outreach records generated yet. Select a qualified lead above to generate a draft.
            </div>
          ) : (
            <div className="space-y-4">
              {outreachRecords.map((rec) => {
                const isSent = rec.status === "sent";
                const isApproved = rec.status === "approved" || rec.manual_approval_granted;

                return (
                  <div
                    key={rec.id}
                    className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{rec.subject || "Proposal Draft"}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              isSent
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : isApproved
                                ? "bg-blue-50 text-blue-700 border-blue-200"
                                : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}
                          >
                            {rec.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Recipient: {rec.recipient || "General Contact Listing"} • Channel: {rec.channel}
                        </p>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2">
                        {!isApproved && !isSent && (
                          <button
                            onClick={() => handleApprove(rec.id)}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium shadow-2xs flex items-center gap-1.5"
                          >
                            <Check className="h-3.5 w-3.5" />
                            <span>Approve Draft</span>
                          </button>
                        )}
                        {isApproved && !isSent && (
                          <button
                            onClick={() => handleMarkSent(rec.id)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium shadow-2xs flex items-center gap-1.5"
                          >
                            <Send className="h-3.5 w-3.5" />
                            <span>Record as Sent</span>
                          </button>
                        )}
                        {isSent && (
                          <span className="text-xs font-medium text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Sent {rec.sent_at ? new Date(rec.sent_at).toLocaleDateString() : ""}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pitch Body Preview */}
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                      {rec.sent_pitch || rec.generated_pitch}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

