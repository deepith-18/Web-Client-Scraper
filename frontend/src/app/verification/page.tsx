"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import {
  fetchVerificationSummary,
  verifyEmailDirect,
  verifyPhoneDirect,
} from "@/lib/api-client";
import {
  ShieldCheck,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Database,
  Lock,
} from "lucide-react";

export default function VerificationCentrePage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Email Test
  const [testEmail, setTestEmail] = useState("");
  const [testingEmail, setTestingEmail] = useState(false);
  const [emailResult, setEmailResult] = useState<any>(null);

  // Phone Test
  const [testPhone, setTestPhone] = useState("");
  const [testCountry, setTestCountry] = useState("IN");
  const [testingPhone, setTestingPhone] = useState(false);
  const [phoneResult, setPhoneResult] = useState<any>(null);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await fetchVerificationSummary();
      setSummary(data);
    } catch (err) {
      console.error("Failed to load verification summary", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const handleTestEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) return;
    setTestingEmail(true);
    setEmailResult(null);
    try {
      const res = await verifyEmailDirect(testEmail.trim());
      setEmailResult(res);
    } catch (err: any) {
      setEmailResult({ error: err.message });
    } finally {
      setTestingEmail(false);
    }
  };

  const handleTestPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone.trim()) return;
    setTestingPhone(true);
    setPhoneResult(null);
    try {
      const res = await verifyPhoneDirect(testPhone.trim(), testCountry);
      setPhoneResult(res);
    } catch (err: any) {
      setPhoneResult({ error: err.message });
    } finally {
      setTestingPhone(false);
    }
  };

  return (
    <>
      <Header />

      <main className="p-8 space-y-8 flex-1">
        {/* Title */}
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Verification Centre</h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Module C: Independent verification engine for DNS/MX records, disposable email blocking, and international phone validation.
          </p>
        </div>

        {/* Verification Summary KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Verified Contacts</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {summary?.verified_records ?? 0}
            </div>
            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 block">Valid & MX Confirmed</span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Verification Runs</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {summary?.total_verifications ?? 0}
            </div>
            <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">Independent checks recorded</span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Disposable Emails Filtered</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {summary?.disposable_emails ?? 0}
            </div>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 mt-1 block">Excluded from outreach</span>
          </div>

          <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Invalid Records Flagged</span>
            <div className="text-2xl font-bold text-slate-900 dark:text-white mt-2">
              {summary?.invalid_records ?? 0}
            </div>
            <span className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 block">Syntax / format errors</span>
          </div>
        </div>

        {/* Interactive Verification Testing Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Email MX & Syntax Validator */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Direct Email & DNS/MX Record Checker
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Validates RFC 5322 syntax, blocks temporary/disposable inboxes, and queries live DNS mail exchangers.
            </p>

            <form onSubmit={handleTestEmail} className="flex gap-2">
              <input
                type="email"
                placeholder="contact@business.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={testingEmail || !testEmail.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                {testingEmail ? "Testing..." : "Verify MX"}
              </button>
            </form>

            {emailResult?.error ? (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{emailResult.error}</span>
              </div>
            ) : emailResult ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{emailResult.email}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      emailResult.verification_status === "mx_confirmed"
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                        : "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60"
                    }`}
                  >
                    {emailResult.verification_status}
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 space-y-1 text-[11px]">
                  <div>Syntax Valid: {emailResult.is_valid_syntax ? "Yes" : "No"}</div>
                  <div>Disposable Blocked: {emailResult.is_disposable ? "Yes" : "No"}</div>
                  <div>Has Active MX: {emailResult.has_mx_records ? "Yes" : "No"}</div>
                  {emailResult.mx_hosts?.length > 0 && (
                    <div className="text-slate-500 dark:text-slate-400 truncate">
                      Exchangers: {emailResult.mx_hosts.join(", ")}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>

          {/* Global Phone Validator */}
          <div className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                International Phone Normalizer (E.164)
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Parses Indian 10-digit formats, US, UK, and European numbers with carrier and line type detection.
            </p>

            <form onSubmit={handleTestPhone} className="flex gap-2">
              <select
                value={testCountry}
                onChange={(e) => setTestCountry(e.target.value)}
                className="w-24 px-2 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 focus:outline-none"
              >
                <option value="IN">India (+91)</option>
                <option value="US">USA (+1)</option>
                <option value="GB">UK (+44)</option>
                <option value="AU">Australia (+61)</option>
                <option value="SG">Singapore (+65)</option>
              </select>
              <input
                type="text"
                placeholder="+91 98450 11223"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="submit"
                disabled={testingPhone || !testPhone.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors"
              >
                {testingPhone ? "Checking..." : "Validate"}
              </button>
            </form>

            {phoneResult?.error ? (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-800 dark:text-rose-300 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-rose-600 dark:text-rose-400 shrink-0" />
                <span>{phoneResult.error}</span>
              </div>
            ) : phoneResult ? (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {phoneResult.e164_format || phoneResult.raw_input}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      phoneResult.is_valid_format
                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60"
                        : "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60"
                    }`}
                  >
                    {phoneResult.is_valid_format ? "Valid Format" : "Invalid Format"}
                  </span>
                </div>
                <div className="text-slate-600 dark:text-slate-300 space-y-1 text-[11px]">
                  <div>Country: {phoneResult.country_code}</div>
                  <div>Line Type: {phoneResult.carrier_type || "Unknown"}</div>
                  <div>E.164 Formatted: {phoneResult.e164_format || "N/A"}</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </main>
    </>
  );
}

