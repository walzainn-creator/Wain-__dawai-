-- Windawai database foundation
-- Target: PostgreSQL / Supabase
-- IMPORTANT: Run this only after creating your own Supabase project.
-- Never place a service-role key in index.html or app-config.js.

create extension if not exists pgcrypto;

create table if not exists public.pharmacies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  city text not null,
  area text,
  address text,
  latitude double precision,
  longitude double precision,
  maps_url text,
  approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.drugs (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  scientific_name text,
  aliases text[] default '{}',
  category text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies(id) on delete cascade,
  drug_id uuid not null references public.drugs(id) on delete cascade,
  status text not null check (status in ('available','unavailable')),
  price numeric(12,2),
  currency text not null default 'SDG',
  eta text,
  updated_at timestamptz not null default now(),
  unique(pharmacy_id, drug_id)
);

create table if not exists public.alert_requests (
  id uuid primary key default gen_random_uuid(),
  drug_id uuid not null references public.drugs(id) on delete cascade,
  pharmacy_id uuid references public.pharmacies(id) on delete set null,
  phone text,
  created_at timestamptz not null default now(),
  notified_at timestamptz
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  name text,
  phone text,
  message text not null,
  reply text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  replied_at timestamptz
);

create table if not exists public.search_events (
  id bigint generated always as identity primary key,
  drug_id uuid references public.drugs(id) on delete set null,
  query_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_inventory_drug_status on public.inventory(drug_id,status);
create index if not exists idx_inventory_pharmacy on public.inventory(pharmacy_id);
create index if not exists idx_search_events_drug on public.search_events(drug_id);
create index if not exists idx_alert_requests_drug on public.alert_requests(drug_id);

-- Basic public-read policy for approved pharmacy inventory.
alter table public.pharmacies enable row level security;
alter table public.drugs enable row level security;
alter table public.inventory enable row level security;
alter table public.alert_requests enable row level security;
alter table public.comments enable row level security;
alter table public.search_events enable row level security;

drop policy if exists "public approved pharmacies" on public.pharmacies;
create policy "public approved pharmacies"
on public.pharmacies for select
using (approved = true);

drop policy if exists "public active drugs" on public.drugs;
create policy "public active drugs"
on public.drugs for select
using (active = true);

drop policy if exists "public available inventory" on public.inventory;
create policy "public available inventory"
on public.inventory for select
using (
  exists (
    select 1 from public.pharmacies p
    where p.id = inventory.pharmacy_id and p.approved = true
  )
);

-- Public users may create alert requests and comments.
drop policy if exists "public create alerts" on public.alert_requests;
create policy "public create alerts"
on public.alert_requests for insert
with check (true);

drop policy if exists "public create comments" on public.comments;
create policy "public create comments"
on public.comments for insert
with check (true);

-- Do not add public UPDATE/DELETE policies.
-- Pharmacy/admin writes must be authenticated and controlled by server-side roles.
