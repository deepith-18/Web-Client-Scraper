import { Business, AnalyticsOverview, ScrapingJob, LeadSource, CallLog, CallLogStats, TeamMember, CompanyExpense, FinancialAnalytics, AuthResponse, RegisterRequest } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function loginJson(data: { email: string; password: string }): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/login-json`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Login failed: ${res.statusText}`);
  }
  return res.json();
}

export async function googleAuth(data: { credential: string; email: string; full_name?: string; role?: "admin" | "caller" }): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Google auth failed: ${res.statusText}`);
  }
  return res.json();
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Registration failed: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAnalytics(): Promise<AnalyticsOverview> {
  const res = await fetch(`${API_BASE_URL}/analytics/overview`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch analytics: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchBusinesses(params?: {
  country?: string;
  city?: string;
  category?: string;
  crm_status?: string;
  priority_tier?: string;
  search?: string;
  has_website?: boolean;
}): Promise<Business[]> {
  const query = new URLSearchParams();
  if (params?.country) query.append("country", params.country);
  if (params?.city) query.append("city", params.city);
  if (params?.category) query.append("category", params.category);
  if (params?.crm_status) query.append("crm_status", params.crm_status);
  if (params?.priority_tier) query.append("priority_tier", params.priority_tier);
  if (params?.search) query.append("search", params.search);
  if (params?.has_website !== undefined) query.append("has_website", String(params.has_website));

  const url = `${API_BASE_URL}/businesses?${query.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch businesses: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchBusiness(id: string): Promise<Business> {
  const res = await fetch(`${API_BASE_URL}/businesses/${id}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch business: ${res.statusText}`);
  }
  return res.json();
}

export async function updateBusinessStatus(id: string, crm_status: string): Promise<Business> {
  const res = await fetch(`${API_BASE_URL}/businesses/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ crm_status }),
  });
  if (!res.ok) {
    throw new Error(`Failed to update business: ${res.statusText}`);
  }
  return res.json();
}

export async function createManualBusiness(data: any): Promise<Business> {
  const res = await fetch(`${API_BASE_URL}/businesses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create business: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteBusiness(id: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/businesses/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to delete business: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchBusinessNotes(businessId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/crm/businesses/${businessId}/notes`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch notes: ${res.statusText}`);
  }
  return res.json();
}

export async function addBusinessNote(businessId: string, content: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/crm/businesses/${businessId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ content }),
  });
  if (!res.ok) {
    throw new Error(`Failed to add note: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchBusinessTasks(businessId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/crm/businesses/${businessId}/tasks`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch tasks: ${res.statusText}`);
  }
  return res.json();
}

export async function createBusinessTask(businessId: string, title: string, dueDate: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/crm/businesses/${businessId}/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, due_date: dueDate }),
  });
  if (!res.ok) {
    throw new Error(`Failed to create task: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchSources(): Promise<LeadSource[]> {
  const res = await fetch(`${API_BASE_URL}/discovery/sources`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch sources: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchDiscoveryJobs(): Promise<ScrapingJob[]> {
  const res = await fetch(`${API_BASE_URL}/discovery/jobs`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch jobs: ${res.statusText}`);
  }
  return res.json();
}

export async function createDiscoveryJob(data: {
  job_name: string;
  target_country: string;
  target_city: string;
  target_category: string;
  source_type: string;
  search_keywords?: string;
  user_id?: string;
  user_name?: string;
}): Promise<ScrapingJob> {
  const res = await fetch(`${API_BASE_URL}/discovery/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create discovery job: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchDiscoveryActivityAudit(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/discovery/activity-audit`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch discovery audit: ${res.statusText}`);
  }
  return res.json();
}



export async function fetchJobLogs(jobId: string): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/discovery/jobs/${jobId}/logs`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch logs: ${res.statusText}`);
  }
  return res.json();
}

export async function cancelDiscoveryJob(jobId: string): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE_URL}/discovery/jobs/${jobId}/cancel`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to cancel job: ${res.statusText}`);
  }
  return res.json();
}

export async function verifyBusiness(businessId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/verification/businesses/${businessId}`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to verify business: ${res.statusText}`);
  }
  return res.json();
}

export async function extractWebsiteContacts(businessId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/verification/businesses/${businessId}/extract`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to extract contacts: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchVerificationSummary(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/verification/summary`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch verification summary: ${res.statusText}`);
  }
  return res.json();
}

export async function runWebsiteAudit(businessId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/audits/businesses/${businessId}`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to audit website: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAuditOpportunities(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/audits/opportunities`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch audit opportunities: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchScoringPresets(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/scoring/presets`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch scoring presets: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchScoringWeights(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/scoring/weights`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch scoring weights: ${res.statusText}`);
  }
  return res.json();
}

export async function calculateBusinessScore(businessId: string, weights?: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/scoring/calculate/${businessId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: weights ? JSON.stringify(weights) : undefined,
  });
  if (!res.ok) {
    throw new Error(`Failed to calculate lead score: ${res.statusText}`);
  }
  return res.json();
}

export async function recalculateAllScores(data?: { category?: string; city?: string; weights?: any }): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/scoring/recalculate-all`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data || {}),
  });
  if (!res.ok) {
    throw new Error(`Failed to recalculate scores: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchScoreBreakdown(businessId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/scoring/breakdown/${businessId}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch score breakdown: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchScoringSummary(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/scoring/summary`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch scoring summary: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchCrmPipeline(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/crm/pipeline`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch CRM pipeline: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchOutreachRecords(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/crm/outreach`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch outreach records: ${res.statusText}`);
  }
  return res.json();
}

export async function generateOutreachPitch(businessId: string, templateId?: string): Promise<any> {
  const url = templateId
    ? `${API_BASE_URL}/crm/outreach/generate/${businessId}?template_id=${encodeURIComponent(templateId)}`
    : `${API_BASE_URL}/crm/outreach/generate/${businessId}`;
  const res = await fetch(url, {
    method: "POST",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to generate outreach pitch: ${res.statusText}`);
  }
  return res.json();
}

export async function approveOutreach(outreachId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/crm/outreach/${outreachId}/approve`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to approve outreach: ${res.statusText}`);
  }
  return res.json();
}

export async function markOutreachSent(outreachId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/crm/outreach/${outreachId}/send`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to record outreach as sent: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchSuppressionList(): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/crm/suppression`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch suppression list: ${res.statusText}`);
  }
  return res.json();
}

export async function addToSuppression(data: { value: string; suppression_type: string; reason?: string }): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/crm/suppression`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Failed to add to suppression list: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteFromSuppression(suppressionId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/crm/suppression/${suppressionId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to remove from suppression: ${res.statusText}`);
  }
  return res.json();
}

export async function auditUrlDirect(url: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/audits/analyze-url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  if (!res.ok) {
    throw new Error(`Failed to audit URL: ${res.statusText}`);
  }
  return res.json();
}

export async function verifyEmailDirect(email: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/verification/verify-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) {
    throw new Error(`Failed to verify email: ${res.statusText}`);
  }
  return res.json();
}

export async function verifyPhoneDirect(phone: string, countryCode: string = "IN"): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/verification/verify-phone`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone, default_country: countryCode }),
  });
  if (!res.ok) {
    throw new Error(`Failed to verify phone: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchOutreachTemplates(channel?: string): Promise<any[]> {
  const url = channel ? `${API_BASE_URL}/crm/templates?channel=${encodeURIComponent(channel)}` : `${API_BASE_URL}/crm/templates`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch outreach templates: ${res.statusText}`);
  }
  return res.json();
}

export async function createOutreachTemplate(data: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/crm/templates`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create template: ${res.statusText}`);
  }
  return res.json();
}

export async function updateOutreachTemplate(id: string, data: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/crm/templates/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    throw new Error(`Failed to update template: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteOutreachTemplate(id: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/crm/templates/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to delete template: ${res.statusText}`);
  }
  return res.json();
}

export async function renderOutreachPreview(data: any): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/crm/outreach/render`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to render outreach preview: ${res.statusText}`);
  }
  return res.json();
}

export async function createOutreachSequence(data: any): Promise<any[]> {
  const res = await fetch(`${API_BASE_URL}/crm/outreach/create-sequence`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create outreach sequence: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchAcceptanceAnalytics(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/analytics/acceptance-rates`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch acceptance analytics: ${res.statusText}`);
  }
  return res.json();
}

// ============================================================================
// TEAM & EMPLOYEE MANAGEMENT API
// ============================================================================

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const res = await fetch(`${API_BASE_URL}/team`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch team members: ${res.statusText}`);
  }
  return res.json();
}

export async function createTeamMember(data: any): Promise<TeamMember> {
  const res = await fetch(`${API_BASE_URL}/team`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to create team member: ${res.statusText}`);
  }
  return res.json();
}

export async function updateTeamMember(userId: string, data: any): Promise<TeamMember> {
  const res = await fetch(`${API_BASE_URL}/team/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update team member: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteTeamMember(userId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/team/${userId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to delete team member: ${res.statusText}`);
  }
  return res.json();
}

export async function assignLeadsToMember(leadIds: string[], userId?: string | null): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/team/assign-leads`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lead_ids: leadIds, user_id: userId }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to assign leads: ${res.statusText}`);
  }
  return res.json();
}

export async function updateTeamMemberPermissions(userId: string, permissions: Record<string, boolean>): Promise<TeamMember> {
  const res = await fetch(`${API_BASE_URL}/team/${userId}/permissions`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ permissions }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update permissions: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchMemberActivityAudit(userId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/team/${userId}/activity`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch member activity: ${res.statusText}`);
  }
  return res.json();
}


// ============================================================================
// CALL LOGS & CRUD AUDIT HISTORY API
// ============================================================================

export async function fetchCallLogs(params?: {
  outcome?: string;
  business_id?: string;
  user_id?: string;
  search?: string;
  skip?: number;
  limit?: number;
}): Promise<CallLog[]> {
  const query = new URLSearchParams();
  if (params?.outcome && params.outcome !== "all") query.append("outcome", params.outcome);
  if (params?.business_id) query.append("business_id", params.business_id);
  if (params?.user_id) query.append("user_id", params.user_id);
  if (params?.search) query.append("search", params.search);
  if (params?.skip) query.append("skip", String(params.skip));
  if (params?.limit) query.append("limit", String(params.limit));

  const res = await fetch(`${API_BASE_URL}/crm/call-logs?${query.toString()}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch call logs: ${res.statusText}`);
  }
  return res.json();
}

export async function createCallLog(data: {
  business_id: string;
  phone_number: string;
  outcome: string;
  duration_seconds?: number;
  caller_name?: string;
  project_type?: string;
  agreed_budget?: string;
  notes?: string;
  decline_reason?: string;
  scheduled_callback_at?: string;
  add_to_suppression?: boolean;
  user_id?: string;
}): Promise<CallLog> {
  const res = await fetch(`${API_BASE_URL}/crm/call-logs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to log call: ${res.statusText}`);
  }
  return res.json();
}

export async function updateCallLog(callId: string, data: Partial<CallLog>): Promise<CallLog> {
  const res = await fetch(`${API_BASE_URL}/crm/call-logs/${callId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update call log: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteCallLog(callId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/crm/call-logs/${callId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to delete call log: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchBusinessCallHistory(businessId: string): Promise<CallLog[]> {
  const res = await fetch(`${API_BASE_URL}/crm/call-logs/history/${businessId}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch call history: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchCallLogsStats(): Promise<CallLogStats> {
  const res = await fetch(`${API_BASE_URL}/crm/call-logs-summary/stats`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch call logs stats: ${res.statusText}`);
  }
  return res.json();
}

// -------------------------------------------------------------
// Company Finance & Spending Tracker API
// -------------------------------------------------------------

export async function fetchExpenses(params?: {
  category?: string;
  vendor?: string;
  search?: string;
  skip?: number;
  limit?: number;
}): Promise<CompanyExpense[]> {
  const query = new URLSearchParams();
  if (params?.category) query.append("category", params.category);
  if (params?.vendor) query.append("vendor", params.vendor);
  if (params?.search) query.append("search", params.search);
  if (params?.skip !== undefined) query.append("skip", String(params.skip));
  if (params?.limit !== undefined) query.append("limit", String(params.limit));

  const url = `${API_BASE_URL}/finance/expenses?${query.toString()}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch company expenses: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchExpense(id: string): Promise<CompanyExpense> {
  const res = await fetch(`${API_BASE_URL}/finance/expenses/${id}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch expense: ${res.statusText}`);
  }
  return res.json();
}

export async function createExpense(data: Partial<CompanyExpense>): Promise<CompanyExpense> {
  const res = await fetch(`${API_BASE_URL}/finance/expenses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to record expense: ${res.statusText}`);
  }
  return res.json();
}

export async function updateExpense(id: string, data: Partial<CompanyExpense>): Promise<CompanyExpense> {
  const res = await fetch(`${API_BASE_URL}/finance/expenses/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to update expense: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteExpense(id: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/finance/expenses/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `Failed to delete expense: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchFinancialAnalytics(): Promise<FinancialAnalytics> {
  const res = await fetch(`${API_BASE_URL}/finance/analytics`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to fetch financial analytics: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteDiscoveryJob(jobId: string): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/discovery/jobs/${jobId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to delete discovery job: ${res.statusText}`);
  }
  return res.json();
}

export async function clearAllDiscoveryJobs(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/discovery/jobs`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to clear discovery jobs: ${res.statusText}`);
  }
  return res.json();
}

export async function clearAllBusinesses(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/businesses`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Failed to clear businesses: ${res.statusText}`);
  }
  return res.json();
}

export async function purgeAllTemporaryData(): Promise<any> {
  const res = await fetch(`${API_BASE_URL}/discovery/purge-temporary-data`, {
    method: "POST",
  });
  if (!res.ok) {
    throw new Error(`Failed to purge temporary data: ${res.statusText}`);
  }
  return res.json();
}





