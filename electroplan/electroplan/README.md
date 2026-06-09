# ElectroPlan — instructiuni

Suita de unelte pentru a duce un plan electric din AutoCAD in realitate augmentata pe santier.

## Fisiere

| Fisier | Ce face | Unde merge |
|---|---|---|
| `index.html` | Pagina de pornire cu linkuri catre toate uneltele | oriunde |
| `etapa0-editor.html` | Editor: incarca DXF, marcheaza dispozitive + trasee, export JSON | desktop + telefon |
| `casa_test.dxf` | Plan de test (casa 10×8 m, unitate **mm**) | — |
| `etapa2-ar.html` | Aplicatia AR: plan → suprapunere pe pereti reali | **doar Android + Chrome, HTTPS** |
| `pv-ar.html` | Demo plasare sistem fotovoltaic AR | Android + iPhone |
| `pv-panou.usdz` | Model 3D panou pentru AR Quick Look (atinge-l pe iPhone) | iPhone |

## Gazduire pe GitHub Pages (de pe desktop Windows)

1. Pune toate fisierele in repository-ul tau (drag & drop pe github.com → **Add file → Upload files → Commit**).
2. **Settings → Pages** → Source: branch `main`, folder `/ (root)` → **Save**.
3. Dupa ~1 minut, linkurile sunt:
   - `https://UTILIZATOR.github.io/REPO/` (pagina de pornire)
   - `https://UTILIZATOR.github.io/REPO/etapa2-ar.html` (AR-ul — deschide pe **Android Chrome**)

> AR-ul are nevoie de **HTTPS** si de **Google Play Services for AR (ARCore)** instalat pe telefon. La deschidere, pagina iti spune singura daca AR-ul e disponibil (banner verde/rosu sus).

## Fluxul de lucru

1. **Editor (Etapa 0):** incarci DXF-ul, alegi unitatea desenului, marchezi fiecare dispozitiv (tip + inaltime in cm) si traseele circuitelor, apoi **Export JSON**.
2. **AR (Etapa 2) pe Android:** incarci JSON-ul → alegi 2 repere pe planul 2D → pornesti AR → scanezi apartamentul → atingi cele 2 repere fizice → introduci distanta orizontala reala (ruleta) → calibrare verticala → apar dispozitivele si traseele pe pereti, cu bife pe straturi.

## De testat / feedback (Etapa 2, versiune 1)

- Apar dispozitivele pe peretele corect? Cat arata **Δ scara AR** (jos-stanga)?
- E bun pragul de „prindere" a colturilor pe planul 2D?
- Inaltimea traseelor (acum desenate la 10 cm de podea) — cum o vrei?
- Stabilitatea reticulei si a ancorarii cand te misti prin camera.
