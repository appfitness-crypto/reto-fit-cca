/* ═══ Reto Fit CCA: permisos de la ficha según las funciones del staff ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global). Estilos en css/plan-nutri.css.
   En "Editar entrenador" se marca qué da cada persona: Entrenamiento, Nutrición o las dos.
   · Entrenamiento → edita la rutina de SUS socios. La nutrición la ve, pero no la cambia.
   · Nutrición     → edita la nutrición (de cualquier socio sin nutriólogo asignado, o de los que tiene asignados).
                     La rutina la ve, pero no la cambia.
   · Las dos       → edita ambas.
   · El director edita todo.
   Las pestañas siguen visibles para todos: lo que no le toca a alguien se muestra en modo solo lectura. ═══ */

function staffYo(){ return (typeof staffActivoEntId!=='undefined'&&staffActivoEntId&&DB.entrenadores)?DB.entrenadores[staffActivoEntId]:null; }
function staffHace(f){ if(staffRol==='coordinador') return true; const e=staffYo(); return !!e&&entHace(e,f); }

// Nutrición: con la función Nutrición, y si el socio tiene nutriólogo asignado, solo ese nutriólogo
window.nutPuedeEditar=nutPuedeEditar=function(s){
  if(!s) return false;
  if(staffRol==='coordinador') return true;
  if(!staffActivoEntId||!staffHace('nutricion')) return false;
  return !s.nutriologoId||s.nutriologoId===staffActivoEntId;
};
// Rutina: con la función Entrenamiento y solo sus propios socios
function rutPuedeEditar(s){
  if(!s) return false;
  if(staffRol==='coordinador') return true;
  if(!staffActivoEntId||!staffHace('entrenamiento')) return false;
  return s.entrenadorId===staffActivoEntId;
}
function permAviso(txt){ return `<div class="perm-ro">${ico('lock')}<span>${txt}</span></div>`; }

(function(){
  // Pestaña Rutina en solo lectura para quien no puede editarla
  if(typeof rtRutinaHTML==='function'){
    const o=rtRutinaHTML;
    window.rtRutinaHTML=rtRutinaHTML=function(s){
      const h=o.apply(this,arguments); if(rutPuedeEditar(s)) return h;
      const quien=!staffHace('entrenamiento')?'Tu perfil es de nutrición: la rutina la ve y la ajusta su entrenador.':'Este socio entrena con otro entrenador: puedes ver su rutina, pero solo su entrenador la cambia.';
      return permAviso('Solo lectura. '+quien)+h.replace('<div class="rt" id="rt-','<div class="rt rt-ro" id="rt-');
    };
  }
  // Pestaña Nutrición: aviso de solo lectura (los botones de edición ya dependen de nutPuedeEditar)
  if(typeof bloqueNutricionStaff==='function'){
    const o=bloqueNutricionStaff;
    window.bloqueNutricionStaff=bloqueNutricionStaff=function(s){
      const h=o.apply(this,arguments); if(!s||nutPuedeEditar(s)) return h;
      const n=s.nutriologoId&&DB.entrenadores[s.nutriologoId];
      const quien=!staffHace('nutricion')?'Tu perfil es de entrenamiento: la nutrición la ajusta el nutriólogo.':'Este socio tiene asignado a '+esc(n?n.nombre:'otro nutriólogo')+': solo esa persona cambia su plan.';
      return permAviso('Solo lectura. '+quien)+h;
    };
  }
  // Candado en las acciones que cambian la rutina (por si alguna se dispara sin el botón)
  const R=['rtAbrir','rtMenuAlt','rtIntercambiar','rtCopiar','rtDescanso','rtSet','rtTexto','rtKg','rtKgTexto','rtDescTodo','rtDuplicar','rtQuitar','rtMover',
    'staffAddEj','staffUpd','staffUpdTipo','staffUpdMetodo','staffUpdMetodoDet','staffUpdAlts','staffEnriquecer','staffDeshacerBase'];
  R.forEach(fn=>{
    if(typeof window[fn]!=='function') return; const o=window[fn];
    window[fn]=function(code){
      // unas reciben el código del socio; las del editor abierto (rtSet, rtTexto, rtKg…) usan rtSel
      const s=(typeof code==='string'&&getSocio(code))||(typeof rtSel!=='undefined'&&rtSel&&getSocio(rtSel.code))||null;
      if(s&&!rutPuedeEditar(s)){ showToast('Solo lectura: la rutina la cambia su entrenador'); return; }
      return o.apply(this,arguments);
    };
  });
  // Candado en las acciones que cambian la nutrición
  ['nutEditarFicha','nutGuardarFicha','nutRestablecer','pnAbrir','maAbrir','nutAbrir'].forEach(fn=>{
    if(typeof window[fn]!=='function') return; const o=window[fn];
    window[fn]=function(code){ const s=code&&getSocio(code); if(s&&!nutPuedeEditar(s)){ showToast('Solo lectura: la nutrición la ajusta el nutriólogo'); return; } return o.apply(this,arguments); };
  });
  // Arrastrar ejercicios: el arrastre empieza con pointerdown sobre .rt-grip; en solo lectura se corta antes
  document.addEventListener('pointerdown',ev=>{ const g=ev.target.closest&&ev.target.closest('.rt-ro .rt-grip'); if(g){ ev.stopImmediatePropagation(); ev.preventDefault(); } },true);
})();
