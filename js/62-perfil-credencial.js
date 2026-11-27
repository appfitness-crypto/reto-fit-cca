/* ═══ Reto Fit CCA: Perfil como credencial del club ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global). Estilos en css/cine.css.
   Arriba del Perfil va una credencial: nombre, número de socio, objetivo, puntos, sesiones, racha y su mascota
   (o su insignia en modo discreto). Debajo, una lista corta: su entrenador y su compañero. Lo que ya estaba
   repetido arriba (encabezado, tarjeta "Mi plan", las tres cifras y la fila de la mascota) se quita. ═══ */

function perfilCredencialHTML(s){
  const ev=calcEvolucion(s), x=typeof socioPuntos==='function'?socioPuntos(s):null;
  const pts=x?x.r.puntos:0;
  const st=(!s.mascotaOculta && s.mascota && typeof mascotaEstado==='function')?mascotaEstado(s):null;
  const nv=(s.mascotaOculta && typeof nivelEstado==='function')?nivelEstado(s):null;
  const fig=st?mascotaImgHTML(st.m, st.etapa.n,'cred-pet'):nv?`<span class="cred-pet">${medallaSVG(nv.etapa.n,120)}</span>`:'';
  const obj=(typeof TR_OBJ_CORTO!=='undefined'&&TR_OBJ_CORTO[s.objetivo])||objNombre(s.objetivo)||'';
  return `<section class="cred" aria-label="Mi credencial del reto">
    <div class="cred-h">${logoMiniHTML()}<span>SOCIO ${esc(s.id||'')}</span></div>
    <h2 class="cred-n">${esc(tc(s.nombre))}</h2>
    ${obj?`<span class="cred-obj">${esc(obj)}</span>`:''}
    <div class="cred-f">
      <button type="button" onclick="${s.mascotaOculta?'':'mascotaAbrir()'}" aria-label="Mis puntos: cómo se ganan"><b>${pts.toLocaleString('es-MX')}</b><small>puntos</small></button>
      <div><b>${ev.total}</b><small>sesiones</small></div>
      <div><b>${ev.racha}</b><small>${ev.racha===1?'semana':'semanas'} de racha</small></div>
    </div>
    ${credLogrosHTML(s,ev)}
    ${fig?`<button type="button" class="cred-fig" onclick="${st?'mascotaAbrir()':"document.getElementById('mi-mascota')?.scrollIntoView({behavior:'smooth'})"}" aria-label="${st?'Ver a '+esc(st.nombre):'Ver mi nivel'}">${fig}</button>`:''}
  </section>`;
}
// Logros dentro de la credencial (los mismos 4 de siempre): encendidos al cumplirse
function credLogrosHTML(s,ev){
  const prsN=Object.keys((s.logs&&s.logs.prs)||{}).length;
  const L=[
    {i:'flame',t:'Constancia',v:ev.racha+' sem',on:ev.racha>=2},
    {i:'dumbbell',t:'Fuerza',v:prsN+' récords',on:prsN>=3},
    {i:'star',t:'Disciplina',v:ev.total+' ses.',on:ev.total>=10},
    {i:'target',t:'Adherencia',v:ev.adherencia+'%',on:ev.adherencia>=80}];
  const n=L.filter(l=>l.on).length;
  return `<div class="cred-lg" role="list" aria-label="Logros: ${n} de 4">${L.map(l=>`<span class="cred-lgi${l.on?' on':''}" role="listitem" aria-label="${l.t}: ${esc(l.v)}${l.on?', logrado':''}"><i>${ico(l.i)}</i><b>${l.t}</b><small>${esc(l.v)}</small></span>`).join('')}</div>`;
}
function perfilListaHTML(s){
  const ent=getEntrenador(s.entrenadorId), pend=s.status==='pendiente', est=typeof membEstado==='function'?membEstado(s).estado:'';
  const st=(!s.mascotaOculta && s.mascota && typeof mascotaEstado==='function')?mascotaEstado(s):null;
  const m=(()=>{ try{ const e=entRutina(s.entrenadorId); return (e&&metLineas(e.filosofia,e,s))||s.metodo; }catch(e){ return null; } })();
  const fila=(on,izq,b,small,der)=>`<button type="button" class="pfl-it" onclick="${on}">${izq}<span class="pfl-t"><b>${b}</b>${small?`<small>${small}</small>`:''}</span>${der||ico('chev')}</button>`;
  const estTxt=pend?'En revisión':(est==='tolerancia'?'Por renovar':'Activa');
  let html=fila(ent&&typeof abrirMetodoSocio==='function'?'abrirMetodoSocio()':'',
    `<span class="pfl-av${ent&&ent.foto?' foto':''}">${ent?(ent.foto?`<img src="${esc(ent.foto)}" alt="" decoding="async">`:esc(iniciales(ent.nombre))):ico('user')}</span>`,
    ent?esc(tc(ent.nombre)):'Plan del club',
    (ent?'Tu entrenador':'Un entrenador del gym lo revisa')+(m&&m.tagline?' · «'+esc(m.tagline)+'»':''),
    `<span class="pfl-st ${pend?'pend':(est==='tolerancia'?'tol':'ok')}">${estTxt}</span>`);
  // Con entrenador: su foto, su nombre y el chat en una sola fila (tocarla abre los mensajes; la foto abre su método)
  const conChat=ent&&ent.rol!=='coordinador'&&typeof chatAbrir==='function'&&s.code;
  if(conChat){
    const nm=esc(tc(ent.nombre));
    const nuevo=typeof chatSinLeer==='function'&&chatSinLeer(s.code,'s');
    html=`<div class="pfl-it pfl-coach">
      <button type="button" class="pfl-coach-av" onclick="abrirMetodoSocio()" aria-label="Ver el método de ${nm}"><span class="pfl-av${ent.foto?' foto':''}">${ent.foto?`<img src="${esc(ent.foto)}" alt="" decoding="async">`:esc(iniciales(ent.nombre))}</span></button>
      <button type="button" class="pfl-coach-b" onclick="chatAbrir('${esc(s.code)}')" aria-label="Escribirle a ${nm}, tu entrenador${nuevo?'. Tienes mensajes nuevos':''}">
        <span class="pfl-t"><b>${nm}</b><small><span class="pfl-st ${pend?'pend':(est==='tolerancia'?'tol':'ok')}">${estTxt}</span>Tu entrenador · Escríbele</small></span>
        <span class="pfl-chat">${ico('chat')}<i class="chat-dot" data-chat-badge="${esc(s.code)}" ${nuevo?'':'hidden'}></i></span>
      </button></div>`;
  } else if(typeof chatFilaPerfilHTML==='function') html+=chatFilaPerfilHTML(s);
  if(st){
    const sub=st.antes?'Empieza a crecer cuando arranque el reto':st.sig?`${st.faltan.toLocaleString('es-MX')} pts para ${esc(st.sig.nm)}`:'Llegó a su forma final';
    html+=fila('mascotaAbrir()',`<span class="pfl-ic">${ico('star')}</span>`,`${esc(st.nombre)} · ${esc(st.etapa.nm)}`,'Mi compañero · '+sub);
  } else if(!s.mascotaOculta && GYM.reto){
    html+=fila('mascotaAbrirSelector(false)',`<span class="pfl-ic">${ico('star')}</span>`,'Elige a tu compañero del reto','Una mascota que evoluciona con tus puntos');
  }
  return `<div class="pfl">${html}</div>`;
}
if(typeof renderPerfilTab==='function'){
  const _rpCred=renderPerfilTab;
  renderPerfilTab=function(){
    _rpCred.apply(this,arguments);
    try{
      const s=activeSocio, sec=document.getElementById('dsec-perfil'); if(!s||!sec) return;
      const h=sec.querySelector('.pf-h'); if(!h) return;
      h.insertAdjacentHTML('beforebegin', perfilCredencialHTML(s)+perfilListaHTML(s));
      // Lo que la credencial y la lista ya muestran
      [h, sec.querySelector('.memb-c'), sec.querySelector('.stats3'), sec.querySelector('.pf-masc'), sec.querySelector('.masc-elige')].forEach(el=>el&&el.remove());
      // Más simple: sin puntos (la credencial y Mi compañero ya los explican), sin logros y sin el método aparte
      const lg=sec.querySelector('.logros'); if(lg){ const t=lg.previousElementSibling; if(t&&t.classList.contains('sec-row')) t.remove(); lg.remove(); }
      [sec.querySelector('#mis-puntos'), sec.querySelector('.pf-met')].forEach(el=>el&&el.remove());
      // Mis datos: solo los que cambian (peso, cintura) y los que la app necesita que llene
      sec.querySelectorAll('.pf-grid>.pf-t').forEach(t=>{ const k=(t.querySelector('.pf-k')||{}).textContent||''; if(/^(Objetivo|Nivel|Frecuencia|Edad)$/.test(k.trim())) t.remove(); });
      // Cerrar sesión como texto, junto a Eliminar mi cuenta
      sec.querySelectorAll('.pf-card').forEach(c=>{ const b=c.querySelector('.pf-row.danger'); if(b && c.children.length===1){ c.replaceWith(Object.assign(document.createElement('button'),{type:'button',className:'pf-salir',textContent:'Cerrar sesión',onclick:()=>logoutSocio()})); } });
      if(s.mascotaOculta){ const n=sec.querySelector('#mi-mascota'); if(n) n.classList.add('pf-nivel-c'); }
    }catch(e){ console.warn('credencial',e); }
  };
}
// El método del entrenador en una hoja (antes era una tarjeta más en el Perfil)
function abrirMetodoSocio(){
  const s=activeSocio; if(!s) return;
  const ent=getEntrenador(s.entrenadorId);
  let m=null; try{ const e=entRutina(s.entrenadorId); m=(e&&metLineas(e.filosofia,e,s))||s.metodo; }catch(e){}
  let ov=document.getElementById('av-ov'); if(ov) ov.remove();
  ov=document.createElement('div'); ov.id='av-ov'; ov.className='av-ov'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-label','Tu entrenador');
  ov.innerHTML=`<div class="av-sheet" tabindex="-1"><span class="av-grab" aria-hidden="true"></span>
    <div class="met-h"><span class="pfl-av${ent&&ent.foto?' foto grande':''}">${ent?(ent.foto?`<img src="${esc(ent.foto)}" alt="Foto de ${esc(tc(ent.nombre))}" decoding="async">`:esc(iniciales(ent.nombre))):ico('user')}</span><div><small>Tu entrenador</small><h2>${ent?esc(tc(ent.nombre)):'Plan del club'}</h2></div></div>
    ${m&&m.tagline?`<p class="met-tag">«${esc(m.tagline)}»</p>`:''}
    ${m&&(m.lineas||[]).length?`<ul class="met-l">${m.lineas.map(l=>`<li>${esc(typeof l==='string'?l:(l.t||l.txt||''))}</li>`).join('')}</ul>`:'<p class="av-msg">Tu entrenador arma tu rutina con su método y la ajusta contigo.</p>'}
    ${ent&&ent.rol!=='coordinador'&&typeof chatAbrir==='function'?`<button type="button" class="sd-pri chat-desde-met" onclick="avisoCerrarHoja();chatAbrir('${esc(s.code)}')">${ico('chat')}Enviarle un mensaje</button>`:''}
    <button type="button" class="av-link" onclick="avisoCerrarHoja()">Cerrar</button></div>`;
  ov.addEventListener('click',e=>{ if(e.target===ov) avisoCerrarHoja(); });
  document.body.appendChild(ov); requestAnimationFrame(()=>ov.classList.add('on')); ov.querySelector('.av-sheet').focus({preventScroll:true});
}
