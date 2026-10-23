-- Unidash Phase 2 — Accounts, Workspaces, Cloud Persistence Schema
-- Matches Blueprint §10 and Build Plan Phase 2

-- Enable pgcrypto for UUID and random token generation
create extension if not exists pgcrypto;

-- 1. Profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Workspaces
create table if not exists public.workspaces (
  id text primary key,
  name text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 3. Workspace Members
create table if not exists public.workspace_members (
  workspace_id text not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz default now(),
  primary key (workspace_id, user_id)
);

-- 4. Dashboards
create table if not exists public.dashboards (
  id text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  name text not null,
  schema_json jsonb not null,
  schema_version int not null default 1,
  status text not null default 'active',
  visibility text not null default 'private' check (visibility in ('private', 'shared', 'public')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 5. Dashboard Versions
create table if not exists public.dashboard_versions (
  id text primary key,
  dashboard_id text not null references public.dashboards(id) on delete cascade,
  version int not null default 1,
  schema_json jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now()
);

-- 6. Data Sources
create table if not exists public.data_sources (
  id text primary key,
  workspace_id text not null references public.workspaces(id) on delete cascade,
  name text not null,
  kind text not null check (kind in ('csv', 'rest', 'webhook', 'demo')),
  config_json jsonb not null default '{}'::jsonb,
  secret_reference jsonb default '{}'::jsonb,
  status text not null default 'idle',
  rows_json jsonb not null default '[]'::jsonb,
  fields_json jsonb not null default '[]'::jsonb,
  last_updated_at timestamptz,
  last_success_at timestamptz,
  error text,
  created_at timestamptz default now()
);

-- 7. Publications
create table if not exists public.publications (
  token text primary key,
  dashboard_id text references public.dashboards(id) on delete set null,
  dashboard_json jsonb not null,
  source_ids jsonb not null default '[]'::jsonb,
  share_mode text not null default 'public' check (share_mode in ('public', 'private', 'password')),
  password_hash text,
  expires_at timestamptz,
  published_at timestamptz default now()
);

-- 8. Audit Events
create table if not exists public.audit_events (
  id text primary key,
  workspace_id text references public.workspaces(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  metadata_json jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

-- Indexes for performance
create index if not exists idx_workspaces_owner on public.workspaces(owner_id);
create index if not exists idx_workspace_members_user on public.workspace_members(user_id);
create index if not exists idx_dashboards_workspace on public.dashboards(workspace_id);
create index if not exists idx_dashboard_versions_dashboard on public.dashboard_versions(dashboard_id);
create index if not exists idx_data_sources_workspace on public.data_sources(workspace_id);
create index if not exists idx_audit_events_workspace on public.audit_events(workspace_id);

-- 9. Trigger: Automatically provision profile and personal workspace on user signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  ws_id text;
  display text;
begin
  display := coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'User');
  
  -- Create profile
  insert into public.profiles (id, display_name)
  values (new.id, display)
  on conflict (id) do nothing;

  -- Create personal workspace
  ws_id := 'ws_' || substr(md5(random()::text || clock_timestamp()::text), 1, 12);
  insert into public.workspaces (id, name, owner_id)
  values (ws_id, coalesce(display || '’s Workspace', 'Personal Workspace'), new.id);

  -- Add user as workspace owner
  insert into public.workspace_members (workspace_id, user_id, role)
  values (ws_id, new.id, 'owner');

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 10. Row Level Security (RLS)
alter table public.profiles enable row level security;
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.dashboards enable row level security;
alter table public.dashboard_versions enable row level security;
alter table public.data_sources enable row level security;
alter table public.publications enable row level security;
alter table public.audit_events enable row level security;

-- Helper function: check workspace membership
create or replace function public.is_workspace_member(ws_id text)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

-- Profiles policies
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = id);

-- Workspaces policies
create policy "Members can view workspaces" on public.workspaces
  for select using (public.is_workspace_member(id) or owner_id = auth.uid());
create policy "Owners can update workspaces" on public.workspaces
  for update using (owner_id = auth.uid());
create policy "Users can insert workspaces" on public.workspaces
  for insert with check (owner_id = auth.uid());

-- Workspace members policies
create policy "Members can view workspace members" on public.workspace_members
  for select using (public.is_workspace_member(workspace_id));
create policy "Owners can manage workspace members" on public.workspace_members
  for all using (
    exists (
      select 1 from public.workspaces
      where id = workspace_members.workspace_id and owner_id = auth.uid()
    )
  );

-- Dashboards policies
create policy "Workspace members can view dashboards" on public.dashboards
  for select using (public.is_workspace_member(workspace_id));
create policy "Workspace members can insert dashboards" on public.dashboards
  for insert with check (public.is_workspace_member(workspace_id));
create policy "Workspace members can update dashboards" on public.dashboards
  for update using (public.is_workspace_member(workspace_id));
create policy "Workspace members can delete dashboards" on public.dashboards
  for delete using (public.is_workspace_member(workspace_id));

-- Dashboard versions policies
create policy "Workspace members can view versions" on public.dashboard_versions
  for select using (
    exists (
      select 1 from public.dashboards d
      where d.id = dashboard_versions.dashboard_id and public.is_workspace_member(d.workspace_id)
    )
  );
create policy "Workspace members can insert versions" on public.dashboard_versions
  for insert with check (
    exists (
      select 1 from public.dashboards d
      where d.id = dashboard_versions.dashboard_id and public.is_workspace_member(d.workspace_id)
    )
  );

-- Data sources policies
create policy "Workspace members can view sources" on public.data_sources
  for select using (public.is_workspace_member(workspace_id));
create policy "Workspace members can manage sources" on public.data_sources
  for all using (public.is_workspace_member(workspace_id));

-- Publications policies
create policy "Anyone can view public publications" on public.publications
  for select using (
    share_mode = 'public' and (expires_at is null or expires_at > now())
  );
create policy "Publishers can manage publications" on public.publications
  for all using (
    dashboard_id is null or exists (
      select 1 from public.dashboards d
      where d.id = publications.dashboard_id and public.is_workspace_member(d.workspace_id)
    )
  );

-- Audit events policies
create policy "Workspace members can view audit events" on public.audit_events
  for select using (public.is_workspace_member(workspace_id));
create policy "System can insert audit events" on public.audit_events
  for insert with check (true);
