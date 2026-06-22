/* ============================================================
   PROFCEISS · Conexiune Supabase (client, cheie PUBLISHABLE - sigura in browser)
   - Creeaza clientul global window.SB
   - Afiseaza un mic indicator de stare (dreapta-jos): conectat / eroare
   Inclus cu:
     <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
     <script src="assets/supabase.js"></script>
   IMPORTANT: aici se pune DOAR cheia publishable. Cheia secret (sb_secret_...) NU se pune niciodata in pagina.
   ============================================================ */
(function(){
  var URL = 'https://ecpuyftrrndkgpjwhskt.supabase.co';
  var KEY = 'sb_publishable_FFBhU2yc1ChZoac8aHlBYA_Dw_0a8Xt';

  function badge(state, msg){
    var el = document.getElementById('sb-status');
    if(!el){ el = document.createElement('div'); el.id='sb-status';
      el.style.cssText='position:fixed;right:12px;bottom:12px;z-index:99998;font:600 11px system-ui;padding:5px 11px;border-radius:999px;border:1px solid #ccc;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.12);cursor:default';
      document.body.appendChild(el); }
    var c = {ok:'#1a8a4f', err:'#c0392b', wait:'#888'}[state] || '#888';
    el.style.borderColor = c; el.style.color = c; el.textContent = msg;
  }

  function start(){
    if(!(window.supabase && window.supabase.createClient)){ badge('err','Supabase: biblioteca neincarcata'); return; }
    try{ window.SB = window.supabase.createClient(URL, KEY); }
    catch(e){ badge('err','Supabase: config invalida'); return; }
    badge('wait','Supabase: verific...');
    // proba de conexiune: interogam un tabel inexistent; daca serverul raspunde (tabel lipsa) => cheia e valida si conexiunea merge
    window.SB.from('__conn_test__').select('*').limit(1).then(function(r){
      var e = r && r.error;
      if(!e){ badge('ok','Supabase: conectat'); return; }
      var m = ((e.message||'') + ' ' + (e.code||'')).toLowerCase();
      if(/relation|does not exist|could not find|42p01|pgrst|schema cache|not found/.test(m)) badge('ok','Supabase: conectat');
      else if(/api key|apikey|jwt|unauthorized|invalid|401|403/.test(m)) badge('err','Supabase: cheie respinsa');
      else badge('ok','Supabase: conectat');
    }).catch(function(){ badge('err','Supabase: fara raspuns'); });
  }

  function boot(){ if(!document.body){ return setTimeout(boot,50); } start(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded', boot); else boot();
  window.PC_SUPABASE = { url:URL };
})();
