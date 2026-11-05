# ProspectIQ
### Intelligent Freelance Client Acquisition & Business Opportunity Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![Next.js](https://img.shields.io/badge/Next.js-14.2+-black.svg?style=flat&logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5+-blue.svg?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB.svg?style=flat&logo=python&logoColor=white)](https://www.python.org)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4+-38B2AC.svg?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg?style=flat&logo=docker&logoColor=white)](https://www.docker.com)

---

## Overview

**ProspectIQ** is an enterprise-grade client acquisition platform purpose-built for freelance web developers, agency founders, and digital consultancies. It automates the discovery of genuine local businesses across global commercial hubs (optimized for Bengaluru, India alongside international markets in North America, Europe, Australia, and Asia), validates public commercial contact details, audits websites for actionable technical and design deficiencies, calculates customizable opportunity scores (0–100), and orchestrates client outreach with strict anti-spam guardrails and manual approval workflows.

All data persistence is backed by normalized relational schemas with full support for SQLite and PostgreSQL, SSRF-shielded background crawlers, real DNS/MX verification, and an interactive, clean SaaS dashboard.

---

## Essential Documentation

- **[System Design & Architecture (SYSTEM_DESIGN.md)](SYSTEM_DESIGN.md)**: Technical architecture, data flow diagrams, database schemas, scoring equations, and SSRF security specifications.
- **[Step-by-Step Run & Deployment Guide (HOW_TO_RUN.md)](HOW_TO_RUN.md)**: Local development setup, database seeding, Docker Compose, automated test commands, and Git version control workflow.

---

## Architecture & Core Modules

```
+------------------------------------------------------------------------+
|                        ProspectIQ Core Modules                         |
+--------------------------------+---------------------------------------+
| Module A: Business Discovery   | Worldwide & Bengaluru geospatial      |
|                                | discovery via OSM Overpass engine     |
+--------------------------------+---------------------------------------+
| Module B: Contact Extraction   | Public email, phone, domain, address  |
|                                | with verifiable source provenance     |
+--------------------------------+---------------------------------------+
| Module C: Lead Verification    | DNS/MX validation, E.164 phone        |
|                                | parsing, and SSL certificate audit    |
+--------------------------------+---------------------------------------+
| Module D: Website Opportunity  | Detects missing sites, broken SSL,    |
|           Analyzer             | mobile layout issues, missing forms   |
+--------------------------------+---------------------------------------+
| Module E: Lead Scoring Engine  | 0–100 weighted opportunity matrix     |
|                                | with customizable strategy presets    |
+--------------------------------+---------------------------------------+
| Module F: Lead CRM Pipeline    | 12-stage Kanban pipeline tracking,    |
|                                | lead notes, follow-ups, suppression   |
+--------------------------------+---------------------------------------+
| Module G: Outreach Manager     | Evidence-backed pitch generation with |
|                                | mandatory manual approval guardrail   |
+--------------------------------+---------------------------------------+
```

---

## Global Market Discovery

ProspectIQ is designed to acquire clients globally without geographical lock-in:
- **India / Bengaluru Primary**: Pre-configured regional filtering for Indiranagar, Koramangala, Jayanagar, Whitefield, HSR Layout, MG Road, and Greater Bengaluru.
- **North America**: Austin TX, San Francisco CA, New York NY, Seattle WA, Toronto ON.
- **Europe**: London, Manchester, Berlin, Amsterdam, Paris.
- **Asia-Pacific**: Sydney, Melbourne, Singapore, Tokyo.
- **Middle East**: Dubai, Abu Dhabi.

---

## Security, Privacy & Ethical Compliance

1. **SSRF Defense Shield**: Crawlers validate destination IP addresses before opening sockets. Loopback (`127.0.0.1`), RFC 1918 private subnets, link-local addresses, multicast, and cloud metadata endpoints (`169.254.169.254`) are strictly blocked.
2. **Zero CAPTCHA Bypassing**: Full compliance with target terms of service. Operates solely via open geospatial registries (OSM Overpass) and public business landing pages.
3. **Strict Business Provenance**: Extracts publicly listed commercial contact records only. Never scrapes private individuals or personal mobile numbers.
4. **Mandatory Manual Approval Guardrail**: Zero automated mass mailing or unsolicited robocalls. Every outreach proposal requires developer review, confirmation, and explicit approval, complying with Indian TRAI/DPDP, EU GDPR, and US CAN-SPAM regulations.
5. **Global Suppression Registry**: Centralized opt-out registry automatically suppresses matching domains, phone numbers, and email addresses from active discovery and outreach.

---

## Quick Start (Single-Command Launchers)

Launch the full platform in two separate terminal windows without manual virtual environment or dependency setup:

### Terminal 1 — Backend API Server
```powershell
.\run-backend.ps1
```
*(Or run `.\run-backend.bat` in Command Prompt)*

- Automatically initializes `.env` from `.env.example`.
- Creates the Python virtual environment and installs dependencies.
- Seeds database tables with sample verified prospects.
- Starts FastAPI at `http://localhost:8000`.
- Interactive Swagger API Documentation: `http://localhost:8000/docs`.

### Terminal 2 — Frontend Next.js Dashboard
```powershell
.\run-frontend.ps1
```
*(Or run `.\run-frontend.bat` in Command Prompt)*

- Automatically installs frontend packages if missing.
- Cleans stale build caches to prevent development chunk conflicts.
- Starts the Next.js development server at `http://localhost:3000`.

---

## Frontend Navigation & Feature Map

Every navigation link and action button in ProspectIQ is fully connected to backend APIs:

| Route | Page | Key Capabilities |
| :--- | :--- | :--- |
| `/` | **Overview Dashboard** | KPI metrics, opportunity breakdown chart, category distribution, recent leads feed |
| `/discover` | **Discover Businesses** | OpenStreetMap Overpass search, live job execution logs, real-time background worker |
| `/leads` | **Lead Explorer** | Prospect directory, multi-factor filters, manual lead registration modal, CSV export |
| `/pipeline` | **CRM Pipeline** | 12-stage Kanban pipeline, drag-and-drop stage updates, prospect details modal |
| `/audits` | **Opportunity Audits** | Live on-demand URL audit scanner, mobile viewport, SSL, latency, legacy tech detection |
| `/scoring` | **Scoring Engine** | Interactive weight sliders, freelance strategy presets, batch recalculation |
| `/verification` | **Verification Centre** | Live DNS/MX record validator, international phone formatting, SSL certificate inspection |
| `/outreach` | **Outreach Manager** | Tailored proposal generator, manual review and approval queue, dispatch logger |
| `/analytics` | **Platform Analytics** | Conversion metrics, market breakdowns, performance indicators |
| `/settings` | **Settings & Suppression** | Global suppression list management (domain/email/phone blacklist), system configuration |

---

## Automated Test Suite

ProspectIQ includes comprehensive end-to-end integration and unit tests covering all core engines:

```bash
# Run complete backend test suite (41 tests)
backend\.venv\Scripts\pytest -v

# Run TypeScript type check across all frontend components and pages
frontend\node_modules\.bin\tsc.cmd --noEmit --project frontend/tsconfig.json
```

---

## Phase-Wise Roadmap & Milestones

- [x] **Phase 1: Project Setup, Database Schema, Authentication & Frontend Layout**
  - Normalized SQLAlchemy models with SQLite/PostgreSQL compatibility
  - Native Bcrypt hashing and secure JWT authentication
  - SSRF protection engine with IP blacklisting
  - Seed script with Bengaluru and international leads
  - Next.js 14 SaaS dashboard shell (Sidebar, Header, KPIs, Filterable Leads Table, Modal)
  - Unit tests (`10/10 passed`) and clean frontend build (`0 errors`)
  - Initial system architecture documentation (`SYSTEM_DESIGN.md`, `HOW_TO_RUN.md`)

- [x] **Phase 2: Business Discovery Integrations**
  - OpenStreetMap Nominatim geocoding and Overpass API query engine
  - Multi-category mapping for retail, healthcare, hospitality, design, and professional services
  - FastAPI asynchronous background worker with job state management
  - Real-time event streaming into `ScrapingJobLog` with frontend log viewer modal
  - Intelligent deduplication and suppression filtering
  - Live progress polling and cancellation controls in Next.js UI
  - Discovery test suite (`14/14 tests passed`)

- [x] **Phase 3: Contact Extraction & Verification**
  - Multi-tier email verification: RFC 5322 syntax regex, disposable domain blocklist, authoritative DNS/MX inspection
  - Global telephone parsing and validation via Google `phonenumbers` (E.164 formatting)
  - SSL certificate and cipher inspection (issuer, expiration days, HTTPS reachability)
  - SSRF-shielded website contact crawler discovering emails, phones, and social footprints
  - Lead Modal verification triggers and provenance tracking
  - Verification test suite (`19/19 tests passed`)

- [x] **Phase 4: Website Opportunity Analyzer**
  - Deep technical audit for development opportunities: viewport meta, SSL, contact form, latency, legacy tech
  - Concrete evidence generation for every deficiency
  - SSRF-shielded URL crawler with redirect detection and timeout protections
  - Technology stack badges and evidence-backed pitch angles
  - Analyzer test suite (`22/22 tests passed`)

- [x] **Phase 5: Intelligent Lead Scoring Engine**
  - Configurable 0–100 weighted opportunity scoring matrix (Module E)
  - 8 multi-factor opportunity components with priority tiers (`high`, `good`, `medium`, `low`)
  - Strategy presets: Balanced, Turnkey Website Specialist, Mobile & UX Redesign, Performance Modernizer
  - Dedicated Next.js Lead Scoring control center (`/scoring`) with live sliders and batch recalculation
  - Scoring test suite (`27/27 tests passed`)

- [x] **Phase 6: CRM & Outreach Management**
  - 12-stage CRM pipeline tracking with Kanban board view (`/pipeline`)
  - Evidence-backed pitch generation using website audit findings (`/outreach`)
  - Mandatory manual approval queue before outreach dispatch
  - Lead notes and follow-up task management with due date tracking
  - Manual lead registration modal with duplicate detection and auto-scoring (`/leads`)
  - Global suppression list CRUD (`/settings`)
  - CRM integration test suite (`31/31 tests passed`)

- [x] **Phase 7: Analytics, Testing & Production Hardening**
  - Full-featured Platform Analytics dashboard (`/analytics`)
  - Dedicated Verification Centre (`/verification`) with live MX and phone inspection
  - Complete backend test suite: **41/41 tests passing**
  - TypeScript validation: **0 compilation errors** across all routes and components
  - Single-command cross-platform launchers (`run-backend.ps1` and `run-frontend.ps1`)
  - System Design and Run guides updated

- [x] **Phase 8: Advanced Outreach Sequences & Rich Template Studio**
  - Reusable outreach template engine with dynamic tokens (`{{business_name}}`, `{{city}}`, `{{deficiencies_list}}`, `{{pitch_angle}}`)
  - 5 default sequence templates (Turnkey Web, Modern Redesign, Day 4 Evidence Follow-Up, Day 8 Final Check-in, LinkedIn DM)
  - Interactive Template Studio with live token insertion and real-time variable test renderer (`/outreach`)
  - Automated multi-touch sequence generator with scheduled calendar follow-up reminders
  - Integrated template selector inside Lead Modal for on-the-fly pitch drafting
  - End-to-end outreach studio test suite (`test_outreach_studio.py`, `4/4 tests passed`)

---

## License

Proprietary — Developed for Freelance Web Client Acquisition.
