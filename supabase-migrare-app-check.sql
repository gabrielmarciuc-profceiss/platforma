-- ============================================================================
-- PROFCEISS · Migrare: extinde constrangerea CHECK pe proiecte.app
-- ----------------------------------------------------------------------------
-- De ce: salvarea in cloud foloseste tabelul "proiecte" pentru toate modulele
-- non-fotovoltaic, punand codul modulului in coloana "app". Schema initiala
-- accepta doar 'profcad','electrica','fotovoltaic','tablotier','altul', deci
-- module ca schema-bloc, buletin-*, spor-de-putere, dosar-* ar fi RESPINSE la
-- salvare. Aici extindem lista cu toate codurile reale folosite de module.
--
-- Cum se ruleaza: Supabase Dashboard -> SQL Editor -> New query -> Run.
-- Sigur de rulat de mai multe ori (drop if exists + add).
-- ============================================================================

alter table public.proiecte
  drop constraint if exists proiecte_app_check;

alter table public.proiecte
  add constraint proiecte_app_check check (app in (
    'profcad',
    'electrica',
    'fotovoltaic',
    'tablotier',
    'schema-bloc',
    'schema-monofilara',
    'buletin-priza-pamant',
    'buletin-izolatie',
    'spor-de-putere',
    'dosar-prosumator',
    'dosar-utilizare',
    'academy-editor',
    'academy-teste',
    'teste',
    'altul'
  ));

-- Verificare:
--   select conname, pg_get_constraintdef(oid)
--   from pg_constraint where conname = 'proiecte_app_check';
