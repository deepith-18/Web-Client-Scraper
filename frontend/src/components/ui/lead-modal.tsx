"use client";

import { useState } from "react";
import { Business } from "@/types";
import { formatScoreTier } from "@/lib/utils";
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
} from "lucide-react";

interface LeadModalProps {
  business: Business | null;
  onClose: () => void;
  onStatusUpdate: (businessId: string, newStatus: string) => Promise<void>;
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

export function LeadModal({ business, onClose, onStatusUpdate }: LeadModalProps) {
  const [updating, setUpdating] = useState(false);

  if (!business) return null;

  const scoreObj = business.lead_scores?.[0];
  const totalScore = scoreObj?.total_opportunity_score ?? 0;
  const scoreBadge = formatScoreTier(totalScore);
  const audit = business.website_audits?.[0];

  const handleStatusChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    setUpdating(true);
    try {
      await onStatusUpdate(business.id, e.target.value);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-slate-50/50">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                {business.category}
              </span>
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${scoreBadge.badgeClass}`}
              >
                {totalScore} / 100 Opportunity ({scoreBadge.label})
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">{business.name}</h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span>
                {business.address_line1 ? `${business.address_line1}, ` : ""}
                {business.city}, {business.state_province ? `${business.state_province}, ` : ""}
                {business.country}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* CRM Status & Pipeline Bar */}
          <div className="flex items-center justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
            <div>
              <p className="text-xs font-semibold text-blue-900">CRM Pipeline Stage</p>
              <p className="text-xs text-blue-700">Update current outreach state</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={business.crm_status}
                disabled={updating}
                onChange={handleStatusChange}
                className="bg-white border border-blue-200 text-slate-800 text-xs font-medium rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {crmStatuses.map((st) => (
                  <option key={st.value} value={st.value}>
                    {st.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Public Business Contacts & Provenance
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Official Website */}
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-md bg-white border border-slate-200 text-slate-600">
                    <Globe className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400">Official Website</p>
                    <p className="text-xs font-semibold text-slate-800">
                      {business.official_website ? (
                        <a
                          href={business.official_website}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {business.official_website}
                        </a>
                      ) : (
                        <span className="text-rose-600">No Website Detected (+30 pts)</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contacts list */}
              {business.contacts && business.contacts.length > 0 ? (
                business.contacts.map((contact) => (
                  <div
                    key={contact.id}
                    className="p-3 bg-slate-50 rounded-lg border border-slate-200/80 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-md bg-white border border-slate-200 text-slate-600">
                        {contact.contact_type === "email" ? (
                          <Mail className="h-4 w-4" />
                        ) : (
                          <Phone className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] font-medium text-slate-400 capitalize">
                          {contact.contact_type} ({contact.verification_status})
                        </p>
                        <p className="text-xs font-semibold text-slate-800">
                          {contact.raw_value}
                        </p>
                      </div>
                    </div>
                    {contact.verification_status === "mx_confirmed" && (
                      <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <Check className="h-3 w-3" /> MX Valid
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-500 italic">
                  No public direct contact detected yet.
                </div>
              )}
            </div>
          </div>

          {/* Website Audit Breakdown */}
          <div>
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Website Opportunity Diagnostics
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] text-slate-400 font-medium">SSL Security</span>
                <p className="text-xs font-semibold mt-1 flex items-center gap-1">
                  {audit?.has_ssl ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Active HTTPS
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Missing SSL (+15 pts)
                    </span>
                  )}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] text-slate-400 font-medium">Mobile Experience</span>
                <p className="text-xs font-semibold mt-1 flex items-center gap-1">
                  {audit?.is_mobile_friendly ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Responsive
                    </span>
                  ) : (
                    <span className="text-rose-600 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Unresponsive (+15 pts)
                    </span>
                  )}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] text-slate-400 font-medium">Inquiry Form</span>
                <p className="text-xs font-semibold mt-1 flex items-center gap-1">
                  {audit?.has_contact_form ? (
                    <span className="text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Detected
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5" /> Missing Form (+10 pts)
                    </span>
                  )}
                </p>
              </div>

              <div className="p-3 rounded-lg border border-slate-200 bg-white">
                <span className="text-[11px] text-slate-400 font-medium">Load Time</span>
                <p className="text-xs font-semibold mt-1">
                  {audit?.load_time_ms ? `${audit.load_time_ms} ms` : "N/A (No site)"}
                </p>
              </div>
            </div>

            {/* Opportunities List */}
            {audit?.opportunities_identified && audit.opportunities_identified.length > 0 && (
              <div className="mt-3 p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-900 mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                  Identified Freelance Pitch Angles:
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {audit.opportunities_identified.map((opp) => (
                    <span
                      key={opp}
                      className="text-[11px] font-medium bg-amber-100/80 text-amber-800 px-2 py-0.5 rounded border border-amber-300/60"
                    >
                      • {opp.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

