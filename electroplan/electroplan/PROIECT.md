# ElectroPlan — rezumat proiect

Document de context: scopul, deciziile luate, arhitectura și ce urmează. De folosit ca punct de plecare într-un proiect nou în Claude.

## Scopul
O platformă care preia un plan electric (din AutoCAD) și, prin realitate augmentată pe telefon, îi arată electricianului pe șantier (casă „la roșu") unde să monteze prizele, întrerupătoarele, dozele, tabloul și pe unde să tragă traseele — la poziția și înălțimea corecte.

## Decizii cheie
- **Format plan: DXF (ASCII)**, exportat din DWG. DWG e binar/proprietar, greu în browser; DXF e text și păstrează layere, blocuri, coordonate, texte. DWG rămâne sursă.
- **Simbolurile din planurile reale = linii/simboluri simple** (fără blocuri cu atribute), deci dispozitivele se marchează manual o dată per plan, în editor. Mai sigur decât extragerea automată.
- **iOS nu suportă WebXR AR** (nici prin Chrome pe iPhone — toate browserele iOS folosesc WebKit; excepția UE/DMA cu motoare alternative e încă imatură, nu construim pe ea). Concluzie:
  - AR-ul interactiv în browser = **doar Android** (WebXR + ARCore).
  - Pentru iPhone în viitor → **aplicație nativă** (ARKit + ARCore, ex. Unity AR Foundation).
- **Localizare/aliniere:** scanarea (SLAM) îmbunătățește tracking-ul, dar NU aliniază planul la realitate singură. Soluție: **2 puncte de reper cunoscute** (plan ↔ realitate) → transformare (rotație, translație, scară) + **calibrare cu ruleta** (orizontal + vertical). Se afișează eroarea reziduală de scară ca indicator de încredere.
- **Înălțimea (verticala)** e fiabilă: AR cunoaște podeaua aliniată la gravitație; cotele de montaj se măsoară de la podea.
- **Limite oneste:** precizie de câțiva cm lângă reper, drift cu distanța (re-ancorare per cameră); plan vs. execuție reală pot diferi (de aceea ruleta e adevărul de teren).

## Arhitectura pe etape
- **Etapa 0 — editor** (`etapa0-editor.html`): DXF → randare plan 2D → marcare dispozitive (tip, x, y, înălțime) + trasee → export JSON (geometrie + dispozitive + trasee + factor de scară). Independent de platformă. **GATA.**
- **Etapa 1 — referință 2D pe șantier** (iOS+Android): plan + poziții + cote, interactiv, fără AR. **DE FĂCUT** (util mai ales pentru iPhone).
- **Etapa 2 — AR** (`etapa2-ar.html`, Android): selectează hartă → scanare → 2 repere + calibrare orizontală/verticală → afișare dispozitive + trasee pe pereți, cu bife (circuite / doze / aparataj). **VERSIUNE 1, de testat pe teren.**

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

## Următorii pași (idei)
1. Test Etapa 2 pe Android; reglaj prag colțuri, înălțime trasee, stabilitate ancorare.
2. Trasee legate de înălțimi reale (urcă din doze spre tablou), nu plate.
3. Mod „puncte de reper" salvate în editor (predefinite, nu alese ad-hoc).
4. Etapa 1 (2D pe șantier) pentru iPhone.
5. Bază de date online (Supabase/Firebase) pentru sincronizare multi-dispozitiv.
6. Pe termen lung: aplicație nativă pentru AR și pe iPhone (LiDAR pentru potrivire automată pe pereți).

## Întrebări deschise pentru tine
- Cum sunt desenați pereții în DXF-urile tale reale (linii simple, duble, polilinii)?
- Înălțimile/cotele apar ca text pe plan sau le introduci manual?
- Ai iPhone Pro (cu LiDAR)? Contează pentru varianta nativă viitoare.
