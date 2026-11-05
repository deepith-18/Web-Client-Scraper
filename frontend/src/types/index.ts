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

export interface ScrapingJob {
  id: string;
  job_name: string;
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


