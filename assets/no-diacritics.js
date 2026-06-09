/* ============================================================
   PROFCEISS · Fără diacritice (regulă globală)
   - Elimină diacriticele românești din TOT ce se afișează (live)
   - Elimină diacriticele din TOT ce tastezi (input/textarea)
   - Expune window.noDia(text) pentru fișierele generate (PDF/SVG/DXF/STL)
   Inclus cu: <script src="../assets/no-diacritics.js"></script>  (cât mai sus în <head> sau <body>)
   ============================================================ */
(function(){
  "use strict";
  if (window.__PCE_NODIA__) return; window.__PCE_NODIA__ = true;

  var MAP = {
    'ă':'a','â':'a','î':'i','ș':'s','ş':'s','ț':'t','ţ':'t',
    'Ă':'A','Â':'A','Î':'I','Ș':'S','Ş':'S','Ț':'T','Ţ':'T',
    // mai rare / lipite cu sedilă vs virgulă
    'ș':'s','ț':'t','Ș':'S','Ț':'T'
  };
  var RE = /[ăâîșşțţĂÂÎȘŞȚŢȘșȚț]/g;
  function strip(s){ if(s==null) return s; s=String(s); if(!RE.test(s)) return s; RE.lastIndex=0; return s.replace(RE, function(c){ return MAP[c]||c; }); }
  window.noDia = strip;

  var SKIP = { SCRIPT:1, STYLE:1, OPTION:1, NOSCRIPT:1 };
  var ATTRS = ['placeholder','title','alt','aria-label','label'];

  function cleanTextNode(node){
    var v = node.nodeValue;
    if (v && RE.test(v)){ RE.lastIndex=0; node.nodeValue = strip(v); }
  }
  function cleanAttrs(elf){
    for (var i=0;i<ATTRS.length;i++){
      var a=ATTRS[i];
      if (elf.hasAttribute && elf.hasAttribute(a)){
        var val=elf.getAttribute(a);
        if (val && RE.test(val)){ RE.lastIndex=0; elf.setAttribute(a, strip(val)); }
      }
    }
  }
  function walk(root){
    if(!root) return;
    if (root.nodeType===3){ cleanTextNode(root); return; }
    if (root.nodeType!==1) return;
    if (SKIP[root.nodeName]) return;
    cleanAttrs(root);
    var tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: function(n){ return (n.parentNode && SKIP[n.parentNode.nodeName]) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT; }
    });
    var n; while((n=tw.nextNode())){ cleanTextNode(n); }
    // atribute pe descendenți
    var els = root.querySelectorAll ? root.querySelectorAll('['+ATTRS.join('],[')+']') : [];
    for (var i=0;i<els.length;i++){ if(!SKIP[els[i].nodeName]) cleanAttrs(els[i]); }
  }

  /* ----- input live (tot ce tastezi devine fără diacritice) ----- */
  function onInput(e){
    var el=e.target;
    if(!el || (el.nodeName!=='INPUT' && el.nodeName!=='TEXTAREA')) return;
    if (el.type && /^(checkbox|radio|file|range|color|date|number)$/.test(el.type)) return;
    var v=el.value;
    if (v && RE.test(v)){
      RE.lastIndex=0;
      var start=el.selectionStart, end=el.selectionEnd;
      el.value=strip(v);
      try{ el.setSelectionRange(start, end); }catch(_){}
    }
  }
  document.addEventListener('input', onInput, true);

  /* ----- pornire + observer pentru conținut generat dinamic ----- */
  function start(){
    try{ walk(document.body); }catch(e){}
    try{ if(document.title) document.title=strip(document.title); }catch(e){}
    var obs=new MutationObserver(function(muts){
      for (var i=0;i<muts.length;i++){
        var m=muts[i];
        if (m.type==='characterData'){ if(m.target && (!m.target.parentNode || !SKIP[m.target.parentNode.nodeName])) cleanTextNode(m.target); }
        else if (m.type==='attributes'){ if(m.target && m.target.nodeType===1 && !SKIP[m.target.nodeName]) cleanAttrs(m.target); }
        else if (m.addedNodes){ for (var j=0;j<m.addedNodes.length;j++) walk(m.addedNodes[j]); }
      }
    });
    obs.observe(document.documentElement, { childList:true, subtree:true, characterData:true, attributes:true, attributeFilter:ATTRS });
  }
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
