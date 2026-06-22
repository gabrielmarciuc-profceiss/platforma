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
  if(window.__pcSB) return; window.__pcSB = true;   // o singura initializare per pagina
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

  /* ---- Autentificare (Supabase Auth: email + parola) ---- */
  window.PCAuth = {
    signUp:  function(email,pw){ return window.SB.auth.signUp({email:email,password:pw}); },
    signIn:  function(email,pw){ return window.SB.auth.signInWithPassword({email:email,password:pw}); },
    signOut: function(){ return window.SB.auth.signOut(); },
    user:    async function(){ try{ var r=await window.SB.auth.getUser(); return r&&r.data&&r.data.user||null; }catch(e){ return null; } },
    onChange:function(cb){ try{ return window.SB.auth.onAuthStateChange(function(_e,s){ cb(s&&s.user||null); }); }catch(e){} }
  };
  function authModal(){
    var m=document.getElementById('pc-auth-modal'); if(m){ m.style.display='flex'; return; }
    m=document.createElement('div'); m.id='pc-auth-modal';
    m.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(18,28,46,.5);display:flex;align-items:center;justify-content:center';
    m.innerHTML='<div style="background:#fff;border-radius:14px;width:320px;max-width:92vw;padding:18px;box-shadow:0 16px 50px rgba(0,0,0,.3);font:13px system-ui">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px"><b style="flex:1;font-size:15px">Cont PROFCEISS</b><button id="pc-auth-x" style="border:none;background:#eef2f7;border-radius:7px;width:26px;height:26px;cursor:pointer;font-size:15px">&times;</button></div>'
      +'<input id="pc-auth-email" type="email" placeholder="Email" autocomplete="username" style="width:100%;border:1px solid #cdd8e6;border-radius:9px;padding:9px;margin-bottom:8px;font-size:13px">'
      +'<input id="pc-auth-pw" type="password" placeholder="Parola" autocomplete="current-password" style="width:100%;border:1px solid #cdd8e6;border-radius:9px;padding:9px;margin-bottom:6px;font-size:13px">'
      +'<div id="pc-auth-msg" style="font-size:11.5px;min-height:16px;margin-bottom:8px;color:#c0392b"></div>'
      +'<button id="pc-auth-login" style="width:100%;border:none;background:#2f6fd0;color:#fff;border-radius:9px;padding:10px;font-weight:700;cursor:pointer;margin-bottom:7px">Intra in cont</button>'
      +'<button id="pc-auth-signup" style="width:100%;border:1px solid #cdd8e6;background:#fff;color:#33506f;border-radius:9px;padding:9px;cursor:pointer">Creeaza cont nou</button>'
      +'</div>';
    document.body.appendChild(m);
    var msg=function(t,ok){ var e=document.getElementById('pc-auth-msg'); if(e){ e.textContent=t; e.style.color=ok?'#1a8a4f':'#c0392b'; } };
    document.getElementById('pc-auth-x').onclick=function(){ m.style.display='none'; };
    document.getElementById('pc-auth-login').onclick=async function(){ var em=document.getElementById('pc-auth-email').value.trim(), pw=document.getElementById('pc-auth-pw').value; if(!em||!pw){ msg('Completeaza email si parola.'); return; } msg('Se conecteaza...',true); var r=await window.PCAuth.signIn(em,pw); if(r.error) msg(r.error.message); else { m.style.display='none'; } };
    document.getElementById('pc-auth-signup').onclick=async function(){ var em=document.getElementById('pc-auth-email').value.trim(), pw=document.getElementById('pc-auth-pw').value; if(!em||pw.length<6){ msg('Email valid + parola de minim 6 caractere.'); return; } msg('Se creeaza contul...',true); var r=await window.PCAuth.signUp(em,pw); if(r.error){ msg(r.error.message); } else if(r.data&&r.data.session){ m.style.display='none'; } else { msg('Cont creat. Verifica emailul pentru confirmare, apoi intra in cont.',true); } };
  }
  function authBadge(user){
    var el=document.getElementById('pc-auth'); if(!el){ el=document.createElement('div'); el.id='pc-auth'; el.style.cssText='position:fixed;right:12px;bottom:42px;z-index:99998;font:600 11px system-ui'; document.body.appendChild(el); }
    if(user){ el.innerHTML='<span style="padding:5px 10px;border-radius:999px;border:1px solid #1a8a4f;color:#1a8a4f;background:#fff;box-shadow:0 4px 14px rgba(0,0,0,.12)">👤 '+(user.email||'cont')+'</span> <button id="pc-auth-out" style="border:1px solid #e6b8b8;background:#fff;color:#c0392b;border-radius:999px;padding:5px 9px;cursor:pointer;font:600 11px system-ui">Iesi</button>'; var o=document.getElementById('pc-auth-out'); if(o) o.onclick=function(){ window.PCAuth.signOut(); }; }
    else { el.innerHTML='<button id="pc-auth-in" style="border:1px solid #2f6fd0;background:#fff;color:#2f6fd0;border-radius:999px;padding:6px 12px;cursor:pointer;font:600 11px system-ui;box-shadow:0 4px 14px rgba(0,0,0,.12)">🔑 Login / Cont</button>'; var i=document.getElementById('pc-auth-in'); if(i) i.onclick=authModal; }
  }
  function setupAuth(){ window.PCAuth.user().then(authBadge); window.PCAuth.onChange(authBadge); }

  /* ---- API generic pentru proiecte/oferte in cloud (respecta RLS: fiecare vede doar ale lui) ----
     app: 'profcad'|'electrica'|'tablotier'|'altul' -> tabel "proiecte" ; 'fotovoltaic' -> tabel "oferte" */
  window.PCCloud = {
    tbl: function(app){ return app==='fotovoltaic' ? 'oferte' : 'proiecte'; },
    save: async function(app, name, dataObj, extra, id){
      if(!window.SB) return {error:{message:'Supabase neconectat.'}};
      var u=await window.PCAuth.user(); if(!u) return {error:{message:'Intra in cont (Login) ca sa salvezi in cloud.'}};
      var t=this.tbl(app), row=Object.assign({nume:name||'Proiect', data:dataObj||{}}, extra||{}); if(t==='proiecte') row.app=app;
      if(id) return window.SB.from(t).update(row).eq('id',id).select().single();
      return window.SB.from(t).insert(row).select().single();
    },
    list: async function(app){ if(!window.SB) return {data:[],error:{message:'Supabase neconectat.'}}; var t=this.tbl(app); var q=window.SB.from(t).select('id,nume,updated_at').order('updated_at',{ascending:false}); if(t==='proiecte') q=q.eq('app',app); return q; },
    load: async function(app,id){ if(!window.SB) return {error:{message:'Supabase neconectat.'}}; return window.SB.from(this.tbl(app)).select('*').eq('id',id).single(); },
    remove: async function(app,id){ if(!window.SB) return {error:{message:'Supabase neconectat.'}}; return window.SB.from(this.tbl(app)).delete().eq('id',id); }
  };

  function flash(t,bad){ var f=document.createElement('div'); f.textContent=t; f.style.cssText='position:fixed;left:50%;top:48px;transform:translateX(-50%);z-index:99999;background:'+(bad?'#c0392b':'#1a8a4f')+';color:#fff;padding:7px 14px;border-radius:9px;font:600 12px system-ui;box-shadow:0 6px 18px rgba(0,0,0,.2)'; document.body.appendChild(f); setTimeout(function(){ try{f.remove();}catch(e){} },2000); }
  async function requireLogin(){ var u=await window.PCAuth.user(); if(!u){ authModal(); flash('Intra in cont (Login) ca sa folosesti cloud-ul.',true); return null; } return u; }
  function cloudListModal(o, rows, bar){
    var old=document.getElementById('pc-cloud-modal'); if(old) old.remove();
    var m=document.createElement('div'); m.id='pc-cloud-modal'; m.style.cssText='position:fixed;inset:0;z-index:99999;background:rgba(18,28,46,.5);display:flex;align-items:center;justify-content:center';
    var items = rows.length ? rows.map(function(r){ var d=r.updated_at?new Date(r.updated_at).toLocaleString('ro-RO'):''; return '<div style="display:flex;align-items:center;gap:6px;padding:7px;border:1px solid #e3e9f1;border-radius:9px;margin-bottom:6px"><span style="flex:1;min-width:0"><b>'+String(r.nume||'(fara nume)').replace(/</g,'&lt;')+'</b><br><span style="color:#8a93a0;font-size:11px">'+d+'</span></span><button data-open="'+r.id+'" style="border:none;background:#2f6fd0;color:#fff;border-radius:8px;padding:6px 10px;cursor:pointer">Deschide</button><button data-del="'+r.id+'" style="border:1px solid #e6b8b8;background:#fff;color:#c0392b;border-radius:8px;padding:6px 9px;cursor:pointer">&#128465;</button></div>'; }).join('') : '<p style="color:#8a93a0">Niciun proiect in cloud inca. Apasa „Salveaza in cloud".</p>';
    m.innerHTML='<div style="background:#fff;border-radius:14px;width:400px;max-width:93vw;max-height:82vh;overflow:auto;padding:16px;font:13px system-ui"><div style="display:flex;align-items:center;gap:8px;margin-bottom:10px"><b style="flex:1;font-size:15px">Proiectele mele (cloud)</b><button id="pc-cloud-x" style="border:none;background:#eef2f7;border-radius:7px;width:26px;height:26px;cursor:pointer;font-size:15px">&times;</button></div>'+items+'</div>';
    document.body.appendChild(m);
    document.getElementById('pc-cloud-x').onclick=function(){ m.remove(); };
    Array.prototype.forEach.call(m.querySelectorAll('[data-open]'), function(b){ b.onclick=async function(){ var r=await window.PCCloud.load(o.app, b.getAttribute('data-open')); if(r.error){ flash(r.error.message,true); return; } try{ o.apply(r.data.data); bar._cloudId=r.data.id; flash('Proiect incarcat: '+(r.data.nume||'')); }catch(e){ flash('Nu pot incarca: '+e.message,true); } m.remove(); }; });
    Array.prototype.forEach.call(m.querySelectorAll('[data-del]'), function(b){ b.onclick=async function(){ if(!confirm('Stergi acest proiect din cloud?')) return; var r=await window.PCCloud.remove(o.app, b.getAttribute('data-del')); if(r.error){ flash(r.error.message,true); } else { var row=b.parentNode; if(row) row.remove(); } }; });
  }
  // o: {app, serialize:()=>obj, apply:(obj)=>void, name, extra:()=>obj}
  window.PCCloud.mountButtons = function(o){
    function ready(){ if(document.getElementById('pc-cloud-bar')) return; if(!document.body){ return setTimeout(ready,200); }
      var bar=document.createElement('div'); bar.id='pc-cloud-bar'; bar.style.cssText='position:fixed;left:50%;top:7px;transform:translateX(-50%);z-index:99997;display:flex;gap:6px;font:600 12px system-ui';
      bar.innerHTML='<button id="pc-cl-save" style="border:none;background:#2f6fd0;color:#fff;border-radius:9px;padding:6px 12px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.15)">&#9729; Salveaza in cloud</button>'
        +'<button id="pc-cl-list" style="border:1px solid #cdd8e6;background:#fff;color:#33506f;border-radius:9px;padding:6px 12px;cursor:pointer;box-shadow:0 4px 14px rgba(0,0,0,.15)">&#9729; Proiectele mele</button>';
      document.body.appendChild(bar); bar._cloudId=null;
      document.getElementById('pc-cl-save').onclick=async function(){ if(!await requireLogin()) return; var data; try{ data=o.serialize(); }catch(e){ flash('Nu pot citi proiectul.',true); return; } if(!data){ flash('Nimic de salvat.',true); return; }
        var nm=prompt('Nume pentru cloud:', o.name?o.name():'Proiect'); if(!nm) return; var r=await window.PCCloud.save(o.app, nm, data, o.extra?o.extra():null, bar._cloudId);
        if(r.error){ flash('Eroare: '+r.error.message,true); } else { bar._cloudId=r.data&&r.data.id; flash('Salvat in cloud: '+nm); } };
      document.getElementById('pc-cl-list').onclick=async function(){ if(!await requireLogin()) return; var r=await window.PCCloud.list(o.app); if(r.error){ flash(r.error.message,true); return; } cloudListModal(o, r.data||[], bar); };
    }
    ready();
  };

  function start(){
    if(!(window.supabase && window.supabase.createClient)){ badge('err','Supabase: biblioteca neincarcata'); return; }
    try{ window.SB = window.supabase.createClient(URL, KEY); }
    catch(e){ badge('err','Supabase: config invalida'); return; }
    setupAuth();
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
