# Unidash — Entrepreneurial Strategy, Revenue Architecture & Creator Studio Addendum

**Document type:** Strategic Addendum, Monetization Architecture, and Creator Studio PRD  
**Companion to:** `Unidash_Product_Blueprint.md`  
**Focus:** Unit economics, GTM wedges, viral growth loops, and the Community/Creator Studio ecosystem

---

## 1. Revenue Architecture & Monetization Strategy

To build a high-margin SaaS while keeping infrastructure costs predictable, Unidash must monetize around **value metrics that scale with the customer's commercial gain** (data freshness, distribution control, and white-labeling) rather than arbitrary dashboard count limits.

### 1.1 The 5 Revenue Streams

| Revenue Stream | Target Segment | Core Value Metric (Upgrade Trigger) | Est. Gross Margin | Strategic Role |
| :--- | :--- | :--- | :--- | :--- |
| **1. Core SaaS (PLG)** | Prosumers, Freelancers, Startups | **Refresh frequency** (1hr vs. 1min), active API/webhook connections, and private sharing limits. | 75% – 85% | Baseline MRR & viral acquisition funnel. |
| **2. "Client Portal" Tier** | Agencies, Consultants, Dev Shops | **Custom domains**, white-labeling (removing Unidash badges), and client access tokens. | 85% – 90% | **Fastest path to early cash flow.** High willingness to pay. |
| **3. Usage-Based Add-ons** | Heavy Data / Ops Teams | High-volume webhook ingestion, fast-polling worker credits, and extra AI generation tokens. | 60% – 70% | Cost-protection shield for backend workers and LLM bills. |
| **4. Two-Sided Marketplace** | Template & Workflow Creators | **15%–20% platform take rate** on paid templates, industry kits, and data pipeline bundles. | 90%+ | Zero-CAC acquisition moat (creators drive their own traffic). |
| **5. Embedded / OEM (P2)** | SaaS Founders | Monthly Active Viewers (MAV) of iframe/SDK embedded dashboards inside *their* products. | 85%+ | High-ticket B2B expansion (land-and-expand). |

### 1.2 Revised Pricing Tiers (Value-Metric Aligned)

Instead of underpricing B2B use cases or overpricing personal habit trackers, structure tiers around **Data Freshness & Distribution**:

* **Free (₹0 / $0):**
  * Unlimited personal dashboards with manual CSV uploads and sample data.
  * Public-only link sharing (includes prominent *"⚡ Live on Unidash — Clone Structure"* viral badge).
  * Access to install free Community Templates.
  * 10 lifetime AI generation/edit prompts to experience the magic.
* **Creator / Pro (₹1,499 / $19 per month):**
  * Live REST API connections (polled every 15–60 minutes) and Inbound Webhooks.
  * Password/token-protected private links.
  * 1 Custom Domain + ability to publish paid templates in the Creator Studio.
  * 200 monthly AI schema-generation & data-mapping credits.
* **Agency / Team (₹4,999–₹7,999 / $59–$99 per month):**
  * Near real-time polling (1–5 minutes) and direct database real-time subscriptions (Supabase/PostgreSQL).
  * Unlimited Custom Domains (Client Portals) and full White-Labeling (removes Unidash branding).
  * Role-Based Access Control (RBAC), shared team workspaces, and embeddable authenticated `<iframe>` views.
* **Enterprise (Custom):**
  * Dedicated ingestion workers, SSO, granular audit logs, custom SLA, and private deployment options.

---

## 2. Unit Economics & Cost Protection Rules

AI token usage and background polling workers can silently destroy SaaS margins if left unchecked. These two engineering rules must be baked into the P0 architecture:

### 2.1 Rule 1: "Lazy Polling / Viewer-Presence Awake"
* **The Risk:** If 5,000 users configure a REST API to poll every 60 seconds and abandon their browser tabs, background workers will execute $7.2 \times 10^6$ redundant jobs per day.
* **The Architecture Fix:** Implement presence-aware polling. High-frequency polling (1–15 mins) only runs when an active WebSocket/SSE heartbeat confirms a human viewer has the dashboard open. When zero viewers are active, the worker automatically hibernates or drops polling to once every 12–24 hours.

### 2.2 Rule 2: Sub-Tree Context Pruning for AI Edits
* **The Risk:** Passing the entire dashboard JSON schema and full API responses to a frontier LLM for minor layout or styling edits ("change this chart to a bar chart") will blow up token costs.
* **The Architecture Fix:**
  * **Initial Generation:** Use a high-reasoning model with the full prompt and data schema summary.
  * **Iterative Editing:** When a user selects a widget or asks for an edit, pass *only* the selected component's JSON sub-tree and the strict `DashboardEdit` TypeScript union to a fast, low-cost model.

---

## 3. Go-To-Market (GTM) Wedge Strategy

While the architectural promise is *"Anything can be a dashboard,"* marketing a horizontal tool to everyone on Day 1 leads to weak conversion. Unidash will position itself as **"Design-Grade Live Dashboards"** (the visual craft of Figma/Framer meets live API/webhook data in 60 seconds) and target three specific wedges first:

1. **Wedge 1: Automation & AI Agency Builders (Highest ROI)**
   * **Target:** Freelancers and agencies building workflows in n8n, Make, Zapier, or custom Python/AI scripts.
   * **Pain:** They build powerful backend automations for clients but lack a clean, branded frontend to show the live results (forcing them to use ugly Google Sheets or spend weeks coding a custom portal).
   * **Pitch:** *"Give your clients a branded, live command center for your automations in 5 minutes."*
2. **Wedge 2: Indie Hackers & Early-Stage SaaS Founders**
   * **Target:** Founders wanting a single pane of glass combining Stripe MRR, PostHog analytics, and database metrics.
   * **Pitch:** *"Your startup's live founder & investor command center. Connect your APIs, pick a theme, share a secure link."*
3. **Wedge 3: Fractional Executives & Freelance Marketers**
   * **Target:** Consultants managing multiple clients who want to replace static weekly PDF reports with living client portals.

---

## 4. Recommended Adjustments to the 12-Week MVP Blueprint

Before executing the build sequence in Section 11 & 12 of the main blueprint, apply these four scope adjustments:

1. **Add "Inbound Webhook Receiver" to P0 (Alongside REST Polling):**
   * Provide workspaces with an authenticated ingestion endpoint (`POST https://api.unidash.com/v1/ingest/{source_id}`). Letting external tools (n8n, Make, Stripe, custom scripts) *push* JSON payloads to Unidash is cheaper on server resources than outbound polling and immediately unlocks the Automation Agency market.
2. **Scope Down "Forms and Buttons" in P0 to Read/Filter Only:**
   * Remove external write-back actions (POST/PUT mutations to external databases) from P0. Keep buttons and inputs strictly for **internal dashboard state** (cross-widget filtering, date-range pickers, tab switching, parameter toggling). Two-way CRUD introduces massive security and state-validation overhead; nail the **Read + Filter** loop first.
3. **Pull "Embeddable Iframes" Forward from P2 to P1:**
   * Wrapping the Published Viewer in an embeddable `<iframe>` so users can drop live Unidash charts into Notion, Confluence, or client websites is low engineering effort with massive viral distribution upside.
4. **Pull "Publish to Community" Forward into MVP (Keep Payouts in P1/P2):**
   * Let users publish free templates with attribution links in the MVP so the community library starts compounding from Day 1.

---

## 5. The Unidash Creator Studio & Community Architecture

To build a defensible moat like Figma Community or Notion Templates, the **Creator Studio** turns every Unidash user into a template publisher and acquisition channel.

### 5.1 Solving the "Data Dependency" Problem: One-Click AI Anonymizer

Most BI/dashboard marketplaces fail because creators cannot share live dashboards without leaking private API keys or sensitive business numbers, and stripping the data leaves an ugly, empty skeleton.

Unidash solves this with the **One-Click AI Anonymizer & Mock Generator** built directly into the Creator Studio publishing flow:

```text
[Working Private Dashboard] 
       │
       ▼ (Creator clicks "Publish to Community")
[Step 1: Credential & Secret Stripper]
  └─ Removes `secret_reference`, private URLs, headers, and workspace IDs.
  └─ Preserves only the `Required Schema Contract` (field names, data types, aggregations).
       │
       ▼
[Step 2: AI Synthetic Snapshot Generator]
  └─ Inspects the statistical shape and field names of the live data.
  └─ Generates a realistic, deterministic JSON mock dataset (e.g., realistic MRR growth curves, synthetic client names, plausible API latency spikes).
       │
       ▼
[Step 3: Bundle into Immutable Template Manifest]
  └─ Packages `schema_json` + `sample_data_snapshot` + `required_schema_contract`.
  └─ Publishes to CDN for instant, zero-database-load interactive community previews.
```

### 5.2 Core Community & Creator Mechanics

#### A. Interactive Live Previews (Zero Static Screenshots)
Because the Unidash `renderer` package can hydrate directly from `schema_json` and the static `sample_data_snapshot` JSON, community listings are **live interactive apps, not PNGs**. Browsers on the Explore tab can click filters, hover over ECharts tooltips, test mobile/tablet breakpoints, and toggle themes before clicking "Install."

#### B. "Remix / Fork" Attribution Lineage
* Any user who installs a community template can modify the layout, add widgets, and re-publish their version to the community as a **Remix**.
* The system tracks `forked_from_template_id` and displays a permanent attribution badge: *"Remixed from @creator_handle's SaaS Command Center."*
* Original creators gain compounding social proof and profile traffic every time their work is forked.

#### C. One-Click AI Schema Mapper (Frictionless Installation)
When a user installs a community template and connects their own CSV or REST API, column names rarely match the template creator's exact field names.
* Each template carries a **Required Schema Contract** (e.g., expects `date: ISOString`, `revenue: number`, `status: string`).
* Upon connecting a new data source, the **AI Data Assistance** layer compares the user's incoming schema against the template's contract and auto-maps mismatched keys (e.g., mapping the user's `created_at` $\rightarrow$ `date` and `total_amount_cents` $\rightarrow$ `revenue`) in one click.

---

## 6. Creator Studio User Flows & UI Specification

### 6.1 Flow E — Publish to Community (Creator Flow)

1. Creator opens a finished dashboard in the Editor and clicks **Publish $\rightarrow$ Publish to Community**.
2. **Security Check & Anonymization:** System runs the Credential Stripper and confirms zero secrets or private endpoints are exposed.
3. **Synthetic Data Preview:** AI generates the `sample_data_snapshot`. Creator previews the dashboard with the synthetic data and can tweak or regenerate the mock values (e.g., *"Make the sample data look like an e-commerce store doing $50k/mo"*).
4. **Listing Metadata Configuration:**
   * Title, Slug, Category, and Tags.
   * Description & Setup Guide (Markdown supported for explaining how to connect APIs or webhooks).
   * Pricing Model: **Free** (Lead Magnet / Affiliate) or **Paid** ($19–$299, unlocked in Stage 4).
   * Creator CTA Config: Optional *"Hire Me for Custom Setup"* button URL.
5. **Validation & Publish:** System validates schema version, responsive rules, and empty states, then creates an immutable `template_versions` record.

### 6.2 Creator Studio Workspace Navigation

Add a dedicated **Creator Studio** section to the main navigation for users who publish templates:

* **Published Templates:** Manage listings, push version updates (`v1.0.0` $\rightarrow$ `v1.1.0`), and edit setup guides.
* **Analytics & Funnel:** Track `Views` $\rightarrow$ `Interactive Previews` $\rightarrow$ `Installs` $\rightarrow$ `Remixes`.
* **Leads & Inquiries:** Track clicks on the creator's *"Hire Me / Book Consultation"* profile button.
* **Earnings & Affiliates:**
  * Track recurring affiliate commissions from free template installers who upgrade to Unidash Pro.
  * Track direct template sales and Stripe Connect / Razorpay Route payouts (Stage 4).

---

## 7. Creator Monetization Tiers (The 4 Ways Creators Earn)

| Tier | Mechanism | Creator Payout | Rollout Phase |
| :--- | :--- | :--- | :--- |
| **1. "Hire Me" Lead Gen** | Creators publish free templates. Every listing and installed copy includes a subtle *"Need custom API setup? Hire @Creator"* link. | **100% kept by creator** (off-platform consulting/agency retainers). | **MVP (Weeks 5–8)** |
| **2. "Clone & Upgrade" Affiliate** | A user installs a creator's free template (or clicks the viral *"Clone Structure"* badge on their shared link) and upgrades to Pro within 60 days. | **25%–30% recurring commission** for 12 months. | **Beta (Weeks 9–12)** |
| **3. Paid Premium Templates** | Creators sell multi-page industry dashboards directly in the marketplace. | **80%–85% revenue share** to the creator; 15%–20% to Unidash. | **P1 (Post-Beta)** |
| **4. "Pipeline + UI" Bundles** | Creators bundle downloadable automation blueprints (n8n/Make JSON workflows) alongside a pre-wired Unidash webhook template. | **85% revenue share** on high-ticket bundles ($99–$299). | **P2 (Platform Expansion)** |

---

## 8. Database & Manifest Schema Updates

To support the Creator Studio, Remix lineage, and instant synthetic previews from Day 1 without painful database migrations later, update **Section 8.3** and **Section 10** of the main blueprint with the following structures.

### 8.1 Updated Template Manifest (`manifest_json`)

```json
{
  "templateId": "agency-automation-portal",
  "version": "1.0.0",
  "name": "AI Automation Client Portal",
  "category": "business",
  "tags": ["agency", "n8n", "webhooks", "client-portal"],
  "description": "Live client reporting dashboard for AI & automation workflows.",
  "forkedFromTemplateId": null,
  "author": {
    "id": "creator_01",
    "handle": "@alexbuilds",
    "hireMeUrl": "https://cal.com/alexbuilds/unidash-setup"
  },
  "pricing": {
    "type": "free",
    "priceUsd": 0,
    "affiliateEligible": true
  },
  "requiredSchemaContract": [
    {
      "sourceAlias": "workflow_runs",
      "connectorType": "webhook_or_rest",
      "expectedFields": [
        { "key": "execution_date", "type": "datetime", "description": "Timestamp of automation run" },
        { "key": "status", "type": "string", "description": "success | failed | running" },
        { "key": "hours_saved", "type": "number", "description": "Estimated manual hours saved" },
        { "key": "cost_usd", "type": "number", "description": "API/LLM token cost of the run" }
      ]
    }
  ],
  "license": "unidash-community-remixable"
}
```

### 8.2 PostgreSQL Schema Additions (Section 10 Delta)

Update the existing `profiles`, `templates`, and `template_versions` tables, and add `creator_referrals`:

| Table | New / Updated Columns | Purpose |
| :--- | :--- | :--- |
| `profiles` | `handle` (unique), `bio`, `avatar_url`, `hire_me_url`, `is_founding_creator`, `stripe_connect_id` | Powers public Creator Profiles and direct consulting lead generation. |
| `templates` | `forked_from_template_id` (UUID, nullable), `price_cents` (int, default 0), `install_count` (int), `remix_count` (int), `featured_rank` (int) | Tracks Remix attribution lineage, marketplace sorting, and pricing. |
| `template_versions` | `sample_data_snapshot` (JSONB), `schema_contract_json` (JSONB), `setup_guide_md` (Text) | Stores AI-generated anonymized mock data for zero-DB-load interactive previews and one-click AI field mapping. |
| `creator_referrals` *(New)* | `id`, `creator_id`, `referred_user_id`, `source_template_id`, `conversion_status`, `commission_earned_cents`, `created_at` | Tracks the "Clone & Upgrade" viral loop to attribute Pro subscriptions back to template creators. |

---

## 9. Cold-Start Playbook: Seeding the Community in 12 Weeks

Do not launch the community tab as an empty ghost town. Execute this 3-step seeding playbook alongside the engineering roadmap:

1. **Weeks 5–8 (Internal Multi-Persona Seeding):**
   * Build the first 15–20 high-craft templates internally focused on the **3 GTM Wedges** (Automation Client Portals, Indie SaaS Command Centers, and Personal Finance/Life OS).
   * Ensure every template includes rich synthetic data (`sample_data_snapshot`) and interactive cross-filtering.
2. **Weeks 9–10 (The "Founding 50 Creators" Cohort):**
   * Recruit 50 builders who already share Notion templates, n8n/Make workflows, or Framer components on X, YouTube, and LinkedIn.
   * **The Offer:** Free lifetime Unidash Pro, a permanent **"Founding Creator"** badge, **0% platform fee** on their paid templates for Year 1, **30% recurring affiliate share**, and guaranteed featured placement on the Unidash Home screen.
3. **Weeks 11–12 (The Viral "Clone Structure" Loop & Launch Bounties):**
   * Enable the floating **`⚡ Live on Unidash — Clone Structure`** pill on all public and link-shared dashboards.
   * Run a $1,500 launch hackathon across 3 categories (*Best Automation Portal*, *Best Startup Metrics Board*, *Best Personal OS*) where winners are judged on community installs and remixes.