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
      <button type="button" onclick="document.getElementById('mis-puntos')?.scrollIntoView({behavior:'smooth',block:'start'})"><b>${pts.toLocaleString('es-MX')}</b><small>puntos</small></button>
      <div><b>${ev.total}</b><small>sesiones</small></div>
      <div><b>${ev.racha}</b><small>${ev.racha===1?'semana':'semanas'} de racha</small></div>
    </div>
    ${fig?`<button type="button" class="cred-fig" onclick="${st?'mascotaAbrir()':"document.getElementById('mi-mascota')?.scrollIntoView({behavior:'smooth'})"}" aria-label="${st?'Ver a '+esc(st.nombre):'Ver mi nivel'}">${fig}</button>`:''}
  </section>`;
}
function perfilListaHTML(s){
  const ent=getEntrenador(s.entrenadorId), pend=s.status==='pendiente', est=typeof membEstado==='function'?membEstado(s).estado:'';
  const st=(!s.mascotaOculta && s.mascota && typeof mascotaEstado==='function')?mascotaEstado(s):null;
  const m=(()=>{ try{ const e=entRutina(s.entrenadorId); return (e&&metLineas(e.filosofia,e,s))||s.metodo; }catch(e){ return null; } })();
  const fila=(on,izq,b,small,der)=>`<button type="button" class="pfl-it" onclick="${on}">${izq}<span class="pfl-t"><b>${b}</b>${small?`<small>${small}</small>`:''}</span>${der||ico('chev')}</button>`;
  const estTxt=pend?'En revisión':(est==='tolerancia'?'Por renovar':'Activa');
  let html=fila(m&&m.tagline?"const d=document.querySelector('#dsec-perfil .pf-met');if(d){d.open=true;d.scrollIntoView({behavior:'smooth',block:'center'})}":"",
    `<span class="pfl-av">${ent?esc(iniciales(ent.nombre)):ico('user')}</span>`,
    ent?esc(tc(ent.nombre)):'Plan del club',
    (ent?'Tu entrenador':'Un entrenador del gym lo revisa')+(m&&m.tagline?' · «'+esc(m.tagline)+'»':''),
    `<span class="pfl-st ${pend?'pend':(est==='tolerancia'?'tol':'ok')}">${estTxt}</span>`);
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
    }catch(e){ console.warn('credencial',e); }
  };
}
