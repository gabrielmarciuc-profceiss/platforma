-- ============================================================================
-- PROFCEISS · Schema Supabase cu securitate (RLS) by default
-- ----------------------------------------------------------------------------
-- Cum se ruleaza:
--   Supabase Dashboard -> proiectul tau -> SQL Editor -> New query
--   -> lipesti tot acest fisier -> Run.
--
-- Principii de securitate (din ghidul oficial Supabase RLS):
--   * RLS este ACTIVAT pe toate tabelele din schema "public" (obligatoriu).
--   * Cu cheia publishable din browser, NU se vede niciun rand pana nu exista
--     o "policy" care permite explicit accesul.
--   * Politicile sunt scrise DOAR pentru rolul "authenticated" (utilizator logat);
--     un vizitator nelogat (anon) nu primeste nimic -> securizat implicit.
--   * Fiecare rand are owner-ul (user_id) si fiecare utilizator vede/editeaza
--     DOAR randurile lui ( (select auth.uid()) = user_id ).
--   * auth.uid() e impachetat in (select auth.uid()) pentru performanta (cache).
--   * Indecsi pe user_id pentru performanta politicilor.
--   * NU se foloseste user_metadata pentru autorizare (poate fi modificat de user).
--
-- IMPORTANT: ca sa functioneze, utilizatorii trebuie sa fie LOGATI (Supabase Auth).
--   Daca nu esti logat, auth.uid() e null si nu ai acces (corect, e securizat).
-- ============================================================================

-- 0) Trigger utilitar: actualizeaza automat updated_at la fiecare UPDATE
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- TABEL: clienti
-- ============================================================================
create table if not exists public.clienti (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  nume        text not null,
  telefon     text,
  email       text,
  adresa      text,
  note        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists clienti_user_id_idx on public.clienti (user_id);
drop trigger if exists clienti_set_updated_at on public.clienti;
create trigger clienti_set_updated_at before update on public.clienti
  for each row execute function public.set_updated_at();

alter table public.clienti enable row level security;
grant select, insert, update, delete on public.clienti to authenticated;

drop policy if exists clienti_select_own on public.clienti;
create policy clienti_select_own on public.clienti for select to authenticated
  using ( (select auth.uid()) = user_id );
drop policy if exists clienti_insert_own on public.clienti;
create policy clienti_insert_own on public.clienti for insert to authenticated
  with check ( (select auth.uid()) is not null and (select auth.uid()) = user_id );
drop policy if exists clienti_update_own on public.clienti;
create policy clienti_update_own on public.clienti for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );
drop policy if exists clienti_delete_own on public.clienti;
create policy clienti_delete_own on public.clienti for delete to authenticated
  using ( (select auth.uid()) = user_id );

-- ============================================================================
-- TABEL: proiecte (profcad, configurator electrica, tablotier ...)
-- "data" = continutul proiectului (JSON), exact ce salvai in localStorage.
-- ============================================================================
create table if not exists public.proiecte (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id   uuid references public.clienti(id) on delete set null,
  app         text not null check (app in ('profcad','electrica','fotovoltaic','tablotier','altul')),
  nume        text not null,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists proiecte_user_id_idx  on public.proiecte (user_id);
create index if not exists proiecte_user_app_idx on public.proiecte (user_id, app);
drop trigger if exists proiecte_set_updated_at on public.proiecte;
create trigger proiecte_set_updated_at before update on public.proiecte
  for each row execute function public.set_updated_at();

alter table public.proiecte enable row level security;
grant select, insert, update, delete on public.proiecte to authenticated;

drop policy if exists proiecte_select_own on public.proiecte;
create policy proiecte_select_own on public.proiecte for select to authenticated
  using ( (select auth.uid()) = user_id );
drop policy if exists proiecte_insert_own on public.proiecte;
create policy proiecte_insert_own on public.proiecte for insert to authenticated
  with check ( (select auth.uid()) is not null and (select auth.uid()) = user_id );
drop policy if exists proiecte_update_own on public.proiecte;
create policy proiecte_update_own on public.proiecte for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );
drop policy if exists proiecte_delete_own on public.proiecte;
create policy proiecte_delete_own on public.proiecte for delete to authenticated
  using ( (select auth.uid()) = user_id );

-- ============================================================================
-- TABEL: oferte (configurator fotovoltaic)
-- ============================================================================
create table if not exists public.oferte (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users(id) on delete cascade,
  client_id   uuid references public.clienti(id) on delete set null,
  numar       text,
  nume        text,
  total_ron   numeric,
  data        jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists oferte_user_id_idx on public.oferte (user_id);
drop trigger if exists oferte_set_updated_at on public.oferte;
create trigger oferte_set_updated_at before update on public.oferte
  for each row execute function public.set_updated_at();

alter table public.oferte enable row level security;
grant select, insert, update, delete on public.oferte to authenticated;

drop policy if exists oferte_select_own on public.oferte;
create policy oferte_select_own on public.oferte for select to authenticated
  using ( (select auth.uid()) = user_id );
drop policy if exists oferte_insert_own on public.oferte;
create policy oferte_insert_own on public.oferte for insert to authenticated
  with check ( (select auth.uid()) is not null and (select auth.uid()) = user_id );
drop policy if exists oferte_update_own on public.oferte;
create policy oferte_update_own on public.oferte for update to authenticated
  using ( (select auth.uid()) = user_id )
  with check ( (select auth.uid()) = user_id );
drop policy if exists oferte_delete_own on public.oferte;
create policy oferte_delete_own on public.oferte for delete to authenticated
  using ( (select auth.uid()) = user_id );

-- ============================================================================
-- GATA. Toate tabelele au RLS activat + politici doar pentru utilizatorul logat.
-- Vizitatorii nelogati (anon) NU au acces la niciun rand.
-- ============================================================================
