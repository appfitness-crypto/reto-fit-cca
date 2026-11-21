/* ═══ Reto Fit CCA: lo del reto que ve el socio ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global).
   · Perfil: tarjeta "Mis puntos del reto" arriba, con los mismos puntos del ranking (js/54-tablero-reto.js):
     constancia (sesiones, semanas cumplidas, mediciones) y progreso según su objetivo. Solo sus propios puntos.
   · Selector de tema del perfil con los tres temas: Claro, Salvia y Oscuro. ═══ */

// Puntos del socio. Antes del arranque del reto no cuenta nada (el tablero del director sí muestra una vista previa).
function socioPuntos(s){
  if(!s || typeof trCalcSocio!=='function') return null;
  const e=typeof retoEstado==='function'?retoEstado():null;
  const P=trPuntos();
  if(e && e.estado==='antes'){
    return {antes:true, e, P, r:{puntos:0, ptsConst:0, ptsProg:0, sesiones:0, semanasOk:0, mediciones:0}, cambio:'—'};
  }
  const r=trCalcSocio(s, trDesde(), P);
  return {antes:false, e, P, r, cambio:trCambioTxt(r)};
}

function socioPuntosHTML(s){
  const x=socioPuntos(s); if(!x) return '';
  const {r,P,e}=x;
  const tot=Math.max(1,r.puntos), pc=r.puntos?Math.round(r.ptsConst/tot*100):0;
  const semanaSes=(()=>{ const ini=inicioSemana(new Date()).getTime(); return sesValidas(s).filter(z=>(z.ts||0)>=ini).length; })();
  const faltan=Math.max(0,3-semanaSes);
  const tip = x.antes ? `Tus puntos empiezan a contar el ${retoFechaTxt(e.inicio)}, cuando arranca el reto (faltan ${e.faltan} días). Mientras, ya puedes entrenar y registrar tus pesos.`
    : e && e.estado==='terminado' ? 'El reto terminó: estos son tus puntos finales.'
    : faltan>0 ? `Te ${faltan===1?'falta 1 sesión':'faltan '+faltan+' sesiones'} esta semana para sumar +${P.semana} por semana cumplida.`
    : `Ya cumpliste la semana. Cada sesión extra suma +${P.sesion}.`;
  return `<div class="pr-pts" id="mis-puntos" aria-label="Mis puntos del reto">
    <div class="pr-pts-h">
      <div><div class="pr-pts-k">Mis puntos del reto</div><div class="pr-pts-v">${r.puntos.toLocaleString('es-MX')}<small>pts</small></div></div>
      <span class="pr-pts-obj">${esc(TR_OBJ_CORTO[s.objetivo]||objNombre(s.objetivo))}</span>
    </div>
    <div class="pr-pts-bar" aria-hidden="true"><i style="width:${pc}%"></i><i style="width:${r.puntos?100-pc:0}%"></i></div>
    <div class="pr-pts-l"><span>Constancia <b>${r.ptsConst.toLocaleString('es-MX')}</b></span><span>Progreso <b>${r.ptsProg.toLocaleString('es-MX')}</b></span></div>
    <div class="pr-pts-rows">
      <div class="pr-pts-row"><span>Sesiones registradas<small>+${P.sesion} cada una, +${P.completa} si la completas</small></span><b>${r.sesiones}</b></div>
      <div class="pr-pts-row"><span>Semanas cumplidas<small>3 o más sesiones · +${P.semana}</small></span><b>${r.semanasOk}</b></div>
      <div class="pr-pts-row"><span>Semanas con medidas<small>registrar peso o medidas en Progreso · +${P.medicion} por semana</small></span><b>${r.mediciones}</b></div>
      <div class="pr-pts-row"><span>Tu cambio<small>según tu objetivo</small></span><b>${esc(x.cambio)}</b></div>
    </div>
    <p class="pr-pts-tip">${esc(tip)}</p>
  </div>`;
}

// Puntos en la tarjeta del reto (arriba de todas las pestañas): sube con animación cuando gana puntos
let _ptsMostrados=null;
function socioPuntosBannerHTML(){
  const x=socioPuntos(activeSocio); if(!x) return '';
  return `<button type="button" class="rb-pts" onclick="dashTab('perfil');setTimeout(()=>document.getElementById('mis-puntos')?.scrollIntoView({behavior:'smooth',block:'start'}),80)" aria-label="Mis puntos: ${x.r.puntos}${x.antes?', aún no cuentan':''}">
    <b id="rb-pts-n">${(_ptsMostrados==null?x.r.puntos:_ptsMostrados).toLocaleString('es-MX')}</b><small>pts</small></button>`;
}
function socioPuntosAnimar(){
  const el=document.getElementById('rb-pts-n'), x=socioPuntos(activeSocio); if(!el||!x) return;
  const de=_ptsMostrados==null?x.r.puntos:_ptsMostrados, a=x.r.puntos; _ptsMostrados=a;
  if(de===a || matchMedia('(prefers-reduced-motion: reduce)').matches){ el.textContent=a.toLocaleString('es-MX'); return; }
  const t0=performance.now(), dur=900; el.parentElement.classList.add('sube');
  (function paso(t){ const p=Math.min(1,(t-t0)/dur); el.textContent=Math.round(de+(a-de)*(1-Math.pow(1-p,3))).toLocaleString('es-MX');
    if(p<1) requestAnimationFrame(paso); else setTimeout(()=>el.parentElement&&el.parentElement.classList.remove('sube'),400); })(t0);
}
// La tarjeta del reto se vuelve a pintar cada vez que cambia el tablero del socio
['refreshDash','dashTab'].forEach(fn=>{
  if(typeof window[fn]!=='function') return;
  const orig=window[fn];
  window[fn]=function(){ const r=orig.apply(this,arguments); try{ if(typeof retoPintar==='function') retoPintar(); }catch(e){} return r; };
});

if(typeof renderPerfilTab==='function'){
  const _rpOrig=renderPerfilTab;
  renderPerfilTab=function(){
    _rpOrig.apply(this,arguments);
    try{
      const h=document.querySelector('#dsec-perfil .pf-h');
      if(h && GYM.reto) h.insertAdjacentHTML('afterend', socioPuntosHTML(activeSocio));
    }catch(e){ console.warn('puntos del reto',e); }
  };
}

// Tres temas en el perfil
temaSegHTML=function(){
  return `<div class="seg2" role="group" aria-label="Tema de color">
    <button type="button" data-t="light" onclick="setTema('light')">${ico('sun')}Claro</button>
    <button type="button" data-t="light2" onclick="setTema('light2')">${ico('spark')}Salvia</button>
    <button type="button" data-t="dark" onclick="setTema('dark')">${ico('moon')}Oscuro</button>
  </div>`;
};
