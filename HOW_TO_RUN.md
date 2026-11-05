# ProspectIQ — Complete Run & Deployment Guide

This guide provides step-by-step instructions to configure, run, test, and deploy **ProspectIQ** locally, with Docker Compose, and prepares the repository for phase-wise Git version control.

---

## 1. Prerequisites

Ensure the following tools are installed on your machine:

| Tool | Recommended Version | Verification Command |
| :--- | :--- | :--- |
| **Python** | 3.11 or 3.12 | `python --version` |
| **Node.js** | 20 LTS or 22 LTS | `node --version` |
| **npm** | 10+ | `npm --version` |
| **Git** | 2.30+ | `git --version` |
| **Docker** *(Optional)* | 24+ with Compose v2 | `docker compose version` |

---

## 2. Option A: One-Command Startup (Easiest & Recommended)

You can launch both the backend and frontend using dedicated one-click launcher scripts. Simply open two terminals:

### Terminal 1 — Backend (FastAPI + Database + Seeding):
```powershell
.\run-backend.ps1
```
*(Or double-click `run-backend.bat` in File Explorer)*

> **What this single command does automatically:**
> 1. Detects and creates `.env` from `.env.example` if not found.
> 2. Sets up Python virtual environment and installs dependencies.
> 3. Creates database tables and seeds verified sample leads across Bengaluru and global markets.
> 4. Starts the FastAPI server on [http://localhost:8000](http://localhost:8000) with hot-reload enabled.
> 5. Swagger Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Terminal 2 — Frontend (Next.js Dashboard):
```powershell
.\run-frontend.ps1
```
*(Or double-click `run-frontend.bat` in File Explorer)*

> **What this single command does automatically:**
> 1. Installs frontend packages if `node_modules` is missing.
> 2. Starts the Next.js development server on [http://localhost:3000](http://localhost:3000).

---

## 3. Option B: Manual Step-by-Step Setup

If you prefer to run each step manually:

### Step 1: Environment Configuration

Copy the example environment file:

```bash
# On Linux / macOS / Git Bash:
cp .env.example .env

# On Windows PowerShell:
Copy-Item .env.example .env
```

The default `.env` is configured to use local SQLite (`prospectiq.db`) for immediate out-of-the-box development without requiring a separate PostgreSQL service.

---

### Step 2: Backend Setup & Database Seeding

Open a terminal in the root workspace directory (`c:\Scraper`):

```bash
# 1. Create a Python virtual environment (if not already created)
python -m venv backend/.venv

# 2. Activate the virtual environment
# Windows PowerShell:
backend\.venv\Scripts\Activate.ps1
# Windows Command Prompt:
backend\.venv\Scripts\activate.bat
# Linux / macOS:
source backend/.venv/bin/activate

# 3. Install backend dependencies
pip install -r backend/requirements.txt

# 4. Initialize database schema & seed initial verified leads
python -m backend.app.core.seed
```

> **What happens during seed?**
> - All tables are automatically created in the database.
> - Default admin user is created: `admin@prospectiq.io` (password: `prospect123!`).
> - Authorized sources (OpenStreetMap Overpass Engine, Google Places API, Public Web Crawler) are registered.
> - Sample qualified leads across **Bengaluru, India** (Indiranagar, Koramangala, Jayanagar) and **International metros** (Austin TX, London UK, Sydney AU) are seeded with complete technical audit scores and contact cards.

---

### Step 3: Run FastAPI Backend Server

```bash
# Start FastAPI with hot reload on port 8000
python -m uvicorn backend.app.main:app --reload --port 8000
```

- **Interactive Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **API Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

### Step 4: Frontend Setup & Dashboard Launch

Open a second terminal in the workspace root:

```bash
# 1. Navigate to frontend directory
cd frontend

# 2. Install dependencies (if not already installed)
npm install

# 3. Start the Next.js development server
npm run dev
```

- **ProspectIQ Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Discovery Launcher**: [http://localhost:3000/discover](http://localhost:3000/discover)

---

## 3. Option B: Docker Compose Deployment

To run the entire production-grade stack (PostgreSQL 16 + FastAPI + Next.js):

```bash
# 1. Build and run containers in background
docker compose up -d --build

# 2. Check container status
docker compose ps

# 3. View live application logs
docker compose logs -f

# 4. Seed the PostgreSQL database inside container
docker compose exec backend python -m backend.app.core.seed

# 5. Stop containers when finished
docker compose down
```

---

## 4. Running the Automated Test Suite

ProspectIQ includes automated unit and integration tests covering security, password hashing, JWT generation, SSRF defense, lead scoring, discovery pipelines, deep contact verification, website opportunity analysis, and CRM pipeline workflows:

```bash
# Run all 41 tests across the entire backend suite:
backend\.venv\Scripts\pytest -v

# Or run individual modules:
backend\.venv\Scripts\pytest backend/tests/test_outreach_studio.py -v
backend\.venv\Scripts\pytest backend/tests/test_crm.py -v
backend\.venv\Scripts\pytest backend/tests/test_scoring.py -v
backend\.venv\Scripts\pytest backend/tests/test_analyzer.py -v
backend\.venv\Scripts\pytest backend/tests/test_verification.py -v
backend\.venv\Scripts\pytest backend/tests/test_discovery.py -v
backend\.venv\Scripts\pytest backend/tests/test_ssrf.py -v
backend\.venv\Scripts\pytest backend/tests/test_auth.py -v
```

---

## 5. Verifying Frontend Production Build & Types

Before pushing to GitHub, ensure the Next.js frontend passes all TypeScript type checks:

```bash
# Verify TypeScript compilation (0 errors across all routes)
frontend\node_modules\.bin\tsc.cmd --noEmit --project frontend/tsconfig.json
```

---

## 6. Phase-wise Git Commit & Pushing Guide

Since you are pushing phase-by-phase to GitHub, follow these git workflow steps:

```bash
# 1. Check current repository status
git status

# 2. Stage all modifications
git add .

# 3. Commit Phase 6 & Phase 7 milestones
git commit -m "feat(crm-pipeline-hardening): complete Phase 6 CRM pipeline, outreach queue, manual lead registration, and Phase 7 production hardening"

# 4. Optional: Create milestone tags
git tag -a v1.0.0-full -m "ProspectIQ Production Release (Phases 1-7)"

# 5. Push to your GitHub repository
git push origin main --tags
```

