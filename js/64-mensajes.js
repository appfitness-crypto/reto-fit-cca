/* ═══ Reto Fit CCA: mensajes 1 a 1 entre el socio y su entrenador ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global). Estilos en css/cine.css.
   · Firebase: /chats/<socio>/<id> = {d:'s'|'e', t, ts, u, n}   (d = quién lo escribió: socio o entrenador)
               /chatsMeta/<socio> = {e: entrenador, ts, d, t (vista previa), ls / le: hasta cuándo leyó el socio / el entrenador}
     Reglas en firebase-rules.json: el socio, su entrenador y el director; nadie más lee ni escribe.
   · Socio: Perfil → "Mensajes con <entrenador>" y botón en la hoja Tu entrenador. Punto en la pestaña Perfil si hay sin leer.
   · Entrenador: en su lista, globo junto al socio que le escribió; en la ficha, botón Mensajes.
   · Necesita conexión: los mensajes no se guardan en el celular para mandarse después. ═══ */

const CHAT_MAX=1000;
let chatMeta={};            // meta por socio: lo que escucha esta sesión
let chatMetaRef=null, chatMetaClave='';
let chatAbierto=null;       // {code, ref, quien:'s'|'e'}

function chatListo(){ return !!(fbListo && fbDB); }
function chatEsStaff(){ return typeof staffRol!=='undefined' && !!staffActivoEntId && !(typeof vistaSocioActiva==='function' && vistaSocioActiva()); }
function chatSinLeer(code,quien){
  const m=chatMeta[code]; if(!m || !m.ts) return false;
  return quien==='s' ? (m.d==='e' && +m.ts>(+m.ls||0)) : (m.d==='s' && +m.ts>(+m.le||0));
}

// ── Escuchar la meta (para saber si hay mensajes sin leer) ──
function chatEscucharMeta(){
  if(!chatListo()) return;
  let clave='', ref=null;
  if(chatEsStaff()){
    if(staffRol==='coordinador'){ clave='dir'; ref=fbDB.ref('/chatsMeta'); }
    else { clave='e:'+staffActivoEntId; ref=fbDB.ref('/chatsMeta').orderByChild('e').equalTo(staffActivoEntId); }
  } else if(typeof activeSocio!=='undefined' && activeSocio && activeSocio.code){
    clave='s:'+activeSocio.code; ref=fbDB.ref('/chatsMeta/'+activeSocio.code);
  }
  if(clave===chatMetaClave) return;
  chatDetenerMeta();
  if(!ref) return;
  chatMetaClave=clave; chatMetaRef=ref;
  ref.on('value', sn=>{
    const v=sn.val()||{};
    chatMeta = clave.startsWith('s:') ? {[activeSocio.code]:v} : v;
    chatPintarAvisos();
  }, err=>{ console.warn('chatsMeta',err&&err.code); chatMetaClave=''; chatMetaRef=null; });
}
function chatDetenerMeta(){ if(chatMetaRef){ try{ chatMetaRef.off(); }catch(e){} } chatMetaRef=null; chatMetaClave=''; chatMeta={}; }

// Puntos y globos de "sin leer" donde estén pintados
function chatPintarAvisos(){
  const s=typeof activeSocio!=='undefined'?activeSocio:null;
  const tab=document.getElementById('dtab-perfil');
  if(tab) tab.classList.toggle('chat-nuevo', !!(s && !chatEsStaff() && chatSinLeer(s.code,'s')));
  document.querySelectorAll('[data-chat-badge]').forEach(el=>{ const c=el.getAttribute('data-chat-badge'); el.hidden=!chatSinLeer(c, chatEsStaff()?'e':'s'); });
  if(chatEsStaff() && document.getElementById('staff-socio-list')) chatMarcarLista();
  chatFabPintar();
}
// Burbuja flotante en Inicio: aparece cuando ya hay conversación; con punto rojo y el mensaje cuando le respondieron
function chatFabPintar(){
  const sd=document.getElementById('s-dash'); if(!sd) return;
  let fab=document.getElementById('chat-fab');
  const s=typeof activeSocio!=='undefined'?activeSocio:null;
  const m=s&&chatMeta[s.code];
  if(!s || chatEsStaff() || !m || !m.ts){ if(fab) fab.remove(); return; }
  const nuevo=chatSinLeer(s.code,'s'), e=chatNombreEnt(s);
  const quien=e?tc(e.nombre).split(' ')[0]:'El club';
  const av=e&&typeof entAvatarHTML==='function'?entAvatarHTML(e,'ent-av chat-fab-av'):`<span class="ent-av chat-fab-av">${ico('chat')}</span>`;
  const clave=[nuevo,m.ts,quien].join('|');
  if(fab && fab.dataset.k===clave) return;
  if(!fab){ fab=document.createElement('div'); fab.id='chat-fab'; fab.className='chat-fab'; sd.appendChild(fab); }
  fab.dataset.k=clave;
  fab.classList.toggle('nuevo',nuevo);
  fab.innerHTML=`${nuevo&&m.d==='e'&&m.t?`<button type="button" class="chat-fab-msg" onclick="chatAbrir('${esc(s.code)}')"><b>${esc(quien)}</b><span>${esc(m.t)}</span></button>`:''}
    <button type="button" class="chat-fab-b" onclick="chatAbrir('${esc(s.code)}')" aria-label="${nuevo?esc(quien)+' te respondió. Abrir mensajes':'Abrir mensajes con '+esc(quien)}">${av}<i class="chat-fab-ic">${ico('chat')}</i>${nuevo?'<i class="chat-fab-dot" aria-hidden="true"></i>':''}</button>`;
}
function chatMarcarLista(){
  document.querySelectorAll('#staff-socio-list .sl-item').forEach(it=>{
    const m=(it.getAttribute('onclick')||'').match(/staffOpenSocio\('([^']+)'\)/); if(!m) return;
    let b=it.querySelector('.sl-chat');
    const on=chatSinLeer(m[1],'e');
    if(on && !b){ b=document.createElement('span'); b.className='sl-chat'; b.title='Te escribió'; b.innerHTML=ico('chat'); it.querySelector('.sl-nm')?.appendChild(b); }
    if(!on && b) b.remove();
  });
}

// ── Entradas ──
function chatNombreEnt(s){ const e=s&&s.entrenadorId&&getEntrenador(s.entrenadorId); return e&&e.nombre&&e.rol!=='coordinador'?e:null; }
function chatFilaPerfilHTML(s){
  if(!s || !s.code) return '';
  const e=chatNombreEnt(s);
  // Sin entrenador: escribe al club y le responde el director
  const av=e&&typeof entAvatarHTML==='function'?entAvatarHTML(e,'pfl-av chat-av'):`<span class="pfl-ic">${ico('chat')}</span>`;
  const tit=e?'Mensajes con '+esc(tc(e.nombre).split(' ')[0]):'Mensajes con el club';
  const sub=e?'Escríbele dudas de tu rutina o tu comida':'Te responde el director mientras te asignan entrenador';
  return `<button type="button" class="pfl-it" onclick="chatAbrir('${esc(s.code)}')">${av}<span class="pfl-t"><b>${tit}</b><small>${sub}</small></span><i class="chat-dot" data-chat-badge="${esc(s.code)}" ${chatSinLeer(s.code,'s')?'':'hidden'}></i>${ico('chev')}</button>`;
}
function chatBotonFichaHTML(s){
  if(!s || !chatEsStaff()) return '';
  const nuevo=chatSinLeer(s.code,'e');
  return `<button type="button" class="fx-chat" onclick="chatAbrir('${esc(s.code)}')">${ico('chat')}<span>Mensajes</span><i class="chat-dot" data-chat-badge="${esc(s.code)}" ${nuevo?'':'hidden'}></i></button>`;
}

// ── Conversación ──
function chatAbrir(code){
  const s=getSocio(code); if(!s) return;
  const quien=chatEsStaff()?'e':'s';
  if(!chatListo() || !navigator.onLine){ showToast('Los mensajes necesitan conexión a internet.'); return; }
  chatCerrar();
  const ent=quien==='s'?chatNombreEnt(s):null;
  const titulo=quien==='s'?(ent?tc(ent.nombre):'Equipo del club'):tc(s.nombre);
  const entS=getEntrenador(s.entrenadorId), conEnt=entS&&entS.rol!=='coordinador';
  const sub=quien==='s'?(ent?'Tu entrenador':'Te responde el director'):(s.entrenadorId===staffActivoEntId?'Tu atleta':conEnt?'Atleta de '+entS.nombre:'Sin entrenador: le respondes tú');
  const av=quien==='s'?(typeof entAvatarHTML==='function'&&ent?entAvatarHTML(ent,'ent-av chat-hav'):`<span class="ent-av chat-hav">${ico('chat')}</span>`):`<span class="ent-av chat-hav">${esc(typeof entIniciales==='function'?entIniciales(s.nombre):'')}</span>`;
  const ov=document.createElement('div'); ov.id='chat-ov'; ov.className='chat-ov'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-label','Mensajes con '+titulo);
  ov.innerHTML=`<div class="chat-hoja">
    <div class="chat-h">${av}<div class="chat-ht"><b>${esc(titulo)}</b><small>${esc(sub)}</small></div><button type="button" class="chat-x" onclick="chatCerrar()" aria-label="Cerrar">${ico('x')}</button></div>
    <div class="chat-l" id="chat-l" aria-live="polite"><p class="chat-vacio">Cargando…</p></div>
    <form class="chat-f" onsubmit="event.preventDefault();chatEnviar()">
      <textarea id="chat-in" rows="1" maxlength="${CHAT_MAX}" placeholder="Escribe un mensaje" aria-label="Escribe un mensaje" oninput="chatCrecer(this)" onkeydown="if(event.key==='Enter'&&!event.shiftKey&&matchMedia('(pointer:fine)').matches){event.preventDefault();chatEnviar();}"></textarea>
      <button type="submit" class="chat-env" id="chat-env" aria-label="Enviar">${ico('arrow')}</button>
    </form></div>`;
  ov.addEventListener('click',e=>{ if(e.target===ov) chatCerrar(); });
  document.body.appendChild(ov); requestAnimationFrame(()=>ov.classList.add('on'));
  document.addEventListener('keydown',chatEsc);
  const ref=fbDB.ref('/chats/'+code).limitToLast(150);
  chatAbierto={code,ref,quien};
  ref.on('value', sn=>{ chatPintar(sn.val()||{}); chatMarcarLeido(); }, err=>{
    const l=document.getElementById('chat-l'); if(l) l.innerHTML=`<p class="chat-vacio">No se pudieron abrir los mensajes${err&&String(err.code).includes('permission')?': falta publicar las reglas nuevas de Firebase.':'.'}</p>`;
  });
  setTimeout(()=>{ const i=document.getElementById('chat-in'); if(i && matchMedia('(pointer:fine)').matches) i.focus(); },250);
}
function chatEsc(e){ if(e.key==='Escape') chatCerrar(); }
function chatCerrar(){
  document.removeEventListener('keydown',chatEsc);
  if(chatAbierto){ try{ chatAbierto.ref.off(); }catch(e){} chatAbierto=null; }
  const ov=document.getElementById('chat-ov'); if(ov) ov.remove();
}
function chatCrecer(t){ t.style.height='auto'; t.style.height=Math.min(140,t.scrollHeight)+'px'; }
function chatHora(ts){ try{ return new Date(ts).toLocaleTimeString('es-MX',{hour:'numeric',minute:'2-digit'}); }catch(e){ return ''; } }
function chatDia(ts){
  const d=new Date(ts), hoy=new Date(), ayer=new Date(); ayer.setDate(hoy.getDate()-1);
  if(d.toDateString()===hoy.toDateString()) return 'Hoy';
  if(d.toDateString()===ayer.toDateString()) return 'Ayer';
  try{ return d.toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'}); }catch(e){ return fechaISO(d); }
}
function chatPintar(v){
  const l=document.getElementById('chat-l'); if(!l||!chatAbierto) return;
  const msgs=Object.values(v).filter(m=>m&&m.t).sort((a,b)=>(+a.ts||0)-(+b.ts||0));
  if(!msgs.length){
    l.innerHTML=`<p class="chat-vacio">${chatAbierto.quien==='s'?(chatNombreEnt(getSocio(chatAbierto.code))?'Escríbele a tu entrenador: dudas de un ejercicio, si algo te molesta o si no podrás venir.':'Escríbenos tus dudas de la rutina o del reto. El director te responde aquí.'):'Aún no hay mensajes. Escríbele para darle seguimiento.'}</p>`;
    return;
  }
  let dia='', h='';
  msgs.forEach(m=>{
    const dd=chatDia(+m.ts); if(dd!==dia){ dia=dd; h+=`<div class="chat-dia"><span>${esc(dd)}</span></div>`; }
    const mio=m.d===chatAbierto.quien;
    const quien=!mio && m.d==='e' && m.n ? `<em>${esc(m.n)}</em>` : '';
    h+=`<div class="chat-m${mio?' mio':''}">${quien}<p>${esc(m.t)}</p><small>${esc(chatHora(+m.ts))}</small></div>`;
  });
  const abajo=l.scrollHeight-l.scrollTop-l.clientHeight<80;
  l.innerHTML=h;
  if(abajo||!l.dataset.listo){ l.scrollTop=l.scrollHeight; l.dataset.listo='1'; }
}
function chatMarcarLeido(){
  if(!chatAbierto) return;
  const {code,quien}=chatAbierto;
  // El director solo mira las conversaciones de otros entrenadores: no las marca como leídas por ellos
  if(quien==='e' && staffRol==='coordinador'){ const s=getSocio(code); if(s && s.entrenadorId && s.entrenadorId!==staffActivoEntId && getEntrenador(s.entrenadorId)) return; }
  const m=chatMeta[code]||{};
  if(!m.ts || !chatSinLeer(code,quien)) return;
  const s=getSocio(code);
  fbDB.ref('/chatsMeta/'+code).update({[quien==='s'?'ls':'le']:Date.now(), e:(m.e||(s&&s.entrenadorId)||'_dir')}).catch(()=>{});
}
async function chatEnviar(){
  if(!chatAbierto) return;
  const inp=document.getElementById('chat-in'), btn=document.getElementById('chat-env');
  const t=String(inp.value||'').trim().slice(0,CHAT_MAX); if(!t) return;
  if(!navigator.onLine){ showToast('Sin conexión: tu mensaje no se envió.'); return; }
  const {code,quien}=chatAbierto, s=getSocio(code); if(!s) return;
  const ts=Date.now();
  const yo=quien==='s'?(s.nombre||''):(((getEntrenador(staffActivoEntId)||{}).nombre)||(staffRol==='coordinador'?'Director':''));
  const msg={d:quien, t, ts, u:fbUid||'', n:String(yo).split(' ')[0]||''};
  btn.disabled=true;
  try{
    await fbDB.ref('/chats/'+code).push(msg);
    const meta={e:s.entrenadorId||'_dir', ts, d:quien, t:t.slice(0,80)};
    meta[quien==='s'?'ls':'le']=ts;
    await fbDB.ref('/chatsMeta/'+code).update(meta);
    inp.value=''; chatCrecer(inp);
  }catch(e){
    console.warn('chat',e);
    showToast(String(e&&e.code||e).includes('permission')?'No se pudo enviar: falta publicar las reglas nuevas de Firebase.':'No se pudo enviar. Revisa tu conexión.');
  }finally{ btn.disabled=false; }
}

// ── Enganches: escuchar al entrar, pintar en lista, ficha y perfil ──
(function(){
  const envolver=(fn,despues)=>{ if(typeof window[fn]!=='function') return; const o=window[fn]; window[fn]=function(){ const r=o.apply(this,arguments); try{ despues.apply(this,arguments); }catch(e){ console.warn('chat',fn,e); } return r; }; };
  envolver('refreshDash',()=>{ chatEscucharMeta(); chatPintarAvisos(); });
  envolver('dashTab',()=>chatFabPintar());
  envolver('staffRenderList',()=>{ chatEscucharMeta(); chatMarcarLista(); });
  envolver('staffRenderContent',s=>{
    const head=document.querySelector('#staff-content .fx-head'); if(!head||!s) return;
    if(!head.querySelector('.fx-chat')) head.insertAdjacentHTML('beforeend',chatBotonFichaHTML(s));
  });
  envolver('logoutSocio',()=>{ chatCerrar(); chatDetenerMeta(); chatFabPintar(); });
  envolver('staffLogout',()=>{ chatCerrar(); chatDetenerMeta(); });
})();
