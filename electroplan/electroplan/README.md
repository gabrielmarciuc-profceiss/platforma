# ElectroPlan — instrucțiuni

Suită de unelte pentru a duce un plan electric din AutoCAD în realitate augmentată pe șantier.

## Fișiere

| Fișier | Ce face | Unde merge |
|---|---|---|
| `index.html` | Pagină de pornire cu linkuri către toate uneltele | oriunde |
| `etapa0-editor.html` | Editor: încarcă DXF, marchează dispozitive + trasee, export JSON | desktop + telefon |
| `casa_test.dxf` | Plan de test (casă 10×8 m, unitate **mm**) | — |
| `etapa2-ar.html` | Aplicația AR: plan → suprapunere pe pereți reali | **doar Android + Chrome, HTTPS** |
| `pv-ar.html` | Demo plasare sistem fotovoltaic AR | Android + iPhone |
| `pv-panou.usdz` | Model 3D panou pentru AR Quick Look (atinge-l pe iPhone) | iPhone |

## Găzduire pe GitHub Pages (de pe desktop Windows)

1. Pune toate fișierele în repository-ul tău (drag & drop pe github.com → **Add file → Upload files → Commit**).
2. **Settings → Pages** → Source: branch `main`, folder `/ (root)` → **Save**.
3. După ~1 minut, linkurile sunt:
   - `https://UTILIZATOR.github.io/REPO/` (pagina de pornire)
   - `https://UTILIZATOR.github.io/REPO/etapa2-ar.html` (AR-ul — deschide pe **Android Chrome**)

> AR-ul are nevoie de **HTTPS** și de **Google Play Services for AR (ARCore)** instalat pe telefon. La deschidere, pagina îți spune singură dacă AR-ul e disponibil (banner verde/roșu sus).

## Fluxul de lucru

1. **Editor (Etapa 0):** încarci DXF-ul, alegi unitatea desenului, marchezi fiecare dispozitiv (tip + înălțime în cm) și traseele circuitelor, apoi **Export JSON**.
2. **AR (Etapa 2) pe Android:** încarci JSON-ul → alegi 2 repere pe planul 2D → pornești AR → scanezi apartamentul → atingi cele 2 repere fizice → introduci distanța orizontală reală (ruletă) → calibrare verticală → apar dispozitivele și traseele pe pereți, cu bife pe straturi.

## De testat / feedback (Etapa 2, versiune 1)

- Apar dispozitivele pe peretele corect? Cât arată **Δ scară AR** (jos-stânga)?
- E bun pragul de „prindere" a colțurilor pe planul 2D?
- Înălțimea traseelor (acum desenate la 10 cm de podea) — cum o vrei?
- Stabilitatea reticulei și a ancorării când te miști prin cameră.
