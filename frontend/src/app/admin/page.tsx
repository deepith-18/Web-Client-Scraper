"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe2, Shield, Eye, EyeOff, Mail, Lock, User, Chrome, ArrowRight, Building2, AlertCircle } from "lucide-react";
import { loginJson, googleAuth, register } from "@/lib/api-client";
import { signInWithGoogle } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/lib/theme-context";

type Tab = "login" | "signup";

export default function AdminPortalPage() {
  const router = useRouter();
  const { setActiveUser } = useAuth();
  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirect = () => router.push("/");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp = await loginJson({ email, password });
      if (resp.user.role !== "admin") {
        setError("This account is registered as a Caller. Please sign in through the Caller Portal.");
        return;
      }
      localStorage.setItem("demanex_token", resp.access_token);
      setActiveUser(resp.user);
      redirect();
    } catch (err: any) {
      setError(err.message || "Failed to log in as administrator.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp = await register({ email, password, full_name: fullName, role: "admin" });
      localStorage.setItem("demanex_token", resp.access_token);
      setActiveUser(resp.user);
      redirect();
    } catch (err: any) {
      setError(err.message || "Failed to create administrator account.");
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
        role: "admin",
      });
      if (resp.user.role !== "admin") {
        setError("This Google account is assigned the Caller role. Please sign in via the Caller Portal.");
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
      <div className="hidden lg:flex lg:w-[45%] flex-col justify-between p-12 bg-gradient-to-br from-slate-950 via-blue-950/40 to-slate-950 border-r border-slate-800/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Globe2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-white text-xl tracking-tight">Demanex</span>
              <p className="text-slate-400 text-xs font-medium">Startup Agency OS</p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        <div className="space-y-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
              <Shield className="h-3 w-3" />
              Admin Portal
            </div>
            <h1 className="text-4xl font-bold text-white leading-tight">
              Full agency<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-emerald-400">
                command centre
              </span>
            </h1>
            <p className="mt-4 text-slate-400 text-sm leading-relaxed max-w-sm">
              Manage your team, track company spending, run live discovery scrapers, and control every part of your Demanex lead acquisition engine.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {[
              { label: "Team & Roles", desc: "Manage employees & limits" },
              { label: "Company Spend", desc: "AI, cloud & telephony burn" },
              { label: "Live Scraping", desc: "Automated business discovery" },
              { label: "Deal Analytics", desc: "Win rates & pipeline metrics" },
            ].map((f) => (
              <div key={f.label} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <p className="text-white text-sm font-semibold">{f.label}</p>
                <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-500 text-xs">
          <Building2 className="h-3.5 w-3.5" />
          <span>Not an admin?</span>
          <a href="/caller" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors underline">
            Go to Caller Portal
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
            <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-blue-600 via-indigo-600 to-emerald-500 flex items-center justify-center">
              <Globe2 className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white text-lg">Demanex</span>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold mb-6">
            <Shield className="h-3 w-3" />
            Admin Portal — Full Agency Control
          </div>

          <h2 className="text-2xl font-bold text-white mb-1">
            {tab === "login" ? "Welcome back, Founder" : "Create admin account"}
          </h2>
          <p className="text-slate-400 text-sm mb-8">
            {tab === "login"
              ? "Sign in to manage Demanex operations and team"
              : "Register the primary administrator account"}
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
                  ? "bg-blue-600 text-white shadow-sm"
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
                  ? "bg-blue-600 text-white shadow-sm"
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
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="email"
                placeholder="admin@demanex.io"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
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
                className="w-full pl-10 pr-10 py-3 bg-slate-900/90 border border-slate-800 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:border-blue-500 transition-colors"
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
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2 transition-all mt-1 shadow-lg shadow-blue-600/25"
            >
              {loading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{tab === "login" ? "Sign In to Admin" : "Create Admin Account"}</span>
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
            <Chrome className="h-4 w-4 text-blue-400" />
            <span>Continue with Google</span>
          </button>

          {/* Caller portal link */}
          <p className="mt-8 text-center text-slate-500 text-xs">
            Are you a caller?{" "}
            <a href="/caller" className="text-emerald-400 hover:text-emerald-300 font-semibold transition-colors underline">
              Switch to Caller Portal
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
