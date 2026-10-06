const fs=require('fs');
const file='index.html';
const marker='<!-- CPP V33 P2P BUTTON BRIDGE:';
const patch=String.raw`<!-- CPP V33 P2P BUTTON BRIDGE: conecta cualquier botón P2P con el módulo V32 sin tocar otros módulos -->
<script id="cpp-v33-p2p-button-bridge">
(()=>{'use strict';
const boot=()=>{
  const open=window.__CPP_P2P_V32__||window.__CPP_P2P_V31__?.open||window.p2pPanel||window.__CPP_P2P_OPEN__;
  if(typeof open!=='function')return;
  window.p2pPanel=open;
  window.__CPP_P2P_OPEN__=open;
  window.__CPP_P2P_V33__={open,version:'V33-button-bridge'};
  const isP2P=(el)=>{
    if(!el)return false;
    const txt=String(el.textContent||'').replace(/\s+/g,' ').trim().toLowerCase();
    const aria=String(el.getAttribute?.('aria-label')||'').trim().toLowerCase();
    const data=String(el.getAttribute?.('data-action')||el.getAttribute?.('data-page')||el.getAttribute?.('data-module')||'').trim().toLowerCase();
    return txt==='p2p'||txt.includes('p2p')||aria.includes('p2p')||data==='p2p'||data.includes('p2p');
  };
  document.addEventListener('click',async ev=>{
    const el=ev.target?.closest?.('button,a,[role="button"],[data-action],[data-page],[data-module]');
    if(!isP2P(el))return;
    ev.preventDefault();
    ev.stopPropagation();
    if(typeof ev.stopImmediatePropagation==='function')ev.stopImmediatePropagation();
    try{await open();}catch(e){
      const msg=String(e?.message||e||'No se pudo abrir P2P');
      const mb=document.getElementById('modalBody');
      if(mb)mb.innerHTML='<div class="msg error">'+msg.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))+'</div>';
    }
  },true);
  window.dispatchEvent(new CustomEvent('cpp:p2p-ready'));
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
</script>
`;
const html=fs.readFileSync(file,'utf8');
if(!html.includes(marker)){fs.writeFileSync(file,html+'\n'+patch,'utf8');console.log('P2P V33 bridge appended');}
else console.log('P2P V33 bridge already present');
