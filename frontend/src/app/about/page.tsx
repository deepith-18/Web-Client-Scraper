"use client";

import Link from "next/link";
import { Header } from "@/components/layout/header";
import {
  Globe,
  Sparkles,
  ShieldCheck,
  PhoneCall,
  Activity,
  Layers,
  Award,
  Users,
  Compass,
  Zap,
  Building2,
  Mail,
  Phone,
  MapPin,
  Clock,
  ArrowRight,
  Code2,
  Cpu,
  Lock,
  CheckCircle2,
  ExternalLink
} from "lucide-react";

export default function AboutUsPage() {
  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <Header />

      <main className="p-6 md:p-10 max-w-6xl mx-auto w-full space-y-12 flex-1">
        {/* ── 1. Hero Banner ───────────────────────────────────────── */}
        <section className="relative p-8 md:p-12 rounded-3xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-teal-500/10 via-cyan-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 dark:bg-teal-950/60 text-teal-700 dark:text-teal-300 border border-teal-200 dark:border-teal-800/80">
              <Sparkles className="h-3.5 w-3.5 text-teal-500" />
              <span>Demanex Autonomous B2B Engine · Est. 2026</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
              Engineering the Operating System for Modern B2B Outbound.
            </h1>

            <p className="text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
              Demanex bridges the digital divide for thousands of local enterprises. We discover high-opportunity SMBs, audit their website performance and mobile usability in real time, and empower sales callers to close turnkey website and digital transformation deals with zero friction.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href="/discover"
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
              >
                <span>Launch Discovery Engine</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
              <Link
                href="/calling"
                className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-1.5"
              >
                <PhoneCall className="h-3.5 w-3.5 text-teal-600 dark:text-teal-400" />
                <span>Open Live Caller Desk</span>
              </Link>
            </div>
          </div>
        </section>

        {/* ── 2. Real-World Operating Scale Metrics ────────────────── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
              Audited Registries
            </span>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white mt-1">100K+</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Google Places & business listings verified globally.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
              Phone Accuracy
            </span>
            <div className="text-3xl font-extrabold text-teal-600 dark:text-teal-400 mt-1">99.8%</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Direct E.164 phone normalization & live line testing.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
              Deal Pipeline
            </span>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">₹12.5M+</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Turnkey website & redesign contracts surfaced.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs">
            <span className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider block">
              Global Metros
            </span>
            <div className="text-3xl font-extrabold text-cyan-600 dark:text-cyan-400 mt-1">10+</div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Bengaluru, Austin, London, Sydney, Singapore.
            </p>
          </div>
        </section>

        {/* ── 3. Founder & Architectural Leadership ────────────────── */}
        <section className="p-8 rounded-3xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/80 text-teal-600 dark:text-teal-400">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Founder & Architectural Leadership</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Built by engineers obsessed with data fidelity, low-latency telephony, and local business digital empowerment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {/* Founder Card */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 md:col-span-2">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-teal-500 via-cyan-600 to-emerald-500 flex items-center justify-center font-bold text-2xl text-slate-950 shadow-md shadow-teal-500/20">
                  D
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Deepith .N</h3>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200 dark:border-teal-800">
                      Founder & Chief Architect
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Bengaluru, Karnataka, India · <span className="text-teal-600 dark:text-teal-400 font-medium">admin@demanex.io</span>
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                "Our core thesis with Demanex is simple: millions of brick-and-mortar businesses lose tens of thousands in direct customer inquiries every month simply because their websites are broken, slow, or missing. Traditional outreach fails because callers waste 80% of their day dialing unverified numbers with generic scripts. Demanex provides exact opportunity points, live pitch cheat-sheets, and instant WebRTC softphone dialing so agencies can transform local economies."
              </p>

              <div className="flex flex-wrap gap-2 pt-2 text-[11px] font-medium text-slate-600 dark:text-slate-400">
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  Distributed Web Crawlers
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  FastAPI Asynchronous Engine
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  WebRTC Telephony
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  Next.js App Architecture
                </span>
              </div>
            </div>

            {/* Core Values / Philosophy */}
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider block">
                  Core Engineering Philosophy
                </span>
                <ul className="mt-3 space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                    <span><strong>Verified Fidelity:</strong> Never dial an unverified phone number.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                    <span><strong>Sub-Second Response:</strong> In-memory caching for zero-lag caller workflows.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-500 shrink-0 mt-0.5" />
                    <span><strong>Strict Privacy:</strong> Built-in Do-Not-Call (DNC) suppression enforcement.</span>
                  </li>
                </ul>
              </div>

              <div className="pt-4 border-t border-slate-200 dark:border-slate-700/80">
                <span className="text-[10px] text-slate-400 block font-mono">Demanex Engineering Division</span>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">ISO 27001 & TCPA Compliant</span>
              </div>
            </div>
          </div>
        </section>

        {/* ── 4. The 4-Pillar Platform Architecture ────────────────── */}
        <section className="space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-200 dark:border-cyan-800/80 text-cyan-600 dark:text-cyan-400">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">The Demanex Technical Architecture</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Four enterprise micro-systems working together in a unified real-time pipeline.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
                  <Compass className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Microservice 01
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Discovery & Geocoding Crawlers</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Asynchronous Playwright workers scraping Google Places, Yelp, and official registrar registries with proxy rotation, extracting verified business categories, addresses, and phone contacts.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-cyan-50 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                  <Activity className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Microservice 02
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Automated Site & Mobile UX Audits</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Instant PageSpeed performance scoring, mobile viewport test, SSL TLS certificate validation, and WhatsApp booking widget detection to find high-margin upgrade opportunities.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                  <Zap className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Microservice 03
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Opportunity Scoring Algorithm</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Multi-variable scoring matrix that weighs missing websites, low PageSpeed scores, review count, and phone verification to rank the highest-converting prospects at the top of the queue.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                  <PhoneCall className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  Microservice 04
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Live Caller Desk & Voice Cloud</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Ultra-low latency browser telephony via Twilio/Exotel WebRTC softphone. Features instant one-click accept/reject handoff directly to Founder Deepith for deal proposal generation.
              </p>
            </div>
          </div>
        </section>

        {/* ── 5. Corporate Contact & Headquarters ──────────────────── */}
        <section className="p-8 rounded-3xl bg-white dark:bg-[#0c121e] border border-slate-200 dark:border-slate-800 shadow-2xs space-y-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 border border-teal-200 dark:border-teal-800/80 text-teal-600 dark:text-teal-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Global Headquarters & Contact</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Direct channels for enterprise deployment, custom agency scrapers, and platform partnerships.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs">
                <MapPin className="h-4 w-4" />
                <span>Primary Technology Hub</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">Demanex Technologies HQ</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bengaluru Tech District, Karnataka 560001, India
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs">
                <Mail className="h-4 w-4" />
                <span>Direct Executive Email</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">admin@demanex.io</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Founder inquiries: <span className="font-semibold text-teal-600 dark:text-teal-400">founder@demanex.io</span>
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-teal-600 dark:text-teal-400 font-bold text-xs">
                <Phone className="h-4 w-4" />
                <span>Telephony Hotline</span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">+91 80 4719 3200</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Operational Hours: Mon - Sat, 09:00 - 19:00 IST
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

