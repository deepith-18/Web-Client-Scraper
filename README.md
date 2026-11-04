# ProspectIQ 🎯
### Intelligent Freelance Client Acquisition & Business Opportunity Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2+-black.svg?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com)

---

## 📖 Overview

**ProspectIQ** is an enterprise-grade client acquisition platform purpose-built for freelance web developers and creative digital agencies. It automates the discovery of genuine local businesses across any city worldwide (with built-in support for Bengaluru, India and global markets such as the US, UK, Australia, Europe, and Asia), validates public business contact details, audits their existing websites for actionable development deficiencies, scores conversion potential (0–100), and manages client outreach.

> **Important**: This is a production-quality application with real database persistence, asynchronous background jobs, strict SSRF shielding, and interactive SaaS analytics.

---

## 📚 Essential Documentation

- 📐 **[System Design & Architecture (SYSTEM_DESIGN.md)](SYSTEM_DESIGN.md)**: Exhaustive technical topology, data flow diagrams, database schemas, scoring formulas, and security specs.
- 🚀 **[Step-by-Step Run & Deployment Guide (HOW_TO_RUN.md)](HOW_TO_RUN.md)**: Local development setup, database seeding, Docker Compose, automated test commands, and phase-wise GitHub commit instructions.

---

## 🌟 Core Modules

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ProspectIQ Core Modules                         │
├────────────────────────────────┬───────────────────────────────────────┤
│ Module A: Business Discovery   │ Worldwide & Bengaluru geospatial      │
│                                │ discovery via authorized registries   │
├────────────────────────────────┼───────────────────────────────────────┤
│ Module B: Contact Extraction   │ Public email, phone, domain, address  │
│                                │ with strict source provenance         │
├────────────────────────────────┼───────────────────────────────────────┤
│ Module C: Lead Verification    │ DNS/MX records, E.164 phone formats,   │
│                                │ SSL certificate inspection            │
├────────────────────────────────┼───────────────────────────────────────┤
│ Module D: Website Opportunity  │ Detects missing sites, broken SSL,    │
│           Analyzer             │ mobile breakage, missing contact form │
├────────────────────────────────┼───────────────────────────────────────┤
│ Module E: Lead Scoring Engine  │ 0–100 weighted opportunity matrix     │
│                                │ (High, Good, Medium, Low priority)   │
├────────────────────────────────┼───────────────────────────────────────┤
│ Module F: Lead CRM Pipeline    │ 12-stage CRM pipeline tracking, notes, │
│                                │ follow-ups, and suppression list      │
├────────────────────────────────┼───────────────────────────────────────┤
│ Module G: Outreach Manager     │ Personalized pitch generation with    │
│                                │ required manual approval queue        │
└────────────────────────────────┴───────────────────────────────────────┘
```

---

## 🗺️ Global Market Discovery

ProspectIQ is designed to acquire clients globally:
- 🇮🇳 **India / Bengaluru Primary**: Pre-configured filters for Indiranagar, Koramangala, Jayanagar, Whitefield, HSR Layout, etc.
- 🇺🇸 **United States**: Austin TX, San Francisco CA, New York NY, Seattle WA.
- 🇬🇧 **United Kingdom**: London, Manchester, Birmingham.
- 🇦🇺 **Australia**: Sydney, Melbourne, Brisbane.
- 🇸🇬 **Southeast Asia & Middle East**: Singapore, Dubai (UAE).

---

## 🛡️ Security, Privacy & Ethical Crawling

1. **SSRF Defense Shield**: Crawlers validate destination IPs prior to socket connection. Loopback (`127.0.0.1`), private RFC 1918 subnets, link-local, multicast, and cloud metadata endpoints (`169.254.169.254`) are strictly blocked.
2. **Zero CAPTCHA Bypassing**: Strict compliance with terms of service. Operates via permitted business directories, open geospatial registries (OSM Overpass), and official websites.
3. **No Private Data Harvesting**: Only gathers publicly available commercial business telephone and email records. Personal mobile numbers are never scraped.
4. **Anti-Spam & Manual Approval**: Zero automated mass mailing. Every outreach pitch requires explicit developer review and manual approval, conforming to Indian TRAI/DPDP, EU GDPR, and US CAN-SPAM standards.

---

## 🚀 Quick Start (Single-Command Launchers)

Launch the full stack in just two terminals without manual virtual environment or dependency configuration:

### Terminal 1 — Backend API Server
```powershell
.\run-backend.ps1
```
*(Or double-click `run-backend.bat`)*
- Automatically creates `.env`, initializes Python virtual environment, installs dependencies, seeds database with sample prospects, and starts FastAPI.
- Swagger API Docs: `http://localhost:8000/docs`

### Terminal 2 — Next.js Dashboard UI
```powershell
.\run-frontend.ps1
```
*(Or double-click `run-frontend.bat`)*
- Automatically installs frontend packages and starts Next.js with hot reload.
- Dashboard UI: `http://localhost:3000`
- Discovery Engine: `http://localhost:3000/discover`

---

## 🧪 Automated Test Suite

```bash
# Run backend test suite (Auth, Scoring Matrix, SSRF Shield)
backend\.venv\Scripts\pytest backend/tests

# Check frontend production build
cd frontend
npm run build
```

---

## 📋 Phase-Wise Development Roadmap

- [x] **Phase 1: Project Setup, Database Schema, Authentication & Frontend Layout**
  - Normalized SQLAlchemy models & SQLite/PostgreSQL support
  - Native Bcrypt hashing and JWT authentication
  - SSRF protection engine with IP blacklisting
  - Seed script with Bengaluru & International leads
  - Next.js 14 SaaS dashboard (Sidebar, Header, KPIs, Filterable Leads Table, Modal, Discovery page)
  - Unit tests (`10/10 passed`) & Clean frontend build (`0 errors`)
  - Documentation (`SYSTEM_DESIGN.md`, `HOW_TO_RUN.md`, `README.md`, `.gitignore`)
- [x] **Phase 2: Business Discovery Integrations**
  - OpenStreetMap Nominatim geocoding & Overpass API geospatial query engine
  - Multi-category mapping (Restaurants, Dental Clinics, Gyms, Interior Designers, Coaching Centres, Real Estate, Travel, Salons, Manufacturers)
  - FastAPI asynchronous background worker with state transitions (`pending` → `running` → `completed` / `cancelled`)
  - Real-time event streaming into `ScrapingJobLog` with frontend log viewer modal
  - Intelligent deduplication and suppression filtering
  - Live progress polling and cancellation controls in Next.js UI
  - Discovery test suite with mock Nominatim/Overpass pipelines (`14/14 tests passed`)
- [x] **Phase 3: Contact Extraction & Verification**
  - Multi-tier email verification: RFC 5322 syntax regex, disposable domain blocklist, and authoritative DNS/MX record inspection via `dnspython`
  - Global telephone parsing and validation via Google `phonenumbers` (E.164 formatting, country ISO detection, carrier line typing)
  - SSL certificate and cipher inspection (issuer, expiration days, HTTPS reachability)
  - SSRF-shielded website contact crawler discovering hidden emails, phones, contact pages (`/contact`, `/about-us`), and verified social footprints (LinkedIn, Instagram, Facebook)
  - Interactive Lead Modal verification triggers and provenance tracking
  - Verification test suite with mock MX resolutions and HTML contact parsers (`19/19 tests passed`)
- [ ] **Phase 4: Website Opportunity Analyzer** (Live HTTP/SSL & mobile diagnostics)
- [ ] **Phase 5: Lead Scoring Engine** (Configurable 0–100 weighted matrix)
- [ ] **Phase 6: CRM & Outreach Management** (Pitch generator & manual approval queue)
- [ ] **Phase 7: Analytics, Testing & Production Deployment**

---

## 📄 License

Proprietary — Developed for Freelance Web Client Acquisition.
