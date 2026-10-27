(()=>{'use strict';
const KEY='nexo_supabase_config';
const $=s=>document.querySelector(s);
let supa=null;
function cfg(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return {}}}
function init(){const c=cfg();if(c.url&&c.key&&window.supabase&&window.supabase.createClient){try{supa=window.supabase.createClient(c.url,c.key)}catch(_){supa=null}}return supa}
function escape(s){return String(s??'').replace(/[&<>"]/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[x]))}
function panel(title,html){const w=$('#work');w.innerHTML='<section class="card"><div class="workhead"><h2>'+escape(title)+'</h2><button class="btn ghost" id="nxClose">Cerrar ×</button></div>'+html+'</section>';w.scrollIntoView({behavior:'smooth',block:'start'});$('#nxClose').onclick=()=>w.replaceChildren()}
async function settings(){
 const c=cfg();init();
 const html='<p class="muted">Conecta tu proyecto Supabase con la URL y la clave pública publishable/anon. Nunca introduzcas aquí una clave service_role ni una clave privada de IA.</p>'+
 '<div class="field"><label>Supabase Project URL</label><input id="nxUrl" placeholder="https://proyecto.supabase.co" value="'+escape(c.url)+'"></div>'+
 '<div class="field"><label>Clave pública publishable / anon</label><input id="nxKey" placeholder="sb_publishable_… o anon key" value="'+escape(c.key)+'"></div>'+
 '<button type="button" class="btn" id="nxSave">Guardar conexión</button><div class="sep"></div><h3>Cuenta de usuario</h3>'+
 '<div class="field"><label>Correo</label><input id="nxEmail" type="email" autocomplete="email"></div>'+
 '<div class="field"><label>Contraseña</label><input id="nxPass" type="password" autocomplete="current-password"></div>'+
 '<div class="row"><button class="btn" id="nxLogin">Iniciar sesión</button><button class="btn secondary" id="nxSignup">Crear cuenta</button><button class="btn ghost" id="nxLogout">Cerrar sesión</button></div>'+
 '<div id="nxStatus" class="result">Sin conexión configurada.</div><div class="notice">La IA real se ejecuta en el backend nexo-ai. La clave de OpenAI permanece en los secretos de Supabase; nunca la pongas en esta página.</div>';
 panel('NEXO CONNECT · Conexión segura',html);
 $('#nxSave').addEventListener('click',()=>{const status=$('#nxStatus');try{const url=$('#nxUrl').value.trim().replace(/\/$/,'');const key=$('#nxKey').value.trim();if(!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(url)){status.textContent='La URL no parece válida. Debe empezar por https:// y terminar en .supabase.co';return}if(!key){status.textContent='Pega la clave pública publishable/anon.';return}localStorage.setItem(KEY,JSON.stringify({url,key}));supa=null;const client=init();status.textContent=client?'✅ Conexión guardada en este dispositivo. Ahora inicia sesión o crea una cuenta.':'Se guardó la configuración, pero no se cargó el cliente Supabase. Recarga la página y prueba otra vez.';}catch(err){status.textContent='No se pudo guardar: '+(err&&err.message?err.message:'el navegador bloqueó el almacenamiento.');}});
 $('#nxLogin').onclick=async()=>{if(!init())return $('#nxStatus').textContent='Guarda primero la conexión.';const {data,error}=await supa.auth.signInWithPassword({email:$('#nxEmail').value.trim(),password:$('#nxPass').value});$('#nxStatus').textContent=error?error.message:'Sesión iniciada: '+data.user.email;$('#nxPass').value=''};
 $('#nxSignup').onclick=async()=>{if(!init())return $('#nxStatus').textContent='Guarda primero la conexión.';const {data,error}=await supa.auth.signUp({email:$('#nxEmail').value.trim(),password:$('#nxPass').value});$('#nxStatus').textContent=error?error.message:(data.session?'Cuenta creada y sesión iniciada.':'Cuenta creada; revisa el correo para confirmar.');$('#nxPass').value=''};
 $('#nxLogout').onclick=async()=>{if(supa)await supa.auth.signOut();$('#nxStatus').textContent='Sesión cerrada.'};
 if(supa){const {data,error}=await supa.auth.getSession();$('#nxStatus').textContent=error?error.message:(data.session?'Sesión activa: '+data.session.user.email:'Conexión lista; falta iniciar sesión.')}
}
function wireButton(){if(!$('#settingsBtn')){const top=document.querySelector('.top');if(top){const b=document.createElement('button');b.id='settingsBtn';b.className='btn ghost';b.textContent='Conectar IA';b.style.padding='9px 11px';top.appendChild(b)}}}
async function generate(prompt,mode){
 if(!prompt||prompt.trim().length<10){alert('Describe tu idea con al menos 10 caracteres.');return}
 const c=init();
 if(!c){panel('Conecta NEXO primero','<p>Para usar el modelo de IA, pulsa <b>Conectar IA</b>, guarda la URL y la clave pública de Supabase, y luego inicia sesión.</p>');return}
 const {data:sessionData,error:sessionError}=await c.auth.getSession();
 if(sessionError||!sessionData.session){panel('Inicia sesión para generar','<p>Abre <b>Conectar IA</b>, configura Supabase e inicia sesión. La función requiere una sesión autenticada.</p>');return}
 panel('NEXO AI · Procesando','<p class="muted">Enviando tu instrucción al backend seguro…</p><div class="result">NEXO BRAIN está preparando el resultado.</div>');
 try{
  const {data,error}=await c.functions.invoke('nexo-ai',{body:{prompt:prompt.trim().slice(0,20000),mode:mode||'app_blueprint'}});
  if(error)throw error;
  if(!data||!data.ok||!data.result)throw new Error((data&&data.error)||'La IA no devolvió un resultado válido.');
  panel('NEXO AI · Resultado','<p class="muted">Respuesta generada por el modelo: '+escape(data.model||'OpenAI')+'. Esto es un plan/especificación; aún no es una aplicación desplegada.</p><div class="result" id="nxResult">'+escape(data.result)+'</div><div class="row" style="margin-top:10px"><button class="btn" id="nxDownload">Exportar resultado TXT</button></div>');
  $('#nxDownload').onclick=()=>{const blob=new Blob([data.result],{type:'text/plain;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='nexo-ai-especificacion.txt';a.click();URL.revokeObjectURL(url)};
 }catch(e){panel('NEXO AI · Error','<div class="notice">'+escape(e&&e.message||e)+'</div><p class="muted">Revisa la sesión, el secreto OPENAI_API_KEY y los registros de la función. No compartas claves privadas.</p>')}
}
function intercept(id,getPrompt,getMode){const b=$(id);if(!b||b.dataset.nexoBound)return;b.dataset.nexoBound='1';b.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();generate(getPrompt(),getMode())},true)}
function boot(){wireButton();init();const b=$('#settingsBtn');if(b)b.addEventListener('click',settings);intercept('#runMain',()=>$('#mainPrompt')?.value||'','app_blueprint');
 document.addEventListener('click',e=>{const b=e.target.closest('#genApp,#brainGo,#goalGo');if(!b)return;
  if(b.id==='genApp'){e.preventDefault();e.stopImmediatePropagation();generate((($('#appName')?.value||'Nueva aplicación')+' — '+($('#appDesc')?.value||'')),'app_blueprint')}
  else if(b.id==='brainGo'){e.preventDefault();e.stopImmediatePropagation();generate($('#brainIdea')?.value||'','business_plan')}
  else {e.preventDefault();e.stopImmediatePropagation();generate($('#goal')?.value||'',b.id==='goalGo'?'workflow':'business_plan')}
 },true);
}
window.nexoOpenSettings=settings;
document.addEventListener('click',function(e){const b=e.target&&e.target.closest?e.target.closest('#settingsBtn'):null;if(!b)return;e.preventDefault();e.stopImmediatePropagation();settings().catch(err=>{const w=$('#work');if(w)w.textContent='No se pudo abrir Conectar IA: '+(err&&err.message?err.message:'error inesperado');});},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();