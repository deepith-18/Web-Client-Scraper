"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe2, PhoneCall, Eye, EyeOff, Mail, Lock, User, Chrome, ArrowRight, Building2, AlertCircle } from "lucide-react";
import { loginJson, googleAuth, register } from "@/lib/api-client";
import { signInWithGoogle } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/lib/theme-context";

type Tab = "login" | "signup";

export default function CallerPortalPage() {
  const router = useRouter();
  const { setActiveUser } = useAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirect = () => router.push("/calling");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp = await loginJson({ email, password });
      if (resp.user.role !== "caller") {
        setError("This account is an Administrator. Please use the Admin Portal.");
        return;
      }
      localStorage.setItem("demanex_token", resp.access_token);
      setActiveUser(resp.user);
      redirect();
    } catch (err: any) {
      setError(err.message || "Failed to log in as caller.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp = await register({ email, password, full_name: fullName, role: "caller" });
      localStorage.setItem("demanex_token", resp.access_token);
      setActiveUser(resp.user);
      redirect();
    } catch (err: any) {
      setError(err.message || "Failed to create caller account.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      const { user: firebaseUser } = await signInWithGoogle();
      const resp = await googleAuth({
        credential: await firebaseUser.getIdToken(),
        email: firebaseUser.email ?? "",
        full_name: firebaseUser.displayName ?? undefined,
        role: "caller",
      });
      if (resp.user.role !== "caller") {
        setError("This account is an Administrator. Please sign in via the Admin Portal.");
        return;
      }
      localStorage.setItem("demanex_token", resp.access_token);
      setActiveUser(resp.user);
      redirect();
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") return;
      setError(err.message ?? "Google sign-in failed. Check Firebase config.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 dark:bg-[#070b14] flex text-slate-100 transition-colors">
      {/* ── Left branding panel ─────────────────────────── */}
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-emerald-950/40 to-slate-950 border-r border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Globe2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-xl tracking-tight">Demanex</span>
              <p className="text-slate-400 text-xs font-medium">Caller Desk</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
              <PhoneCall className="h-3 w-3" />
              Caller Portal
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              High-velocity<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400">
                cold calling desk
              </span>
            </h1>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm">
              Work through qualified local leads, log client call outcomes, book callbacks, and hand off deals directly to the Demanex developer.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Live Telephony Desk", desc: "Talking points & instant dialing" },
              { label: "Call History Logs", desc: "Full CRUD & outcome audit" },
              { label: "Lead Directory", desc: "Assigned prospects & phones" },
              { label: "Daily Call Targets", desc: "Track conversions & quotas" },
            ].map((f) => (
              <div key={f.label} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <p className="text-white text-sm font-semibold">{f.label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Caller Permissions Notice */}
          <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
            <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">Caller Scope & Boundaries</p>
            <div className="space-y-1.5 text-xs text-slate-400">
              <div className="flex items-center gap-2 text-emerald-400">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                <span>Granted: Dialing, Lead Updates, Call Logging, Acceptance Tracking</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <div className="h-1.5 w-1.5 rounded-full bg-slate-600" />
                <span>Restricted: Company Spending, Team Management & Scraper Config</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <Building2 className="h-3.5 w-3.5" />
          <span>Are you an admin?</span>
          <a href="/admin" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors underline">
            Go to Admin Portal
          </a>
        </div>
      </div>

      {/* ── Right auth panel ────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-6 right-6 lg:hidden">
          <ThemeToggle />
        </div>

        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-2 mb-8">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-500 flex items-center justify-center">
              <Globe2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">Demanex</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold mb-6">
            <PhoneCall className="h-3 w-3" />
            Caller Portal — Telephony Desk
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">
            {tab === "login" ? "Welcome back, Teammate" : "Join the calling team"}
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            {tab === "login"
              ? "Sign in to access your assigned leads and dialer queue"
              : "Register your caller profile to begin calling"}
          </p>

          {/* Tab switcher */}
          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl mb-6">
            <button
              onClick={() => {
                setTab("login");
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === "login"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setTab("signup");
                setError(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                tab === "signup"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2.5">
              <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={tab === "login" ? handleLogin : handleSignup} className="space-y-3.5">
            {tab === "signup" && (
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                placeholder="caller@demanex.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type={showPass ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-3 bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all mt-1 shadow-lg shadow-emerald-600/25"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{tab === "login" ? "Sign In to Caller Desk" : "Create Caller Account"}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-slate-800" />
            <span className="text-slate-500 text-xs">or sign in with</span>
            <div className="flex-1 h-px bg-slate-800" />
          </div>

          {/* Google Auth Button */}
          <button
            onClick={handleGoogle}
            disabled={loading}
            className="w-full py-3 bg-slate-900 hover:bg-slate-800/90 border border-slate-800 hover:border-slate-700 text-white font-medium rounded-xl text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-50 shadow-sm"
          >
            <Chrome className="h-4 w-4 text-emerald-400" />
            <span>Continue with Google</span>
          </button>

          {/* Admin portal link */}
          <p className="mt-8 text-center text-slate-500 text-xs">
            Are you an administrator?{" "}
            <a href="/admin" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors underline">
              Switch to Admin Portal
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
