(()=>{'use strict';
const KEY='nexo_supabase_config';
const $=s=>document.querySelector(s);
let supa=null;
function cfg(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return {}}}
function init(){const c=cfg();if(c.url&&c.key&&window.supabase&&window.supabase.createClient){try{supa=window.supabase.createClient(c.url,c.key)}catch(_){supa=null}}return supa}
function escape(s){return String(s||'').replace(/[&<>"]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x]))}
function panel(title,html){const w=$('#work');w.innerHTML='<section class="card"><div class="workhead"><h2>'+title+'</h2><button class="btn ghost" id="nxClose">Cerrar ×</button></div>'+html+'</section>';w.scrollIntoView({behavior:'smooth',block:'start'});$('#nxClose').onclick=()=>w.replaceChildren()}
async function settings(){
 const c=cfg();init();
 const html='<p class="muted">Conecta un proyecto Supabase. Usa solo la URL del proyecto y la clave pública publishable/anon. Nunca introduzcas una clave service_role ni una clave privada de IA.</p>'+
 '<div class="field"><label>Supabase Project URL</label><input id="nxUrl" placeholder="https://proyecto.supabase.co" value="'+escape(c.url)+'"></div>'+
 '<div class="field"><label>Clave pública publishable / anon</label><input id="nxKey" placeholder="sb_publishable_… o anon key" value="'+escape(c.key)+'"></div>'+
 '<button class="btn" id="nxSave">Guardar conexión</button><div class="sep"></div>'+
 '<h3>Cuenta de usuario</h3><div class="field"><label>Correo</label><input id="nxEmail" type="email" autocomplete="email"></div>'+
 '<div class="field"><label>Contraseña</label><input id="nxPass" type="password" autocomplete="current-password"></div>'+
 '<div class="row"><button class="btn" id="nxLogin">Iniciar sesión</button><button class="btn secondary" id="nxSignup">Crear cuenta</button><button class="btn ghost" id="nxLogout">Cerrar sesión</button></div>'+
 '<div id="nxStatus" class="result">Sin conexión configurada.</div><div class="notice">Para usar IA real, debe desplegarse la función nexo-ai y guardarse OPENAI_API_KEY como secreto en Supabase. Los pagos todavía no están activos.</div>';
 panel('NEXO CONNECT · Conexión segura',html);
 $('#nxSave').onclick=()=>{const url=$('#nxUrl').value.trim().replace(/\/$/,'');const key=$('#nxKey').value.trim();if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)||!key){$('#nxStatus').textContent='Revisa la URL y la clave pública.';return}localStorage.setItem(KEY,JSON.stringify({url,key}));init();$('#nxStatus').textContent=supa?'Conexión guardada. Inicia sesión.':'No se pudo iniciar el cliente Supabase.'};
 $('#nxLogin').onclick=async()=>{if(!init())return $('#nxStatus').textContent='Guarda primero la conexión.';const {data,error}=await supa.auth.signInWithPassword({email:$('#nxEmail').value.trim(),password:$('#nxPass').value});$('#nxStatus').textContent=error?error.message:'Sesión iniciada: '+data.user.email;$('#nxPass').value=''};
 $('#nxSignup').onclick=async()=>{if(!init())return $('#nxStatus').textContent='Guarda primero la conexión.';const {data,error}=await supa.auth.signUp({email:$('#nxEmail').value.trim(),password:$('#nxPass').value});$('#nxStatus').textContent=error?error.message:(data.session?'Cuenta creada y sesión iniciada.':'Cuenta creada; revisa el correo para confirmar.');$('#nxPass').value=''};
 $('#nxLogout').onclick=async()=>{if(supa)await supa.auth.signOut();$('#nxStatus').textContent='Sesión cerrada.'};
 if(supa){const {data,error}=await supa.auth.getSession();$('#nxStatus').textContent=error?error.message:(data.session?'Sesión activa: '+data.session.user.email:'Conexión lista; falta iniciar sesión.')}
}
function wireButton(){if(!$('#settingsBtn')){const top=document.querySelector('.top');if(top){const b=document.createElement('button');b.id='settingsBtn';b.className='btn ghost';b.textContent='Conectar IA';b.style.padding='9px 11px';top.appendChild(b)}}}
function wrapRun(){
 if(typeof window.runIdea!=='function'||window.runIdea.__nexoRemote)return;
 const local=window.runIdea;
 const remote=async function(text,mode){
  const c=init();
  if(c){try{const {data:s}=await c.auth.getSession();if(s&&s.session){panel('NEXO AI · Procesando','<p class="muted">La solicitud se está enviando al backend seguro.</p><div class="result">Esperando respuesta del modelo…</div>');const {data,error}=await c.functions.invoke('nexo-ai',{body:{prompt:String(text||'').slice(0,8000),mode:mode||'business'}});if(error)throw error;if(typeof window.showResult==='function')return window.showResult('NEXO AI · Resultado',String(data&&data.answer||'La IA no devolvió texto.'),mode||'brain');const box=$('#work');box.innerHTML='<section class="card"><div class="workhead"><h2>NEXO AI · Resultado</h2><button class="btn ghost" id="nxClose">Cerrar ×</button></div><div class="result">'+escape(data&&data.answer)+'</div></section>';$('#nxClose').onclick=()=>box.replaceChildren();return}}catch(e){panel('NEXO AI · Error de conexión','<div class="notice">'+escape(e&&e.message||e)+'</div><p class="muted">Comprueba que la función nexo-ai está desplegada y que OPENAI_API_KEY está configurada como secreto en Supabase.</p>');return}}
  return local(text,mode);
 };
 remote.__nexoRemote=true;window.runIdea=remote;
}
function boot(){wireButton();init();wrapRun();const b=$('#settingsBtn');if(b)b.addEventListener('click',settings);setTimeout(wrapRun,100)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
