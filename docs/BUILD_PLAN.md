# Unidash — Final Build Plan

**Sources:** `Unidash_Product_Blueprint.md` (product, architecture, roadmap) and
`unidash_strategy_creator_studio_addendum.md` (pricing, cost rules, GTM wedges, Creator Studio).
This plan merges the two, records what is built, the decisions that differ from the documents, and
the order to build the rest.

**Positioning (addendum §3):** *Design-grade live dashboards.* The engine stays universal ("anything
can be a dashboard"), but launch marketing targets three wedges: automation/AI agencies, indie SaaS
founders, and fractional consultants.

**Core loop:** Discover → Create → Customize → Connect → Interact → Publish → Reuse.

---

## 1. Status at a glance (October 2026)

The blueprint's **first vertical slice** (§12) now works end to end on one machine:
pick a template → install an independent copy → edit and rearrange it → connect a CSV, API or webhook →
values update live → publish a link → reopen it later.

| Area | Status | Where |
|---|---|---|
| Template gallery, categories, install as independent copy (§8.4) | ✅ 15 templates, 3 with live data | `src/templates.ts` |
| Visual editor: add, edit, resize (S/M/L/Full), drag-reorder, undo, keyboard moves | ✅ | `src/views/Board.tsx` |
| Responsive desktop / tablet / phone, light & dark | ✅ | `src/styles.css` |
| 14 widget types with a shared registry (§7.3) | ✅ | `src/widgets/registry.ts` |
| CSV import (upload or paste) | ✅ | `server/sources.ts` |
| REST polling with intervals, test-before-save, schema discovery | ✅ | `server/sources.ts`, `server/net.ts` |
| **Inbound webhook receiver** (addendum §4.1 → P0) | ✅ token-auth `POST /api/ingest/:id` | `server/index.ts` |
| Live push to viewers (SSE) | ✅ | `src/live.ts` |
| **Lazy polling / viewer-presence** (addendum §2.1) | ✅ full speed only while a viewer is connected; else every 12 h | `server/sources.ts` |
| Freshness states: live / stale / error / waiting / paused / uploaded (§1.6 "data is explicit") | ✅ badge on every bound widget | `src/components/WidgetCard.tsx` |
| Sample-data labelling for template values | ✅ "Sample" tag until edited or connected | `src/templates.ts` |
| Data binding: value, series, category, table, with aggregations (§7.5 steps 1–2) | ✅ | `src/resolve.ts` |
| Secrets server-side, never returned or published (§6.6) | ✅ header names only are exposed | `server/store.ts` |
| SSRF guard: http(s) only, private/metadata IPs blocked, redirects re-checked, 10 s timeout, 2 MB cap | ✅ | `server/net.ts` |
| Publish view-only link, update/unpublish, viewers stream only that dashboard's sources | ✅ | `src/components/ShareSheet.tsx` |
| **Embeddable iframe** (addendum §4.3, pulled forward) | ✅ `?embed=1` | `src/views/Published.tsx` |
| **"Live on Unidash · Make your own" + "Use as template"** viral loop (addendum §9.3) | ✅ basic | `src/views/Published.tsx` |
| Accounts, workspaces, private links, RBAC | ❌ Phase 2 | — |
| AI prompt-to-dashboard and AI edits (Phase 3) | ✅ needs `ANTHROPIC_API_KEY`; without it the prompt suggests the closest template | `server/ai.ts`, `shared/ai.ts`, `src/components/AiPrompt.tsx`, `src/components/AskAI.tsx` |
| Dashboard filters (pinned field dropdowns) + date range (last hour / today / 7 days / all), applied before aggregation, saved with the dashboard, used by the shared viewer | ✅ Phase 4 | `src/components/FilterBar.tsx`, `src/resolve.ts` |
| Click-to-filter: donut slice or grouped bar sets a filter, clicking again clears it, removable chip; the clicked chart highlights instead of collapsing | ✅ Phase 4 | `src/components/Charts.tsx`, `src/pages.ts` |
| Multiple pages per dashboard (tabs → chip row on phones); old flat dashboards are one implicit page, no migration rewrite | ✅ Phase 4 | `src/components/PageTabs.tsx`, `src/pages.ts` |
| Version history: last 20 versions per dashboard in this browser, Restore sheet with undo | ✅ Phase 4 | `src/store.ts`, `src/components/VersionSheet.tsx` |
| Database real-time subscription connector (Postgres/Supabase) | ❌ Phase 4 | — |
| Creator Studio, community, remix lineage, anonymizer | ❌ Phase 5 | — |
| Plans, billing, custom domains, white-label | ❌ Phase 6 | — |

### Requirements check (blueprint §5.1)

| ID | Requirement | Status |
|---|---|---|
| PR-01 | Create from blank, AI or template | ✅ |
| PR-02 | Add, select, move, resize, configure | ✅ |
| PR-03 | Saved changes survive reload | ✅ in this browser · cloud → Phase 2 |
| PR-04 | Responsive layout | ✅ |
| PR-05 | Gallery search/filter/preview/install | Filter + install ✅ · search & live preview → Phase 5 |
| PR-06 | AI generation | ✅ generation + edits · schema mapper still to do |
| PR-07 | CSV and REST sources | ✅ (+ webhooks) |
| PR-08 | Live updates with freshness | ✅ |
| PR-09 | Filters and component events | ✅ filters, date range, click-to-filter (read/filter only) |
| PR-10 | Publishing follows access policy | Link sharing ✅ · private/password → Phase 2 |
| PR-11 | Server-side authorization | ⚠️ Local-only gate today · real auth → Phase 2 |
| PR-12 | Installs independent of template updates | ✅ |
| PR-13 | Clear feedback on failed refresh/save | ✅ refresh errors; save is local |
| PR-14 | Keyboard support | ✅ core editing |

---

## 2. Decisions that differ from the documents

| Blueprint said | We did | Why | Revisit when |
|---|---|---|---|
| Next.js + Supabase from day 1 | Vite + React SPA + a dependency-free Node data server | Proves the loop without accounts or hosting decisions; Node 22 runs the TypeScript server directly | Phase 2: move persistence to Supabase Postgres; the server's `store.ts` is the only storage seam |
| 12-column x/y/w/h canvas | Ordered widgets with 4 sizes; the grid reflows per breakpoint | Far simpler to use, works with touch, and phones/tablets never need hand-made layouts | Only if users demand pixel placement; the schema can add optional per-breakpoint overrides |
| Apache ECharts | Small custom SVG charts | ~10× smaller bundle, theme-consistent, accessible | Need for maps, heatmaps or very large series |
| Supabase Realtime for live updates | Server-Sent Events from our own server | One mechanism for polling, webhooks and demos; doubles as the presence signal for lazy polling | Add a Postgres change-feed **connector** in Phase 4; keep SSE as the delivery path |
| Dashboards in Postgres | Dashboards in browser storage; only published copies live on the server | No accounts yet | Phase 2 |

The principle from §6.1 holds: **the dashboard definition is the source of truth**. The editor, the
published viewer and (later) AI all read and write the same `Dashboard` / `Widget` / `Binding` types
(`src/types.ts`, `shared/data.ts`).

---

## 3. Architecture today

```text
Browser (React SPA)                         Data server (node server/index.ts)
├─ Home / templates  ──install──▶            ├─ /api/sources        CRUD, test, refresh   (owner only)
├─ Board editor                              ├─ /api/stream         SSE live snapshots   (owner only)
│   └─ WidgetCard ◀── snapshots ── SSE ──────┤     └─ open stream = viewer presence → lazy polling
├─ Data sources page                         ├─ /api/ingest/:id     webhooks (token)      (public)
└─ Published viewer (#/p/:token) ◀── SSE ────┤ /api/p/:token(/stream) shared links       (public)
                                             ├─ scheduler: REST polls, demo ticks, backoff
dashboards: localStorage                     └─ .data/db.json: sources, rows, secrets, publications
```

Two paths are kept separate, as §6.5 requires: **configuration** (dashboard JSON, saved by the
editor) and **data** (rows fetched or received by the server, pushed to viewers). Live values never
rewrite the dashboard.

### Running it

```bash
npm install
npm run dev        # web app on :3000, data server on :3001 (proxied at /api)
npm run build && npm start   # production: one server on $PORT serving app + API
```

Environment: `UNIDASH_ALLOW_PRIVATE=1` lets API sources reach localhost/LAN (e.g. a local n8n);
`UNIDASH_TRUST_LAN=1` lets other devices on your network manage sources (no auth yet — use with care);
`UNIDASH_DATA_DIR` moves the data file. `ANTHROPIC_API_KEY` turns on AI generation and edits
(token usage per request is logged as `[ai] …` lines).

### Security posture right now

- There are **no accounts yet**. Managing sources (and reading webhook tokens) is limited to
  requests from the machine running Unidash. Shared links and webhook ingest are open by design.
- **Do not deploy to the public internet before Phase 2.** Behind a reverse proxy every request looks
  local, which would expose source management.

---

## 4. Roadmap from here

Each phase ends with a working product. Estimates assume one developer with AI assistance.

### Phase 2 — Accounts & cloud (2–3 weeks) · *gate for any public deploy*
- Supabase Auth (email link + Google), `profiles`, `workspaces`, `workspace_members` (blueprint §10).
- Move dashboards to Postgres (`dashboards`, `dashboard_versions`) with autosave, offline cache and
  conflict-safe saves; import existing browser dashboards on first sign-in.
- Move `server/store.ts` to Postgres tables `data_sources`, `publications`, `audit_events`; secrets in
  Supabase Vault (`secret_reference`), never in rows.
- Replace the local-only gate with workspace authorization on every route (row-level security + server checks).
- Private and password/token-protected share links; revocable embed tokens.
- Deploy: web on Vercel; data server on a long-running host (Fly.io / Render / Railway) — SSE and the
  scheduler need a persistent process, not serverless functions.
- **Exit:** two users on different devices can't see each other's data; a user can reopen work on any device.

### Phase 3 — AI generation & editing (2 weeks) · ✅ built except the schema mapper
- ✅ Home prompt: "What do you want to build?" → `POST /api/ai/generate` (owner-only) → `claude-opus-5-5`
  with structured output (one JSON-schema variant per widget type) and server-side refusal fallback.
- ✅ Strict validation in `shared/ai.ts`, run on the server and again in the browser: unknown widget
  types and fields dropped, values repaired (numbers, dates, time zones, http(s)-only URLs, list caps),
  never rendered raw. Generated numbers/charts/tables carry the "Sample" tag. *Decision:* a small
  hand-written validator instead of Zod — the server stays dependency-light and the same code runs in both places.
- ✅ Edits: "Ask AI" bar in edit mode (layout edits, sees a compact outline of the current page) and in the
  widget editor (sees only that widget's JSON) → `POST /api/ai/edit` → `claude-haiku-5-5` returns typed ops
  (`add_component`, `update_props`, `move_component`, `remove_component`), validated against the ids it was
  shown, applied through `updateDashboard` as **one undo step**.
- ✅ No `ANTHROPIC_API_KEY`: the API answers 503 with a clear message; the Home prompt offers the closest
  template by keyword, and Ask AI says AI isn't set up.
- ✅ Token usage per request in the server log. Per-workspace metering waits for accounts (Phase 2) and billing (Phase 6).
- ⏳ **AI schema mapper** (addendum §5.2C): match a new source's fields to a template's
  `requiredSchemaContract` in one click (needs the Phase 5 template manifest).
- **Exit:** a first-time user reaches a useful, editable dashboard from one sentence.

### Phase 4 — Interactions & deeper data (2 weeks)
- ✅ Dashboard-level filters and date-range picker; `pointSelected` → filter action (donut slices, grouped
  bars). Read/filter only — no write-back to external systems (addendum §4.2). `rowSelected` (table rows) still open.
- ✅ Multiple pages per dashboard; version history with restore (local; moves to Postgres with Phase 2).
- Postgres/Supabase change-feed connector (the blueprint's "one reliable database real-time path").
- Derived metrics and formulas (§7.5 step 4); schema-change detection with a visible warning.
- **Exit:** clicking a slice filters every linked widget; a DB row change appears in under 2 s.

### Phase 5 — Creator Studio & community (3 weeks)
- Publish → **Publish to community** flow (addendum §6.1): credential stripper (extends today's
  publish sanitising), synthetic `sample_data_snapshot`, listing metadata, setup guide, "Hire me" URL.
- Template manifest v2 with `requiredSchemaContract`, `forkedFromTemplateId`, pricing, license
  (addendum §8.1); tables `templates`, `template_versions`, `template_installs`, `creator_referrals`.
- Explore tab with search, interactive live previews from snapshots, remix lineage badges,
  creator profiles and the Analytics funnel (views → previews → installs → remixes).
- **Exit:** a creator publishes a template; another user installs, connects their own data and remixes it.

### Phase 6 — Plans & billing (1–2 weeks)
- Tiers per addendum §1.2, gated on **data freshness and distribution**: Free (manual CSV, public links
  with badge, 10 AI prompts) · Pro $19 (REST 15–60 min, webhooks, private links, 1 custom domain,
  200 AI credits) · Agency $59–99 (1–5 min polling, DB realtime, unlimited domains, white-label,
  RBAC, authenticated embeds) · Enterprise.
- Stripe (global) and Razorpay (India); usage metering for polling and AI; affiliate attribution.
- Custom domains and white-label for client portals (the fastest revenue path per addendum §1.1).

### Phase 7 — Private beta & launch (2 weeks, overlaps 5–6)
- Instrument the blueprint §5.3 events; activation, time-to-value and retention dashboards (built in Unidash).
- 15–20 polished templates aimed at the three wedges (addendum §9.1).
- Founding 50 Creators cohort, launch hackathon, "Clone structure" pill on every shared link.
- Launch gates from blueprint §13 — especially no credential exposure and accurate freshness indicators.

---

## 5. Risks to watch

| Risk | Mitigation in place / planned |
|---|---|
| Polling costs explode | Presence-aware polling ✅, minimum 15 s interval ✅, backoff ✅ · per-plan limits in Phase 6 |
| Misleading numbers | Freshness badges ✅, sample tags ✅, "waiting for data" instead of zeros ✅ · schema-change warnings Phase 4 |
| Data leaks via sharing | Secrets server-side ✅, shared links stream only bound sources ✅ · real auth Phase 2 |
| SSRF through API sources | Private ranges + metadata IPs blocked, redirects re-validated ✅ · DNS-rebinding hardening (pin resolved IP) in Phase 2 |
| Scope creep ("universal") | Engine stays universal; marketing and templates focus on the three wedges |
