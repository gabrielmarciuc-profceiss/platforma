/* ============================================================
   PROFCEISS · Salvare proiecte - DOAR in cloud (Supabase)
   - Salvarea locala (localStorage "Proiectele mele") si autosalvarea au fost
     ELIMINATE la cererea utilizatorului (iunie 2026). Salvarea se face acum
     EXCLUSIV in cloud.
   - Acest fisier: serializeaza/aplica starea (formular + hook) si monteaza
     butoanele de salvare in cloud (incarca singur supabase.js).
   - Hook optional:
       window.PROFCEISS_PROJECT = { app, label, getState(), setState(), full };
   Inclus cu: <script src="../assets/profceiss-projects.js" defer></script>
   ============================================================ */
(function(){
  "use strict";
  if (window.__PCE_PROJECTS__) return; window.__PCE_PROJECTS__ = true;

  var HOOK = window.PROFCEISS_PROJECT || null;
  var APP  = (HOOK && HOOK.app) || window.PCE_APP ||
             (location.pathname.replace(/\/(index\.html)?$/,'').split('/').filter(Boolean).pop() || 'app');
  APP = String(APP).toLowerCase();
  var FULL = !!(HOOK && HOOK.full); // hook gestioneaza singur tot (sarim snapshot-ul generic)
  var CURNAME = '';                 // numele curent - DOAR in memorie, nu se persista local
  function curName(){ return CURNAME; }
  function setName(n){ CURNAME = n || ''; }

  /* ---------- snapshot / restore formular ---------- */
  // sarim campurile din UI-ul de cloud/login (ex. email/parola), nu fac parte din proiect
  function inCloudUI(el){ return !!(el.closest && el.closest('#pc-auth-modal,#pc-cloud-bar,#pc-cloud-modal,#pc-auth,#sb-status')); }
  function fieldKey(el){ return el.id ? ('#'+el.id) : (el.name ? ('='+el.name+'['+fieldIndex(el)+']') : null); }
  function fieldIndex(el){ var same=document.getElementsByName(el.name); for(var i=0;i<same.length;i++){ if(same[i]===el) return i; } return 0; }
  function snapshotForm(){
    var o = {};
    var els = document.querySelectorAll('input,select,textarea');
    for (var i=0;i<els.length;i++){ var el=els[i];
      if (inCloudUI(el)) continue;
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
      if(!el || inCloudUI(el)) return;
      try{
        if (el.type==='checkbox' || el.type==='radio') el.checked = !!o[k];
        else el.value = o[k];
        el.dispatchEvent(new Event('input',  {bubbles:true}));
        el.dispatchEvent(new Event('change', {bubbles:true}));
      }catch(e){}
    });
  }

  /* ---------- serializare / aplicare proiect ---------- */
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

  /* ============================================================
     CLOUD (Supabase) - singura metoda de salvare
     Incarca dinamic biblioteca Supabase + assets/supabase.js si monteaza
     butoanele "Salveaza in cloud" / "Proiectele mele".
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
  window.PCEProjects = { serialize:serialize, apply:apply };
})();
