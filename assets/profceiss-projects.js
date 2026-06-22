/* ============================================================
   PROFCEISS · Sistem comun de salvare proiecte
   - Salveaza cu nume, "Proiectele mele", autosalvare + restaurare
   - Backup / import in fisier (.pce.json)
   - Snapshot generic al formularului (input/select/textarea/checkbox/radio)
   - Hook optional pentru stare JS specifica:
       window.PROFCEISS_PROJECT = {
         app: 'nume-unic',            // optional (altfel se ia din folder)
         label: 'Oferta',             // optional, cum numim "proiectul"
         getState(){ return {...}; }, // stare suplimentara (array-uri etc.)
         setState(s){ ... }           // restaureaza + re-randeaza
       };
   Inclus cu: <script src="../assets/profceiss-projects.js" defer></script>
   ============================================================ */
(function(){
  "use strict";
  if (window.__PCE_PROJECTS__) return; window.__PCE_PROJECTS__ = true;

  var HOOK = window.PROFCEISS_PROJECT || null;
  var APP  = (HOOK && HOOK.app) || window.PCE_APP ||
             (location.pathname.replace(/\/(index\.html)?$/,'').split('/').filter(Boolean).pop() || 'app');
  APP = String(APP).toLowerCase();
  var LABEL = (HOOK && HOOK.label) || 'Proiect';
  // plural corect in romana: Oferta→Oferte, Schema→Scheme, Buletin→Buletine, Dosar→Dosare, Proiect→Proiecte
  var PLURAL = (HOOK && HOOK.plural) || (/a$/.test(LABEL) ? LABEL.replace(/a$/,'e') : LABEL + 'e');
  var ARTPL  = PLURAL + 'le'; // articulat: Oferte→Ofertele, Proiecte→Proiectele
  var PKEY = 'pce_proj_' + APP;     // dictionar proiecte salvate
  var AKEY = 'pce_auto_' + APP;     // autosalvare ultima sesiune
  var NKEY = 'pce_name_' + APP;     // numele curent

  /* ---------- helpers stocare ---------- */
  function loadStore(){ try{ return JSON.parse(localStorage.getItem(PKEY) || '{}'); }catch(e){ return {}; } }
  function saveStore(s){ try{ localStorage.setItem(PKEY, JSON.stringify(s)); return true; }catch(e){ alert('Nu pot salva (memoria browserului e plina).'); return false; } }
  function curName(){ try{ return localStorage.getItem(NKEY) || ''; }catch(e){ return ''; } }
  function setName(n){ try{ localStorage.setItem(NKEY, n||''); }catch(e){} }

  /* ---------- snapshot / restore formular ---------- */
  function inWidget(el){ return !!(el.closest && el.closest('#pcek-root')); }
  function fieldKey(el){ return el.id ? ('#'+el.id) : (el.name ? ('='+el.name+'['+fieldIndex(el)+']') : null); }
  function fieldIndex(el){ var same=document.getElementsByName(el.name); for(var i=0;i<same.length;i++){ if(same[i]===el) return i; } return 0; }
  function snapshotForm(){
    var o = {};
    var els = document.querySelectorAll('input,select,textarea');
    for (var i=0;i<els.length;i++){ var el=els[i];
      if (inWidget(el)) continue;
      if (el.type==='file' || el.type==='button' || el.type==='submit' || el.type==='reset') continue;
      var k = fieldKey(el); if(!k) continue;
      if (el.type==='checkbox' || el.type==='radio') o[k] = !!el.checked;
      else o[k] = el.value;
    }
    return o;
  }
  function restoreForm(o){
    if(!o) return;
    Object.keys(o).forEach(function(k){
      var el=null;
      if (k[0]==='#') el = document.getElementById(k.slice(1));
      else if (k[0]==='='){ var m=k.slice(1).match(/^(.*)\[(\d+)\]$/); if(m){ var arr=document.getElementsByName(m[1]); el=arr[+m[2]]; } }
      if(!el || inWidget(el)) return;
      try{
        if (el.type==='checkbox' || el.type==='radio') el.checked = !!o[k];
        else el.value = o[k];
        el.dispatchEvent(new Event('input',  {bubbles:true}));
        el.dispatchEvent(new Event('change', {bubbles:true}));
      }catch(e){}
    });
  }

  /* ---------- serializare proiect ---------- */
  var FULL = !!(HOOK && HOOK.full); // hook gestioneaza singur tot (sarim snapshot-ul generic)
  function serialize(){
    var s = { v:1, app:APP, savedAt:Date.now(), name:curName(), form: FULL ? null : snapshotForm() };
    try{ if (HOOK && typeof HOOK.getState==='function') s.app_state = HOOK.getState(); }catch(e){ console.warn('getState', e); }
    return s;
  }
  function apply(o){
    if(!o) return;
    if(!FULL) restoreForm(o.form);
    try{ if (HOOK && typeof HOOK.setState==='function' && o.app_state!=null) HOOK.setState(o.app_state); }catch(e){ console.warn('setState', e); }
  }
  function hasContent(o){
    if(!o) return false;
    if (o.app_state!=null){ try{ if (JSON.stringify(o.app_state).length>4) return true; }catch(e){} }
    if (o.form){ var keys=Object.keys(o.form); for(var i=0;i<keys.length;i++){ var v=o.form[keys[i]]; if(v && v!==false && v!=='0' && String(v).trim()!=='') return true; } }
    return false;
  }

  /* ---------- autosalvare (cu linie de baza: salvam doar daca s-a schimbat ceva) ---------- */
  var BASELINE = null;  // semnatura starii initiale (default/incarcat din hash)
  function signature(s){ try{ return JSON.stringify({form:s.form, app_state:s.app_state}); }catch(e){ return ''; } }
  function autosave(){
    try{
      var s=serialize();
      if (BASELINE!=null && signature(s)===BASELINE){ localStorage.removeItem(AKEY); return; }
      localStorage.setItem(AKEY, JSON.stringify(s));
    }catch(e){}
  }
  window.addEventListener('beforeunload', function(){ if(BASELINE!=null) autosave(); });

  /* ---------- proiecte salvate ---------- */
  function saveProject(name){ name=(name||'').trim(); if(!name) return false; var s=loadStore(); setName(name); s[name]=serialize(); if(saveStore(s)){ autosave(); return true; } return false; }
  function deleteProject(name){ var s=loadStore(); delete s[name]; saveStore(s); }

  function fileExport(){
    var data = JSON.stringify(serialize(), null, 1);
    var fn = (curName()||APP).replace(/[^\w\-]+/g,'_') + '.pce.json';
    var a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([data],{type:'application/json'})); a.download=fn; document.body.appendChild(a); a.click(); a.remove();
  }
  function fileImport(file, after){
    var rd=new FileReader();
    rd.onload=function(){ try{ var o=JSON.parse(rd.result); apply(o); if(o.name){ setName(o.name); saveProject(o.name); } after&&after(true,o.name); }catch(e){ after&&after(false); } };
    rd.readAsText(file);
  }

  /* ============================================================
     UI
     ============================================================ */
  var CSS = ''+
  '#pcek-root{position:fixed;z-index:2147483600;left:14px;bottom:14px;font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif}'+
  '#pcek-fab{display:inline-flex;align-items:center;gap:8px;background:#ffffff;color:#16314f;border:1px solid #cdd9ea;border-radius:999px;padding:9px 14px;font-size:13px;font-weight:600;cursor:pointer;box-shadow:0 6px 18px rgba(20,40,80,.18)}'+
  '#pcek-fab:hover{background:#f3f8ff;border-color:#9fc0e8}'+
  '#pcek-fab .dot{width:8px;height:8px;border-radius:50%;background:#1a8a4f;box-shadow:0 0 0 3px rgba(26,138,79,.18)}'+
  '#pcek-ov{position:fixed;inset:0;background:rgba(18,30,52,.42);display:none;align-items:center;justify-content:center;z-index:2147483601}'+
  '#pcek-ov.on{display:flex}'+
  '#pcek-modal{background:#fff;color:#1d2b44;width:min(440px,92vw);max-height:88vh;overflow:auto;border-radius:14px;padding:18px 18px 16px;box-shadow:0 24px 60px rgba(15,30,60,.35)}'+
  '#pcek-modal h2{margin:0 0 4px;font-size:17px}'+
  '#pcek-modal .sub{color:#5d6b82;font-size:12px;margin:0 0 12px}'+
  '#pcek-modal .rowi{display:flex;gap:7px;margin-bottom:12px}'+
  '#pcek-modal input[type=text]{flex:1;border:1px solid #cdd9ea;border-radius:8px;padding:8px 10px;font-size:13px;color:#1d2b44}'+
  '#pcek-modal .b{border:1px solid #cdd9ea;background:#f3f8ff;color:#16314f;border-radius:8px;padding:8px 12px;font-size:13px;font-weight:600;cursor:pointer;white-space:nowrap}'+
  '#pcek-modal .b:hover{background:#e6f0fc}'+
  '#pcek-modal .b.primary{background:#1c7bd6;border-color:#1c7bd6;color:#fff}'+
  '#pcek-modal .b.primary:hover{background:#1769bb}'+
  '#pcek-modal .b.warn{background:#fff;border-color:#e6b8b8;color:#b23b3b}'+
  '#pcek-list{border:1px solid #e6edf6;border-radius:10px;overflow:hidden;margin-bottom:12px}'+
  '#pcek-list .it{display:flex;align-items:center;gap:8px;padding:9px 10px;border-bottom:1px solid #eef3f9}'+
  '#pcek-list .it:last-child{border-bottom:none}'+
  '#pcek-list .it .nm{flex:1;font-size:13px;font-weight:600;line-height:1.25}'+
  '#pcek-list .it .nm small{display:block;color:#7d8aa0;font-weight:400;font-size:11px}'+
  '#pcek-list .empty{padding:14px;color:#7d8aa0;font-size:13px;text-align:center}'+
  '#pcek-modal .foot{display:flex;gap:7px;flex-wrap:wrap}'+
  '#pcek-modal .x{position:absolute;top:0;right:0}'+
  '#pcek-toast{position:fixed;left:14px;bottom:64px;z-index:2147483602;background:#16314f;color:#fff;border-radius:10px;padding:11px 13px;font-size:13px;display:none;align-items:center;gap:10px;box-shadow:0 10px 28px rgba(15,30,60,.3);max-width:min(360px,92vw);font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif}'+
  '#pcek-toast.on{display:flex}'+
  '#pcek-toast .b{border:none;border-radius:7px;padding:6px 10px;font-size:12px;font-weight:700;cursor:pointer}'+
  '#pcek-toast .yes{background:#46b46e;color:#06321b}'+
  '#pcek-toast .no{background:#33507a;color:#cfe0f5}'+
  '@media print{#pcek-root,#pcek-ov,#pcek-toast{display:none !important}}';

  function el(tag, html){ var e=document.createElement(tag); if(html!=null) e.innerHTML=html; return e; }
  function esc(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }

  function build(){
    var style=el('style'); style.textContent=CSS; document.head.appendChild(style);

    var root=el('div'); root.id='pcek-root';
    var fab=el('button'); fab.id='pcek-fab'; fab.innerHTML='<span class="dot"></span>💾 '+esc(PLURAL);
    root.appendChild(fab);
    document.body.appendChild(root);

    var ov=el('div'); ov.id='pcek-ov';
    var modal=el('div'); modal.id='pcek-modal'; modal.style.position='relative';
    ov.appendChild(modal); document.body.appendChild(ov);

    var toast=el('div'); toast.id='pcek-toast'; document.body.appendChild(toast);

    function close(){ ov.classList.remove('on'); }
    ov.addEventListener('click', function(e){ if(e.target===ov) close(); });

    function render(){
      var store=loadStore();
      var names=Object.keys(store).sort(function(a,b){ return (store[b].savedAt||0)-(store[a].savedAt||0); });
      var items = names.length ? names.map(function(n){
        var d=store[n].savedAt? new Date(store[n].savedAt):null; var when=d? d.toLocaleString('ro-RO'):'';
        return '<div class="it"><span class="nm">📁 '+esc(n)+'<small>'+when+'</small></span>'+
               '<button class="b" data-load="'+encodeURIComponent(n)+'">Deschide</button>'+
               '<button class="b warn" data-del="'+encodeURIComponent(n)+'" title="Sterge">🗑</button></div>';
      }).join('') : '<div class="empty">Nimic salvat inca.</div>';

      modal.innerHTML =
        '<button class="b x" id="pcek-close">✕</button>'+
        '<h2>📂 '+esc(ARTPL)+' mele</h2>'+
        '<p class="sub">Salveaza tot ce ai completat si reia oricand. Lucrarea se salveaza si automat.</p>'+
        '<div class="rowi"><input type="text" id="pcek-name" placeholder="Nume '+esc(LABEL.toLowerCase())+'…" value="'+esc(curName())+'"><button class="b primary" id="pcek-save">💾 Salveaza</button></div>'+
        '<div id="pcek-list">'+items+'</div>'+
        '<div class="foot"><button class="b" id="pcek-exp">⬇ Backup in fisier</button><button class="b" id="pcek-imp">⬆ Incarca din fisier</button></div>'+
        '<input type="file" id="pcek-file" accept="application/json,.json" style="display:none">';

      modal.querySelector('#pcek-close').onclick=close;
      modal.querySelector('#pcek-save').onclick=function(){ var n=modal.querySelector('#pcek-name').value.trim(); if(!n){ alert('Scrie un nume.'); return; } if(saveProject(n)){ render(); flash('✅ Salvat: '+n); } };
      modal.querySelectorAll('[data-load]').forEach(function(b){ b.onclick=function(){ var n=decodeURIComponent(b.getAttribute('data-load')); var st=loadStore(); if(st[n]){ apply(st[n]); setName(n); close(); flash('Incarcat: '+n); } }; });
      modal.querySelectorAll('[data-del]').forEach(function(b){ b.onclick=function(){ var n=decodeURIComponent(b.getAttribute('data-del')); if(confirm('Stergi „'+n+'"?')){ deleteProject(n); render(); } }; });
      modal.querySelector('#pcek-exp').onclick=fileExport;
      modal.querySelector('#pcek-imp').onclick=function(){ modal.querySelector('#pcek-file').click(); };
      modal.querySelector('#pcek-file').onchange=function(e){ var f=e.target.files[0]; if(!f) return; fileImport(f, function(ok,nm){ if(ok){ render(); modal.querySelector('#pcek-name').value=nm||''; flash('Import reusit'); } else alert('Fisier invalid.'); }); };
    }

    fab.onclick=function(){ render(); ov.classList.add('on'); };

    function flash(msg){ toast.innerHTML='<span>'+esc(msg)+'</span>'; toast.classList.add('on'); setTimeout(function(){ toast.classList.remove('on'); }, 2200); }

    /* dupa ce aplicatia s-a initializat complet: fixam linia de baza,
       pornim autosalvarea si oferim restaurarea doar daca starea salvata difera de baseline */
    function startEngine(){
      try{ BASELINE = signature(serialize()); }catch(e){ BASELINE=''; }
      setInterval(autosave, 4000);

      var last=null; try{ last=JSON.parse(localStorage.getItem(AKEY)||'null'); }catch(e){}
      if (last && hasContent(last) && signature(last)!==BASELINE){
        var when=last.savedAt? new Date(last.savedAt).toLocaleString('ro-RO'):'';
        toast.innerHTML='<span>↩ Ai o lucrare nesalvata'+(last.name?(' („'+esc(last.name)+'")'):'')+' din '+when+'.</span>'+
                        '<button class="b yes" id="pcek-rsy">Reia</button><button class="b no" id="pcek-rsn">Ignora</button>';
        toast.classList.add('on');
        toast.querySelector('#pcek-rsy').onclick=function(){ apply(last); if(last.name) setName(last.name); toast.classList.remove('on'); flash('Sesiune reluata'); };
        toast.querySelector('#pcek-rsn').onclick=function(){ toast.classList.remove('on'); };
        setTimeout(function(){ toast.classList.remove('on'); }, 14000);
      }
    }
    // lasam timp pentru init-urile din window.load / importFromHash
    if (document.readyState==='complete') setTimeout(startEngine, 600);
    else window.addEventListener('load', function(){ setTimeout(startEngine, 600); });
  }

  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', build);
  else build();

  /* ============================================================
     CLOUD (Supabase) - activare automata
     Incarca dinamic biblioteca Supabase + assets/supabase.js (daca nu sunt deja
     in pagina) si monteaza butoanele "Salveaza in cloud" / "Proiectele mele".
     Astfel toate modulele care includ acest fisier capata salvare in baza de
     date, fara a edita fiecare modul in parte. Salvarea locala / autosalvarea
     raman ca plasa de siguranta.
     ============================================================ */
  function mountCloud(){
    if(!(window.PCCloud && window.PCCloud.mountButtons)){ return setTimeout(mountCloud, 300); }
    if(window.__pceCloudMounted) return; window.__pceCloudMounted = true;
    window.PCCloud.mountButtons({
      app: APP,
      serialize: serialize,
      apply: function(d){ apply(d); if(d && d.name){ setName(d.name); } },
      name: curName
    });
  }
  function injectCloud(){
    if(window.__pceCloudInjected) return; window.__pceCloudInjected = true;
    var me = document.querySelector('script[src*="profceiss-projects.js"]');
    var base = me ? me.getAttribute('src').replace(/profceiss-projects\.js.*$/, '') : '../assets/';
    function loadLocal(){
      if(window.PCCloud){ mountCloud(); return; }
      var s=document.createElement('script'); s.src=base+'supabase.js';
      s.onload=mountCloud; s.onerror=mountCloud; document.head.appendChild(s);
    }
    if(window.supabase && window.supabase.createClient){ loadLocal(); }
    else {
      var c=document.createElement('script');
      c.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      c.onload=loadLocal; c.onerror=loadLocal; document.head.appendChild(c);
    }
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', injectCloud);
  else injectCloud();

  /* API public, pentru integrari avansate */
  window.PCEProjects = { save:saveProject, serialize:serialize, apply:apply, export:fileExport };
})();
