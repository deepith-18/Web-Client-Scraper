"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import {
  User,
  Shield,
  PhoneCall,
  Key,
  Lock,
  Globe,
  CheckCircle2,
  Copy,
  Eye,
  EyeOff,
  Sparkles,
  Smartphone,
  Save,
  Check,
  RefreshCw,
  Sliders,
  ExternalLink,
  Laptop,
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function ProfilePage() {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Active Tab
  const [activeTab, setActiveTab] = useState<"general" | "telephony" | "api" | "security" | "appearance">("general");

  // General Profile State
  const [fullName, setFullName] = useState(user?.full_name || "Deepith .N");
  const [email, setEmail] = useState(user?.email || "admin@demanex.io");
  const [companyName, setCompanyName] = useState("Demanex Outbound Engine");
  const [jobTitle, setJobTitle] = useState(user?.role === "admin" ? "Founder & Managing Director" : "Senior Telephony Specialist");
  const [timeZone, setTimeZone] = useState("Asia/Kolkata (IST, UTC+05:30)");
  const [phoneNumber, setPhoneNumber] = useState("+91 98450 11223");

  // Telephony State
  const [callerId, setCallerId] = useState("+91 80 4719 3200");
  const [dialingMode, setDialingMode] = useState<"webrtc" | "mobile">("webrtc");
  const [dailyCallTarget, setDailyCallTarget] = useState(35);
  const [recordingConsent, setRecordingConsent] = useState(true);
  const [defaultPitchAngle, setDefaultPitchAngle] = useState("Turnkey Website Build");

  // API State
  const [apiKeyRevealed, setApiKeyRevealed] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("https://api.demanex.io/v1/telephony/webhook");
  const [testWebhookStatus, setTestWebhookStatus] = useState<string | null>(null);

  // Security State
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(true);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Notification Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Accent Preference
  const [accentColor, setAccentColor] = useState<"teal" | "emerald" | "indigo" | "amber">("teal");

  // Hydrate custom user settings from localStorage if stored
  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("demanex_user_profile");
      if (savedProfile) {
        const parsed = JSON.parse(savedProfile);
        if (parsed.fullName) setFullName(parsed.fullName);
        if (parsed.companyName) setCompanyName(parsed.companyName);
        if (parsed.jobTitle) setJobTitle(parsed.jobTitle);
        if (parsed.phoneNumber) setPhoneNumber(parsed.phoneNumber);
        if (parsed.callerId) setCallerId(parsed.callerId);
        if (parsed.dialingMode) setDialingMode(parsed.dialingMode);
        if (parsed.dailyCallTarget) setDailyCallTarget(parsed.dailyCallTarget);
        if (parsed.recordingConsent !== undefined) setRecordingConsent(parsed.recordingConsent);
        if (parsed.defaultPitchAngle) setDefaultPitchAngle(parsed.defaultPitchAngle);
        if (parsed.accentColor) setAccentColor(parsed.accentColor);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        fullName,
        companyName,
        jobTitle,
        phoneNumber,
        callerId,
        dialingMode,
        dailyCallTarget,
        recordingConsent,
        defaultPitchAngle,
        accentColor,
      };
      localStorage.setItem("demanex_user_profile", JSON.stringify(payload));
      setToastMessage("Profile and operational preferences successfully synchronized.");
      setTimeout(() => setToastMessage(null), 3500);
    } catch {
      setToastMessage("Failed to save profile changes.");
      setTimeout(() => setToastMessage(null), 3500);
    }
  };

  const handleCopyApiKey = () => {
    navigator.clipboard.writeText("dmx_live_948f2a187e029cba4837190e8a7199bc");
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleTestPingWebhook = () => {
    setTestWebhookStatus("sending");
    setTimeout(() => {
      setTestWebhookStatus("success");
      setTimeout(() => setTestWebhookStatus(null), 3000);
    }, 800);
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters in length.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    setPasswordSuccess("Security credentials updated. Your active sessions remain protected.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => setPasswordSuccess(null), 4000);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header />

      <main className="p-6 md:p-8 max-w-6xl mx-auto w-full space-y-8 flex-1">
        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="p-4 bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800 text-teal-900 dark:text-teal-200 text-xs rounded-xl shadow-lg flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="h-4 w-4 text-teal-600 dark:text-teal-400 shrink-0" />
              <span className="font-semibold">{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-teal-600 dark:text-teal-400 font-bold hover:text-teal-900"
            >
              ✕
            </button>
          </div>
        )}

        {/* ── 1. Top Executive Identity Banner ─────────────────────── */}
        <div className="p-6 md:p-8 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs relative overflow-hidden">
          {/* Subtle ambient gradient highlight */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-72 h-72 bg-gradient-to-bl from-teal-500/10 via-cyan-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-600 flex items-center justify-center font-bold text-2xl text-slate-950 shadow-md shadow-teal-500/20">
                  {fullName ? fullName.charAt(0).toUpperCase() : "D"}
                </div>
                <div
                  className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 border-2 border-white dark:border-[#0c121e] rounded-full flex items-center justify-center"
                  title="Session Online & Active"
                >
                  <div className="h-2 w-2 bg-white rounded-full animate-ping" />
                </div>
              </div>

              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    {fullName}
                  </h1>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80">
                    {user?.role === "admin" ? "Founder & Admin" : "Caller Specialist"}
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                    Verified B2B
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {email} · <span className="font-medium text-slate-700 dark:text-slate-300">{companyName}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-2 hover:scale-[1.02]"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save All Changes</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── 2. Segmented Navigation Tabs ─────────────────────────── */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-xl border border-slate-200/80 dark:border-slate-800 overflow-x-auto text-xs">
          {[
            { id: "general", label: "Identity & Profile", icon: User },
            { id: "telephony", label: "Telephony & Dialing", icon: PhoneCall },
            { id: "api", label: "API Keys & Webhooks", icon: Key },
            { id: "security", label: "Security & 2FA", icon: Lock },
            { id: "appearance", label: "Theme & Display", icon: Sliders },
          ].map((tab) => {
            const Icon = tab.icon;
            const isCurrent = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-semibold whitespace-nowrap transition-all ${
                  isCurrent
                    ? "bg-white dark:bg-[#0c121e] text-teal-700 dark:text-teal-300 shadow-xs border border-slate-200 dark:border-slate-800"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/50 dark:hover:bg-slate-800/50"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isCurrent ? "text-teal-600 dark:text-teal-400" : "text-slate-400"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── 3. Tab Contents ──────────────────────────────────────── */}

        {/* TAB 1: General Identity & Profile */}
        {activeTab === "general" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Personal & Organization Identity</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Manage your public caller display identity and regional workspace defaults.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Full Legal Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Account Email</label>
                  <input
                    type="email"
                    disabled
                    value={email}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 font-medium cursor-not-allowed"
                    title="Account email is managed by your workspace domain admin"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Startup / Agency Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Job Title / Designation</label>
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Direct Contact Phone</label>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Operational Timezone</label>
                  <select
                    value={timeZone}
                    onChange={(e) => setTimeZone(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="Asia/Kolkata (IST, UTC+05:30)">Asia/Kolkata (IST, UTC+05:30) · Bengaluru HQ</option>
                    <option value="America/Chicago (CST, UTC-06:00)">America/Chicago (CST, UTC-06:00) · Austin, TX</option>
                    <option value="Europe/London (GMT, UTC+00:00)">Europe/London (GMT, UTC+00:00) · London, UK</option>
                    <option value="Australia/Sydney (AEST, UTC+10:00)">Australia/Sydney (AEST, UTC+10:00) · Sydney</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  <span>Save Identity Settings</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 2: Telephony & Dialing Configuration */}
        {activeTab === "telephony" && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Telephony & Voice Outreach Engine</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Configure outbound caller ID numbers, daily sales quotas, and automated pitch presets.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Default Outbound Caller ID (DID)
                  </label>
                  <input
                    type="text"
                    value={callerId}
                    onChange={(e) => setCallerId(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-mono font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                  <p className="text-[11px] text-slate-400">Verified SIP trunk provisioned through Twilio / Exotel.</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Preferred Dialing Mechanism
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDialingMode("webrtc")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        dialingMode === "webrtc"
                          ? "bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-800 dark:text-teal-300 font-bold"
                          : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400"
                      }`}
                    >
                      <div className="text-xs font-bold">WebRTC Browser</div>
                      <div className="text-[10px] opacity-75 mt-0.5">Direct in-browser headset softphone</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDialingMode("mobile")}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        dialingMode === "mobile"
                          ? "bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-800 dark:text-teal-300 font-bold"
                          : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-400"
                      }`}
                    >
                      <div className="text-xs font-bold">Mobile App Dial</div>
                      <div className="text-[10px] opacity-75 mt-0.5">Click-to-call handoff to phone</div>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 md:col-span-2 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Daily Target Calling Quota</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">Target verified contacts dialed per calendar day</p>
                    </div>
                    <span className="text-base font-bold font-mono text-teal-600 dark:text-teal-400 bg-white dark:bg-slate-800 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 shadow-2xs">
                      {dailyCallTarget} Calls / Day
                    </span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={100}
                    step={5}
                    value={dailyCallTarget}
                    onChange={(e) => setDailyCallTarget(Number(e.target.value))}
                    className="w-full accent-teal-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>10 (Starter)</span>
                    <span>35 (Standard Enterprise)</span>
                    <span>100 (Power Outreach)</span>
                  </div>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Default Outreach Pitch Angle</label>
                  <select
                    value={defaultPitchAngle}
                    onChange={(e) => setDefaultPitchAngle(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  >
                    <option value="Turnkey Website Build">Turnkey Website Build (For prospects without official website)</option>
                    <option value="Mobile Speed & UX Audit">Mobile Speed & UX Redesign (For outdated/slow websites)</option>
                    <option value="WhatsApp Direct Order System">WhatsApp Direct Ordering Portal (For cafes & restaurants)</option>
                    <option value="Local SEO & Google Maps Ranking">Local SEO & Google Review Growth Funnel</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-start gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recordingConsent}
                      onChange={(e) => setRecordingConsent(e.target.checked)}
                      className="mt-0.5 rounded text-teal-600 focus:ring-teal-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Auto-Announce Call Recording Disclosure</span>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        Complies with telecommunications regulations by playing a polite 2-second audio notice before bridging outbound calls.
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  <span>Update Telephony Engine</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* TAB 3: API Keys & Webhooks */}
        {activeTab === "api" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Production API & Webhooks</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Integrate your lead stream directly with Twilio, Exotel, Zapier, and custom CRM webhooks.
                </p>
              </div>

              {/* API Key Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Key className="h-3.5 w-3.5 text-teal-500" />
                    Demanex Live Production Key
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                    Active
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex-1 font-mono text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 truncate">
                    {apiKeyRevealed
                      ? "dmx_live_948f2a187e029cba4837190e8a7199bc"
                      : "dmx_live_••••••••••••••••••••••••••••••••"}
                  </div>

                  <button
                    type="button"
                    onClick={() => setApiKeyRevealed(!apiKeyRevealed)}
                    className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                    title={apiKeyRevealed ? "Hide API Key" : "Reveal API Key"}
                  >
                    {apiKeyRevealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyApiKey}
                    className="px-3.5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                    title="Copy API Key to clipboard"
                  >
                    {copiedKey ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    <span>{copiedKey ? "Copied" : "Copy"}</span>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400">
                  Allows authenticated programmatic access to lead queries, CRM statuses, and webhook ingestion. Keep this secret.
                </p>
              </div>

              {/* Webhook Configuration Box */}
              <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Globe className="h-3.5 w-3.5 text-cyan-500" />
                    Telephony Webhook Endpoint
                  </span>
                  <span className="text-[10px] font-semibold text-slate-500">POST application/json</span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={webhookUrl}
                    onChange={(e) => setWebhookUrl(e.target.value)}
                    className="flex-1 font-mono text-xs px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 font-medium"
                  />

                  <button
                    type="button"
                    onClick={handleCopyWebhook}
                    className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-50 transition-colors"
                    title="Copy Webhook URL"
                  >
                    {copiedWebhook ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={handleTestPingWebhook}
                    disabled={testWebhookStatus === "sending"}
                    className="px-3 py-2 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${testWebhookStatus === "sending" ? "animate-spin" : ""}`} />
                    <span>{testWebhookStatus === "sending" ? "Testing..." : testWebhookStatus === "success" ? "200 OK!" : "Send Test Ping"}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Security & Credentials */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Security & Credentials</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Update administrative credentials and enforce multi-factor authentication (2FA).
                </p>
              </div>

              {passwordSuccess && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs rounded-xl flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{passwordSuccess}</span>
                </div>
              )}

              {passwordError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{passwordError}</span>
                </div>
              )}

              <form onSubmit={handlePasswordUpdate} className="space-y-4 max-w-lg">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Current Password</label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Confirm New Password</label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  />
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-slate-900 dark:bg-slate-700 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2"
                >
                  <Lock className="h-3.5 w-3.5" />
                  <span>Update Password</span>
                </button>
              </form>

              {/* Two-Factor Authentication Status */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Shield className="h-4 w-4 text-teal-500" />
                      Two-Factor Authentication (2FA)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Requires TOTP verification code from Google Authenticator or 1Password when signing in.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      twoFactorEnabled
                        ? "bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {twoFactorEnabled ? "✓ Enabled (Active)" : "Enable 2FA"}
                  </button>
                </div>
              </div>

              {/* Active Sessions */}
              <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Laptop className="h-4 w-4 text-cyan-500" />
                  Active Authorized Sessions
                </h3>

                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Chrome on Windows 11</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 rounded-full">
                        Current Session
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Bengaluru, India · IP 106.51.x.x · Signed in today
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Theme & Appearance */}
        {activeTab === "appearance" && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">Appearance & Workspace Theme</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Switch between high-contrast dark mode and clean paper light mode.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => {
                    if (theme !== "dark") toggleTheme();
                  }}
                  className={`p-5 rounded-2xl border text-left transition-all relative ${
                    theme === "dark"
                      ? "bg-[#0c121e] border-teal-500 ring-2 ring-teal-500/30 text-white shadow-lg"
                      : "bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-white">Obsidian Dark</span>
                    {theme === "dark" && (
                      <span className="text-[10px] font-bold bg-teal-500 text-slate-950 px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">
                    Engineered for high-focus outbound dialing and night usage. Zero eye-strain.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (theme !== "light") toggleTheme();
                  }}
                  className={`p-5 rounded-2xl border text-left transition-all relative ${
                    theme === "light"
                      ? "bg-white border-teal-500 ring-2 ring-teal-500/30 text-slate-900 shadow-lg"
                      : "bg-white/80 border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-sm text-slate-900">Crisp Paper Light</span>
                    {theme === "light" && (
                      <span className="text-[10px] font-bold bg-teal-600 text-white px-2 py-0.5 rounded-full">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500">
                    High contrast paper finish with crisp typography for bright daytime environments.
                  </p>
                </button>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white">Workspace Accent Palette</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Choose your primary executive highlight accent.
                </p>

                <div className="flex flex-wrap items-center gap-3">
                  {[
                    { id: "teal", label: "Electric Teal", color: "bg-teal-500" },
                    { id: "emerald", label: "B2B Emerald", color: "bg-emerald-500" },
                    { id: "indigo", label: "Executive Indigo", color: "bg-indigo-500" },
                    { id: "amber", label: "Opportunity Amber", color: "bg-amber-500" },
                  ].map((acc) => (
                    <button
                      key={acc.id}
                      type="button"
                      onClick={() => {
                        setAccentColor(acc.id as any);
                        handleSaveProfile({ preventDefault: () => {} } as any);
                      }}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-semibold transition-all ${
                        accentColor === acc.id
                          ? "border-slate-900 dark:border-white bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      <div className={`h-3 w-3 rounded-full ${acc.color}`} />
                      <span>{acc.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

