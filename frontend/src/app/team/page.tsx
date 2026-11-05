"use client";

import { useState, useEffect, useMemo } from "react";
import { Header } from "@/components/layout/header";
import {
  fetchTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
  assignLeadsToMember,
  fetchBusinesses,
  updateTeamMemberPermissions,
  fetchDiscoveryActivityAudit
} from "@/lib/api-client";
import { TeamMember, Business } from "@/types";
import { AVAILABLE_PERMISSIONS } from "@/lib/permissions";
import {
  Users,
  UserPlus,
  PhoneCall,
  CheckCircle2,
  Target,
  TrendingUp,
  Edit3,
  Trash2,
  UserCheck,
  Search,
  Mail,
  Phone,
  Shield,
  Briefcase,
  Calendar,
  X,
  Check,
  AlertCircle,
  ArrowRight,
  Layers,
  Sparkles,
  KeyRound,
  History,
  Activity,
  Lock,
  Compass
} from "lucide-react";

export default function TeamManagementPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"roster" | "matrix" | "audit">("roster");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Add Member Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "caller",
    phone: "",
    daily_call_target: 30,
    notes: ""
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Edit Member Modal State
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editForm, setEditForm] = useState({
    full_name: "",
    role: "caller",
    is_active: true,
    phone: "",
    daily_call_target: 30,
    notes: "",
    password: ""
  });
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Permissions Edit Modal State
  const [permMember, setPermMember] = useState<TeamMember | null>(null);
  const [permDraft, setPermDraft] = useState<Record<string, boolean>>({});
  const [savingPerms, setSavingPerms] = useState(false);

  // Delete Member Confirmation State
  const [deletingMember, setDeletingMember] = useState<TeamMember | null>(null);
  const [submittingDelete, setSubmittingDelete] = useState(false);

  // Assign Leads Modal State
  const [assigningMember, setAssigningMember] = useState<TeamMember | null>(null);
  const [assignCount, setAssignCount] = useState<number>(20);
  const [assignCityFilter, setAssignCityFilter] = useState<string>("");
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [membersData, bizData, auditData] = await Promise.all([
        fetchTeamMembers(),
        fetchBusinesses(),
        fetchDiscoveryActivityAudit().catch(() => [])
      ]);
      setTeamMembers(membersData);
      setBusinesses(bizData);
      setAuditEvents(auditData);
    } catch (err: any) {
      console.error("Failed to load team data", err);
      showNotification(err.message || "Failed to load team data", "error");
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

  const filteredMembers = useMemo(() => {
    return teamMembers.filter((m) => {
      if (roleFilter !== "all" && m.role !== roleFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = m.full_name?.toLowerCase().includes(q) ?? false;
        const matchEmail = m.email.toLowerCase().includes(q);
        const matchPhone = m.phone?.toLowerCase().includes(q) ?? false;
        if (!matchName && !matchEmail && !matchPhone) return false;
      }
      return true;
    });
  }, [teamMembers, roleFilter, searchQuery]);

  // KPIs
  const kpis = useMemo(() => {
    const totalMembers = teamMembers.length;
    const activeCallers = teamMembers.filter((m) => ["caller", "sdr"].includes(m.role) && m.is_active).length;
    const totalCalls = teamMembers.reduce((acc, m) => acc + (m.total_calls || 0), 0);
    const totalWon = teamMembers.reduce((acc, m) => acc + (m.accepted_deals || 0), 0);
    const totalScrapers = auditEvents.length;

    return { totalMembers, activeCallers, totalCalls, totalWon, totalScrapers };
  }, [teamMembers, auditEvents]);

  // Handle Add Member
  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addForm.email || !addForm.password) {
      showNotification("Email and password are required", "error");
      return;
    }

    setSubmittingAdd(true);
    try {
      await createTeamMember(addForm);
      showNotification(`Team member ${addForm.full_name || addForm.email} successfully added`);
      setIsAddModalOpen(false);
      setAddForm({
        full_name: "",
        email: "",
        password: "",
        role: "caller",
        phone: "",
        daily_call_target: 30,
        notes: ""
      });
      loadData();
    } catch (err: any) {
      showNotification(err.message || "Failed to add team member", "error");
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Open Permissions Modal
  const openPermissionsModal = (member: TeamMember) => {
    setPermMember(member);
    setPermDraft(member.permissions || {});
  };

  // Toggle single permission live
  const togglePermissionKey = async (memberId: string, key: string, currentVal: boolean) => {
    const newVal = !currentVal;
    try {
      const updated = await updateTeamMemberPermissions(memberId, { [key]: newVal });
      setTeamMembers((prev) => prev.map((m) => (m.id === memberId ? updated : m)));
      showNotification(`Updated permission '${key}' to ${newVal ? "ALLOWED" : "DENIED"}`);
    } catch (err: any) {
      showNotification(err.message || "Failed to update permission", "error");
    }
  };

  // Save Modal Permissions
  const handleSaveModalPermissions = async () => {
    if (!permMember) return;
    setSavingPerms(true);
    try {
      const updated = await updateTeamMemberPermissions(permMember.id, permDraft);
      setTeamMembers((prev) => prev.map((m) => (m.id === permMember.id ? updated : m)));
      showNotification(`Updated permissions for ${permMember.full_name || permMember.email}`);
      setPermMember(null);
    } catch (err: any) {
      showNotification(err.message || "Failed to save permissions", "error");
    } finally {
      setSavingPerms(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (member: TeamMember) => {
    setEditingMember(member);
    setEditForm({
      full_name: member.full_name || "",
      role: member.role,
      is_active: member.is_active,
      phone: member.phone || "",
      daily_call_target: member.daily_call_target || 30,
      notes: member.notes || "",
      password: ""
    });
  };

  // Handle Update Member
  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMember) return;

    setSubmittingEdit(true);
    try {
      const payload: any = {
        full_name: editForm.full_name,
        role: editForm.role,
        is_active: editForm.is_active,
        phone: editForm.phone,
        daily_call_target: Number(editForm.daily_call_target),
        notes: editForm.notes
      };
      if (editForm.password) {
        payload.password = editForm.password;
      }

      await updateTeamMember(editingMember.id, payload);
      showNotification("Team member updated successfully");
      setEditingMember(null);
      loadData();
    } catch (err: any) {
      showNotification(err.message || "Failed to update member", "error");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // Handle Delete Member
  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setSubmittingDelete(true);
    try {
      await deleteTeamMember(deletingMember.id);
      showNotification(`Member ${deletingMember.email} removed`);
      setDeletingMember(null);
      loadData();
    } catch (err: any) {
      showNotification(err.message || "Failed to delete member", "error");
    } finally {
      setSubmittingDelete(false);
    }
  };

  // Handle Lead Assignment
  const handleAssignLeads = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assigningMember) return;

    setSubmittingAssign(true);
    try {
      let eligible = businesses.filter((b) => !b.is_suppressed);
      if (assignCityFilter) {
        eligible = eligible.filter((b) => b.city.toLowerCase().includes(assignCityFilter.toLowerCase()));
      }
      const leadIds = eligible.slice(0, assignCount).map((b) => b.id);

      if (leadIds.length === 0) {
        showNotification("No eligible leads found matching criteria", "error");
        setSubmittingAssign(false);
        return;
      }

      await assignLeadsToMember(leadIds, assigningMember.id);
      showNotification(`Assigned ${leadIds.length} leads to ${assigningMember.full_name || assigningMember.email}`);
      setAssigningMember(null);
      loadData();
    } catch (err: any) {
      showNotification(err.message || "Failed to assign leads", "error");
    } finally {
      setSubmittingAssign(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="h-3 w-3" />
            Admin & Developer
          </span>
        );
      case "caller":
      case "sdr":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <PhoneCall className="h-3 w-3" />
            Telecaller / SDR
          </span>
        );
      case "developer":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Briefcase className="h-3 w-3" />
            Web Developer
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            {role}
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-slate-50/50">
      <Header />

      <main className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Toast Notification */}
        {notification && (
          <div
            className={`p-4 rounded-xl border flex items-center justify-between text-xs font-medium transition-all ${
              notification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
          >
            <div className="flex items-center gap-2">
              {notification.type === "success" ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              ) : (
                <AlertCircle className="h-4 w-4 text-rose-600" />
              )}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)} className="text-slate-400 hover:text-slate-600">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-purple-100 text-purple-700 rounded-md">
                Admin Control Room
              </span>
              <span className="text-xs text-slate-500 font-medium">Startup Team & Granular RBAC</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-1">
              Team Command & Granular Permissions
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Administer team member roles, toggle granular feature permissions per employee, monitor scraper usage, and inspect chronological activity audits.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <UserPlus className="h-4 w-4" />
              <span>Add Team Member</span>
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Agency Members</span>
              <Users className="h-4 w-4 text-slate-400" />
            </div>
            <div className="text-2xl font-bold text-slate-900 mt-2">{kpis.totalMembers}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Full agency headcount</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Active Callers</span>
              <PhoneCall className="h-4 w-4 text-blue-500" />
            </div>
            <div className="text-2xl font-bold text-blue-600 mt-2">{kpis.activeCallers}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Assigned to Cold Calling</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Dials</span>
              <Target className="h-4 w-4 text-indigo-500" />
            </div>
            <div className="text-2xl font-bold text-indigo-600 mt-2">{kpis.totalCalls}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Logged phone calls</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Agreed Clients</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-emerald-600 mt-2">{kpis.totalWon}</div>
            <span className="text-[11px] text-emerald-600 font-medium mt-1 block">Sent to Deepith</span>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Scrapers Triggered</span>
              <Compass className="h-4 w-4 text-purple-500" />
            </div>
            <div className="text-2xl font-bold text-purple-600 mt-2">{kpis.totalScrapers}</div>
            <span className="text-[11px] text-slate-400 mt-1 block">Tracked discovery runs</span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("roster")}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 ${
              activeTab === "roster"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Team Roster & Targets
          </button>
          <button
            onClick={() => setActiveTab("matrix")}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "matrix"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <KeyRound className="h-3.5 w-3.5" />
            <span>Granular RBAC Permissions Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`pb-3 px-4 text-xs font-bold transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <History className="h-3.5 w-3.5" />
            <span>Live Scraper & Action Audit Trail</span>
          </button>
        </div>

        {/* TAB 1: TEAM ROSTER */}
        {activeTab === "roster" && (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row items-center justify-between gap-3 bg-slate-50/50">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                <span className="text-xs text-slate-500 font-medium">Role:</span>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-medium text-slate-700"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Administrators</option>
                  <option value="caller">Telecallers / SDRs</option>
                  <option value="developer">Developers</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3.5 px-4">Member Name & Email</th>
                    <th className="py-3.5 px-4">Role</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Active Permissions</th>
                    <th className="py-3.5 px-4 text-center">Calls Made</th>
                    <th className="py-3.5 px-4 text-center">Deals Agreed</th>
                    <th className="py-3.5 px-4 text-center">Assigned Leads</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Loading team roster...
                      </td>
                    </tr>
                  ) : filteredMembers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        No team members found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredMembers.map((member) => {
                      const enabledPermCount = Object.values(member.permissions || {}).filter(Boolean).length;
                      return (
                        <tr key={member.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                                {member.full_name ? member.full_name.charAt(0).toUpperCase() : member.email.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900">
                                  {member.full_name || "Unnamed Employee"}
                                </div>
                                <div className="text-[11px] text-slate-500">{member.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">{getRoleBadge(member.role)}</td>

                          <td className="py-3.5 px-4">
                            {member.is_active ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-slate-300"></span>
                                Inactive
                              </span>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              onClick={() => openPermissionsModal(member)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-medium transition-colors"
                            >
                              <KeyRound className="h-3 w-3 text-purple-600" />
                              <span>{enabledPermCount} / {AVAILABLE_PERMISSIONS.length} Allowed</span>
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-center font-semibold text-slate-800">
                            {member.total_calls}
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="font-bold text-emerald-600">{member.accepted_deals}</span>
                          </td>

                          <td className="py-3.5 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-medium">
                              {member.assigned_leads}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openPermissionsModal(member)}
                                title="Edit Granular Permissions"
                                className="p-1.5 rounded-md hover:bg-purple-50 text-slate-400 hover:text-purple-600 transition-colors"
                              >
                                <KeyRound className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setAssigningMember(member);
                                  setAssignCount(20);
                                }}
                                title="Assign Scraped Leads"
                                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-blue-600 transition-colors"
                              >
                                <Layers className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => openEditModal(member)}
                                title="Edit Member Profile"
                                className="p-1.5 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              {member.role !== "admin" && (
                                <button
                                  onClick={() => setDeletingMember(member)}
                                  title="Delete Member"
                                  className="p-1.5 rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
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
        )}

        {/* TAB 2: GRANULAR PERMISSION MATRIX */}
        {activeTab === "matrix" && (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <KeyRound className="h-4 w-4 text-purple-600" />
                  <span>Granular Feature Access Matrix</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Click any switch below to toggle specific capabilities immediately for that employee.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4 min-w-[160px]">Team Member</th>
                    {AVAILABLE_PERMISSIONS.map((perm) => (
                      <th key={perm.key} className="py-3 px-3 text-center min-w-[110px]" title={perm.description}>
                        <div className="font-bold text-slate-800">{perm.label}</div>
                        <div className="text-[10px] text-slate-400 normal-case font-normal">{perm.category}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teamMembers.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-4 px-4 font-semibold text-slate-900">
                        <div>{member.full_name || member.email}</div>
                        <div className="text-[10px] text-slate-400 font-normal">{member.role.toUpperCase()}</div>
                      </td>

                      {AVAILABLE_PERMISSIONS.map((perm) => {
                        const isChecked = member.role === "admin" || !!member.permissions?.[perm.key];
                        const isDisabled = member.role === "admin"; // Admins retain all permissions

                        return (
                          <td key={perm.key} className="py-4 px-3 text-center">
                            <button
                              disabled={isDisabled}
                              onClick={() => togglePermissionKey(member.id, perm.key, isChecked)}
                              className={`w-9 h-5 inline-flex items-center rounded-full p-0.5 transition-colors ${
                                isChecked ? "bg-emerald-600" : "bg-slate-300"
                              } ${isDisabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                              title={isDisabled ? "Admin has full access" : `Toggle ${perm.label}`}
                            >
                              <span
                                className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${
                                  isChecked ? "translate-x-4" : "translate-x-0"
                                }`}
                              />
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: LIVE SCRAPER & ACTION AUDIT TRAIL */}
        {activeTab === "audit" && (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <History className="h-4 w-4 text-blue-600" />
                  <span>Team Discovery & Action Audit Trail</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete chronological record of which employee launched discovery scrapers, targeted which cities, and logged calls.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {auditEvents.length === 0 ? (
                <div className="py-12 text-center text-slate-400 text-xs">
                  No scraper runs or discovery actions recorded yet. Launch a discovery job on /discover to track it!
                </div>
              ) : (
                auditEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold">
                        <Compass className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-semibold text-slate-900 text-xs flex items-center gap-2">
                          <span>{event.job_name}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            event.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"
                          }`}>
                            {event.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="font-medium text-slate-700">{event.target_category}</span>
                          <span>•</span>
                          <span>{event.target_city}, {event.target_country}</span>
                          <span>•</span>
                          <span className="font-semibold text-purple-700">{event.records_found} Leads Discovered</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-800 flex items-center justify-end gap-1">
                        <UserCheck className="h-3.5 w-3.5 text-blue-600" />
                        <span>{event.user_name || "Deepith (Admin)"}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(event.created_at).toLocaleString("en-IN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* MODAL: GRANULAR PERMISSION SETTINGS */}
      {permMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Granular Permissions</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Configure feature gates for {permMember.full_name || permMember.email}
                </p>
              </div>
              <button
                onClick={() => setPermMember(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
              {AVAILABLE_PERMISSIONS.map((p) => {
                const checked = permMember.role === "admin" || !!permDraft[p.key];
                return (
                  <div
                    key={p.key}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                  >
                    <div className="pr-4">
                      <div className="font-semibold text-slate-900 text-xs">{p.label}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{p.description}</div>
                    </div>
                    <button
                      disabled={permMember.role === "admin"}
                      onClick={() => setPermDraft({ ...permDraft, [p.key]: !checked })}
                      className={`w-9 h-5 shrink-0 inline-flex items-center rounded-full p-0.5 transition-colors ${
                        checked ? "bg-emerald-600" : "bg-slate-300"
                      } ${permMember.role === "admin" ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                    >
                      <span
                        className={`w-4 h-4 rounded-full bg-white shadow-xs transform transition-transform ${
                          checked ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setPermMember(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={savingPerms}
                onClick={handleSaveModalPermissions}
                className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
              >
                {savingPerms ? "Saving..." : "Apply Permissions"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD TEAM MEMBER */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Add New Startup Team Member</h3>
                <p className="text-xs text-slate-500 mt-0.5">Create account credentials and role assignments.</p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddMember} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={addForm.full_name}
                    onChange={(e) => setAddForm({ ...addForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={addForm.role}
                    onChange={(e) => setAddForm({ ...addForm, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="caller">Telecaller / SDR (Caller Desk)</option>
                    <option value="developer">Web Developer</option>
                    <option value="admin">Administrator (Full Access)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Work Email</label>
                  <input
                    type="email"
                    required
                    placeholder="caller@agency.com"
                    value={addForm.email}
                    onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                  <input
                    type="password"
                    required
                    placeholder="Create password"
                    value={addForm.password}
                    onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="text"
                    placeholder="+91 98450 12345"
                    value={addForm.phone}
                    onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Call Target</label>
                  <input
                    type="number"
                    min={5}
                    max={150}
                    value={addForm.daily_call_target}
                    onChange={(e) => setAddForm({ ...addForm, daily_call_target: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Specialization, timezone, target industry..."
                  value={addForm.notes}
                  onChange={(e) => setAddForm({ ...addForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submittingAdd ? "Adding..." : "Add Member"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TEAM MEMBER */}
      {editingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Edit Member Profile</h3>
                <p className="text-xs text-slate-500 mt-0.5">{editingMember.email}</p>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role</label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white"
                  >
                    <option value="caller">Telecaller / SDR</option>
                    <option value="developer">Web Developer</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Daily Call Target</label>
                  <input
                    type="number"
                    value={editForm.daily_call_target}
                    onChange={(e) => setEditForm({ ...editForm, daily_call_target: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 py-1">
                <input
                  type="checkbox"
                  id="is_active_checkbox"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="is_active_checkbox" className="text-xs font-medium text-slate-700 cursor-pointer">
                  Account is Active (permitted to access portal)
                </label>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reset Password <span className="text-slate-400 font-normal">(Leave blank to keep existing)</span>
                </label>
                <input
                  type="password"
                  placeholder="New password (optional)"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                ></textarea>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingMember(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submittingEdit ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ASSIGN LEADS */}
      {assigningMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-xl overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Assign Scraped Leads</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribute batch leads to {assigningMember.full_name || assigningMember.email}
                </p>
              </div>
              <button
                onClick={() => setAssigningMember(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAssignLeads} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Batch Size (Number of Leads)</label>
                <input
                  type="number"
                  min={5}
                  max={200}
                  value={assignCount}
                  onChange={(e) => setAssignCount(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Filter by City <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Bengaluru, Austin, London..."
                  value={assignCityFilter}
                  onChange={(e) => setAssignCityFilter(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>

              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-800">
                <span className="font-semibold block mb-0.5">Caller Queue Routing</span>
                These prospects will automatically appear prioritized at the top of the teammate's Caller Desk with click-to-dial links.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAssigningMember(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssign}
                  className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm disabled:opacity-50"
                >
                  {submittingAssign ? "Routing..." : "Confirm Assignment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deletingMember && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full border border-slate-200 shadow-xl overflow-hidden p-6 space-y-4">
            <div className="h-10 w-10 rounded-full bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center">
              <Trash2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Remove Team Member?</h3>
              <p className="text-xs text-slate-500 mt-1">
                Are you sure you want to remove <span className="font-semibold text-slate-800">{deletingMember.email}</span>? Any assigned leads will be unassigned and returned to the pool.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingMember(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteMember}
                disabled={submittingDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-sm"
              >
                {submittingDelete ? "Deleting..." : "Confirm Removal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
