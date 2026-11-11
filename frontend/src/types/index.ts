export interface Contact {
  id: string;
  contact_type: "email" | "phone" | "whatsapp" | "contact_form";
  raw_value: string;
  normalized_value: string;
  is_primary: boolean;
  verification_status: "unverified" | "valid_syntax" | "mx_confirmed" | "invalid" | "disposable";
  source_url?: string;
}

export interface LeadScore {
  id: string;
  total_opportunity_score: number;
  priority_tier: "high" | "good" | "medium" | "low";
  no_website_score: number;
  website_unavailable_score: number;
  mobile_score: number;
  missing_contact_score: number;
  performance_score: number;
  missing_info_score?: number;
  authenticity_score: number;
  email_available_score: number;
  score_breakdown?: Record<string, any>;
}

export interface ScoringWeightsConfig {
  no_website: number;
  website_unavailable: number;
  poor_mobile: number;
  missing_contact: number;
  missing_info: number;
  performance_issues: number;
  identity_corroborated: number;
  email_available: number;
}

export interface PresetProfile {
  id: string;
  name: string;
  description: string;
  weights: ScoringWeightsConfig;
}

export interface ScoreFactorDetail {
  factor_name: string;
  points_awarded: number;
  max_possible: number;
  reason: string;
  evidence?: string;
}

export interface ScoreBreakdownDetail {
  business_id: string;
  business_name: string;
  total_opportunity_score: number;
  priority_tier: string;
  verification_confidence: string;
  factors: ScoreFactorDetail[];
  disclaimer: string;
  recommended_pitch_angle: string;
  calculated_at: string;
}

export interface WebsiteAudit {
  id: string;
  has_website: boolean;
  is_reachable: boolean;
  http_status?: number;
  has_ssl: boolean;
  is_mobile_friendly: boolean;
  has_contact_form: boolean;
  load_time_ms?: number;
  opportunities_identified: string[];
  technologies_detected: string[];
  raw_audit_report?: Record<string, any>;
  evidence?: Record<string, string>;
}

export interface Business {
  id: string;
  name: string;
  legal_name?: string;
  category: string;
  sub_category?: string;
  description?: string;
  address_line1?: string;
  address_line2?: string;
  city: string;
  state_province?: string;
  postal_code?: string;
  country: string;
  latitude?: number;
  longitude?: number;
  official_website?: string;
  normalized_domain?: string;
  contact_page_url?: string;
  source_url?: string;
  social_links?: Record<string, string>;
  crm_status:
    | "new"
    | "researching"
    | "qualified"
    | "contact_permitted"
    | "contacted"
    | "interested"
    | "meeting_scheduled"
    | "proposal_sent"
    | "negotiation"
    | "converted"
    | "not_interested"
    | "do_not_contact";
  is_suppressed: boolean;
  first_discovered_at: string;
  last_verified_at?: string;
  created_at: string;
  contacts: Contact[];
  lead_scores: LeadScore[];
  website_audits: WebsiteAudit[];
}

export interface AnalyticsOverview {
  total_discovered_businesses: number;
  verified_identities: number;
  contacts_available: number;
  businesses_without_websites: number;
  website_improvement_opportunities: number;
  qualified_leads: number;
  interested_prospects: number;
  converted_clients: number;
  category_distribution: { category: string; count: number }[];
  opportunity_distribution: { tier: string; count: number }[];
  crm_distribution: { status: string; count: number }[];
}

export interface CategoryAcceptanceRate {
  category: string;
  total_called: number;
  accepted_count: number;
  rejected_count: number;
  acceptance_rate_pct: number;
}

export interface AcceptanceAnalytics {
  overall_calls: number;
  total_accepted: number;
  total_rejected: number;
  overall_acceptance_rate_pct: number;
  best_converting_category: string;
  category_breakdown: CategoryAcceptanceRate[];
}

export interface ScrapingJob {
  id: string;
  job_name: string;
  user_id?: string;
  user_name?: string;
  target_country: string;
  target_city: string;
  target_postal_code?: string;
  target_category: string;
  search_keywords?: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";

  progress_pct: number;
  records_found: number;
  records_qualified: number;
  error_message?: string;
  created_at: string;
}

export interface LeadSource {
  id: string;
  name: string;
  source_type: string;
  description?: string;
  reliability_score: number;
  is_authorized: boolean;
}

export interface OutreachRecord {
  id: string;
  business_id: string;
  channel: string;
  recipient?: string;
  subject?: string;
  generated_pitch: string;
  sent_pitch?: string;
  stage_step: number;
  template_id?: string;
  status: "draft" | "approved" | "sent" | "replied" | "declined";
  manual_approval_granted: boolean;
  sent_at?: string;
  created_at: string;
}

export interface OutreachTemplate {
  id: string;
  name: string;
  channel: string;
  stage_step: number;
  delay_days: number;
  subject_template: string;
  body_template: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface OutreachRenderResponse {
  subject: string;
  body: string;
  recipient?: string;
  channel: string;
  tokens_substituted: string[];
}

export interface FollowUpTask {
  id: string;
  business_id: string;
  title: string;
  due_date: string;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
}

export interface LeadNote {
  id: string;
  business_id: string;
  user_id?: string;
  content: string;
  created_at: string;
}

export interface SuppressionRecord {
  id: string;
  value: string;
  suppression_type: string;
  reason?: string;
  requested_at: string;
}

export interface CallLog {
  id: string;
  business_id: string;
  business_name?: string;
  business_category?: string;
  business_city?: string;
  user_id?: string;
  caller_name?: string;
  phone_number: string;
  outcome: "agreed" | "declined" | "callback_scheduled" | "no_answer" | "gatekeeper" | "wrong_number" | string;
  duration_seconds: number;
  project_type?: string;
  agreed_budget?: string;
  notes?: string;
  decline_reason?: string;
  scheduled_callback_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CallLogStats {
  total_calls_today: number;
  total_calls_all_time: number;
  total_agreed: number;
  total_declined: number;
  total_callbacks: number;
  acceptance_rate: number;
  top_converting_category?: string;
}

export interface TeamMember {
  id: string;
  email: string;
  full_name?: string;
  role: "admin" | "caller" | "sdr" | "developer" | string;
  is_active: boolean;
  phone?: string;
  daily_call_target: number;
  notes?: string;
  permissions?: Record<string, boolean>;
  created_at: string;
  updated_at: string;
  total_calls: number;
  accepted_deals: number;
  declined_calls: number;
  callbacks_scheduled: number;
  assigned_leads: number;
  conversion_rate: number;
}

export interface CompanyExpense {
  id: string;
  title: string;
  category: "ai_apis" | "cloud_deployments" | "telephony" | "proxies_scraping" | "payroll_team" | "software_tools" | "operations" | string;
  amount: number;
  currency: string;
  vendor: string;
  billing_type: "recurring_monthly" | "one_time" | "usage_based" | string;
  notes?: string;
  expense_date: string;
  logged_by_user_id?: string;
  logged_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CategorySpendDetail {
  category_key: string;
  category_name: string;
  total_amount: number;
  percentage: number;
  count: number;
}

export interface MonthlyTrendDetail {
  month_label: string;
  total_spend: number;
  ai_spend: number;
  cloud_spend: number;
  telephony_spend: number;
  other_spend: number;
}

export interface VendorSpendDetail {
  vendor: string;
  total_amount: number;
  percentage: number;
}

export interface FinancialAnalytics {
  total_spend_all_time: number;
  total_spend_this_month: number;
  average_monthly_burn: number;
  category_breakdown: CategorySpendDetail[];
  monthly_trends: MonthlyTrendDetail[];
  top_vendors: VendorSpendDetail[];
  pipeline_deal_revenue: number;
  net_profit: number;
  profit_margin_pct: number;
  cost_per_acquired_client: number;
  total_clients_acquired: number;
}

/* ─── Auth types ─────────────────────────────────────────── */
export interface UserResponse {
  id: string;
  email: string;
  full_name?: string;
  role: "admin" | "caller";
  is_active: boolean;
  permissions?: Record<string, boolean>;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: UserResponse;
}

export interface LoginJsonRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name?: string;
  role: "admin" | "caller";
}

export interface GoogleAuthRequest {
  credential: string;
}





