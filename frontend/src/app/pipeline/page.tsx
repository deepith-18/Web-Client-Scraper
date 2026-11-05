"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { LeadModal } from "@/components/ui/lead-modal";
import { formatScoreTier } from "@/lib/utils";
import {
  fetchCrmPipeline,
  updateBusinessStatus,
  fetchBusiness,
} from "@/lib/api-client";
import { Business } from "@/types";
import {
  FileCheck2,
  Filter,
  ChevronRight,
  MapPin,
  Clock,
  Layers,
  ArrowRight,
} from "lucide-react";

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  researching: "Researching",
  qualified: "Qualified",
  contact_permitted: "Contact Permitted",
  contacted: "Contacted",
  interested: "Interested",
  meeting_scheduled: "Meeting Scheduled",
  proposal_sent: "Proposal Sent",
  negotiation: "Negotiation",
  converted: "Converted",
  not_interested: "Not Interested",
  do_not_contact: "Do Not Contact",
};

export default function CrmPipelinePage() {
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Business | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadPipeline = async () => {
    setLoading(true);
    try {
      const data = await fetchCrmPipeline();
      setPipelineData(data);
    } catch (err) {
      console.error("Failed to load pipeline", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  const handleStageChange = async (bizId: string, newStage: string) => {
    setUpdatingId(bizId);
    try {
      await updateBusinessStatus(bizId, newStage);
      await loadPipeline();
      if (selectedLead?.id === bizId) {
        const refreshed = await fetchBusiness(bizId);
        setSelectedLead(refreshed);
      }
    } catch (err) {
      console.error("Failed to move stage", err);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCardClick = async (bizId: string) => {
    try {
      const fullBiz = await fetchBusiness(bizId);
      setSelectedLead(fullBiz);
    } catch (err) {
      console.error("Failed to load business details", err);
    }
  };

  const stages = pipelineData?.stages || Object.keys(STAGE_LABELS);
  const pipeline = pipelineData?.pipeline || {};
  const counts = pipelineData?.counts || {};

  return (
    <>
      <Header />

      <main className="p-8 space-y-6 flex-1 flex flex-col h-[calc(100vh-65px)]">
        {/* Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">CRM Pipeline</h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Module F: Complete freelance sales pipeline tracking across all 12 qualification and outreach stages.
            </p>
          </div>
        </div>

        {/* Pipeline Kanban Board */}
        <div className="flex-1 overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[1900px] h-full">
            {stages.map((stage: string) => {
              const leads = pipeline[stage] || [];
              const count = counts[stage] || 0;
              const isExcludedStage = stage === "do_not_contact" || stage === "not_interested";

              return (
                <div
                  key={stage}
                  className={`w-72 flex-shrink-0 flex flex-col rounded-xl border ${
                    isExcludedStage
                      ? "bg-slate-100/60 border-slate-200"
                      : "bg-slate-50/70 border-slate-200"
                  } p-3 max-h-[78vh]`}
                >
                  {/* Column Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 mb-3">
                    <span className="text-xs font-bold text-slate-800">
                      {STAGE_LABELS[stage] || stage}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white text-slate-700 border border-slate-200 shadow-2xs">
                      {count}
                    </span>
                  </div>

                  {/* Cards List */}
                  <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
                    {leads.length === 0 ? (
                      <div className="p-4 text-center text-slate-400 text-xs italic">
                        No leads
                      </div>
                    ) : (
                      leads.map((lead: any) => {
                        const badge = formatScoreTier(lead.total_opportunity_score);
                        return (
                          <div
                            key={lead.id}
                            className="p-3 bg-white rounded-lg border border-slate-200/90 shadow-2xs hover:shadow-sm hover:border-slate-300 transition-all cursor-pointer space-y-2 group"
                            onClick={() => handleCardClick(lead.id)}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                                {lead.name}
                              </span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${badge.badgeClass}`}>
                                {lead.total_opportunity_score} pts
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-500">
                              <span className="truncate max-w-[130px]">{lead.category}</span>
                              <span className="text-slate-400 font-mono text-[10px]">
                                {lead.city}
                              </span>
                            </div>

                            {/* Stage Switcher */}
                            <div
                              className="pt-2 border-t border-slate-100 flex items-center justify-between"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <span className="text-[10px] text-slate-400 font-medium">Move to:</span>
                              <select
                                value={lead.crm_status}
                                disabled={updatingId === lead.id}
                                onChange={(e) => handleStageChange(lead.id, e.target.value)}
                                className="text-[10px] font-medium bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-slate-700 focus:outline-none"
                              >
                                {stages.map((st: string) => (
                                  <option key={st} value={st}>
                                    {STAGE_LABELS[st] || st}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* Lead Modal */}
      {selectedLead && (
        <LeadModal
          business={selectedLead}
          onClose={() => setSelectedLead(null)}
          onStatusUpdate={async (bizId, newStatus) => {
            await handleStageChange(bizId, newStatus);
          }}
          onRefresh={loadPipeline}
        />
      )}
    </>
  );
}

