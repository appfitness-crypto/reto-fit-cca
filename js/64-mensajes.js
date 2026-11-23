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
  // Oculta por el socio: vuelve sola cuando su entrenador le escribe algo nuevo
  const pref=chatFabPref();
  if(pref.oculto && !(nuevo && +m.ts>+pref.oculto)){ if(fab) fab.remove(); return; }
  const quien=e?tc(e.nombre).split(' ')[0]:'El club';
  const av=e&&typeof entAvatarHTML==='function'?entAvatarHTML(e,'ent-av chat-fab-av'):`<span class="ent-av chat-fab-av">${ico('chat')}</span>`;
  const clave=[nuevo,m.ts,quien].join('|');
  if(fab && fab.dataset.k===clave) return;
  if(!fab){ fab=document.createElement('div'); fab.id='chat-fab'; fab.className='chat-fab'; sd.appendChild(fab); }
  fab.dataset.k=clave;
  fab.classList.toggle('nuevo',nuevo);
  fab.innerHTML=`${nuevo&&m.d==='e'&&m.t?`<button type="button" class="chat-fab-msg" onclick="chatAbrir('${esc(s.code)}')"><b>${esc(quien)}</b><span>${esc(m.t)}</span></button>`:''}
    <button type="button" class="chat-fab-b" onclick="if(!chatFabArrastro)chatAbrir('${esc(s.code)}')" aria-label="${nuevo?esc(quien)+' te respondió. Abrir mensajes':'Abrir mensajes con '+esc(quien)}. Mantén y arrastra para moverla o llévala a la X para ocultarla.">${av}<i class="chat-fab-ic">${ico('chat')}</i>${nuevo?'<i class="chat-fab-dot" aria-hidden="true"></i>':''}</button>`;
  chatFabColocar(fab);
  chatFabArrastre(fab);
}
// ── Burbuja movible: el socio la arrastra a donde quiera (se recuerda) o a la X para ocultarla ──
const CHAT_FAB_LS='chat_fab_v1';
let chatFabArrastro=false;
function chatFabPref(){ try{ return JSON.parse(localStorage.getItem(CHAT_FAB_LS))||{}; }catch(e){ return {}; } }
function chatFabGuardar(p){ try{ localStorage.setItem(CHAT_FAB_LS,JSON.stringify(Object.assign(chatFabPref(),p))); }catch(e){} }
function chatFabColocar(fab){
  const p=chatFabPref();
  fab.classList.toggle('izq',p.lado==='izq');
  if(p.y==null){ fab.style.top=fab.style.left=fab.style.right=fab.style.bottom=''; return; }
  const h=window.innerHeight, y=Math.max(80,Math.min(h-190,p.y*h));   // y = arriba del botón
  const b=fab.querySelector('.chat-fab-b'), extra=b?Math.max(0,fab.offsetHeight-b.offsetHeight):0;   // el globo va encima
  fab.style.bottom='auto'; fab.style.top=Math.max(8,y-extra)+'px';
  if(p.lado==='izq'){ fab.style.left='16px'; fab.style.right='auto'; } else { fab.style.right='16px'; fab.style.left='auto'; }
}
function chatFabArrastre(fab){
  const b=fab.querySelector('.chat-fab-b'); if(!b || b.dataset.arr) return; b.dataset.arr='1';
  let ini=null, x0=0, y0=0, moviendo=false;
  const zona=()=>{ let z=document.getElementById('chat-fab-x'); if(!z){ z=document.createElement('div'); z.id='chat-fab-x'; z.className='chat-fab-x'; z.innerHTML=ico('x')+'<span>Ocultar</span>'; document.body.appendChild(z); } return z; };
  const sobreX=(cx,cy)=>{ const z=document.getElementById('chat-fab-x'); if(!z) return false; const r=z.getBoundingClientRect(); return Math.hypot(cx-(r.left+r.width/2),cy-(r.top+r.height/2))<70; };
  b.addEventListener('pointerdown',ev=>{
    if(ev.button>0) return;
    ev.preventDefault();   // sin selección de texto ni arrastre nativo (cancelaba el movimiento)
    const r=fab.getBoundingClientRect(); ini={x:ev.clientX,y:ev.clientY,l:r.left,t:r.top}; moviendo=false; chatFabArrastro=false;
    try{ b.setPointerCapture(ev.pointerId); }catch(e){}
  });
  b.addEventListener('pointermove',ev=>{
    if(!ini) return;
    const dx=ev.clientX-ini.x, dy=ev.clientY-ini.y;
    if(!moviendo && Math.hypot(dx,dy)<8) return;
    if(!moviendo){
      moviendo=true; chatFabArrastro=true; fab.classList.add('arrastrando'); zona().classList.add('on');
      const r=b.getBoundingClientRect(); ini.l=r.left; ini.t=r.top;   // sin el globo, la caja es solo el botón
    }
    const bw=b.offsetWidth, bh=b.offsetHeight;
    x0=Math.max(4,Math.min(window.innerWidth-bw-4,ini.l+dx));
    y0=Math.max(8,Math.min(window.innerHeight-bh-8,ini.t+dy));
    fab.style.left=x0+'px'; fab.style.top=y0+'px'; fab.style.right='auto'; fab.style.bottom='auto';
    const bb=b.getBoundingClientRect(), z=document.getElementById('chat-fab-x');
    if(z) z.classList.toggle('cerca',sobreX(bb.left+bb.width/2,bb.top+bb.height/2));
  });
  const fin=ev=>{
    if(!ini) return; ini=null;
    const z=document.getElementById('chat-fab-x');
    if(!moviendo){ if(z) z.remove(); return; }
    const bb=b.getBoundingClientRect(), cx=bb.left+bb.width/2, cy=bb.top+bb.height/2;
    fab.classList.remove('arrastrando');
    if(z && sobreX(cx,cy)){
      z.remove();
      const s=typeof activeSocio!=='undefined'?activeSocio:null, m=s&&chatMeta[s.code];
      chatFabGuardar({oculto:(m&&+m.ts)||Date.now()});
      fab.classList.add('saliendo'); setTimeout(()=>chatFabPintar(),220);
      showToast('Burbuja oculta. Tus mensajes siguen en Perfil y vuelve cuando te escriban.');
    } else {
      if(z) z.remove();
      chatFabGuardar({lado:cx<window.innerWidth/2?'izq':'der', y:bb.top/window.innerHeight});
      fab.classList.add('acomodando'); chatFabColocar(fab); setTimeout(()=>fab.classList.remove('acomodando'),300);
    }
    setTimeout(()=>{ chatFabArrastro=false; },60);
  };
  b.addEventListener('pointerup',fin); b.addEventListener('pointercancel',fin);
  b.addEventListener('dragstart',ev=>ev.preventDefault());
}
window.addEventListener('resize',()=>{ const f=document.getElementById('chat-fab'); if(f) chatFabColocar(f); });
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
