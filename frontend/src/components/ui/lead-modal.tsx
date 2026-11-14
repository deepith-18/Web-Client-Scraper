"use client";

import { useState, useEffect } from "react";
import { Business, OutreachTemplate } from "@/types";
import { formatScoreTier } from "@/lib/utils";
import {
  verifyBusiness,
  extractWebsiteContacts,
  runWebsiteAudit,
  calculateBusinessScore,
  generateOutreachPitch,
  fetchBusinessNotes,
  addBusinessNote,
  createBusinessTask,
  fetchOutreachTemplates,
} from "@/lib/api-client";
import {
  X,
  Globe,
  Mail,
  Phone,
  MapPin,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Send,
  Building,
  Check,
  Search,
  RotateCw,
  ExternalLink,
  Share2,
  Activity,
  Layers,
  Code2,
  FileText,
} from "lucide-react";

interface LeadModalProps {
  business: Business | null;
  onClose: () => void;
  onStatusUpdate: (businessId: string, newStatus: string) => Promise<void>;
  onRefresh?: () => void;
}

const crmStatuses = [
  { value: "new", label: "New" },
  { value: "researching", label: "Researching" },
  { value: "qualified", label: "Qualified" },
  { value: "contact_permitted", label: "Contact Permitted" },
  { value: "contacted", label: "Contacted" },
  { value: "interested", label: "Interested" },
  { value: "meeting_scheduled", label: "Meeting Scheduled" },
  { value: "proposal_sent", label: "Proposal Sent" },
  { value: "negotiation", label: "Negotiation" },
  { value: "converted", label: "Converted" },
  { value: "not_interested", label: "Not Interested" },
  { value: "do_not_contact", label: "Do Not Contact" },
];

export function LeadModal({ business, onClose, onStatusUpdate, onRefresh }: LeadModalProps) {
  const [updating, setUpdating] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [auditing, setAuditing] = useState(false);
  const [scoring, setScoring] = useState(false);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // CRM Notes & Tasks
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [savingTask, setSavingTask] = useState(false);
  const [availableTemplates, setAvailableTemplates] = useState<OutreachTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");

  useEffect(() => {
    if (business?.id) {
      fetchBusinessNotes(business.id).then(setNotes).catch(() => {});
      fetchOutreachTemplates()
        .then((tpls) => {
          setAvailableTemplates(tpls);
          if (tpls.length > 0) setSelectedTemplateId(tpls[0].id);
        })
        .catch(() => {});
    }
  }, [business?.id]);

  if (!business) return null;

  const scoreObj = business.lead_scores?.[0];
  const totalScore = scoreObj?.total_opportunity_score ?? 0;
  const scoreBadge = formatScoreTier(totalScore);
  const audit = business.website_audits?.[0];
  const auditEvidence = (scoreObj?.score_breakdown as any)?.evidence || (audit?.raw_audit_report as any)?.evidence || {};

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUpdating(true);
    try {
      await onStatusUpdate(business.id, e.target.value);
    } finally {
      setUpdating(false);
    }
  };

  const handleRunVerification = async () => {
    setVerifying(true);
    setActionMessage(null);
    try {
      await verifyBusiness(business.id);
      setActionMessage("Verification complete! DNS/MX, E.164 phone formats, and SSL validated.");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setActionMessage(`Verification error: ${err.message}`);
    } finally {
      setVerifying(false);
    }
  };

  const handleExtractContacts = async () => {
    setExtracting(true);
    setActionMessage(null);
    try {
      const res = await extractWebsiteContacts(business.id);
      setActionMessage(`Scanned website pages. Discovered ${res.new_contacts_added} new contact points!`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setActionMessage(`Extraction error: ${err.message}`);
    } finally {
      setExtracting(false);
    }
  };

  const handleRunAudit = async () => {
    setAuditing(true);
    setActionMessage(null);
    try {
      const res = await runWebsiteAudit(business.id);
      setActionMessage(`Audit complete! Identified ${res.audit.opportunities_identified.length} technical opportunities. Lead Score: ${res.opportunity_score} pts.`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setActionMessage(`Audit error: ${err.message}`);
    } finally {
      setAuditing(false);
    }
  };

  const handleRunScoring = async () => {
    setScoring(true);
    setActionMessage(null);
    try {
      const res = await calculateBusinessScore(business.id);
      setActionMessage(`Lead opportunity score recalculated: ${res.total_opportunity_score} / 100 (${res.priority_tier.toUpperCase()})`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setActionMessage(`Scoring error: ${err.message}`);
    } finally {
      setScoring(false);
    }
  };

  const handleGeneratePitch = async () => {
    setGeneratingPitch(true);
    setActionMessage(null);
    try {
      await generateOutreachPitch(business.id, selectedTemplateId || undefined);
      setActionMessage("Evidence-backed proposal draft created! View and manage under Outreach Studio.");
    } catch (err: any) {
      setActionMessage(`Pitch error: ${err.message}`);
    } finally {
      setGeneratingPitch(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await addBusinessNote(business.id, newNote.trim());
      setNotes((prev) => [res, ...prev]);
      setNewNote("");
      setActionMessage("CRM Note saved.");
    } catch (err: any) {
      setActionMessage(`Failed to add note: ${err.message}`);
    } finally {
      setSavingNote(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskDue) return;
    setSavingTask(true);
    try {
      await createBusinessTask(business.id, taskTitle.trim(), new Date(taskDue).toISOString());
      setActionMessage(`Follow-up scheduled for ${taskDue}.`);
      setTaskTitle("");
      setTaskDue("");
    } catch (err: any) {
      setActionMessage(`Failed to schedule: ${err.message}`);
    } finally {
      setSavingTask(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between bg-white dark:bg-slate-900">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-md border border-blue-200 dark:border-blue-800/60">
                {business.category}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${scoreBadge.badgeClass}`}
              >
                {totalScore} / 100 Opportunity ({scoreBadge.label})
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{business.name}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
              <span>
                {business.address_line1 ? `${business.address_line1}, ` : ""}
                {business.city}, {business.state_province ? `${business.state_province}, ` : ""}
                {business.country}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Action Notification Banner */}
          {actionMessage && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-800 dark:text-blue-300 text-xs rounded-lg flex items-center justify-between">
              <span>{actionMessage}</span>
              <button onClick={() => setActionMessage(null)} className="text-blue-500 hover:text-blue-700 dark:hover:text-blue-300">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* CRM Status & Action Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-blue-50/50 dark:bg-blue-950/30 rounded-xl border border-blue-100 dark:border-blue-900/40 gap-3">
            <div>
              <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">CRM Pipeline Stage</p>
              <p className="text-xs text-blue-700 dark:text-blue-400">Update current outreach state</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={business.crm_status}
                disabled={updating}
                onChange={handleStatusChange}
                className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-xs font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {crmStatuses.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>

              <button
                onClick={handleRunVerification}
                disabled={verifying}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
                title="Verify DNS/MX records and E.164 phone formats"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>{verifying ? "Verifying..." : "Verify Lead"}</span>
              </button>

              {business.official_website && (
                <>
                  <button
                    onClick={handleExtractContacts}
                    disabled={extracting}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
                    title="Crawl official website for emails, phones, and contact page"
                  >
                    <Search className="h-3.5 w-3.5" />
                    <span>{extracting ? "Scanning..." : "Scan Contacts"}</span>
                  </button>

                  <button
                    onClick={handleRunAudit}
                    disabled={auditing}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
                    title="Run deep technical website opportunity audit"
                  >
                    <Activity className="h-3.5 w-3.5" />
                    <span>{auditing ? "Auditing..." : "Audit Website"}</span>
                  </button>
                </>
              )}

              <button
                onClick={handleRunScoring}
                disabled={scoring}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
                title="Evaluate lead opportunity score using multi-factor engine"
              >
                <Layers className="h-3.5 w-3.5" />
                <span>{scoring ? "Scoring..." : "Score Lead"}</span>
              </button>

              {availableTemplates.length > 0 && (
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="bg-white dark:bg-slate-800 border border-blue-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-medium rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[140px] truncate"
                  title="Choose outreach template strategy"
                >
                  {availableTemplates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} (Step {t.stage_step})
                    </option>
                  ))}
                </select>
              )}

              <button
                onClick={handleGeneratePitch}
                disabled={generatingPitch || business.is_suppressed}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium transition-colors shadow-xs disabled:opacity-50"
                title="Generate tailored proposal draft based on audit findings"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{generatingPitch ? "Drafting..." : "Draft Pitch"}</span>
              </button>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Public Business Contacts & Provenance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Official Website */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Official Website</p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {business.official_website ? (
                        <a
                          href={business.official_website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                        >
                          <span>{business.official_website}</span>
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-rose-600 dark:text-rose-400">No Website Detected (+30 pts)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contact Page URL if found */}
              {business.contact_page_url && (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                      <ExternalLink className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500">Contact / About Page</p>
                      <a
                        href={business.contact_page_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[200px] block"
                      >
                        {business.contact_page_url}
                      </a>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/60">
                    Discovered
                  </span>
                </div>
              )}

              {/* Contacts list */}
              {business.contacts && business.contacts.length > 0 ? (
                business.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/80 dark:border-slate-700 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300">
                        {contact.contact_type === "email" ? (
                          <Mail className="h-4 w-4" />
                        ) : (
                          <Phone className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 capitalize">
                          {contact.contact_type} ({contact.verification_status.replace(/_/g, " ")})
                        </p>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                          {contact.normalized_value || contact.raw_value}
                        </p>
                      </div>
                    </div>
                    {contact.verification_status === "mx_confirmed" && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/60">
                        <Check className="h-3 w-3" /> MX Confirmed
                      </span>
                    )}
                    {contact.verification_status === "valid_syntax" && (
                      <span className="text-[10px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800/60">
                        Valid Syntax
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 italic">
                  No public direct contact detected yet.
                </div>
              )}
            </div>
          </div>

          {/* Social Profiles */}
          {business.social_links && Object.keys(business.social_links).length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5 text-slate-400" />
                <span>Verified Social Footprints</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {Object.entries(business.social_links).map(([net, link]) => (
                  <a
                    key={net}
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/50 hover:text-blue-700 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 transition-colors capitalize flex items-center gap-1"
                  >
                    <span>{net}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Website Audit Breakdown */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
              Website Opportunity Diagnostics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">SSL Security</span>
                <p className="text-xs font-semibold mt-1 flex items-center gap-1">
                  {audit?.has_ssl ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active HTTPS
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Missing SSL (+15 pts)
                    </span>
                  )}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Mobile Experience</span>
                <p className="text-xs font-semibold mt-1 flex items-center gap-1">
                  {audit?.is_mobile_friendly ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Responsive
                    </span>
                  ) : (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Unresponsive (+15 pts)
                    </span>
                  )}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Inquiry Form</span>
                <p className="text-xs font-semibold mt-1 flex items-center gap-1">
                  {audit?.has_contact_form ? (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Detected
                    </span>
                  ) : (
                    <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Missing Form (+10 pts)
                    </span>
                  )}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Load Time</span>
                <p className="text-xs font-semibold mt-1 text-slate-900 dark:text-white">
                  {audit?.load_time_ms ? `${audit.load_time_ms} ms` : "N/A (No site)"}
                </p>
              </div>
            </div>

            {/* Detected Technology Stack */}
            {audit?.technologies_detected && audit.technologies_detected.length > 0 && (
              <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg">
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                  <Code2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Detected Technology Stack:</span>
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {audit.technologies_detected.map((tech) => (
                    <span
                      key={tech}
                      className="text-[11px] font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Opportunities List with Concrete Evidence */}
            {audit?.opportunities_identified && audit.opportunities_identified.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg">
                <p className="text-xs font-semibold text-amber-900 dark:text-amber-300 mb-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Evidence-Backed Freelance Pitch Angles:</span>
                </p>
                <div className="space-y-1.5">
                  {audit.opportunities_identified.map((opp) => {
                    const evidenceText = auditEvidence[opp] || `Identified deficiency: ${opp.replace(/_/g, " ")}`;
                    return (
                      <div
                        key={opp}
                        className="text-xs font-medium bg-amber-100/70 dark:bg-amber-900/40 text-amber-900 dark:text-amber-200 p-2 rounded-md border border-amber-200/80 dark:border-amber-800/50 flex items-start gap-2"
                      >
                        <span className="font-bold shrink-0 text-amber-800 dark:text-amber-300">
                          • {opp.replace(/_/g, " ").toUpperCase()}:
                        </span>
                        <span className="text-amber-950 dark:text-amber-100 font-normal">{evidenceText}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Lead Scoring Intelligence Breakdown */}
          <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Layers className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <span>Opportunity Scoring Intelligence</span>
              </h3>
              <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${scoreBadge.badgeClass}`}>
                {totalScore} / 100 PTS • {scoreBadge.label}
              </span>
            </div>

            {/* Recommended Pitch Recommendation */}
            {(scoreObj?.score_breakdown as any)?.recommended_pitch && (
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/50 rounded-lg">
                <p className="text-[11px] font-bold text-blue-900 dark:text-blue-300 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <span>Strategic Freelance Pitch Angle:</span>
                </p>
                <p className="text-xs text-blue-950 dark:text-blue-200 font-medium">
                  {(scoreObj?.score_breakdown as any)?.recommended_pitch}
                </p>
              </div>
            )}

            {/* Factor Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">No Website</span>
                <span className="font-bold text-slate-800 dark:text-white">+{scoreObj?.no_website_score || 0} pts</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Site Offline/Error</span>
                <span className="font-bold text-slate-800 dark:text-white">+{scoreObj?.website_unavailable_score || 0} pts</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Mobile Deficiencies</span>
                <span className="font-bold text-slate-800 dark:text-white">+{scoreObj?.mobile_score || 0} pts</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Missing Form/CTA</span>
                <span className="font-bold text-slate-800 dark:text-white">+{scoreObj?.missing_contact_score || 0} pts</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Performance/Speed</span>
                <span className="font-bold text-slate-800 dark:text-white">+{scoreObj?.performance_score || 0} pts</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Missing Info</span>
                <span className="font-bold text-slate-800 dark:text-white">+{scoreObj?.missing_info_score || 0} pts</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Identity Corroborated</span>
                <span className="font-bold text-slate-800 dark:text-white">+{scoreObj?.authenticity_score || 0} pts</span>
              </div>
              <div className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium block">Public Email Found</span>
                <span className="font-bold text-slate-800 dark:text-white">+{scoreObj?.email_available_score || 0} pts</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
              Notice: Opportunity scores measure empirical technical need for freelance web services, completely distinct from data verification. They do not constitute guaranteed purchasing intent.
            </p>
          </div>

          {/* CRM Notes & Task Reminders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Notes Section */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                <span>CRM Communication Notes</span>
              </h3>

              <form onSubmit={handleAddNote} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a call outcome or discovery note..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={savingNote || !newNote.trim()}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {savingNote ? "Saving..." : "Save"}
                </button>
              </form>

              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {notes.length === 0 ? (
                  <p className="text-slate-400 dark:text-slate-500 text-[11px] italic">No notes logged yet.</p>
                ) : (
                  notes.map((n) => (
                    <div key={n.id} className="p-2 bg-white dark:bg-slate-800 rounded border border-slate-200/80 dark:border-slate-700 text-[11px]">
                      <p className="text-slate-800 dark:text-slate-200">{n.content}</p>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 block">
                        {n.created_at ? new Date(n.created_at).toLocaleDateString() : ""}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Follow-Up Task Section */}
            <div className="p-4 bg-slate-50/80 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
              <h3 className="text-xs font-semibold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                <span>Schedule Follow-Up Task</span>
              </h3>

              <form onSubmit={handleCreateTask} className="space-y-2">
                <input
                  type="text"
                  placeholder="Task title (e.g. Call founder for feedback)"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={taskDue}
                    onChange={(e) => setTaskDue(e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={savingTask || !taskTitle.trim() || !taskDue}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                  >
                    {savingTask ? "Saving..." : "Schedule"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
