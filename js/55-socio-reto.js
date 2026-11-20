/* ═══ Reto Fit CCA: lo del reto que ve el socio ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global).
   · Perfil: tarjeta "Mis puntos del reto" arriba, con los mismos puntos del ranking (js/54-tablero-reto.js):
     constancia (sesiones, semanas cumplidas, mediciones) y progreso según su objetivo. Solo sus propios puntos.
   · Selector de tema del perfil con los tres temas: Claro, Salvia y Oscuro. ═══ */

function socioPuntosHTML(s){
  if(!s || typeof trCalcSocio!=='function') return '';
  const P=trPuntos(), r=trCalcSocio(s, trDesde(), P);
  const tot=Math.max(1,r.puntos), pc=Math.round(r.ptsConst/tot*100);
  const e=typeof retoEstado==='function'?retoEstado():null;
  const cambio=trCambioTxt(r);
  const semanaSes=(()=>{ const ini=inicioSemana(new Date()).getTime(); return sesValidas(s).filter(x=>(x.ts||0)>=ini).length; })();
  const faltan=Math.max(0,3-semanaSes);
  const tip = e && e.estado==='terminado' ? 'El reto terminó: estos son tus puntos finales.'
    : faltan>0 ? `Te ${faltan===1?'falta 1 sesión':'faltan '+faltan+' sesiones'} esta semana para sumar +${P.semana} por semana cumplida.`
    : `Ya cumpliste la semana. Cada sesión extra suma +${P.sesion}.`;
  return `<div class="pr-pts" aria-label="Mis puntos del reto">
    <div class="pr-pts-h">
      <div><div class="pr-pts-k">Mis puntos del reto</div><div class="pr-pts-v">${r.puntos.toLocaleString('es-MX')}<small>pts</small></div></div>
      <span class="pr-pts-obj">${esc(TR_OBJ_CORTO[s.objetivo]||objNombre(s.objetivo))}</span>
    </div>
    <div class="pr-pts-bar" aria-hidden="true"><i style="width:${pc}%"></i><i style="width:${100-pc}%"></i></div>
    <div class="pr-pts-l"><span>Constancia <b>${r.ptsConst.toLocaleString('es-MX')}</b></span><span>Progreso <b>${r.ptsProg.toLocaleString('es-MX')}</b></span></div>
    <div class="pr-pts-rows">
      <div class="pr-pts-row"><span>Sesiones registradas<small>+${P.sesion} cada una, +${P.completa} si la completas</small></span><b>${r.sesiones}</b></div>
      <div class="pr-pts-row"><span>Semanas cumplidas<small>3 o más sesiones · +${P.semana}</small></span><b>${r.semanasOk}</b></div>
      <div class="pr-pts-row"><span>Semanas con medidas<small>peso o medidas · +${P.medicion}</small></span><b>${r.mediciones}</b></div>
      <div class="pr-pts-row"><span>Tu cambio<small>según tu objetivo</small></span><b>${esc(cambio)}</b></div>
    </div>
    <p class="pr-pts-tip">${esc(tip)}${e&&e.estado==='antes'?' El reto aún no arranca: por ahora cuenta todo lo que registres.':''}</p>
  </div>`;
}

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
