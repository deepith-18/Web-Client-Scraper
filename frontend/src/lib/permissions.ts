export interface PermissionDefinition {
  key: string;
  label: string;
  description: string;
  category: "Scraping & Discovery" | "Calling & Outreach" | "Data & CRM" | "Administration";
}

export const AVAILABLE_PERMISSIONS: PermissionDefinition[] = [
  {
    key: "can_discover",
    label: "Execute Discovery Scrapers",
    description: "Launch OpenStreetMap geospatial crawlers to harvest new leads",
    category: "Scraping & Discovery",
  },
  {
    key: "can_call",
    label: "Telephony Desk & Dialing",
    description: "Access Caller Desk, click-to-dial, talking points cheat-sheet",
    category: "Calling & Outreach",
  },
  {
    key: "can_view_leads",
    label: "Explore Lead Directory",
    description: "Browse, filter, and inspect discovered prospects and phone numbers",
    category: "Data & CRM",
  },
  {
    key: "can_edit_leads",
    label: "Edit Leads & Statuses",
    description: "Modify lead CRM pipeline stages, add notes, and adjust budgets",
    category: "Data & CRM",
  },
  {
    key: "can_delete_leads",
    label: "Delete Leads & Logs",
    description: "Permanently delete lead records or call log entries",
    category: "Data & CRM",
  },
  {
    key: "can_export_data",
    label: "Export CSV Reports",
    description: "Download client lists, phone numbers, and call logs to CSV",
    category: "Data & CRM",
  },
  {
    key: "can_view_audits",
    label: "Technical Website Audits",
    description: "Inspect mobile viewports, SSL status, and code deficiencies",
    category: "Scraping & Discovery",
  },
  {
    key: "can_manage_templates",
    label: "Outreach Template Studio",
    description: "Create and edit multi-touch email sequences and LinkedIn pitches",
    category: "Calling & Outreach",
  },
  {
    key: "can_view_analytics",
    label: "Financial & Win Analytics",
    description: "Access category win rates, conversion trends, and caller leaderboard",
    category: "Administration",
  },
  {
    key: "can_manage_team",
    label: "Team & Role Control",
    description: "Add employees, set call targets, and grant granular permissions",
    category: "Administration",
  },
];

/**
 * Returns the stored Demanex user from localStorage.
 * IMPORTANT: Returns null if unauthenticated. Never defaults to full admin!
 */
export function getActiveUser(): {
  id: string;
  full_name?: string;
  email: string;
  role: string;
  permissions?: Record<string, boolean>;
} | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem("demanex_user") || localStorage.getItem("prospectiq_user");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  return null;
}

/** @deprecated Use useAuth() from auth-context */
export function setActiveUser(user: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("demanex_user", JSON.stringify(user));
    window.dispatchEvent(new Event("user-changed"));
  }
}

/**
 * Check if the active user has a specific permission.
 * Admins automatically pass all checks.
 * Callers only pass if their role permissions explicitly allow it.
 * Returns false if unauthenticated.
 */
export function checkPermission(permissionKey: string): boolean {
  const user = getActiveUser();
  if (!user) return false;
  if (user.role === "admin") return true;
  return !!user.permissions?.[permissionKey];
}
