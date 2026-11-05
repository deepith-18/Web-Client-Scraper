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
    category: "Scraping & Discovery"
  },
  {
    key: "can_call",
    label: "Telephony Desk & Dialing",
    description: "Access Caller Desk, click-to-dial, talking points cheat-sheet",
    category: "Calling & Outreach"
  },
  {
    key: "can_view_leads",
    label: "Explore Lead Directory",
    description: "Browse, filter, and inspect discovered prospects and phone numbers",
    category: "Data & CRM"
  },
  {
    key: "can_edit_leads",
    label: "Edit Leads & Statuses",
    description: "Modify lead CRM pipeline stages, add notes, and adjust budgets",
    category: "Data & CRM"
  },
  {
    key: "can_delete_leads",
    label: "Delete Leads & Logs",
    description: "Permanently delete lead records or call log entries",
    category: "Data & CRM"
  },
  {
    key: "can_export_data",
    label: "Export CSV Reports",
    description: "Download client lists, phone numbers, and call logs to CSV",
    category: "Data & CRM"
  },
  {
    key: "can_view_audits",
    label: "Technical Website Audits",
    description: "Inspect mobile viewports, SSL status, and code deficiencies",
    category: "Scraping & Discovery"
  },
  {
    key: "can_manage_templates",
    label: "Outreach Template Studio",
    description: "Create and edit multi-touch email sequences and LinkedIn pitches",
    category: "Calling & Outreach"
  },
  {
    key: "can_view_analytics",
    label: "Financial & Win Analytics",
    description: "Access category win rates, conversion trends, and caller leaderboard",
    category: "Administration"
  },
  {
    key: "can_manage_team",
    label: "Team & Role Control",
    description: "Add employees, set call targets, and grant granular permissions",
    category: "Administration"
  }
];

export function getActiveUser() {
  if (typeof window === "undefined") {
    return {
      id: "admin-default",
      full_name: "Deepith",
      email: "admin@prospectiq.io",
      role: "admin",
      permissions: {
        can_discover: true,
        can_call: true,
        can_view_leads: true,
        can_edit_leads: true,
        can_delete_leads: true,
        can_export_data: true,
        can_view_audits: true,
        can_manage_templates: true,
        can_manage_team: true,
        can_view_analytics: true
      }
    };
  }

  const stored = localStorage.getItem("prospectiq_active_user");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // fallback
    }
  }

  // Default to Deepith (Admin)
  return {
    id: "admin-default",
    full_name: "Deepith",
    email: "admin@prospectiq.io",
    role: "admin",
    permissions: {
      can_discover: true,
      can_call: true,
      can_view_leads: true,
      can_edit_leads: true,
      can_delete_leads: true,
      can_export_data: true,
      can_view_audits: true,
      can_manage_templates: true,
      can_manage_team: true,
      can_view_analytics: true
    }
  };
}

export function setActiveUser(user: any) {
  if (typeof window !== "undefined") {
    localStorage.setItem("prospectiq_active_user", JSON.stringify(user));
    window.dispatchEvent(new Event("user-changed"));
  }
}

export function checkPermission(permissionKey: string): boolean {
  const user = getActiveUser();
  if (user.role === "admin") return true;
  return !!user.permissions?.[permissionKey];
}
