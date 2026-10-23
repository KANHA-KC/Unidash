# Unidash — Phase 2 Deployment Guide (Cloud & Accounts)

This guide walks through deploying Unidash to production with Supabase Auth, PostgreSQL persistence, and a live SSE data server.

---

## Architecture Overview

Unidash uses a hybrid architecture designed for speed and real-time live data:

1. **Web Frontend (React SPA):**
   - Hosted on **Vercel**, **Cloudflare Pages**, or **Netlify**.
   - Connects directly to Supabase GoTrue for Auth (JWT session).
   - Syncs dashboard configurations to the Data Server / Postgres.

2. **Data Server (Node.js 22):**
   - Hosted on a **long-running host** (**Fly.io**, **Render**, or **Railway**).
   - *Why persistent?* Server-Sent Events (SSE) connections and scheduled REST polling require an active, stateful process with presence tracking—not ephemeral serverless lambdas.
   - Handles data fetching, live streaming, webhook receivers, and authorization.

3. **Database & Auth (Supabase):**
   - **Supabase Auth:** Email/password, magic links, OAuth.
   - **PostgreSQL:** Durable relational storage (`profiles`, `workspaces`, `workspace_members`, `dashboards`, `dashboard_versions`, `data_sources`, `publications`, `audit_events`).
   - **Row Level Security (RLS):** Multi-tenant isolation at the database layer.

---

## 1. Supabase Setup

### A. Project Credentials
Collect the following from your [Supabase Dashboard](https://supabase.com/dashboard):
- **Project URL:** `https://<project-ref>.supabase.co`
- **Anon / Publishable Key:** `Project Settings → API → anon / public`
- **Service Role Key:** `Project Settings → API → service_role` (Server-only secret)
- **Database Connection String:** `Project Settings → Database → Connection string` (URI)

### B. Run Database Migration
Apply the Phase 2 schema located in [`supabase/migrations/00001_phase2_schema.sql`](file:///Users/kc/Desktop/Desktop/unidash/supabase/migrations/00001_phase2_schema.sql):

Using Supabase CLI:
```bash
supabase link --project-ref <your-project-ref>
supabase db push
```

Or via Supabase Dashboard **SQL Editor**:
1. Open the SQL Editor in Supabase.
2. Copy the contents of `supabase/migrations/00001_phase2_schema.sql`.
3. Click **Run**.

This creates the tables, indexes, user auto-provisioning triggers, and RLS security policies.

---

## 2. Environment Variables Reference

### Client (Web App)
Set these in Vercel or your `.env`:
| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Your Supabase project URL (`https://<project>.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Public publishable anon key |
| `VITE_API_URL` | Base URL of the deployed data server (e.g. `https://api.unidash.yourdomain.com`). Leave empty if running unified on one host. |

### Server (Data Server)
Set these in Fly.io / Render / Railway:
| Variable | Description |
|---|---|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_ANON_KEY` | Public publishable anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side service role key (enables admin sync & RLS bypass) |
| `DATABASE_URL` | PostgreSQL connection string (`postgresql://postgres:...`) |
| `PORT` | Listening port (typically `3001` or provided by host as `8080` / `$PORT`) |
| `HOST` | `0.0.0.0` for cloud container hosting |
| `ANTHROPIC_API_KEY` | Optional: enables AI generation and Ask AI features |

---

## 3. Deploy Data Server (Fly.io / Render)

### Option A: Fly.io

1. Create `Dockerfile` in the repository root:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3001
EXPOSE 3001
CMD ["node", "server/index.ts"]
```

2. Deploy:
```bash
fly launch
fly secrets set SUPABASE_URL=... SUPABASE_ANON_KEY=... SUPABASE_SERVICE_ROLE_KEY=... DATABASE_URL=...
fly deploy
```

### Option B: Render or Railway
1. Create a **Web Service** pointing to your repository.
2. Build command: `npm install`
3. Start command: `node server/index.ts`
4. Add the environment variables listed in the Server table above.

---

## 4. Deploy Web App (Vercel)

1. Import your Git repository in Vercel.
2. Framework Preset: **Vite**
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Configure Environment Variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_URL` (Points to your live data server, e.g. `https://api.unidash.fly.dev`)
6. Click **Deploy**.

---

## 5. Verification Checklist

- [ ] **Auth:** Sign up with email/password and verify auto-creation of profile and workspace in Supabase.
- [ ] **Cloud Autosave:** Create or edit a dashboard; refresh on a separate browser or incognito tab to confirm synchronization.
- [ ] **Import Local Drafts:** Click "Import to Cloud" to migrate browser-local dashboards to the user's workspace.
- [ ] **Live Data Streaming:** Open a dashboard with connected sources; verify SSE snapshot updates over HTTPS.
- [ ] **Inbound Webhook:** Send a sample payload to `POST /api/ingest/:id` with bearer token; confirm live widget update.
- [ ] **Protected Sharing:** Test public links, password-protected links with prompt, and workspace-private links.
