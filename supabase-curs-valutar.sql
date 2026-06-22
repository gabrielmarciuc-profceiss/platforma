-- ============================================================================
-- PROFCEISS · Curs valutar BNR (actualizabil online)
-- ----------------------------------------------------------------------------
-- Cum se ruleaza:
--   Supabase Dashboard -> proiectul tau -> SQL Editor -> New query
--   -> lipesti tot acest fisier -> Run.
--
-- Ce face:
--   1) Creeaza tabelul public.curs_valutar (o linie per moneda; noi folosim EUR).
--   2) Activeaza RLS FARA politici -> tabelul e accesibil DOAR din Edge Function
--      (care ruleaza cu service_role si ocoleste RLS). anon/authenticated NU au
--      acces direct -> respecta principiul "anon nu primeste nimic".
--   3) Activeaza pg_cron + pg_net si programeaza un job zilnic care cheama
--      Edge Function "curs-bnr" ca sa reimprospateze cursul.
--
-- IMPORTANT: ruleaza acest fisier DUPA ce ai facut deploy la Edge Function
--   "curs-bnr" (altfel cron-ul cheama un URL care inca nu exista).
-- ============================================================================

-- 0) Trigger utilitar pentru updated_at (daca nu exista deja din schema principala)
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
-- TABEL: curs_valutar
--   currency   = codul monedei (ex: 'EUR')
--   rate       = cursul fata de RON (ex: 5.2391)
--   data       = data oficiala a cursului, asa cum o publica BNR (Cube date)
--   updated_at = cand a fost reimprospatat ultima oara rândul
-- ============================================================================
create table if not exists public.curs_valutar (
  currency    text primary key,
  rate        numeric not null,
  data        date,
  updated_at  timestamptz not null default now()
);

drop trigger if exists curs_valutar_set_updated_at on public.curs_valutar;
create trigger curs_valutar_set_updated_at before update on public.curs_valutar
  for each row execute function public.set_updated_at();

-- RLS activat, FARA politici -> doar service_role (din Edge Function) are acces.
alter table public.curs_valutar enable row level security;

-- ============================================================================
-- CRON zilnic: cheama Edge Function "curs-bnr" ca sa ia cursul nou de la BNR.
-- Necesita extensiile pg_cron si pg_net.
-- (Le poti activa si din Dashboard -> Database -> Extensions.)
-- ============================================================================
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Stergem job-ul vechi daca exista (ca sa putem rula fisierul de mai multe ori).
select cron.unschedule('refresh-curs-bnr')
  where exists (select 1 from cron.job where jobname = 'refresh-curs-bnr');

-- BNR publica de obicei cursul in jurul orei 13:00, in zilele lucratoare.
-- Rulam la 13:10, luni-vineri (ora serverului Supabase este UTC).
select cron.schedule(
  'refresh-curs-bnr',
  '10 13 * * 1-5',
  $$
  select net.http_post(
    url     := 'https://ecpuyftrrndkgpjwhskt.supabase.co/functions/v1/curs-bnr',
    headers := '{"Content-Type":"application/json"}'::jsonb,
    body    := '{}'::jsonb
  );
  $$
);

-- ============================================================================
-- Verificare rapida (optional):
--   select * from public.curs_valutar;            -- dupa primul apel al functiei
--   select * from cron.job where jobname='refresh-curs-bnr';
--   select * from cron.job_run_details order by start_time desc limit 5;
-- ============================================================================
