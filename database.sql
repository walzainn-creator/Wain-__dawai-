-- WINDawai production database
-- PostgreSQL / Supabase
-- Run this in Supabase SQL Editor.
-- Do NOT expose the service-role key in the frontend.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'patient'
    check (role in ('patient','pharmacist','doctor','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.pharmacies (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users(id) on delete set null,
  name text not null,
  phone text not null,
  city text not null,
  area text,
  address text,
  latitude double precision,
  longitude double precision,
  maps_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.drugs (
  id uuid primary key default gen_random_uuid(),
  name_ar text not null,
  scientific_name text,
  aliases text[] not null default '{}',
  category text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  pharmacy_id uuid not null references public.pharmacies(id) on delete cascade,
  drug_id uuid not null references public.drugs(id) on delete cascade,
  status text not null check(status in ('available','unavailable')),
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
  user_id uuid references auth.users(id) on delete set null,
  name text,
  phone text,
  message text not null,
  reply text,
  status text not null default 'pending'
    check(status in ('pending','answered','hidden')),
  created_at timestamptz not null default now(),
  replied_at timestamptz
);

create table if not exists public.search_events (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete set null,
  drug_id uuid references public.drugs(id) on delete set null,
  query_text text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_pharmacies_active on public.pharmacies(is_active);
create index if not exists idx_inventory_drug_status on public.inventory(drug_id,status);
create index if not exists idx_inventory_pharmacy on public.inventory(pharmacy_id);
create index if not exists idx_search_drug on public.search_events(drug_id);
create index if not exists idx_search_created on public.search_events(created_at);
create index if not exists idx_alert_drug on public.alert_requests(drug_id);

alter table public.profiles enable row level security;
alter table public.pharmacies enable row level security;
alter table public.drugs enable row level security;
alter table public.inventory enable row level security;
alter table public.alert_requests enable row level security;
alter table public.comments enable row level security;
alter table public.search_events enable row level security;

-- Public can read active pharmacies and active drugs.
drop policy if exists "public read active pharmacies" on public.pharmacies;
create policy "public read active pharmacies" on public.pharmacies
for select using (is_active=true);

drop policy if exists "public read active drugs" on public.drugs;
create policy "public read active drugs" on public.drugs
for select using (active=true);

drop policy if exists "public read inventory" on public.inventory;
create policy "public read inventory" on public.inventory
for select using (
  exists(select 1 from public.pharmacies p
         where p.id=inventory.pharmacy_id and p.is_active=true)
);

-- A user can create comments/alerts/search events.
drop policy if exists "public insert alerts" on public.alert_requests;
create policy "public insert alerts" on public.alert_requests
for insert with check (true);

drop policy if exists "public insert comments" on public.comments;
create policy "public insert comments" on public.comments
for insert with check (true);

drop policy if exists "public insert search events" on public.search_events;
create policy "public insert search events" on public.search_events
for insert with check (true);

-- Pharmacy owners may manage their own pharmacy.
drop policy if exists "owner read own pharmacy" on public.pharmacies;
create policy "owner read own pharmacy" on public.pharmacies
for select using (owner_id=auth.uid());

drop policy if exists "owner update own pharmacy" on public.pharmacies;
create policy "owner update own pharmacy" on public.pharmacies
for update using (owner_id=auth.uid()) with check (owner_id=auth.uid());

drop policy if exists "owner insert pharmacy" on public.pharmacies;
create policy "owner insert pharmacy" on public.pharmacies
for insert with check (owner_id=auth.uid());

drop policy if exists "owner manage inventory" on public.inventory;
create policy "owner manage inventory" on public.inventory
for all using (
  exists(select 1 from public.pharmacies p
         where p.id=inventory.pharmacy_id and p.owner_id=auth.uid())
) with check (
  exists(select 1 from public.pharmacies p
         where p.id=inventory.pharmacy_id and p.owner_id=auth.uid())
);

-- Profiles: users can read/update their own profile.
drop policy if exists "own profile" on public.profiles;
create policy "own profile" on public.profiles
for select using (id=auth.uid());

drop policy if exists "insert own profile" on public.profiles;
create policy "insert own profile" on public.profiles
for insert with check (id=auth.uid());

-- Admin permissions should be implemented through a server-side role/custom claim.
-- Never grant public users admin UPDATE/DELETE access.
