# Unidash — Product Blueprint & Implementation Plan

**Document type:** Product strategy, PRD, UX architecture, technical specification, and delivery roadmap  
**Working name:** Unidash  
**Product promise:** Anything can be a dashboard.  
**Status:** Initial planning blueprint  
**Planning horizon:** MVP and private beta, followed by marketplace and platform expansion

---

## Executive Summary

Unidash is a universal dashboard creation platform where individuals and businesses can turn ideas, data, and workflows into beautiful, interactive workspaces using AI, a visual editor, live data connections, and a marketplace of reusable templates.

The product should not be a collection of separate dashboard products. A personal goals tracker, a startup metrics board, and an operational monitoring interface should share the same underlying component system, data-binding engine, interaction model, and publishing infrastructure. Their templates, permissions, visual styles, and connected data can differ.

The product's competitive advantage should be the combination of:

1. **Exceptional starting points:** beautiful templates people actually want to use.
2. **Freedom to customize:** a visual editor that feels like a design tool, not a configuration form.
3. **A living result:** dashboards that respond to data changes and user interactions rather than producing static mockups.

The marketplace is a first-class product priority, not a feature to tack on at the end. The template system must be dependable before third-party creators are invited to publish.

### Core product loop

**Discover → Create → Customize → Connect → Interact → Publish → Reuse**

### Initial recommendation

- Serve both individuals and businesses at the product and template level.
- Start with a curated first-party template gallery.
- Offer AI generation and visual editing together.
- Support CSV, REST API polling, and one reliable database-driven real-time subscription path.
- Build a shared dashboard schema and rendering engine before expanding widgets and integrations.
- Treat industrial-scale streaming, safety-critical controls, enterprise deployment, and an open third-party marketplace as later phases.

---

## 1. Product Definition

### 1.1 Vision

Make it possible for anyone to create, customize, connect, and publish a powerful dashboard without building an application from scratch.

### 1.2 Mission

Turn dashboard creation from a technical project into an intuitive creative activity.

### 1.3 Product promise

Start with an idea. Choose a template or ask AI. Customize anything. Connect your data. Publish a dashboard that works.

### 1.4 Positioning

**Primary positioning:** A flexible workspace builder for people who want their information organized their way.

Possible messaging:
- Anything can be a dashboard.
- Build the interface your information deserves.
- Your data. Your rules. Your dashboard.
- Turn any idea into an interactive workspace.

### 1.5 Target users

| Segment | Core problem | Example dashboard |
|---|---|---|
| Individuals | Too many personal goals, tools, and metrics | Life OS, habits, fitness, finances, learning |
| Creators and freelancers | Fragmented client and project information | Client portal, income tracker, content calendar |
| Startups and small businesses | Need custom reporting without building internal software | Business command centre, sales dashboard |
| Teams and operators | Need shared, actionable views of workflows | Project operations, service monitoring |
| Technical users | Need a customizable view of live data | API monitoring, IoT telemetry, system health |

The platform can support all these segments in the interface and template system, while keeping initial data connections and workflow capabilities deliberately scoped.

### 1.6 Product principles

- **Template-first:** users should see a useful result before facing a blank canvas.
- **AI is collaborative:** AI proposes, generates, and modifies; the user retains control.
- **Everything is editable:** generated dashboards become real structured components.
- **Data is explicit:** connected, sample, stale, and unavailable data must be distinguishable.
- **Beautiful by default:** spacing, typography, hierarchy, and responsive behavior are built in.
- **Interactions are reusable:** components share a consistent event, state, and action model.
- **Secure by default:** credentials and data permissions are enforced by the backend.
- **Progressive complexity:** basic dashboards remain approachable; advanced functionality is available when needed.

---

## 2. Product Scope and Priorities

### 2.1 P0 — MVP essentials

The smallest complete product that delivers the Unidash promise:

- Dashboard gallery with categories, search, and filters.
- Template preview, duplication, and editable starter data.
- AI prompt-to-dashboard generation using a structured schema.
- Visual canvas with drag, resize, selection, and responsive layouts.
- Initial widget library: metrics, charts, tables, text, lists, progress, forms, and buttons.
- Saved dashboards, multiple pages, and reusable themes.
- CSV import and REST API connector.
- Live refresh, supported real-time subscriptions, and last-updated indicators.
- Cross-widget filters and a basic event/action system.
- Published dashboard URLs with private and public access options.
- Template metadata, versioning, and first-party template publishing.
- Basic authentication, authorization, server-side secret handling, and audit events.

### 2.2 P1 — Beta expansion

- Creator accounts and public template submissions.
- Template ratings, reviews, favorites, and usage analytics.
- Team workspaces and role-based access.
- More integrations, webhooks, and event-driven refresh.
- Advanced filters, formulas, and conditional visibility.
- Version history, restoration, and reusable component groups.
- Paid plans, AI usage quotas, and marketplace transactions.

### 2.3 P2 — Platform expansion

- Custom widget SDK and third-party extensions.
- Embedded dashboards and white-label experiences.
- Advanced workflow automation and scheduled jobs.
- Enterprise SSO, granular audit controls, and private deployment.
- Industrial telemetry pipelines and specialized data adapters.
- Marketplace revenue sharing and advanced creator analytics.

### 2.4 Marketplace scope decision

A curated marketplace/gallery is part of the MVP. External submissions, payments, and creator payouts should follow only after templates can be validated, versioned, and safely installed.

### 2.5 What “live data” means in the MVP

| Capability | Initial approach |
|---|---|
| CSV/uploaded data | Refresh when the user uploads a newer file |
| REST APIs | Configurable polling with caching and rate limits |
| Database-backed records | Subscribe to supported change events |
| External webhooks | Authenticated event endpoint; update affected data |
| High-frequency telemetry | Later, dedicated ingestion and streaming infrastructure |
| Safety-critical control systems | Out of initial scope |

A REST API refreshed every 30 seconds is live-updating, but it is not equivalent to a continuous stream. The UI must communicate the actual refresh mode and timestamp.

**MVP live-data target:** polling plus one reliable real-time subscription path, not every streaming protocol.

---

## 3. Information Architecture

Unidash has two main environments: the product where users discover/manage dashboards, and the editor where they build them.

### 3.1 Main navigation

- **Home:** recent dashboards, templates, and quick creation.
- **Explore:** template gallery, categories, and community creations.
- **My dashboards:** owned dashboards, drafts, and published views.
- **Data sources:** connections, schemas, refresh status, and permissions.
- **Workspace:** members, roles, shared resources, and settings.
- **Marketplace:** templates, component packs, and creator profiles.

### 3.2 Home screen

The home screen should help users do one of three things immediately:

1. Create a dashboard with AI.
2. Start from a template.
3. Reopen an existing dashboard.

Suggested layout:
- Large prompt field: “What do you want to build?”
- Popular starting points.
- Recently edited dashboards.
- Browse by use case.
- Connected data sources and recent activity.

Avoid making the home screen feel like an enterprise admin console. It should feel like a creative tool.

### 3.3 Dashboard editor layout

**Top bar**
- Dashboard name
- Undo/redo
- Responsive breakpoint selector
- Preview
- Save state
- Version history
- Publish

**Left sidebar**
- Widgets
- Templates
- Pages
- Data sources
- Reusable components

**Centre canvas**
- Drag, resize, select, group, align, and test interactions

**Right inspector**
- Properties
- Data bindings
- Styling
- Responsive settings
- Events and actions

**AI command bar**
- Create, edit, explain, or debug the dashboard

### 3.4 Essential editor behaviors

- Drag and resize widgets with predictable grid snapping.
- Select a widget without accidentally triggering its underlying action.
- Edit text inline.
- Show a clear selection outline and insertion targets.
- Support undo/redo across visual edits and AI edits.
- Display loading, empty, error, disconnected, and stale states.
- Preview desktop, tablet, and mobile layouts.
- Save drafts automatically and provide recovery from failed saves.
- Support component duplication, grouping, and alignment.
- Provide keyboard alternatives for core editing operations.

The AI should use the same internal operations as the visual editor. “Move the chart below the table” should update the dashboard schema through a validated edit operation, not create a separate rendering path.

---

## 4. Core User Flows

### 4.1 Flow A — Create with AI

1. User opens Home.
2. User describes the desired dashboard and optionally supplies data.
3. System clarifies requirements only when missing information materially affects the result.
4. System selects a suitable layout or template.
5. AI generates a structured dashboard definition.
6. Validator checks component types, layout, bindings, and actions.
7. Invalid output is repaired or safely rejected.
8. User sees an editable preview.
9. User customizes the result.
10. User connects real data.
11. User tests and publishes.

**Requirements**
- Accept natural-language prompts and optional uploaded CSVs.
- Infer layout, theme, and widget types.
- Generate structured component definitions, not arbitrary frontend source code.
- Validate component types, data bindings, and layout constraints.
- Repair invalid output before presenting it.
- Clearly label mock values and unconnected widgets.
- Support refinements via chat or direct manipulation.

**Success criterion:** a first-time user can create and edit a useful starter dashboard without documentation.

### 4.2 Flow B — Start from a template

1. Explore templates.
2. Search or filter.
3. Open template details.
4. Preview the sample dashboard.
5. Install template.
6. Create an editable copy in the user's workspace.
7. Customize content and theme.
8. Connect data if needed.
9. Save or publish.

Templates must declare required connectors and permissions before installation. Installation must not silently inherit a creator's credentials or private data.

### 4.3 Flow C — Connect live data

1. Open Data Sources.
2. Choose a connector.
3. Configure credentials.
4. Test connection server-side.
5. Discover fields and schema.
6. Select data and refresh mode.
7. Bind data to widgets.
8. Verify values and timestamps.

**Requirements**
- Keep API credentials server-side.
- Use read-only access wherever possible.
- Support connection testing and schema discovery.
- Validate allowed hosts, protocols, timeouts, and response sizes.
- Apply rate limits, caching, and request budgets.
- Expose last successful refresh and connection status.
- Handle schema changes without silently displaying misleading values.
- Separate data-source permissions from dashboard-sharing permissions.

### 4.4 Flow D — Publish and share

Owner selects a publishing mode, configures access, previews the published experience, and confirms publication.

Initial modes:
- **Private:** accessible only to authorized users.
- **Link-shared:** accessible through a controlled sharing link.
- **Public:** accessible without signing in.

Public publishing is opt-in. Never expose private API responses or credentials just because the visual dashboard is public.

---

## 5. Product Requirements

### 5.1 Functional requirements

| ID | Requirement | Acceptance criteria |
|---|---|---|
| PR-01 | Create dashboard | User can create from blank, AI, or template |
| PR-02 | Visual editing | Widgets can be added, selected, moved, resized, and configured |
| PR-03 | Persistent state | Saved changes survive reload and are recoverable |
| PR-04 | Responsive layout | Dashboard adapts to supported screen widths |
| PR-05 | Template gallery | Search, filter, preview, and install a template |
| PR-06 | AI generation | Valid prompt produces an editable, schema-valid dashboard |
| PR-07 | Data connection | CSV and supported REST sources can be connected |
| PR-08 | Live updates | Configured refresh updates affected widgets and reports freshness |
| PR-09 | Interactions | Filters and component events update linked components correctly |
| PR-10 | Publishing | Published view follows its configured access policy |
| PR-11 | Security | Server-side authorization applies to reads, writes, and data queries |
| PR-12 | Template versioning | Installed dashboards remain independent of later template updates |
| PR-13 | Error recovery | Failed refreshes and saves produce clear feedback and preserve recoverable work |
| PR-14 | Accessibility | Core navigation, editing, and published views support keyboard interaction |

### 5.2 Non-functional requirements

- Editor interactions should feel responsive under an agreed test dashboard size.
- Dashboard configuration should load quickly on typical broadband.
- Live refresh must not block the whole canvas.
- Application must tolerate temporarily unavailable data sources.
- All user data operations must be authenticated and authorized.
- Secrets must never be serialized into published dashboard configurations.
- Dashboard schema changes must use versioned migrations.
- Logs and monitoring must make failed connections, AI generations, and publishing errors diagnosable.

A reasonable initial performance target is ordinary editor interactions under roughly 100 ms on a representative desktop, excluding network-dependent work. Establish actual rendering, API response, and dashboard-size targets through performance testing.

### 5.3 Product analytics

Instrument:
- `dashboard_created`
- `template_previewed`
- `template_installed`
- `ai_generation_started`
- `ai_generation_succeeded`
- `ai_generation_failed`
- `widget_added`
- `data_source_connected`
- `live_refresh_succeeded`
- `dashboard_published`
- `dashboard_revisited`

These events reveal whether templates, AI, and live connections help users succeed.

---

## 6. Technical Architecture

### 6.1 Architectural principle

**The dashboard definition is the source of truth; the editor and published viewer are two different ways to interact with it.**

The editor, AI generation, and public runtime should not become three separate systems.

### 6.2 Logical architecture

**Client applications**
- Home
- Template gallery
- Visual editor
- Published viewer

**Application API**
- Authentication
- Authorization
- Validation
- Rate limits

**Core modules**
- Dashboard service: CRUD, schema, versions, publishing
- AI service: generation, edit operations, validation
- Data service: connectors, queries, caching, mappings
- Live-update service: polling, subscriptions, invalidation
- Template service: manifests, installation, versioning

**Infrastructure**
- PostgreSQL
- Secret storage
- Job queue/worker
- Cache
- Observability

This is a logical architecture and does not require separate microservices at the beginning.

### 6.3 Recommended stack

| Layer | Suggested technology | Rationale |
|---|---|---|
| Web application | Next.js + React + TypeScript | Routing, application shell, typed components |
| UI system | Tailwind CSS + shadcn/ui + Motion | Flexible design system and polished transitions |
| Canvas engine | React Grid Layout or custom grid | Dragging, resizing, responsive layout |
| Visualization | Apache ECharts | Interactive charts and diverse visualizations |
| Backend/database | PostgreSQL + Supabase | Relational metadata, persistence, auth integration, supported realtime |
| AI layer | Provider-agnostic model adapter | Avoid locking core logic to one model vendor |
| Background jobs | Managed queue or worker | Polling, retries, webhook processing, heavy work |
| Deployment | Vercel + managed backend services | Pragmatic launch setup; workers can be moved independently |

Before committing to the canvas library, prototype drag/resize, mobile layouts, nested groups, undo/redo, and schema serialization. The layout engine is foundational and expensive to replace later.

### 6.4 Start as a modular monolith

Suggested repository:

```text
unidash/
├── apps/
│   ├── web/                   # Home, gallery, editor, viewer
│   └── worker/                # Scheduled refresh and background jobs
├── packages/
│   ├── dashboard-schema/      # Versioned dashboard types
│   ├── renderer/              # Shared widget runtime
│   ├── editor/                # Canvas and editing controls
│   ├── widget-library/        # Widget definitions and renderers
│   ├── data-connectors/       # CSV, REST, database adapters
│   ├── interaction-engine/    # Events, actions, state and filters
│   ├── template-system/       # Manifest, installation, versioning
│   ├── design-system/         # Tokens, themes and primitives
│   └── ai/                    # Prompting, validation and edit operations
├── supabase/
│   ├── migrations/
│   └── policies/
└── docs/
    ├── product-requirements.md
    ├── architecture.md
    └── schema.md
```

This can be simplified for a solo developer while preserving the boundaries.

### 6.5 Data and real-time architecture

Keep two data paths separate:

1. **Configuration path:** user edits a dashboard, API validates and saves its schema, editor updates.
2. **Data path:** connector fetches or receives external data, backend normalizes it, authorized clients receive updates.

A dashboard's configuration should not need to be rewritten every time a sensor value or API metric changes.

Initial approach:
- Worker for scheduled REST polling.
- Caching and deduplication to avoid redundant requests.
- Supported realtime subscription for database-driven updates.
- Authenticated server endpoints for webhooks.
- Push invalidation or data updates to authorized viewers.
- Expose `lastUpdatedAt`, `lastSuccessfulUpdateAt`, and connection status.
- Pause or reduce refresh frequency for inactive dashboards where appropriate.
- Retry transient failures with backoff and enforce source-specific request budgets.

Do not run one uncontrolled polling loop per open browser tab.

### 6.6 Security architecture

- Enforce workspace ownership and membership in backend policies.
- Store credentials in server-side secret storage, never dashboard JSON.
- Validate and restrict outbound API requests to prevent SSRF.
- Prevent unauthorized users from querying protected data through widget bindings.
- Rate-limit AI generation, connection tests, API calls, and publishing.
- Sanitize rich text and disallow unsafe HTML or script execution in standard widgets.
- Treat custom widget code as untrusted; do not allow arbitrary code execution in the core renderer.
- Use scoped, revocable tokens for private sharing and embedding.
- Audit permission changes, data-source configuration, and publishing events.

For public dashboards, serve only data explicitly approved for public access. Hiding a table or widget in the browser is not access control.

---

## 7. Universal Dashboard Schema

The schema must be flexible enough to describe dashboards across industries, but strict enough to validate, render, save, and modify reliably.

### 7.1 Core entities

| Entity | Purpose |
|---|---|
| Workspace | Ownership, members, and shared resources |
| Dashboard | Name, description, schema, visibility, and current version |
| Page | One screen or section within a dashboard |
| Component | A widget instance and its configuration |
| Data source | Logical connection to a file, API, or database |
| Binding | Connects a component property to a data source or derived value |
| Action | Validated response to an event |
| Theme | Colors, typography, spacing, radii, and visual tokens |
| Template | Published starter definition with metadata and version |
| Publication | Public/private sharing settings and publication state |

### 7.2 Example dashboard definition

Illustrative schema shape, not production-ready code:

```json
{
  "schemaVersion": 1,
  "dashboard": {
    "id": "dash_example",
    "name": "Business Overview",
    "themeId": "theme_modern",
    "pages": [
      {
        "id": "page_overview",
        "title": "Overview",
        "layout": {
          "columns": 12,
          "gap": 16
        },
        "components": [
          {
            "id": "metric_revenue",
            "type": "metric",
            "layout": {
              "x": 0,
              "y": 0,
              "w": 3,
              "h": 2
            },
            "props": {
              "title": "Revenue",
              "format": "currency"
            },
            "binding": {
              "sourceId": "source_sales",
              "field": "revenue"
            },
            "events": []
          }
        ]
      }
    ]
  }
}
```

The schema should be versioned and validated with a runtime validator such as Zod or JSON Schema. The renderer should only accept registered component types and known configuration fields.

### 7.3 Recommended widget contract

Each widget type registers:
- Stable component type and schema version.
- Default properties and layout.
- Property inspector definition.
- Supported data-binding types.
- Supported events and actions.
- Renderer for edit mode and view mode.
- Empty, loading, error, and stale states.
- Responsive behavior.
- Accessibility requirements.

Example: a chart may expose `pointSelected`; a table may expose `rowSelected`. The interaction engine should handle these consistently.

### 7.4 Layout and responsive behavior

Use a 12-column desktop grid initially, but don't assume a dashboard is just desktop coordinates scaled down.

- Store layout rules per breakpoint when necessary.
- Stack wide charts and metric cards sensibly on mobile.
- Allow manual overrides and sensible automatic layouts.
- Use grid-relative dimensions instead of fixed pixels.
- Validate layout collisions and out-of-bounds components.

### 7.5 Data binding and derived values

Separate component presentation from data retrieval. A binding describes the source, selected fields, transformations, and formatting. Query execution occurs through the authorized data service, not directly through a widget.

Support progressively:
1. Direct field binding.
2. Aggregations and formatting.
3. Shared dashboard filters.
4. Derived metrics and formulas.
5. Advanced transformations and cross-source calculations.

Avoid arbitrary SQL or user-authored backend code in the initial version.

---

## 8. Template Marketplace

Unidash should feel like a place where users discover dashboards they want to own, not just a blank editor with a template dropdown.

The marketplace has two roles:
- **Discovery engine:** helps users find the right starting point.
- **Distribution system:** lets creators publish reusable, versioned dashboard experiences.

### 8.1 Initial categories

**Personal**
- Life OS
- Goals and habits
- Fitness
- Reading
- Personal finance
- Learning

**Business**
- Sales
- Marketing
- Revenue
- Operations
- Customer support
- Project management

**Technical and live data**
- API health
- Infrastructure
- Device telemetry
- Operational monitoring

### 8.2 Template listing requirements

Each listing should include:
- Strong preview image or interactive demo.
- Name, description, category, and author.
- Supported-data requirements.
- Widget and page counts.
- Required integrations and permissions.
- Last-updated date and template version.
- Installation count, favorites, and ratings when available.
- Free/paid status.
- Compatibility and security status.

Search should support categories and natural-language intent. Example: “a dashboard to help me run my freelance design business” should return relevant templates even if the exact words aren't in the title.

### 8.3 Template manifest

Illustrative example:

```json
{
  "templateId": "freelance-command-center",
  "version": "1.0.0",
  "name": "Freelance Command Center",
  "category": "business",
  "description": "Manage projects, clients and income.",
  "preview": {
    "mode": "sample-data"
  },
  "requirements": {
    "connectors": ["csv", "rest"]
  },
  "permissions": [],
  "authorId": "creator_example",
  "license": "unidash-standard"
}
```

Define licensing and permissions before accepting third-party submissions.

### 8.4 Template installation and updates

When someone installs a template:
1. Validate definition and compatibility.
2. Create a new dashboard owned by the user.
3. Replace template-specific IDs with new instance IDs where needed.
4. Copy safe defaults and sample data.
5. Leave external credentials unconfigured.
6. Ask the user to connect required sources.
7. Record originating template and version.

Installed dashboards must not silently change when the original template is updated. Later, offer an explicit update/merge flow with a diff and conflict handling.

### 8.5 Marketplace rollout

| Stage | Scope |
|---|---|
| Stage 1 | 15–20 polished first-party templates |
| Stage 2 | Categories, search, filters, favorites, and usage analytics |
| Stage 3 | Creator profiles and moderated submissions |
| Stage 4 | Paid templates, payments, and revenue sharing |
| Stage 5 | Component packs, integration bundles, and richer creator tooling |

Prioritize a small number of excellent templates over hundreds of generic ones. Quality includes interactions, responsive layouts, empty states, and realistic data behavior—not just screenshots.

---

## 9. AI Architecture: Generate and Edit Safely

The AI should not render the interface itself. It should produce structured definitions and validated edit operations that the application understands.

### 9.1 Generation pipeline

1. User prompt and optional data.
2. Intent and requirements extraction.
3. Select compatible template or layout.
4. Generate dashboard schema.
5. Validate components and bindings.
6. If invalid, repair or regenerate bounded changes.
7. Render dashboard preview.
8. User reviews and edits.
9. Save a version.

### 9.2 Four AI tasks

**Generation**
- Create a dashboard schema from a prompt, selected template, or uploaded data.

**Editing**
- Convert “make this more compact” into a set of schema edits.

**Data assistance**
- Suggest chart types, field mappings, aggregations, and filters based on discovered schemas.

**Explanation**
- Summarize data trends, explain failed bindings, and suggest next steps. Explanations must be grounded in retrieved data.

### 9.3 Structured edit operations

Illustrative TypeScript:

```ts
type DashboardEdit =
  | { type: "add_component"; component: DashboardComponent }
  | { type: "remove_component"; componentId: string }
  | {
      type: "update_props";
      componentId: string;
      props: Record<string, unknown>;
    }
  | {
      type: "move_component";
      componentId: string;
      layout: DashboardComponent["layout"];
    };
```

Production operations should use discriminated schemas, granular property allowlists, authorization checks, and transactional application.

The AI should receive only context needed for the requested change. It should not automatically receive API credentials, unrestricted database contents, or unrelated workspace data.

### 9.4 AI acceptance criteria

- Every generated dashboard passes schema validation.
- Unsupported widget types are rejected or replaced with supported alternatives.
- Failed generations don't destroy the current dashboard.
- Edits can be previewed and undone.
- AI cannot bypass permissions by generating a new binding.
- Expensive or external actions require explicit authorization.
- AI-generated summaries identify missing or stale data where relevant.
- Token and latency costs are tracked per workspace.

---

## 10. Database Design

Use PostgreSQL for durable metadata and relational relationships. JSONB is appropriate for a validated dashboard definition, but should not replace every relational table.

| Table | Important fields |
|---|---|
| `profiles` | `id`, `display_name`, `created_at` |
| `workspaces` | `id`, `name`, `owner_id`, `created_at` |
| `workspace_members` | `workspace_id`, `user_id`, `role` |
| `dashboards` | `id`, `workspace_id`, `name`, `schema_json`, `schema_version`, `status`, `visibility`, `updated_at` |
| `dashboard_versions` | `id`, `dashboard_id`, `version`, `schema_json`, `created_by`, `created_at` |
| `data_sources` | `id`, `workspace_id`, `type`, `config_json`, `secret_reference`, `status` |
| `templates` | `id`, `author_id`, `slug`, `category`, `status`, `latest_version` |
| `template_versions` | `id`, `template_id`, `version`, `manifest_json`, `schema_json` |
| `template_installs` | `id`, `template_version_id`, `dashboard_id`, `installed_by` |
| `publications` | `id`, `dashboard_id`, `share_mode`, `token_hash`, `expires_at` |
| `audit_events` | `id`, `workspace_id`, `actor_id`, `event_type`, `metadata_json`, `created_at` |

Add billing, creator payouts, marketplace purchases, and review tables only when those features enter scope.

### Database decisions

- Use foreign keys and indexes for workspace and dashboard relationships.
- Enforce access policies at database and service layers.
- Use JSONB for flexible component definitions, with strict application validation.
- Keep secrets in a dedicated secret manager or protected server-side vault.
- Use versioned migrations for database and dashboard schemas.
- Retain a recoverable revision before destructive schema changes.
- Consider immutable version records for published templates.
- Store audit events separately from frequently updated dashboard records.
- Define data-retention and deletion behavior before accepting sensitive user data.

For live metrics, don't necessarily store every incoming sample in the dashboard table. Use the appropriate source database, cache, or time-series store.

---

## 11. Delivery Roadmap

An initial 8–12 week build is a planning estimate for a focused prototype and private beta, assuming one strong full-stack developer, design support, and AI-assisted development. The canvas engine, live integrations, and editor polish could extend the schedule.

### Weeks 1–2 — Foundation

**Scope**
- Finalize requirements and core user journeys.
- Prototype the grid editor and responsive behavior.
- Establish dashboard schema and widget registry.
- Set up repository, authentication, database, and migrations.
- Build initial theme and component primitives.

**Exit criterion:** a saved schema renders consistently in editor preview and published viewer.

### Weeks 3–4 — Visual builder

**Scope**
- Implement selection, dragging, resizing, and undo/redo.
- Build initial 10–15 widget types.
- Add widget inspectors, themes, and multiple pages.
- Persist changes and restore drafts.
- Build responsive viewer.

**Exit criterion:** user can build, save, reopen, and publish a dashboard without AI.

### Weeks 5–6 — Templates and AI

**Scope**
- Build gallery, search, previews, and installation.
- Produce first 15–20 first-party templates.
- Implement prompt-to-schema generation.
- Add validated AI edit operations.
- Provide clear sample-data states and schema repair.

**Exit criterion:** users can start from a prompt or template and edit the result.

### Weeks 7–8 — Live data

**Scope**
- Add CSV import and first REST connector.
- Implement refresh scheduling and connection health.
- Add a supported database realtime path.
- Implement filters and cross-widget interactions.
- Test caching, failure recovery, and authorization.

**Exit criterion:** connected data updates appropriate widgets and UI reports freshness and errors correctly.

### Weeks 9–10 — Hardening

**Scope**
- Implement publication permissions and protected sharing.
- Test tenant isolation, secret handling, and malicious API inputs.
- Add version history, recovery, and audit events.
- Improve accessibility and mobile behavior.
- Instrument product analytics.

**Exit criterion:** critical user journeys pass end-to-end tests and security checks.

### Weeks 11–12 — Private beta

**Scope**
- Invite a small group of individuals and businesses.
- Observe creation, template installation, and data connection.
- Fix confusing workflows and common failure states.
- Measure activation and repeat usage.
- Decide marketplace and integration priorities.

**Exit criterion:** users repeatedly create dashboards that solve real problems, with evidence of retention or willingness to pay.

### Scope boundary

This estimate assumes a curated marketplace, basic permissions, a small number of dependable data paths, and a constrained widget library. It excludes a mature public marketplace, arbitrary integrations, enterprise governance, and industrial-scale streaming.

---

## 12. Practical Build Sequence

1. **Create the application shell.** Set up authentication, workspace selection, dashboard routing, migrations, and access policies.
2. **Define schema and renderer.** Implement typed dashboard definition, widget registry, themes, and read-only renderer. Verify schema versioning before adding editing.
3. **Implement editor core.** Add selection, drag/resize, property inspectors, save/restore, and undo/redo. Add keyboard alternatives alongside pointer interactions.
4. **Build complete template lifecycle.** Create manifest, gallery, preview, install action, and independent dashboard copy. Ship first curated templates.
5. **Add AI generation.** Generate valid definitions, validate, and render previews. Add bounded edit operations and recovery when generation fails.
6. **Add data connections.** Implement CSV import first, then secure REST adapter, field discovery, bindings, and query validation.
7. **Add live-update infrastructure.** Build worker, scheduled refresh, caching, connection status, supported subscriptions, and authorized client updates.
8. **Add interactions and publishing.** Implement shared filters, component events, public/private access, publication snapshots or versions, and safe viewer rendering.
9. **Harden and validate.** Test permissions, performance, accessibility, schema migration, error recovery, and the complete creation-to-publication journey.

### First vertical slice

Before implementing the entire product, make this one scenario work end-to-end:

1. User opens Unidash.
2. Selects a business metrics template.
3. Installs it into their workspace.
4. Moves a metric card and changes its title.
5. Connects a CSV or REST data source.
6. Metric updates from actual data.
7. Publishes a private dashboard.
8. Reopens it later and sees saved work.

This tests architecture, editor, template system, data layer, and publishing model together.

---

## 13. Testing and Launch Readiness

| Test area | Must verify |
|---|---|
| Schema | Invalid or unsupported components are rejected |
| Editor | Move, resize, undo, redo, and save work consistently |
| AI | Invalid generations are repaired or safely rejected |
| Templates | Installed copies are independent of original |
| Live data | Refreshes, stale states, errors, and reconnects behave correctly |
| Permissions | Users cannot read or change another workspace's protected data |
| Publishing | Public dashboards expose only approved information |
| Responsive UI | Layouts remain usable on desktop, tablet, and mobile |
| Recovery | Failed saves, refreshes, and AI edits don't destroy work |
| Performance | Large dashboards don't freeze the editor or trigger excessive requests |

### Launch gates

Before opening the beta:
- No known critical authorization or credential-exposure issues.
- Complete, repeatable dashboard creation and publishing journey.
- Reliable saving and recovery.
- Accurate status indicators for connected data.
- Useful set of polished templates.
- Monitoring for application errors, failed refreshes, and AI-generation failures.
- Straightforward user issue reporting and feature requests.

---

## 14. Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Universal scope becomes endless | Keep engine universal, but limit initial widgets, integrations, and workflow capabilities |
| Templates look good but don't work | Treat bindings, interactions, mobile layouts, and empty states as template quality requirements |
| Live data creates cost and reliability problems | Define refresh limits, caching, backoff, quotas, and connection health early |
| Platform becomes a security risk | Strict component registration, server-side credentials, backend authorization, controlled outbound requests, explicit publishing permissions |
| Marketplace launches without demand | Begin with first-party templates, track installation and reuse, recruit creators only after validating demand |
| AI produces broken interfaces | Typed schema, deterministic renderer, validation, bounded edits, error feedback |
| Canvas engine is difficult to replace | Prototype key interactions and serialization before committing |
| Too many features slow launch | Prioritize the end-to-end vertical slice over breadth |

Security rule: **never let dashboard visual design bypass data permissions.** Hiding a sensitive widget is not sufficient; the backend must enforce access control.

---

## 15. Business Model

Start with freemium SaaS pricing, with limits aligned to infrastructure costs.

| Plan | Potential scope |
|---|---|
| Free | Personal dashboards, sample data, basic widgets, limited publishing |
| Pro | More dashboards, advanced styling, AI generation credits, API connections |
| Team | Shared workspaces, collaboration, permissions, and team templates |
| Enterprise | SSO, audit trails, advanced security, private deployment options, and support |

Illustrative pricing experiments (not validated market prices):
- **Free:** ₹0
- **Pro:** ₹799–1,499/month
- **Team:** ₹2,999+/month
- **Enterprise:** custom

Potential additional revenue:
- Paid templates.
- Custom components.
- Integration packages.
- Enterprise licensing.
- Marketplace revenue sharing.

Monitor unit economics. AI usage, live refreshes, storage, workflow execution, and published dashboard traffic all cost money. Avoid promising unlimited AI or unrestricted refreshes on a low-cost plan.

---

## 16. Validation Plan

Validate the concept before investing months in a broad feature set.

1. **Build three contrasting demos:** personal goals, startup metrics, and live-data monitoring. Use the same editor and widget system.
2. **Interview 10–15 target users:** ask them to describe a dashboard they currently wish they had. Observe whether they can create something useful without help.
3. **Test prompt-to-dashboard:** can a user get to a useful, editable dashboard in a few minutes?
4. **Test editing:** observe how users change layouts, connect data, and fix an incorrect widget.
5. **Ask for commitment:** recruit design partners and aim for real workflow usage, ideally with a paid pilot before expanding.

### Early metrics

- Time to first usable dashboard.
- Percentage of generated dashboards that get published.
- Percentage of users who return to edit or use a dashboard.
- Successful data connection rate.
- Conversion to a paid pilot or subscription.

### Product success metrics

- **Activation:** percentage of new users who create a useful dashboard.
- **Template conversion:** percentage of template previews that lead to installation.
- **Time to value:** time from first visit to a usable dashboard.
- **Data connection success:** percentage of attempted connections that work.
- **Publication:** percentage of created dashboards shared or published.
- **Retention:** percentage of users who return to view or edit dashboards.
- **Marketplace quality:** template reuse, favorites, and repeat installations.
- **Reliability:** save success, refresh success, and generation failure rates.

Set numerical targets after observing early users rather than treating arbitrary benchmarks as proof of product-market fit.

---

## 17. Final Recommendation

Build Unidash around a single core loop:

**Discover → Create → Customize → Connect → Interact → Publish → Reuse**

The most important architectural investment is the shared dashboard schema and rendering engine. The most important product investment is the combination of beautiful templates and an intuitive editor. Live data should be supported from the beginning, but through a small number of reliable, secure connectors.

The first milestone isn't a massive universal platform. It's one exceptionally polished dashboard builder that proves the full loop works. Once that is reliable, additional templates, widget types, integrations, and marketplace capabilities can grow on the same foundation.

### Immediate next steps

1. **Product requirements document:** finalize scope, acceptance criteria, user stories, and release boundaries.
2. **Technical foundation:** schema specification, repository structure, database migrations, and component contracts.
3. **Editor prototype:** dashboard canvas, widget library, properties panel, and template gallery.

Prioritize the editor experience before adding too much backend complexity. Visual quality and intuitive interactions are where Unidash can establish its identity.

**Build order:** prove the editor and template installation flow first, then add AI and live data on top of a stable foundation.
