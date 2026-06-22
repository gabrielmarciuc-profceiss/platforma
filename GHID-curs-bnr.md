# Curs BNR actualizabil online — ghid de instalare

Cursul EUR/RON din configuratorul fotovoltaic se ia acum de la **BNR, sursa oficiala**,
prin Supabase. Browserul nu mai apeleaza bnr.ro direct (esua din cauza CORS) — apeleaza
o **Edge Function** care citeste BNR pe server si salveaza cursul intr-un tabel, zilnic.

## Ce s-a schimbat in cod
- `platforma/supabase/functions/curs-bnr/index.ts` — functia care citeste BNR + salveaza + returneaza.
- `platforma/supabase/config.toml` — seteaza functia ca publica (`verify_jwt = false`).
- `platforma/supabase-curs-valutar.sql` — tabelul `curs_valutar` + cron-ul zilnic.
- `platforma/configurator-fotovoltaic/index.html` — apeleaza functia in loc de proxy-uri publice.
- `calculator_fotovoltaic_v5c.html` (master din radacina) — la fel.

## Pasi de instalare (o singura data)

### 1. Deploy la Edge Function
Ai nevoie de Supabase CLI instalat. In folderul `platforma/`:

```bash
supabase login
supabase link --project-ref ecpuyftrrndkgpjwhskt
supabase functions deploy curs-bnr --no-verify-jwt
```

`--no-verify-jwt` o face apelabila public (configuratorul o cheama si fara login).

> Functia foloseste automat variabilele `SUPABASE_URL` si `SUPABASE_SERVICE_ROLE_KEY`,
> care sunt deja disponibile in mediul Edge Functions — nu trebuie sa setezi nimic.

### 2. Creeaza tabelul + cron-ul
Supabase Dashboard → proiectul tau → **SQL Editor → New query** → lipesti tot
`supabase-curs-valutar.sql` → **Run**.

(Daca pg_cron / pg_net nu se activeaza din SQL, activeaza-le din
**Database → Extensions** si reruleaza fisierul.)

### 3. Verifica
Deschide in browser (sau cu curl):

```
https://ecpuyftrrndkgpjwhskt.supabase.co/functions/v1/curs-bnr
```

Ar trebui sa primesti ceva de forma:

```json
{ "rate": 5.2391, "date": "2026-06-19", "source": "BNR", "stale": false }
```

Apoi in SQL Editor: `select * from public.curs_valutar;` — ar trebui sa vezi linia EUR.

Deschide configuratorul fotovoltaic: sub campul de curs ar trebui sa scrie
„Curs BNR <data>: 5.2391 + 2% = 5.3439" (sau similar).

## Cum functioneaza
- La fiecare deschidere a configuratorului, functia returneaza cursul de azi din tabel
  (rapid). Daca lipseste sau e vechi, il ia live de la BNR si il salveaza.
- Cron-ul ruleaza luni-vineri la 13:10 si reimprospateaza cursul (BNR publica ~13:00).
- Daca BNR e momentan picat, functia returneaza ultima valoare salvata (marcata `stale`).
- Configuratorul aplica marja firmei de **+2%** peste cursul oficial (logica veche, pastrata).

## De ce nu alt site (cursbnr.ro, exchangerate.host etc.)
Toate re-publica tot cursul BNR. Acum citim direct sursa oficiala (bnr.ro), pe server,
deci nu mai depindem de niciun intermediar. Vechiul cod folosea proxy-uri publice
(allorigins.win, corsproxy.io) — gratuite dar nesigure si imprevizibile; le-am scos.
