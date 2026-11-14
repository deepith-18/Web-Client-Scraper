"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/layout/sidebar";
import { useAuth } from "@/lib/auth-context";
import type { ReactNode } from "react";

// Standalone auth portal routes — full-screen, no shell, no sidebar
const PORTAL_ROUTES = ["/admin", "/caller"];

// Callers are strictly restricted to these routes only
const CALLER_ALLOWED_PREFIXES = ["/calling", "/leads", "/profile", "/about"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  const currentPath = pathname || "";
  const isPortalRoute = PORTAL_ROUTES.some(
    (r) => currentPath === r || currentPath.startsWith(r + "/")
  );

  useEffect(() => {
    if (loading || isPortalRoute) return;

    // Not logged in -> send to Admin Portal login
    if (!user) {
      router.replace("/admin");
      return;
    }

    // STRICT CALLER ACCESS SEPARATION:
    // If user is a caller, they MUST NOT access admin modules (/finance, /team, /discover, /audits, /scoring, /pipeline, /outreach, /analytics, /settings, and the root admin overview /)
    if (user.role === "caller") {
      const isAllowed = CALLER_ALLOWED_PREFIXES.some(
        (prefix) => currentPath === prefix || currentPath.startsWith(prefix + "/")
      );
      if (!isAllowed) {
        // Redirect unauthorized caller immediately to their dedicated Live Caller Desk
        router.replace("/calling");
      }
    }
  }, [currentPath, user, loading, isPortalRoute, router]);

  // Auth pages (Admin / Caller sign-in / sign-up) -> render standalone full screen
  if (isPortalRoute) {
    return <>{children}</>;
  }

  // Show sleek loading state while checking session
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] flex flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 border-2 border-slate-300 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Authenticating Demanex session...</p>
      </div>
    );
  }

  // If unauthenticated, display elegant redirecting splash rather than a blank screen
  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-[#070b14] flex flex-col items-center justify-center gap-4 text-slate-800 dark:text-slate-200">
        <div className="h-8 w-8 border-2 border-slate-300 dark:border-slate-700 border-t-blue-500 rounded-full animate-spin" />
        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">Redirecting to Demanex Portal...</p>
          <p className="text-xs text-slate-400">Please sign in to access Demanex.</p>
        </div>
        <a
          href="/admin"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          Go to Admin Sign In
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100 transition-colors">
      <Sidebar />
      <div className="flex-1 ml-64 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  );
}
