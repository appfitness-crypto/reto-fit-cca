/* ═══ Reto Fit CCA: ficha del socio (panel del staff) ordenada ═══
   Módulo cargado después de los que agregan piezas al encabezado (mensajes, mediciones oficiales, categoría).
   · Encabezado: nombre a lo ancho; estado, categoría, nivel, objetivo y días como etiquetas; número y entrenador en gris.
   · Tres acciones iguales: Mensajes, Mediciones y Entrenador (antes la franja "Pasar a otro").
   · Aviso cuando los días que eligió el socio no coinciden con los días con sesión de su rutina. ═══ */
function fichaOrdenar(s){
  const head=document.querySelector('#staff-content .fx-head'); if(!head||!s||head.dataset.ord) return;
  head.dataset.ord='1';
  const id=head.querySelector('.fx-id'), sub=head.querySelector('.fx-sub'), cod=head.querySelector('.fx-cod');
  const chips=document.createElement('div'); chips.className='fx-chips';
  const est=head.querySelector('.sl-st'); if(est) chips.appendChild(est);
  const cat=head.querySelector('.fx-cat'); if(cat) chips.appendChild(cat);
  [sc(s.nivel),sc(s.objetivo)].filter(Boolean).forEach(t=>{ const c=document.createElement('span'); c.className='fx-chip'; c.textContent=t; chips.appendChild(c); });
  if(s.dias){ const c=document.createElement('span'); c.className='fx-chip'; c.textContent=s.dias+' días'; chips.appendChild(c); }
  const ent=(DB.entrenadores[s.entrenadorId]&&DB.entrenadores[s.entrenadorId].nombre)||'';
  const lin=document.createElement('span'); lin.className='fx-lin'; lin.textContent=[s.id, ent?'entrena con '+tc(ent):'sin entrenador'].filter(Boolean).join(' · ');
  if(sub) sub.remove();
  if(id){ id.appendChild(chips); id.appendChild(lin); }
  // Acciones
  const acc=document.createElement('div'); acc.className='fx-acc';
  const msj=head.querySelector('.fx-chat:not(.fx-ofi)'), ofi=head.querySelector('.fx-ofi'), pasar=document.querySelector('#staff-content .fx-pasar');
  if(msj){ const t=msj.querySelector('span'); if(t) t.innerHTML='Mensajes<small>'+(msj.querySelector('.chat-dot:not([hidden])')?'nuevos':'chat')+'</small>'; acc.appendChild(msj); }
  if(ofi){ const t=ofi.querySelector('span'), n=ofi.querySelector('.ofi-n'); if(t) t.innerHTML='Mediciones<small>'+(n?n.textContent.replace('/',' de '):'')+'</small>'; if(n) n.remove(); acc.appendChild(ofi); }
  if(pasar){ pasar.className='fx-chat fx-ent'; pasar.innerHTML=ico('refresh')+'<span>Entrenador<small>Pasar a otro</small></span>'; acc.appendChild(pasar); }
  if(acc.children.length) head.insertAdjacentElement('afterend',acc);
  // Días elegidos vs días de su rutina
  const conSes=DIAS_ORDER.filter(k=>comoArray(s.rutina&&s.rutina[k]&&s.rutina[k].ejercicios).length).length;
  const dias=parseInt(s.dias)||0;
  if(dias && conSes && conSes<dias && s.status==='activo' && staffRol==='coordinador'){
    acc.insertAdjacentHTML('afterend',`<div class="fx-warn">${ico('warn')}<div><b>Su rutina tiene ${conSes} día${conSes===1?'':'s'} con sesión y eligió ${dias}.</b>Puede ser una rutina de antes de un cambio.${typeof staffRegenerarSistema==='function'?`<button type="button" onclick="staffRegenerarSistema('${esc(s.code)}')">Regenerar con el sistema</button>`:''}</div></div>`);
  }
}
(function(){
  if(typeof staffRenderContent!=='function') return;
  const o=staffRenderContent;
  window.staffRenderContent=staffRenderContent=function(s){ const r=o.apply(this,arguments); try{ fichaOrdenar(s); }catch(e){ console.warn('ficha',e); } return r; };
})();
