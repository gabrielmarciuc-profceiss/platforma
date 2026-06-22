# Salvare in cloud (Supabase) — activare + test

Pana acum modulele salvau doar in localStorage + backup in fisier `.pce.json`.
Acum salvarea se face in baza de date Supabase (tabelele `proiecte` si `oferte`),
legata de contul utilizatorului (fiecare isi vede doar proiectele lui — RLS).

> Faza 1 (acum): cloud-ul a fost ACTIVAT peste tot, dar metoda JSON a ramas pe loc
> ca plasa de siguranta. Nu s-a stricat nimic din ce exista.
> Faza 2 (dupa ce confirmi ca merge cloud-ul): scot complet butoanele/functiile
> `.pce.json`, conform deciziei tale.

## Ce s-a modificat (faza 1)
- `assets/profceiss-projects.js` — incarca automat biblioteca Supabase + `assets/supabase.js`
  si monteaza butoanele „Salveaza in cloud" / „Proiectele mele". Acopera toate cele 11
  module care includ acest fisier (profcad, schema-bloc, schema-monofilara, tablotier,
  buletin-priza-pamant, buletin-izolatie, spor-de-putere, Dosar-prosumator, academy/*).
- `configurator-electrica/index.html` si `configurator-fotovoltaic/index.html` — au primit
  includerea bibliotecii Supabase (aveau deja codul de montare a butoanelor, dar nu incarcau
  biblioteca).
- `profcad/index.html` — am scos blocul inline vechi de cloud (acum se monteaza centralizat,
  ca sa nu existe doua montari in conflict).
- `supabase-migrare-app-check.sql` — extinde constrangerea `proiecte.app` ca sa accepte
  codurile tuturor modulelor (altfel salvarea pica pentru schema-bloc, buletine, dosare etc.).

## Pasi de activare (o singura data)
1. Asigura-te ca schema principala e deja rulata (tabelele `proiecte`, `oferte`, `clienti`
   din `supabase-schema.sql`). Daca nu, ruleaza-o intai.
2. Ruleaza migrarea: Supabase Dashboard → SQL Editor → lipesti `supabase-migrare-app-check.sql` → Run.
3. Publica modificarile (commit + push / scriptul tau .bat). Live in 1–3 minute.

## Test in browser (fa-l inainte de faza 2)
Pentru fiecare modul important (macar configurator-fotovoltaic, configurator-electrica,
profcad, un buletin si un dosar):
1. Deschide modulul. Jos-dreapta apare „🔑 Login / Cont" si un indicator „Supabase: conectat".
2. Apasa Login si creeaza-ti / intra in cont (email + parola).
3. Completeaza ceva in modul. Sus apare bara „☁ Salveaza in cloud" / „☁ Proiectele mele".
4. Apasa „Salveaza in cloud", da un nume. Trebuie sa apara „Salvat in cloud: <nume>".
5. Reincarca pagina (sau deschide pe alt calculator/telefon, logat cu acelasi cont) →
   „Proiectele mele" → „Deschide". Proiectul trebuie sa revina complet.
6. Verifica in Supabase: Table Editor → `proiecte` (sau `oferte` pentru fotovoltaic) →
   trebuie sa vezi randul, cu `user_id`-ul tau.

### Daca ceva nu merge
- „Intra in cont ca sa salvezi" → nu esti logat; apasa Login.
- Eroare cu „violates check constraint proiecte_app_check" → nu ai rulat migrarea (pasul 2).
- „Supabase: biblioteca neincarcata" → CDN-ul jsdelivr a fost blocat la incarcare; reincearca.
- Butoanele de cloud nu apar → verifica in consola (F12) erori de la `supabase.js`.

## Faza 2 — scoaterea metodei JSON (dupa confirmare)
Cand imi confirmi ca salvarea in cloud merge pe module, scot:
- din `assets/profceiss-projects.js`: `fileExport` / `fileImport` + butoanele
  „⬇ Backup in fisier" / „⬆ Incarca din fisier";
- din `configurator-electrica/index.html`: butoanele `pExport` / `pImport` + `.pce.json`.
