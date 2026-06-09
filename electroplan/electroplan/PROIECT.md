# ElectroPlan — rezumat proiect

Document de context: scopul, deciziile luate, arhitectura si ce urmeaza. De folosit ca punct de plecare intr-un proiect nou in Claude.

## Scopul
O platforma care preia un plan electric (din AutoCAD) si, prin realitate augmentata pe telefon, ii arata electricianului pe santier (casa „la rosu") unde sa monteze prizele, intrerupatoarele, dozele, tabloul si pe unde sa traga traseele — la pozitia si inaltimea corecte.

## Decizii cheie
- **Format plan: DXF (ASCII)**, exportat din DWG. DWG e binar/proprietar, greu in browser; DXF e text si pastreaza layere, blocuri, coordonate, texte. DWG ramane sursa.
- **Simbolurile din planurile reale = linii/simboluri simple** (fara blocuri cu atribute), deci dispozitivele se marcheaza manual o data per plan, in editor. Mai sigur decat extragerea automata.
- **iOS nu suporta WebXR AR** (nici prin Chrome pe iPhone — toate browserele iOS folosesc WebKit; exceptia UE/DMA cu motoare alternative e inca imatura, nu construim pe ea). Concluzie:
  - AR-ul interactiv in browser = **doar Android** (WebXR + ARCore).
  - Pentru iPhone in viitor → **aplicatie nativa** (ARKit + ARCore, ex. Unity AR Foundation).
- **Localizare/aliniere:** scanarea (SLAM) imbunatateste tracking-ul, dar NU aliniaza planul la realitate singura. Solutie: **2 puncte de reper cunoscute** (plan ↔ realitate) → transformare (rotatie, translatie, scara) + **calibrare cu ruleta** (orizontal + vertical). Se afiseaza eroarea reziduala de scara ca indicator de incredere.
- **Înaltimea (verticala)** e fiabila: AR cunoaste podeaua aliniata la gravitatie; cotele de montaj se masoara de la podea.
- **Limite oneste:** precizie de cativa cm langa reper, drift cu distanta (re-ancorare per camera); plan vs. executie reala pot diferi (de aceea ruleta e adevarul de teren).

## Arhitectura pe etape
- **Etapa 0 — editor** (`etapa0-editor.html`): DXF → randare plan 2D → marcare dispozitive (tip, x, y, inaltime) + trasee → export JSON (geometrie + dispozitive + trasee + factor de scara). Independent de platforma. **GATA.**
- **Etapa 1 — referinta 2D pe santier** (iOS+Android): plan + pozitii + cote, interactiv, fara AR. **DE FĂCUT** (util mai ales pentru iPhone).
- **Etapa 2 — AR** (`etapa2-ar.html`, Android): selecteaza harta → scanare → 2 repere + calibrare orizontala/verticala → afisare dispozitive + trasee pe pereti, cu bife (circuite / doze / aparataj). **VERSIUNE 1, de testat pe teren.**

## Model de date (JSON exportat)
```
{
  meta: { units_per_mm, created },
  geometry: { lines, polylines, circles, arcs, texts, bbox },
  devices: [ { id, sub, x, y, h(cm), label } ],
  routes:  [ { id, name, color, pts:[{x,y}] } ]
}
```
Tipuri dispozitive (`sub`): priza, priza_blat, intrerupator, tablou, doza_der, doza_ap.
Straturi (bife): aparataj / doza / circuite.

## Status
- ✅ Editor Etapa 0 + DXF de test.
- ✅ AR Etapa 2 v1 (Android, de calibrat pe teren).
- ✅ Demo fotovoltaice AR + USDZ pentru iPhone.
- ⏳ Feedback de pe Android → reglaje.

## Urmatorii pasi (idei)
1. Test Etapa 2 pe Android; reglaj prag colturi, inaltime trasee, stabilitate ancorare.
2. Trasee legate de inaltimi reale (urca din doze spre tablou), nu plate.
3. Mod „puncte de reper" salvate in editor (predefinite, nu alese ad-hoc).
4. Etapa 1 (2D pe santier) pentru iPhone.
5. Baza de date online (Supabase/Firebase) pentru sincronizare multi-dispozitiv.
6. Pe termen lung: aplicatie nativa pentru AR si pe iPhone (LiDAR pentru potrivire automata pe pereti).

## Întrebari deschise pentru tine
- Cum sunt desenati peretii in DXF-urile tale reale (linii simple, duble, polilinii)?
- Înaltimile/cotele apar ca text pe plan sau le introduci manual?
- Ai iPhone Pro (cu LiDAR)? Conteaza pentru varianta nativa viitoare.
