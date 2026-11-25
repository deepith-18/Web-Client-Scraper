# ProspectIQ — Complete Run & Deployment Guide (macOS, Linux & Windows)

This guide provides step-by-step instructions to configure, run, test, and deploy **ProspectIQ** on **macOS**, **Linux**, and **Windows**, locally or with Docker Compose, and prepares the repository for phase-wise Git version control.

---

## 1. Prerequisites

Ensure the following tools are installed on your machine:

| Tool | Recommended Version | Verification (macOS / Linux) | Verification (Windows) |
| :--- | :--- | :--- | :--- |
| **Python** | 3.11, 3.12, or 3.13+ | `python3 --version` | `python --version` |
| **Node.js** | 20 LTS or 22 LTS | `node --version` | `node --version` |
| **npm** | 10+ | `npm --version` | `npm --version` |
| **Git** | 2.30+ | `git --version` | `git --version` |
| **Docker** *(Optional)* | 24+ with Compose v2 | `docker compose version` | `docker compose version` |

---

## 2. Option A: One-Command Startup (Easiest & Recommended)

Dedicated one-command launcher scripts are provided for both **macOS/Linux** (`.sh`) and **Windows** (`.ps1` / `.bat`). Open two terminal windows in `Web-Client-Scraper`:

### Terminal 1 — Backend (FastAPI + Database + Seeding):

**On macOS / Linux:**
```bash
./run-backend.sh
```

**On Windows:**
```powershell
.\run-backend.ps1
# Or double-click run-backend.bat in File Explorer
```

> **What this single command does automatically:**
> 1. Detects and creates `.env` from `.env.example` if not found.
> 2. Sets up Python virtual environment (`backend/.venv`) and installs dependencies.
> 3. Creates database schema and seeds initial verified leads across Bengaluru and global markets.
> 4. Starts the FastAPI server on [http://localhost:8000](http://localhost:8000) with hot-reload enabled.
> 5. Swagger Docs available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

### Terminal 2 — Frontend (Next.js Dashboard):

**On macOS / Linux:**
```bash
./run-frontend.sh
```

**On Windows:**
```powershell
.\run-frontend.ps1
# Or double-click run-frontend.bat in File Explorer
```

> **What this single command does automatically:**
> 1. Installs frontend packages if `node_modules` is missing.
> 2. Clears any stale Next.js cache to prevent build/dev webpack chunk conflicts.
> 3. Starts the Next.js development server on [http://localhost:3000](http://localhost:3000).

---

## 3. Option B: Manual Step-by-Step Setup

If you prefer to run each step manually in your terminal:

### Step 1: Environment Configuration

Navigate to the `Web-Client-Scraper` directory and copy the example environment file:

```bash
# macOS / Linux / Git Bash:
cp .env.example .env

# Windows PowerShell:
Copy-Item .env.example .env
```

The default `.env` is pre-configured to use local SQLite (`prospectiq.db`) for immediate development without requiring a separate PostgreSQL instance.

---

### Step 2: Backend Setup & Database Seeding

In your first terminal (inside `Web-Client-Scraper`):

#### On macOS / Linux:
```bash
# 1. Create Python virtual environment (if not already created)
python3 -m venv backend/.venv

# 2. Activate virtual environment
source backend/.venv/bin/activate

# 3. Install backend dependencies
pip install -r backend/requirements.txt

# 4. Initialize database schema & seed initial verified leads
python3 -m backend.app.core.seed

# 5. Start FastAPI server with hot-reload
python3 -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

#### On Windows:
```powershell
# 1. Create Python virtual environment
python -m venv backend/.venv

# 2. Activate virtual environment
backend\.venv\Scripts\Activate.ps1

# 3. Install backend dependencies
pip install -r backend/requirements.txt

# 4. Initialize database schema & seed initial verified leads
python -m backend.app.core.seed

# 5. Start FastAPI server with hot-reload
python -m uvicorn backend.app.main:app --reload --host 127.0.0.1 --port 8000
```

- **Interactive Swagger Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Alternative ReDoc**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **API Health Check**: [http://localhost:8000/health](http://localhost:8000/health)

---

### Step 3: Frontend Setup & Dashboard Launch

In your second terminal (inside `Web-Client-Scraper`):

```bash
# 1. Navigate to the frontend directory
cd frontend

# 2. Install dependencies (if not already installed)
npm install

# 3. Start the Next.js development server
npm run dev
```

- **ProspectIQ Dashboard**: [http://localhost:3000](http://localhost:3000)
- **Discovery Launcher**: [http://localhost:3000/discover](http://localhost:3000/discover)
- **CRM Pipeline**: [http://localhost:3000/pipeline](http://localhost:3000/pipeline)

---

## 4. Option C: Docker Compose Deployment

To run the entire production stack (PostgreSQL 16 + FastAPI backend + Next.js frontend):

```bash
# 1. Build and run containers in background
docker compose up -d --build

# 2. Check container status
docker compose ps

# 3. View live application logs
docker compose logs -f

# 4. Seed database inside container
docker compose exec backend python -m backend.app.core.seed

# 5. Stop containers when finished
docker compose down
```

---

## 5. Running the Automated Test Suite

ProspectIQ includes unit and integration tests covering security, SSRF defense, JWT auth, lead scoring, discovery pipelines, contact verification, website audit analyzer, and CRM pipeline workflows:

### On macOS / Linux:
```bash
# Option 1: Run all backend tests with virtual environment python/pytest
backend/.venv/bin/pytest -v

# Or with virtualenv active:
source backend/.venv/bin/activate
pytest -v

# Option 2: Run complete automated CI pipeline (tests + type-check + build)
./scripts/run-ci.sh
```

### On Windows:
```powershell
backend\.venv\Scripts\pytest -v

# Or run complete automated CI pipeline
.\scripts\run-ci.ps1
```

### Running Individual Test Modules:
```bash
# macOS / Linux:
backend/.venv/bin/pytest backend/tests/test_outreach_studio.py -v
backend/.venv/bin/pytest backend/tests/test_crm.py -v
backend/.venv/bin/pytest backend/tests/test_scoring.py -v
backend/.venv/bin/pytest backend/tests/test_analyzer.py -v
backend/.venv/bin/pytest backend/tests/test_verification.py -v
backend/.venv/bin/pytest backend/tests/test_discovery.py -v
backend/.venv/bin/pytest backend/tests/test_ssrf.py -v
backend/.venv/bin/pytest backend/tests/test_auth.py -v
```

---

## 6. Verifying Frontend Production Build & Types

Ensure the Next.js frontend passes all TypeScript type checks and builds cleanly:

```bash
cd frontend

# Verify TypeScript compilation (0 errors)
npm run type-check

# Test production build
npm run build
```

---

## 7. Phase-wise Git Commit & Pushing Guide

When pushing phase-by-phase to GitHub, follow these git workflow steps:

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
