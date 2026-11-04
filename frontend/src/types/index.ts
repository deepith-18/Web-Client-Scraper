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
  authenticity_score: number;
  email_available_score: number;
  score_breakdown?: Record<string, any>;
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

