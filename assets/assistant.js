/* ===========================================================================
   Asistent PROFCEISS - widget de chat comun (coltul stanga-jos), pe toate paginile.
   Static, fara server, fara AI deocamdata: raspunde pe reguli si poate executa
   comenzi pe care fiecare aplicatie le inregistreaza prin PCAssistant.register().
   Cand vom avea gazduire, inlocuim doar "creierul" (parser -> LLM), restul ramane.
   FARA diacritice in sursa (conventia proiectului).
   =========================================================================== */
(function(){
  if(window.__pcAssistantLoaded) return; window.__pcAssistantLoaded=true;
  function boot(){
    if(!document.body){ return setTimeout(boot,60); }
    var host=document.createElement('div');
    host.id='pc-assistant-host';
    host.style.cssText='position:fixed;left:16px;bottom:16px;z-index:2147483000';
    document.body.appendChild(host);
    var root=host.attachShadow?host.attachShadow({mode:'open'}):host;

    var appName=(window.PC_ASSIST_APP||document.title||'PROFCEISS').toString().slice(0,40);

    root.innerHTML=''
    +'<style>'
    +':host,*{box-sizing:border-box;font-family:system-ui,Segoe UI,Roboto,Arial,sans-serif}'
    +'.launch{width:54px;height:54px;border-radius:50%;border:none;cursor:pointer;'
    +'  background:linear-gradient(150deg,#2f6fd0,#1d9e75);color:#fff;font-size:24px;'
    +'  box-shadow:0 8px 22px rgba(20,40,80,.32);display:flex;align-items:center;justify-content:center;transition:transform .15s}'
    +'.launch:hover{transform:scale(1.06)}'
    +'.panel{position:absolute;left:0;bottom:64px;width:330px;max-width:86vw;height:440px;max-height:72vh;'
    +'  background:#fff;border:1px solid #dfe6ef;border-radius:16px;box-shadow:0 16px 44px rgba(20,40,80,.28);'
    +'  display:none;flex-direction:column;overflow:hidden}'
    +'.panel.open{display:flex}'
    +'.hd{background:linear-gradient(150deg,#2f6fd0,#1d9e75);color:#fff;padding:11px 13px;display:flex;align-items:center;gap:8px}'
    +'.hd b{font-size:13.5px;font-weight:700;flex:1;line-height:1.1}'
    +'.hd .sub{display:block;font-size:10px;font-weight:500;opacity:.85}'
    +'.hd .x{background:rgba(255,255,255,.2);border:none;color:#fff;width:24px;height:24px;border-radius:7px;cursor:pointer;font-size:15px}'
    +'.msgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:9px;background:#f6f9fd}'
    +'.b{max-width:84%;padding:8px 11px;border-radius:13px;font-size:12.5px;line-height:1.4;white-space:pre-wrap;word-wrap:break-word}'
    +'.b.a{align-self:flex-start;background:#fff;border:1px solid #e3eaf3;color:#1b2a44;border-bottom-left-radius:4px}'
    +'.b.u{align-self:flex-end;background:#2f6fd0;color:#fff;border-bottom-right-radius:4px}'
    +'.chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 8px;background:#f6f9fd}'
    +'.chip{border:1px solid #cdd9e8;background:#fff;color:#33506f;border-radius:14px;padding:5px 10px;font-size:11px;cursor:pointer}'
    +'.chip:hover{background:#eef4fb}'
    +'.ipt{display:flex;gap:7px;padding:9px;border-top:1px solid #e6ecf3;background:#fff}'
    +'.ipt input{flex:1;border:1px solid #d4dde8;border-radius:10px;padding:8px 10px;font-size:12.5px;outline:none;min-width:0}'
    +'.ipt input:focus{border-color:#2f6fd0}'
    +'.ipt button{border:none;background:#2f6fd0;color:#fff;border-radius:10px;padding:0 13px;font-size:14px;cursor:pointer}'
    +'.ipt .mic{background:#eaf0f7;color:#2f6fd0}'
    +'.ipt .mic.listening{background:#e23b3b;color:#fff;animation:pcpulse 1s infinite}'
    +'@keyframes pcpulse{0%,100%{box-shadow:0 0 0 0 rgba(226,59,59,.45)}50%{box-shadow:0 0 0 6px rgba(226,59,59,0)}}'
    +'.hd .spk{background:rgba(255,255,255,.2);border:none;color:#fff;width:24px;height:24px;border-radius:7px;cursor:pointer;font-size:13px;margin-right:2px}'
    +'.hd .spk.off{opacity:.45}'
    +'</style>'
    +'<button class="launch" id="lc" title="Profceiss AI">&#128172;</button>'
    +'<div class="panel" id="pn">'
    +'  <div class="hd"><span style="font-size:18px">&#129302;</span><b>Profceiss AI<span class="sub" id="appn"></span></b><button class="spk" id="spk" title="Citeste cu voce raspunsurile">&#128266;</button><button class="x" id="cl">&times;</button></div>'
    +'  <div class="msgs" id="ms"></div>'
    +'  <div class="chips" id="ch"></div>'
    +'  <div class="ipt"><input id="in" placeholder="Scrie sau apasa microfonul..." autocomplete="off"><button class="mic" id="mic" title="Vorbeste (comanda vocala)">&#127908;</button><button id="sd">&#10148;</button></div>'
    +'</div>';

    var $=function(id){ return root.getElementById?root.getElementById(id):document.getElementById(id); };
    var pn=$('pn'), ms=$('ms'), inp=$('in');
    $('appn').textContent=' · '+appName+' · beta';

    function add(text,who){ var d=document.createElement('div'); d.className='b '+(who==='u'?'u':'a'); d.textContent=text; ms.appendChild(d); ms.scrollTop=ms.scrollHeight; return d; }
    function open(){ pn.classList.add('open'); setTimeout(function(){ inp.focus(); },50); if(!ms.children.length) greet(); }
    function close(){ pn.classList.remove('open'); }

    /* ----- voce: iesire (text-to-speech) ----- */
    var speakOn=true, lastWasVoice=false;
    function speak(text){ try{ if(!speakOn||!window.speechSynthesis) return; var u=new SpeechSynthesisUtterance(text); u.lang='ro-RO'; u.rate=1.02; window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); }catch(e){} }

    var handlers=[];   // fiecare aplicatie isi inregistreaza un (text)->raspuns sau null
    function respond(text){
      var t=(text||'').trim(); if(!t) return;
      add(t,'u');
      var reply=null;
      for(var i=0;i<handlers.length && reply==null;i++){ try{ reply=handlers[i](t); }catch(e){ reply=null; } }
      if(reply==null) reply=ruleReply(t);
      setTimeout(function(){ add(reply,'a'); if(lastWasVoice) speak(reply); lastWasVoice=false; },180);
    }
    function ruleReply(t){
      var s=t.toLowerCase();
      if(/^(salut|buna|hey|noroc|hello|servus)/.test(s)) return 'Salut! Sunt Profceiss AI. Te pot ghida prin '+appName+'. Scrie-mi ce vrei sa faci.';
      if(/multumesc|merci|mersi/.test(s)) return 'Cu placere!';
      if(/ce poti|ce stii|ce faci|ajut|cu ce|help|comenzi|optiuni/.test(s)) return 'Momentan te ghidez prin functiile acestui instrument si raspund la intrebari. In curand voi putea si executa direct comenzi in aplicatie (ex. "fa o casa 8x6", "adauga 3 prize").';
      if(/(fa |creeaza|adauga|pune |sterge|deseneaza|construieste|umple)/.test(s)) return 'Am inteles intentia. Executia directa a comenzilor vine in pasul urmator - momentan iti pot spune cum sa o faci manual. Vrei pasii?';
      return 'Am notat. Sunt in versiune beta si invat: pot raspunde la intrebari despre '+appName+' si, in curand, sa execut comenzi. Reformuleaza ca intrebare daca vrei un ghid.';
    }
    function greet(){
      add('Salut! Sunt Profceiss AI, aici in '+appName+'. Intreaba-ma orice sau alege mai jos.','a');
    }

    // chips implicite (o aplicatie le poate inlocui prin PCAssistant.setChips)
    function setChips(list){ var c=$('ch'); c.innerHTML=''; (list||[]).forEach(function(txt){ var b=document.createElement('button'); b.className='chip'; b.textContent=txt; b.onclick=function(){ respond(txt); }; c.appendChild(b); }); }
    setChips(['Ce poate face acest instrument?','Cum incep?','Da-mi un sfat']);

    $('lc').onclick=function(){ pn.classList.contains('open')?close():open(); };
    $('cl').onclick=close;
    $('sd').onclick=function(){ var v=inp.value; inp.value=''; lastWasVoice=false; respond(v); };
    inp.addEventListener('keydown',function(e){ if(e.key==='Enter'){ var v=inp.value; inp.value=''; lastWasVoice=false; respond(v); } });

    /* ----- voce: intrare (microfon, recunoastere vocala) + toggle citire ----- */
    $('spk').onclick=function(){ speakOn=!speakOn; $('spk').classList.toggle('off',!speakOn); if(!speakOn && window.speechSynthesis) window.speechSynthesis.cancel(); };
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition, rec=null, listening=false;
    var micBtn=$('mic');
    if(!SR){ micBtn.style.display='none'; }   // browserul nu suporta (ex. unele versiuni) -> ramane doar tastatura
    else {
      micBtn.onclick=function(){ if(listening){ try{ rec.stop(); }catch(e){} return; }
        try{ rec=new SR(); }catch(e){ return; }
        rec.lang='ro-RO'; rec.interimResults=false; rec.maxAlternatives=1;
        rec.onstart=function(){ listening=true; micBtn.classList.add('listening'); inp.placeholder='Ascult... vorbeste'; };
        rec.onerror=function(){ listening=false; micBtn.classList.remove('listening'); inp.placeholder='Scrie sau apasa microfonul...'; };
        rec.onend=function(){ listening=false; micBtn.classList.remove('listening'); inp.placeholder='Scrie sau apasa microfonul...'; };
        rec.onresult=function(ev){ var txt=''; for(var i=0;i<ev.results.length;i++) txt+=ev.results[i][0].transcript; txt=(txt||'').trim(); if(txt){ lastWasVoice=true; respond(txt); } };
        if(!pn.classList.contains('open')) open();
        try{ rec.start(); }catch(e){}
      };
    }

    // API publica (pentru integrari per-aplicatie, acum sau dupa ce adaugam AI)
    window.PCAssistant={
      open:open, close:close,
      say:function(t,alsoSpeak){ add(t,'a'); if(alsoSpeak||lastWasVoice) speak(t); if(!pn.classList.contains('open')) open(); },
      speak:speak,
      register:function(fn){ if(typeof fn==='function') handlers.push(fn); },
      setChips:setChips,
      setApp:function(n){ appName=(n||appName).toString(); $('appn').textContent=' · '+appName+' · beta'; }
    };
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
