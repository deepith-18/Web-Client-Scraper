"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import {
  fetchOutreachRecords,
  fetchBusinesses,
  generateOutreachPitch,
  approveOutreach,
  markOutreachSent,
  fetchOutreachTemplates,
  createOutreachTemplate,
  deleteOutreachTemplate,
  renderOutreachPreview,
  createOutreachSequence,
} from "@/lib/api-client";
import { Business, OutreachRecord, OutreachTemplate } from "@/types";
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
  Copy,
  ExternalLink,
  Calendar,
  Layers,
  Sparkles,
  SlidersHorizontal,
  Trash2,
  ArrowRight,
  Eye,
} from "lucide-react";

export default function OutreachManagerPage() {
  const [activeTab, setActiveTab] = useState<"queue" | "templates" | "sequences">("queue");
  const [outreachRecords, setOutreachRecords] = useState<OutreachRecord[]>([]);
  const [templates, setTemplates] = useState<OutreachTemplate[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);

  // Queue state
  const [selectedBusinessId, setSelectedBusinessId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Template Studio state
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: "",
    channel: "email",
    stage_step: 1,
    delay_days: 0,
    subject_template: "",
    body_template: "",
  });
  const [templateSubmitting, setTemplateSubmitting] = useState(false);

  // Preview tester state
  const [previewBusinessId, setPreviewBusinessId] = useState("");
  const [previewTemplateId, setPreviewTemplateId] = useState("");
  const [renderedPreview, setRenderedPreview] = useState<{
    subject: string;
    body: string;
    recipient?: string;
    tokens_substituted: string[];
  } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Sequence state
  const [sequenceBusinessId, setSequenceBusinessId] = useState("");
  const [sequenceTemplateIds, setSequenceTemplateIds] = useState<string[]>([]);
  const [sequenceSubmitting, setSequenceSubmitting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [records, bizList, tpls] = await Promise.all([
        fetchOutreachRecords().catch(() => []),
        fetchBusinesses().catch(() => []),
        fetchOutreachTemplates().catch(() => []),
      ]);
      setOutreachRecords(records);
      setBusinesses(bizList);
      setTemplates(tpls);

      if (bizList.length > 0) {
        if (!selectedBusinessId) setSelectedBusinessId(bizList[0].id);
        if (!previewBusinessId) setPreviewBusinessId(bizList[0].id);
        if (!sequenceBusinessId) setSequenceBusinessId(bizList[0].id);
      }
      if (tpls.length > 0) {
        if (!selectedTemplateId) setSelectedTemplateId(tpls[0].id);
        if (!previewTemplateId) setPreviewTemplateId(tpls[0].id);
        if (sequenceTemplateIds.length === 0) {
          // Default to first 2 templates (Initial + Follow-up)
          setSequenceTemplateIds(tpls.slice(0, 2).map((t) => t.id));
        }
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
      const res = await generateOutreachPitch(selectedBusinessId, selectedTemplateId || undefined);
      setActionSuccess(`Generated customized proposal draft for ${res.recipient || "selected business"}!`);
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

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateForm.name.trim() || !templateForm.subject_template.trim() || !templateForm.body_template.trim()) {
      setActionError("Template name, subject, and body are required.");
      return;
    }

    setTemplateSubmitting(true);
    try {
      await createOutreachTemplate(templateForm);
      setIsTemplateModalOpen(false);
      setTemplateForm({
        name: "",
        channel: "email",
        stage_step: 1,
        delay_days: 0,
        subject_template: "",
        body_template: "",
      });
      setActionSuccess("New outreach template saved to Studio!");
      await loadData();
    } catch (err: any) {
      setActionError(err.message || "Failed to create template");
    } finally {
      setTemplateSubmitting(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      await deleteOutreachTemplate(id);
      setActionSuccess("Template removed.");
      await loadData();
    } catch (err: any) {
      setActionError(err.message || "Failed to delete template");
    }
  };

  const handleTestPreview = async () => {
    if (!previewBusinessId || !previewTemplateId) return;
    setPreviewLoading(true);
    try {
      const data = await renderOutreachPreview({
        business_id: previewBusinessId,
        template_id: previewTemplateId,
        freelancer_name: "Deepith",
        freelancer_portfolio: "https://portfolio.dev",
      });
      setRenderedPreview(data);
    } catch (err: any) {
      setActionError(err.message || "Failed to render preview");
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleLaunchSequence = async () => {
    if (!sequenceBusinessId || sequenceTemplateIds.length === 0) {
      setActionError("Please select a target lead and at least one template step.");
      return;
    }

    setSequenceSubmitting(true);
    setActionError(null);
    try {
      const created = await createOutreachSequence({
        business_id: sequenceBusinessId,
        template_ids: sequenceTemplateIds,
        freelancer_name: "Deepith",
        freelancer_portfolio: "https://portfolio.dev",
      });
      setActionSuccess(`Launched ${created.length}-step outreach sequence with automated calendar reminders!`);
      setActiveTab("queue");
      await loadData();
    } catch (err: any) {
      setActionError(err.message || "Failed to create sequence");
    } finally {
      setSequenceSubmitting(false);
    }
  };

  const insertToken = (token: string, targetField: "subject_template" | "body_template") => {
    setTemplateForm((prev) => ({
      ...prev,
      [targetField]: prev[targetField] + ` {{${token}}}`,
    }));
  };

  return (
    <>
      <Header />

      <main className="p-8 space-y-8 flex-1">
        {/* Header Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-lg">
                <Send className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Outreach Studio</h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Phase 8: Multi-touch cadence tracking, rich template variable studio, and manual dispatch guardrails.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={() => setActiveTab("queue")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "queue"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Approval Queue ({outreachRecords.length})
            </button>
            <button
              onClick={() => setActiveTab("templates")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "templates"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Template Studio ({templates.length})
            </button>
            <button
              onClick={() => setActiveTab("sequences")}
              className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === "sequences"
                  ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              Multi-Touch Sequences
            </button>
          </div>
        </div>

        {/* Action Notifications */}
        {actionSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs rounded-lg flex items-center justify-between animate-in fade-in">
            <span>{actionSuccess}</span>
            <button onClick={() => setActionSuccess(null)} className="text-emerald-700 dark:text-emerald-400 hover:text-emerald-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        {actionError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-300 text-xs rounded-lg flex items-center justify-between animate-in fade-in">
            <span>{actionError}</span>
            <button onClick={() => setActionError(null)} className="text-rose-700 dark:text-rose-400 hover:text-rose-900">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* TAB 1: DISPATCH QUEUE */}
        {activeTab === "queue" && (
          <div className="space-y-6">
            {/* Generate Pitch Card */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span>Generate Single Proposal Draft</span>
                </h2>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Manual Approval Required Before Sending</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-6 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Target Qualified Lead</label>
                  <select
                    value={selectedBusinessId}
                    onChange={(e) => setSelectedBusinessId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id} disabled={b.is_suppressed}>
                        {b.name} ({b.city}) {b.is_suppressed ? "- [SUPPRESSED]" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-4 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Select Template Strategy</label>
                  <select
                    value={selectedTemplateId}
                    onChange={(e) => setSelectedTemplateId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Step {t.stage_step} · {t.channel})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 flex items-end">
                  <button
                    onClick={handleGeneratePitch}
                    disabled={generating || !selectedBusinessId}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {generating ? <span>Drafting...</span> : <span>Draft Pitch</span>}
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Queue List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Outreach Approval Queue ({outreachRecords.length})
                </h3>
              </div>

              {outreachRecords.length === 0 ? (
                <div className="p-12 text-center text-slate-400 dark:text-slate-500 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                  No outreach records drafted yet. Select a qualified lead above to generate a proposal.
                </div>
              ) : (
                <div className="space-y-4">
                  {outreachRecords.map((rec) => {
                    const isSent = rec.status === "sent";
                    const isApproved = rec.status === "approved" || rec.manual_approval_granted;
                    const mailtoUrl = rec.recipient
                        ? `mailto:${rec.recipient}?subject=${encodeURIComponent(
                          rec.subject || "Website Development Proposal"
                        )}&body=${encodeURIComponent(rec.generated_pitch)}`
                      : "";

                    return (
                      <div
                        key={rec.id}
                        className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
                      >
                        {/* Header Details */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-sm">
                                {rec.subject || "Proposal Draft"}
                              </span>
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                Touch {rec.stage_step || 1}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                  isSent
                                    ? "bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/60"
                                    : isApproved
                                    ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/60"
                                    : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800/60"
                                }`}
                              >
                                {rec.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                              <span className="flex items-center gap-1 font-mono text-[11px]">
                                <Mail className="h-3 w-3 text-slate-400" />
                                {rec.recipient || "No recipient email (manual pitch)"}
                              </span>
                              <span>•</span>
                              <span className="capitalize">{rec.channel}</span>
                              <span>•</span>
                              <span>Created {new Date(rec.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>

                          {/* Quick Actions */}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => copyToClipboard(rec.generated_pitch, rec.id)}
                              className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                              title="Copy pitch to clipboard"
                            >
                              {copiedId === rec.id ? (
                                <>
                                  <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                  <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>

                            {mailtoUrl && (
                              <a
                                href={mailtoUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-1.5 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                              >
                                <ExternalLink className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                                <span>Open Client</span>
                              </a>
                            )}
                          </div>
                        </div>

                        {/* Proposal Text Content */}
                        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                          {rec.generated_pitch}
                        </div>

                        {/* Workflow Buttons */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            {isApproved ? (
                              <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                <CheckCircle2 className="h-4 w-4" />
                                Approved for manual transmission
                              </span>
                            ) : (
                              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium">
                                <Clock className="h-4 w-4" />
                                Requires developer review and approval
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {!isApproved && !isSent && (
                              <button
                                onClick={() => handleApprove(rec.id)}
                                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>Approve Pitch</span>
                              </button>
                            )}

                            {isApproved && !isSent && (
                              <button
                                onClick={() => handleMarkSent(rec.id)}
                                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                              >
                                <Send className="h-3.5 w-3.5" />
                                <span>Mark as Sent</span>
                              </button>
                            )}

                            {isSent && (
                              <span className="text-xs text-slate-500 dark:text-slate-400 italic">
                                Sent on {new Date(rec.sent_at || rec.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: TEMPLATE STUDIO */}
        {activeTab === "templates" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Outreach Template Studio</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Craft reusable, evidence-backed pitch templates with smart dynamic replacement tags.
                </p>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="h-4 w-4" />
                <span>Create Template</span>
              </button>
            </div>

            {/* Live Interactive Preview Tester */}
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>Dynamic Variable Live Preview Tester</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select any business in your pipeline to test how smart tokens dynamically render technical findings.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-5 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Test Prospect</label>
                  <select
                    value={previewBusinessId}
                    onChange={(e) => setPreviewBusinessId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium"
                  >
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city} · {b.official_website ? "Has Website" : "No Website"})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-5 space-y-1">
                  <label className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">Template to Test</label>
                  <select
                    value={previewTemplateId}
                    onChange={(e) => setPreviewTemplateId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 font-medium"
                  >
                    {templates.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} (Step {t.stage_step})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 flex items-end">
                  <button
                    onClick={handleTestPreview}
                    disabled={previewLoading || !previewBusinessId || !previewTemplateId}
                    className="w-full py-2 bg-slate-900 dark:bg-slate-800 hover:bg-black dark:hover:bg-slate-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    {previewLoading ? <span>Rendering...</span> : <span>Render Preview</span>}
                  </button>
                </div>
              </div>

              {renderedPreview && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                    <div className="text-xs">
                      <span className="font-semibold text-slate-500 dark:text-slate-400">Subject: </span>
                      <span className="font-bold text-slate-900 dark:text-white">{renderedPreview.subject}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500">Tokens substituted:</span>
                      {renderedPreview.tokens_substituted.map((token) => (
                        <span
                          key={token}
                          className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 rounded text-[10px] font-mono font-semibold"
                        >
                          {token}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="font-mono text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                    {renderedPreview.body}
                  </div>
                </div>
              )}
            </div>

            {/* Template Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map((tpl) => (
                <div
                  key={tpl.id}
                  className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm">{tpl.name}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            Touch {tpl.stage_step}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/60">
                            {tpl.channel}
                          </span>
                          {tpl.delay_days > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Day +{tpl.delay_days}
                            </span>
                          )}
                          {tpl.is_default && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60">
                              System Preset
                            </span>
                          )}
                        </div>
                      </div>

                      {!tpl.is_default && (
                        <button
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors"
                          title="Delete template"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="text-xs">
                      <span className="text-slate-400">Subject: </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono text-[11px]">
                        {tpl.subject_template}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-800 font-mono text-[11px] text-slate-600 dark:text-slate-300 line-clamp-4 whitespace-pre-wrap">
                      {tpl.body_template}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400">
                    <span>Last updated {new Date(tpl.updated_at).toLocaleDateString()}</span>
                    <button
                      onClick={() => {
                        setPreviewTemplateId(tpl.id);
                        handleTestPreview();
                      }}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-semibold inline-flex items-center gap-1"
                    >
                      <span>Test Render</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: MULTI-TOUCH SEQUENCES */}
        {activeTab === "sequences" && (
          <div className="space-y-6">
            <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                  Launch Multi-Touch Outreach Sequence
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Enrolls a business into an automated sequence (e.g. Initial pitch, Day 4 evidence follow-up, Day 8 check-in)
                  with calendar reminders. Every outreach dispatch still requires manual approval.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Target Lead</label>
                  <select
                    value={sequenceBusinessId}
                    onChange={(e) => setSequenceBusinessId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id} disabled={b.is_suppressed}>
                        {b.name} ({b.city}) {b.is_suppressed ? "- [SUPPRESSED]" : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sequence Templates to Include</label>
                  <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 max-h-48 overflow-y-auto">
                    {templates.map((tpl) => {
                      const isChecked = sequenceTemplateIds.includes(tpl.id);
                      return (
                        <label
                          key={tpl.id}
                          className="flex items-center gap-2.5 text-xs text-slate-800 dark:text-slate-200 cursor-pointer hover:text-slate-900 dark:hover:text-white"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSequenceTemplateIds([...sequenceTemplateIds, tpl.id]);
                              } else {
                                setSequenceTemplateIds(sequenceTemplateIds.filter((id) => id !== tpl.id));
                              }
                            }}
                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-semibold">{tpl.name}</span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            (Step {tpl.stage_step} · Day +{tpl.delay_days})
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end">
                <button
                  onClick={handleLaunchSequence}
                  disabled={sequenceSubmitting || !sequenceBusinessId || sequenceTemplateIds.length === 0}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>
                    {sequenceSubmitting ? "Generating Sequence..." : `Launch Sequence (${sequenceTemplateIds.length} Steps)`}
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* CREATE TEMPLATE MODAL */}
      {isTemplateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">Create Outreach Template</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">Define dynamic B2B email or messaging templates.</p>
              </div>
              <button
                onClick={() => setIsTemplateModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Template Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Turnkey Web Solution - First Touch"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Channel</label>
                  <select
                    value={templateForm.channel}
                    onChange={(e) => setTemplateForm({ ...templateForm, channel: e.target.value })}
                    className="w-full text-xs px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="email">Email</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="phone">Phone / Manual</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sequence Stage Step</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={templateForm.stage_step}
                    onChange={(e) => setTemplateForm({ ...templateForm, stage_step: parseInt(e.target.value) || 1 })}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Delay Days After Previous Step</label>
                  <input
                    type="number"
                    min="0"
                    max="60"
                    value={templateForm.delay_days}
                    onChange={(e) => setTemplateForm({ ...templateForm, delay_days: parseInt(e.target.value) || 0 })}
                    className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Dynamic Tag Inserters */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Click to Insert Dynamic Tokens:
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "business_name",
                    "city",
                    "category",
                    "official_website",
                    "deficiencies_list",
                    "deficiencies_list_short",
                    "pitch_angle",
                    "freelancer_name",
                    "freelancer_portfolio",
                  ].map((token) => (
                    <button
                      key={token}
                      type="button"
                      onClick={() => insertToken(token, "body_template")}
                      className="px-2 py-1 bg-white dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-700 dark:hover:text-blue-400 hover:border-blue-300 border border-slate-200 dark:border-slate-700 rounded text-[10px] font-mono font-semibold text-slate-600 dark:text-slate-300 transition-colors shadow-2xs"
                    >
                      +{token}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Subject Line Template <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Website development proposal for {{business_name}} in {{city}}"
                  value={templateForm.subject_template}
                  onChange={(e) => setTemplateForm({ ...templateForm, subject_template: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Proposal Body Template <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={8}
                  required
                  placeholder="Dear {{business_name}} Team,&#10;&#10;I noticed..."
                  value={templateForm.body_template}
                  onChange={(e) => setTemplateForm({ ...templateForm, body_template: e.target.value })}
                  className="w-full text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-[11px] resize-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={templateSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                >
                  {templateSubmitting ? "Saving..." : "Save Template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
