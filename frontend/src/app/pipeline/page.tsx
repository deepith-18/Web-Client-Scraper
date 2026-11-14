"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/header";
import { LeadModal } from "@/components/ui/lead-modal";
import { formatScoreTier } from "@/lib/utils";
import {
  fetchCrmPipeline,
  updateBusinessStatus,
  fetchBusiness,
  fetchBusinesses
} from "@/lib/api-client";
import { Business } from "@/types";
import {
  FileCheck2,
  Filter,
  Kanban,
  List as ListIcon,
  ChevronRight,
  MapPin,
  Clock,
  Layers,
  Search,
  Sparkles,
  Phone,
  Globe,
  GripVertical,
  CheckCircle2,
  TrendingUp,
  SlidersHorizontal,
  XCircle,
  FolderOpen
} from "lucide-react";

const STAGE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "New Prospects", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/40" },
  researching: { label: "Researching", color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50 dark:bg-indigo-950/40" },
  qualified: { label: "Qualified", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/40" },
  contact_permitted: { label: "Contact Permitted", color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50 dark:bg-teal-950/40" },
  contacted: { label: "Contacted", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/40" },
  interested: { label: "Interested", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/40" },
  meeting_scheduled: { label: "Meeting Scheduled", color: "text-cyan-600 dark:text-cyan-400", bg: "bg-cyan-50 dark:bg-cyan-950/40" },
  proposal_sent: { label: "Proposal Sent", color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-950/40" },
  negotiation: { label: "Negotiation", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/40" },
  converted: { label: "Won (Converted)", color: "text-emerald-700 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-950/70" },
  not_interested: { label: "Not Interested", color: "text-slate-500", bg: "bg-slate-100 dark:bg-slate-900/60" },
  do_not_contact: { label: "Do Not Contact", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/40" },
};

// Consolidated primary lanes for an executive, frictionless Kanban workflow
const CONSOLIDATED_LANES = [
  { id: "lane_prospects", title: "1. Discovered & Qualified", stages: ["new", "researching", "qualified"], badgeColor: "bg-blue-500" },
  { id: "lane_queue", title: "2. Telephony Queue", stages: ["contact_permitted"], badgeColor: "bg-teal-500" },
  { id: "lane_contacted", title: "3. Contacted / Pitching", stages: ["contacted", "interested"], badgeColor: "bg-amber-500" },
  { id: "lane_closing", title: "4. Proposals & Negotiation", stages: ["meeting_scheduled", "proposal_sent", "negotiation"], badgeColor: "bg-purple-500" },
  { id: "lane_won", title: "5. Closed Deals (Won)", stages: ["converted"], badgeColor: "bg-emerald-500" },
  { id: "lane_archived", title: "6. Archived / Declined", stages: ["not_interested", "do_not_contact"], badgeColor: "bg-slate-500" },
];

export default function CrmPipelinePage() {
  const [pipelineData, setPipelineData] = useState<any>(null);
  const [allLeads, setAllLeads] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLead, setSelectedLead] = useState<Business | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [laneMode, setLaneMode] = useState<"consolidated" | "detailed">("consolidated");
  const [searchQuery, setSearchQuery] = useState("");
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadPipeline = async () => {
    setLoading(true);
    try {
      const [pipe, bizList] = await Promise.all([
        fetchCrmPipeline().catch(() => null),
        fetchBusinesses().catch(() => [])
      ]);
      setPipelineData(pipe);
      setAllLeads(bizList);
    } catch (err) {
      console.error("Failed to load pipeline", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPipeline();
  }, []);

  const showNotification = (message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleStageChange = async (bizId: string, newStage: string) => {
    setUpdatingId(bizId);
    try {
      // Optimistic update in UI
      setAllLeads((prev) =>
        prev.map((b) => (b.id === bizId ? { ...b, crm_status: newStage as Business["crm_status"] } : b))
      );
      await updateBusinessStatus(bizId, newStage);
      await loadPipeline();
      const stageName = STAGE_CONFIG[newStage]?.label || newStage;
      showNotification(`Lead moved to "${stageName}"`);
      if (selectedLead?.id === bizId) {
        const refreshed = await fetchBusiness(bizId);
        setSelectedLead(refreshed);
      }
    } catch (err: any) {
      showNotification(err.message || "Failed to update stage", "error");
      await loadPipeline();
    } finally {
      setUpdatingId(null);
    }
  };

  // Drag and Drop handlers
  const onDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData("text/plain", leadId);
    setDraggedLeadId(leadId);
  };

  const onDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverColumn(null);
  };

  const onDragOver = (e: React.DragEvent, colKey: string) => {
    e.preventDefault();
    if (dragOverColumn !== colKey) {
      setDragOverColumn(colKey);
    }
  };

  const onDragLeave = () => {
    setDragOverColumn(null);
  };

  const onDrop = async (e: React.DragEvent, targetStageOrLane: string) => {
    e.preventDefault();
    setDragOverColumn(null);
    const leadId = e.dataTransfer.getData("text/plain") || draggedLeadId;
    if (!leadId) return;

    let targetStage = targetStageOrLane;
    // If dropped on a consolidated lane, pick the primary stage of that lane
    if (laneMode === "consolidated") {
      const lane = CONSOLIDATED_LANES.find((l) => l.id === targetStageOrLane);
      if (lane) {
        targetStage = lane.stages[0];
      }
    }

    await handleStageChange(leadId, targetStage);
    setDraggedLeadId(null);
  };

  const handleCardClick = async (bizId: string) => {
    try {
      const fullBiz = await fetchBusiness(bizId);
      setSelectedLead(fullBiz);
    } catch (err) {
      console.error("Failed to load business details", err);
    }
  };

  // Filter leads based on search query
  const filteredLeads = useMemo(() => {
    if (!searchQuery) return allLeads;
    const q = searchQuery.toLowerCase();
    return allLeads.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q)
    );
  }, [allLeads, searchQuery]);

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header />

      <main className="p-4 sm:p-6 md:p-8 space-y-6 flex-1 max-w-[1700px] mx-auto w-full flex flex-col">
        {/* Toast Alert */}
        {notification && (
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in transition-all ${
              notification.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
                : "bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
              ✕
            </button>
          </div>
        )}

        {/* Header Toolbar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-200/80 dark:border-slate-800 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-xl shadow-md shadow-blue-500/20">
                <FileCheck2 className="h-6 w-6" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Deals Pipeline & Kanban Board
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Drag and drop prospects between sales stages or switch to List view for bulk updates and opportunity scoring.
            </p>
          </div>

          {/* Controls: Search + Lane Mode + View Switcher */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-48 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Filter by business, city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Kanban Granularity Mode Toggle (Only in Kanban view) */}
            {viewMode === "kanban" && (
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
                <button
                  onClick={() => setLaneMode("consolidated")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    laneMode === "consolidated"
                      ? "bg-white dark:bg-[#0c121e] text-blue-600 dark:text-blue-400 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                  title="Consolidate stages into 6 clean sales lanes"
                >
                  6 Main Lanes
                </button>
                <button
                  onClick={() => setLaneMode("detailed")}
                  className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                    laneMode === "detailed"
                      ? "bg-white dark:bg-[#0c121e] text-blue-600 dark:text-blue-400 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                  }`}
                  title="View all 12 granular qualification stages"
                >
                  All 12 Stages
                </button>
              </div>
            )}

            {/* View Mode Toggle: Kanban Board vs List View */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900/80 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === "kanban"
                    ? "bg-white dark:bg-[#0c121e] text-blue-600 dark:text-blue-400 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <Kanban className="h-3.5 w-3.5" />
                <span>Kanban Board</span>
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === "list"
                    ? "bg-white dark:bg-[#0c121e] text-blue-600 dark:text-blue-400 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                }`}
              >
                <ListIcon className="h-3.5 w-3.5" />
                <span>List View</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── VIEW 1: KANBAN BOARD WITH DRAG AND DROP ─────────────── */}
        {viewMode === "kanban" && (
          <div className="flex-1 overflow-x-auto pb-4">
            <div className="flex gap-4 min-w-[1500px] h-[calc(100vh-250px)]">
              {laneMode === "consolidated"
                ? CONSOLIDATED_LANES.map((lane) => {
                    const laneLeads = filteredLeads.filter((b) => lane.stages.includes(b.crm_status));
                    const isDragTarget = dragOverColumn === lane.id;

                    return (
                      <div
                        key={lane.id}
                        onDragOver={(e) => onDragOver(e, lane.id)}
                        onDragLeave={onDragLeave}
                        onDrop={(e) => onDrop(e, lane.id)}
                        className={`w-72 flex-shrink-0 flex flex-col rounded-2xl border transition-all ${
                          isDragTarget
                            ? "border-blue-500 dark:border-blue-400 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
                            : "bg-slate-50/70 dark:bg-[#090e17] border-slate-200/80 dark:border-slate-800"
                        } p-3.5`}
                      >
                        {/* Column Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800 mb-3">
                          <div className="flex items-center gap-2">
                            <span className={`h-2.5 w-2.5 rounded-full ${lane.badgeColor}`} />
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {lane.title}
                            </span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-[#0c121e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs font-mono">
                            {laneLeads.length}
                          </span>
                        </div>

                        {/* Drag & Drop Cards Container */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                          {laneLeads.length === 0 ? (
                            <div className="h-32 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs italic">
                              <span>Drag deals here</span>
                            </div>
                          ) : (
                            laneLeads.map((lead) => {
                              const score = lead.lead_scores?.[0]?.total_opportunity_score ?? 0;
                              const badge = formatScoreTier(score);
                              const isDragging = draggedLeadId === lead.id;

                              return (
                                <div
                                  key={lead.id}
                                  draggable={true}
                                  onDragStart={(e) => onDragStart(e, lead.id)}
                                  onDragEnd={onDragEnd}
                                  onClick={() => handleCardClick(lead.id)}
                                  className={`p-3.5 bg-white dark:bg-[#0c121e] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-grab active:cursor-grabbing space-y-2.5 group select-none ${
                                    isDragging ? "opacity-50 scale-95" : ""
                                  }`}
                                >
                                  {/* Top Title & Score */}
                                  <div className="flex items-start justify-between gap-1.5">
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                      <GripVertical className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 shrink-0" />
                                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                        {lead.name}
                                      </span>
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${badge.badgeClass}`}>
                                      {score} pts
                                    </span>
                                  </div>

                                  {/* Category & City */}
                                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                    <span className="truncate max-w-[130px] font-medium">{lead.category}</span>
                                    <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px] flex items-center gap-1">
                                      <MapPin className="h-2.5 w-2.5" />
                                      {lead.city}
                                    </span>
                                  </div>

                                  {/* Quick Stage Mover Selector */}
                                  <div
                                    className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Stage:</span>
                                    <select
                                      value={lead.crm_status}
                                      disabled={updatingId === lead.id}
                                      onChange={(e) => handleStageChange(lead.id, e.target.value)}
                                      className="text-[10px] font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-200 focus:outline-none"
                                    >
                                      {Object.entries(STAGE_CONFIG).map(([stKey, cfg]) => (
                                        <option key={stKey} value={stKey} className="dark:bg-[#0c121e]">
                                          {cfg.label}
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
                  })
                : Object.entries(STAGE_CONFIG).map(([stageKey, cfg]) => {
                    const stageLeads = filteredLeads.filter((b) => b.crm_status === stageKey);
                    const isDragTarget = dragOverColumn === stageKey;

                    return (
                      <div
                        key={stageKey}
                        onDragOver={(e) => onDragOver(e, stageKey)}
                        onDragLeave={onDragLeave}
                        onDrop={(e) => onDrop(e, stageKey)}
                        className={`w-72 flex-shrink-0 flex flex-col rounded-2xl border transition-all ${
                          isDragTarget
                            ? "border-blue-500 dark:border-blue-400 bg-blue-50/40 dark:bg-blue-950/30 ring-2 ring-blue-500/20"
                            : "bg-slate-50/70 dark:bg-[#090e17] border-slate-200/80 dark:border-slate-800"
                        } p-3.5`}
                      >
                        {/* Column Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200/80 dark:border-slate-800 mb-3">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                            {cfg.label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-white dark:bg-[#0c121e] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 shadow-2xs font-mono">
                            {stageLeads.length}
                          </span>
                        </div>

                        {/* Cards List */}
                        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                          {stageLeads.length === 0 ? (
                            <div className="h-32 flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs italic">
                              <span>No deals in this stage</span>
                            </div>
                          ) : (
                            stageLeads.map((lead) => {
                              const score = lead.lead_scores?.[0]?.total_opportunity_score ?? 0;
                              const badge = formatScoreTier(score);

                              return (
                                <div
                                  key={lead.id}
                                  draggable={true}
                                  onDragStart={(e) => onDragStart(e, lead.id)}
                                  onDragEnd={onDragEnd}
                                  onClick={() => handleCardClick(lead.id)}
                                  className="p-3.5 bg-white dark:bg-[#0c121e] rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-blue-400 dark:hover:border-blue-600 transition-all cursor-grab active:cursor-grabbing space-y-2.5 group select-none"
                                >
                                  <div className="flex items-start justify-between gap-1.5">
                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                      <GripVertical className="h-3.5 w-3.5 text-slate-300 dark:text-slate-600 group-hover:text-blue-500 shrink-0" />
                                      <span className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                        {lead.name}
                                      </span>
                                    </div>
                                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border shrink-0 ${badge.badgeClass}`}>
                                      {score} pts
                                    </span>
                                  </div>

                                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                                    <span className="truncate max-w-[130px] font-medium">{lead.category}</span>
                                    <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                                      {lead.city}
                                    </span>
                                  </div>

                                  <div
                                    className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Stage:</span>
                                    <select
                                      value={lead.crm_status}
                                      disabled={updatingId === lead.id}
                                      onChange={(e) => handleStageChange(lead.id, e.target.value)}
                                      className="text-[10px] font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-slate-700 dark:text-slate-200 focus:outline-none"
                                    >
                                      {Object.entries(STAGE_CONFIG).map(([stKey, c]) => (
                                        <option key={stKey} value={stKey} className="dark:bg-[#0c121e]">
                                          {c.label}
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
        )}

        {/* ── VIEW 2: LIST / TABLE VIEW ───────────────────────────── */}
        {viewMode === "list" && (
          <div className="bg-white dark:bg-[#0c121e] rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Business Name & Category</th>
                    <th className="py-3.5 px-4">Market / Location</th>
                    <th className="py-3.5 px-4">Opportunity Score</th>
                    <th className="py-3.5 px-4">Sales Stage</th>
                    <th className="py-3.5 px-4">Quick Stage Move</th>
                    <th className="py-3.5 px-4 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500 text-xs">
                        No prospects match current filters.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.map((lead) => {
                      const score = lead.lead_scores?.[0]?.total_opportunity_score ?? 0;
                      const badge = formatScoreTier(score);
                      const currentCfg = STAGE_CONFIG[lead.crm_status] || {
                        label: lead.crm_status,
                        color: "text-slate-700",
                        bg: "bg-slate-100",
                      };

                      return (
                        <tr
                          key={lead.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                          onClick={() => handleCardClick(lead.id)}
                        >
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 dark:text-white">{lead.name}</div>
                            <div className="text-[11px] text-slate-400">{lead.category}</div>
                          </td>

                          <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 text-slate-400" />
                              <span>{lead.city}</span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${badge.badgeClass}`}>
                              {score} pts ({badge.label})
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${currentCfg.bg} ${currentCfg.color}`}>
                              <span className="h-1.5 w-1.5 rounded-full bg-current" />
                              <span>{currentCfg.label}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4" onClick={(e) => e.stopPropagation()}>
                            <select
                              value={lead.crm_status}
                              disabled={updatingId === lead.id}
                              onChange={(e) => handleStageChange(lead.id, e.target.value)}
                              className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            >
                              {Object.entries(STAGE_CONFIG).map(([stKey, c]) => (
                                <option key={stKey} value={stKey} className="dark:bg-[#0c121e]">
                                  {c.label}
                                </option>
                              ))}
                            </select>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleCardClick(lead.id)}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                            >
                              View & Pitch →
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
        )}
      </main>

      {/* Lead Detail & Pitch Generator Modal */}
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
    </div>
  );
}
