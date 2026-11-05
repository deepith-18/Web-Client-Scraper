# ProspectIQ — Complete User Manual & Feature Guide

## 1. Agency Architecture & Roles

ProspectIQ is designed specifically for a **2-person freelance web agency**:

```
┌────────────────────────────────────────────────────────┐
│                   ProspectIQ Workflow                  │
└────────────────────────────────────────────────────────┘

  STEP 1: DISCOVERY & ENRICHMENT (Admin: Deepith)
  - You harvest real businesses on `/discover` across Bengaluru or any metro.
  - The engine verifies phone numbers and audits website deficiencies.
            │
            ▼
  STEP 2: CALLING & QUALIFICATION (Caller: Teammate)
  - Teammate opens the Caller Desk (`/calling`).
  - Calls verified business numbers using click-to-dial (`tel:+91...`).
  - Clicks "ACCEPT · Client Agreed" or "REJECT · Declined" with reasons.
            │
            ▼
  STEP 3: PROPOSAL & WEBSITE DELIVERY (Admin: Deepith)
  - Accepted clients appear directly on your Overview dashboard (`/`).
  - You review their technical website audit, wireframe proposal, and close the deal!
```

---

## 2. Page-by-Page Feature & Navigation Breakdown

### Page 1: Overview Dashboard (`/`)
- **What It Denotes**: Your executive control room and daily command center.
- **Why It Exists**: Allows Deepith to see high-level business metrics, monitor which leads your teammate agreed with, and view conversion trends at a glance.
- **Key Sections & Buttons**:
  - **KPI Metrics Cards**:
    - *Total Discovered*: Total count of businesses currently saved in your database.
    - *No Official Website*: Businesses with zero web presence (prime turnkey build prospects, +30 opportunity score points).
    - *Improvement Opportunities*: Sites with broken SSL, no mobile viewport, or slow loading times.
    - *Qualified Leads*: Prospects evaluated as viable for outreach.
  - **Deepith's Priority Action Queue (Accepted Clients)**:
    - Automatically displays any prospect marked as **"ACCEPT · Client Agreed"** by your teammate on the Caller Desk.
    - Shows business name, phone number, category, city, and agreed scope.
    - *View Audit & Pitch Button*: Opens the full audit and pitch generator so you can prepare the contract and wireframe.
  - **Which Business Type Accepts Most? (Acceptance Rate by Category)**:
    - Real-time conversion intelligence ranking which industries (Cafes, Interior Designers, Clinics, Gyms) say "YES" the most.
    - Identifies your **Top Converting Category** so you know where to focus your scraper next.
  - **Qualified Business Prospects Table**:
    - Filterable directory by Priority tier (High, Good, Medium, Low), Category, and City.
    - *Open Button*: Opens the full Lead Modal drawer.

---

### Page 2: Caller Desk (`/calling`)
- **What It Denotes**: The dedicated workspace for your **teammate / telecaller**.
- **Why It Exists**: Your teammate does not need to configure scrapers or analyze code. They just need phone numbers, talking points, and simple buttons to log whether the client agreed or declined.
- **Key Sections & Buttons**:
  - **Top KPI Counters**: Shows Leads to Call, Confirmed Accepted, Declined Rejected, Scheduled Callbacks, and Acceptance Rate %.
  - **Click-to-Call Button (`tel:+91...`)**:
    - Clickable phone badge that instantly opens phone dialers or VoIP softphones on mobile/desktop.
    - Dedicated copy button to paste numbers into WhatsApp or CRM.
  - **Calling Pitch Tip Cheat-Sheet**:
    - Dynamic talking points tailored to the prospect:
      - *No Website*: Suggests offering a turnkey website build for local Google search traffic.
      - *Outdated Website*: Suggests pitching mobile responsiveness and SSL security updates.
  - **`ACCEPT · Client Agreed` Button (Emerald Green)**:
    - Opens the Accept Confirmation dialog.
    - Select agreed project type (*Turnkey Website Build*, *Mobile Redesign*, *E-Commerce*, *Custom Solution*).
    - Select budget range (*₹15,000–₹25,000*, *₹25,000–₹50,000*, *₹50,000+*).
    - Enter client notes (decision maker's name, preferred timeline, specific requests).
    - Clicking **"Confirm & Send to Deepith"** marks status as `interested`, tags the lead as Accepted, and moves it to Deepith's priority dashboard queue.
  - **`REJECT · Declined` Button (Rose Red)**:
    - Opens the Decline dialog.
    - Select decline reason (*Already has agency*, *No budget*, *Not interested*, *Wrong number*, *Do Not Call*).
    - Optional checkbox: *Add to Global Do-Not-Contact list* (permanently blocks future scraping/calling).
  - **`Callback` Button (Clock Icon)**:
    - Schedules a specific follow-up date and time and creates a reminder in the calendar tasks system.

---

### Page 3: Discover Businesses (`/discover`)
- **What It Denotes**: The live automated **Lead Harvester Engine**.
- **Why It Exists**: To discover genuine, real-world local businesses across Bengaluru (Indiranagar, Koramangala, Whitefield, etc.) or international markets (US, UK, Australia, Singapore).
- **Key Sections & Buttons**:
  - **Target Country & City**: Select target market (India, United States, United Kingdom, etc.) and city (e.g. `Bengaluru`).
  - **Target Neighborhood / PIN Code**: Optional refinement (e.g. `Indiranagar`, `560038`, `Koramangala`, `Whitefield`).
  - **Business Category Dropdown**:
    - Pre-mapped Overpass OpenStreetMap categories: Cafes & Restaurants, Clinics & Healthcare, Boutiques & Retail, Interior Designers, Gyms & Fitness, Co-working & Offices, Salons & Spas, Bakeries, Law Firms.
  - **Search Keywords**: Optional free-text filter (e.g. `roastery`, `orthodontist`, `architect`).
  - **`Run Discovery Job` Button**:
    - Launches asynchronous background crawler querying the live OpenStreetMap geospatial registry.
    - Automatically checks for duplicate entries and suppression list records.
    - Emits live progress events into the execution log.
  - **Job Execution History & Live Log Modal**:
    - Shows past discovery jobs with status (`pending`, `running`, `completed`, `failed`).
    - *View Logs Button*: Opens the real-time event stream modal showing geocoding coordinates, Overpass bounding box results, and records added.

---

### Page 4: Lead Explorer (`/leads`)
- **What It Denotes**: The master searchable directory of all harvested prospects.
- **Why It Exists**: For browsing, filtering, manually adding prospects, and exporting lists to spreadsheet formats.
- **Key Sections & Buttons**:
  - **`Add Lead` Button**:
    - Manually insert a prospect you found offline or through personal referrals.
    - Enforces duplicate detection (checks domain and name + city).
    - Automatically calculates initial opportunity score on creation.
  - **`Export CSV` Button**:
    - Exports all currently filtered leads into a clean `.csv` spreadsheet with business names, categories, cities, phone numbers, emails, websites, scores, and CRM statuses.
  - **Filter Bar**:
    - Filter by priority tier, industry category, CRM status, or website presence (Has Website vs. No Website).
  - **Table Rows**:
    - Click any row or the *Open* button to open the full Lead Details Modal.

---

### Page 5: Website Audits (`/audits`)
- **What It Denotes**: Deep technical diagnostic center for digital infrastructure.
- **Why It Exists**: Gives you concrete, unassailable technical facts to cite during sales conversations instead of generic sales pitches.
- **Key Sections & Buttons**:
  - **On-Demand Live URL Scanner**:
    - Paste any external website URL and click **"Run Audit"**.
    - Evaluates SSL presence, mobile viewport tag, contact form presence, HTTP latency, and detects legacy technologies (e.g. jQuery 1.x, Bootstrap 3).
  - **Audited Leads Feed**:
    - Lists all audited websites with visual diagnostic badges:
      - *Active HTTPS / Missing SSL*
      - *Responsive / Unresponsive Mobile Viewport*
      - *Inquiry Form Detected / Missing Form*
      - *Load Latency in milliseconds*
    - Displays evidence-backed pitch angles for every identified deficiency.

---

### Page 6: Verification Centre (`/verification`)
- **What It Denotes**: Data quality and deliverability validation laboratory.
- **Why It Exists**: Ensures you never pitch dead emails or call improperly formatted phone numbers.
- **Key Sections & Buttons**:
  - **On-Demand Email Deliverability Validator**:
    - Enter any business email address.
    - Checks RFC 5322 syntax regex, cross-references against disposable email domain blocklists, and queries live authoritative DNS/MX records via `dnspython`.
  - **On-Demand Phone Formatter & Carrier Validator**:
    - Enter any raw phone number with default country code.
    - Parses and formats into standardized E.164 (`+91...`).
  - **SSL Certificate Inspector**:
    - Checks issuer, expiration date, and cipher strength for any secure domain.

---

### Page 7: Lead Scoring Engine (`/scoring`)
- **What It Denotes**: The mathematical formula configuration center.
- **Why It Exists**: Allows you to customize how the 0–100 opportunity score is weighted based on your specific freelance service offering.
- **Key Sections & Buttons**:
  - **Strategy Presets**:
    - *Balanced (Standard)*: Default 8-factor balanced scoring matrix.
    - *Turnkey Website Specialist*: Heavily rewards businesses without websites (+35 pts).
    - *Mobile & UX Redesign Specialist*: Rewards missing mobile viewports and missing inquiry forms.
    - *Performance & Tech Modernizer*: Focuses on high load latency and outdated tech stacks.
  - **Live Weight Sliders**:
    - Adjust weights for No Website, Unreachable Server, Poor Mobile, Missing Contact Form, Latency, and Corroborated Identity.
  - **`Recalculate All Scores` Button**:
    - Re-evaluates every business in your database against the new scoring weights and updates priority tiers.

---

### Page 8: CRM Pipeline (`/pipeline`)
- **What It Denotes**: 12-stage visual Kanban board for tracking client relationship lifecycles.
- **Why It Exists**: Organizes deals from initial discovery to closed client contracts.
- **Pipeline Stages**:
  1. `New`: Newly scraped, uncalled.
  2. `Researching`: Deep audit in progress.
  3. `Qualified`: Verified contact + actionable deficiency.
  4. `Contact Permitted`: Callback scheduled.
  5. `Contacted`: First call or note dispatched.
  6. `Interested`: **ACCEPTED** by client, ready for proposal.
  7. `Meeting Scheduled`: Call or demo scheduled with Deepith.
  8. `Proposal Sent`: Wireframe quotation delivered.
  9. `Negotiation`: Scope and pricing discussion.
  10. `Converted`: Deal won, website build started!
  11. `Not Interested`: Declined, archived politely.
  12. `Do Not Contact`: Blacklisted on suppression list.

---

### Page 9: Outreach Studio (`/outreach`)
- **What It Denotes**: Proposal drafting, template creation, and multi-touch cadence management.
- **Why It Exists**: Produces tailored B2B proposals with strict manual approval guardrails (no spam).
- **Tabs**:
  - **Tab 1: Approval Queue**:
    - Review drafted proposals.
    - *Copy Button*: Copies text to clipboard.
    - *Open Client Button (`mailto:`) *: Pre-populates recipient, subject, and proposal body in your default email client.
    - *Approve Pitch Button*: Developer manual approval gate.
    - *Mark as Sent Button*: Records transmission and advances CRM stage to `contacted`.
  - **Tab 2: Template Studio**:
    - Edit existing templates or create custom outreach templates.
    - Click-to-insert dynamic tokens (`+business_name`, `+city`, `+deficiencies_list`, `+pitch_angle`, etc.).
    - *Dynamic Variable Live Preview Tester*: Test how any template renders against real lead data before saving.
  - **Tab 3: Multi-Touch Sequences**:
    - Select a lead and enroll them in a 3-touch cadence (Day 0 Intro, Day 4 Evidence Follow-up, Day 8 Check-in) with automatic calendar reminders.

---

### Page 10: Platform Analytics (`/analytics`)
- **What It Denotes**: In-depth sales conversion and business intelligence reports.
- **Why It Exists**: To tell you which business categories convert best and show caller efficiency.
- **Key Reports**:
  - *Acceptance Rate by Category Table & Comparison Bars*: Compares acceptance % across Cafes, Clinics, Boutiques, Designers, etc.
  - *Overall Acceptance Rate*: Total agreed vs. declined calls.
  - *Opportunity Distribution*: Percentage of leads across High, Good, Medium, and Low tiers.

---

### Page 11: Settings (`/settings`)
- **What It Denotes**: Security, suppression registry, and system preferences.
- **Why It Exists**: To ensure legal compliance with TRAI, GDPR, and CAN-SPAM regulations.
- **Key Controls**:
  - *Global Suppression List CRUD*: Add or remove blacklisted domains, email addresses, or phone numbers. Suppressed businesses are automatically locked from outreach.
  - *System Information*: Database path and environment configuration.

---

## 3. How Real Live Scraping Works (Replacing Seed/Sample Data)

### Why Sample Data is Currently Present:
When ProspectIQ is first initialized, the seeder inserts a few verified sample businesses across Bengaluru and global commercial metros. This ensures the dashboard, pipeline, and charts render immediately for review rather than appearing blank.

### How to Scrape Genuine, Real-World Clients Now:

1. Open your browser to [`http://localhost:3000/discover`](http://localhost:3000/discover) (or click **"Discover Businesses"** in the sidebar).
2. Set your parameters:
   - **Target Country**: `India` (or `United States`, `United Kingdom`, etc.)
   - **Target City**: `Bengaluru` (or `Austin`, `London`, `Sydney`, etc.)
   - **Target Neighborhood / Area**: Enter a specific commercial locality, e.g.:
     - `Indiranagar`
     - `Koramangala`
     - `Whitefield`
     - `Jayanagar`
     - `HSR Layout`
   - **Target Category**: Pick the industry you want to build websites for (e.g. `Cafes & Restaurants`, `Interior Designers`, `Dental Clinics`, `Gyms & Fitness`).
3. Click **"Run Discovery Job"**.

### What Happens Behind the Scenes:
1. **Geospatial Resolution**: The backend resolves the coordinates of your chosen neighborhood using Nominatim geocoding.
2. **OpenStreetMap Overpass Harvesting**: It queries OpenStreetMap's global database for real physical commercial buildings with exact GPS coordinates.
3. **Contact & Domain Extraction**: It pulls registered phone numbers, street addresses, and official website URLs.
4. **Live Verification**:
   - If an official website exists, the crawler checks for active SSL certificates, mobile viewport tags, and contact forms.
   - If no website exists, the scoring engine immediately assigns **+30 Opportunity Points** (Turnkey Website Prospect).
5. **Caller Desk Population**:
   - All harvested leads with valid phone numbers immediately appear on your teammate's **Caller Desk (`/calling`)**, sorted with the highest-opportunity leads at the top!
6. **Your Teammate Calls**:
   - Teammate dials the numbers and clicks **ACCEPT** for businesses that want a website quotation.
   - Accepted clients immediately appear on **Deepith's Priority Queue** on the Overview dashboard (`/`) for you to build and close!

