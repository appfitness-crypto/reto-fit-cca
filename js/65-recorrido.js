/* ═══ Reto Fit CCA: recorrido guiado la primera vez que el socio entra con su rutina ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global). Estilos en css/cine.css.
   · Ilumina cada parte de la app (un "hueco" sobre la pantalla oscurecida) y explica para qué sirve, paso a paso.
   · Sale una sola vez: se anota en el expediente (s.avisosVistos.recorrido) para que no se repita en otro celular.
   · Perfil → Tu cuenta → "Ver el recorrido de la app" lo vuelve a mostrar.
   · Se salta los pasos cuyo elemento no está en pantalla (p. ej. sin compañero o sin mensajes). ═══ */

let rcrPasos=[], rcrI=0, rcrActivo=false, rcrClave='recorrido';

function rcrSocio(){ return typeof activeSocio!=='undefined'?activeSocio:null; }
function rcrDefinirPasos(){
  const s=rcrSocio(); if(!s) return [];
  const nom=tc(String(s.nombre||'').split(' ')[0]||'');
  const ent=s.entrenadorId&&getEntrenador(s.entrenadorId), entN=ent&&ent.rol!=='coordinador'&&ent.nombre?tc(ent.nombre).split(' ')[0]:'';
  const e=typeof retoEstado==='function'?retoEstado():null;
  const P=[
    {t:`¡Bienvenido a tu reto${nom?', '+nom:''}!`, x:'Te mostramos en un minuto dónde está todo. Puedes saltarlo y volver a verlo cuando quieras desde Perfil.', ic:'spark'},
    {sel:'#dsec-inicio .ih-cta', tab:'inicio', t:'Tu entrenamiento de hoy', x:'Toca Iniciar al llegar al gym: la app te guía ejercicio por ejercicio y te sugiere el peso. Si hoy no puedes, muévela a otro día.'},
    {sel:'#dsec-inicio .ih-compa, #dsec-inicio .ih-lv', tab:'inicio', t:'Tu compañero del reto', x:'Crece con tus puntos: cada sesión que registras, tu constancia y tus récords lo hacen evolucionar, de Cría a Leyenda.'},
    {sel:'#dsec-inicio .ih-reto', tab:'inicio', t:'El reto de 12 semanas', x:e&&e.estado==='antes'?`Aquí ves cuánto falta para que arranque (${retoFechaTxt(e.inicio)}) y en qué fase vas.`:'Aquí ves en qué semana y fase del reto vas, y cuándo te toca evaluarte.'},
    {sel:'#dsec-inicio .ih-sem', tab:'inicio', t:'Tu semana', x:'Cada día que entrenas se marca con una palomita. Cumple tus sesiones para sumar semanas de racha.'},
    {sel:'#chat-fab .chat-fab-b', tab:'inicio', t:'Mensajes', x:'Cuando tu entrenador te escribe, aparece esta burbuja. Puedes moverla con el dedo o llevarla a la X para ocultarla.'},
    {sel:'#dtab-rutina', t:'Rutina', x:'Tu plan de la semana. Toca cualquier ejercicio para ver la foto, cómo se hace, el error común y el peso que te toca.'},
    {sel:'#dtab-progreso', t:'Progreso', x:'Tu constancia, tu peso, tus medidas y tus récords. Ahí también puedes borrar una sesión que registraste por error.'},
    {sel:'#dtab-nutricion', t:'Nutrición', x:'Tus calorías y un menú del día con platillos mexicanos. Marca cada comida con la palomita al terminarla.'},
    {sel:'#dtab-perfil', t:'Perfil', x:`Tus datos, tu cintura (con ella se calcula tu % de grasa), tu evaluación inicial y ${entN?'tus mensajes con '+entN:'tus mensajes con el club'}.`},
    {t:'¡Listo para empezar!', x:'Cuando llegues al gym, abre la app y toca Iniciar. Nosotros llevamos la cuenta de tus series, tus pesos y tus puntos.', ic:'flame', fin:true}
  ];
  return P;
}

// Recorrido de la primera sesión de entrenamiento (pantalla del ejercicio)
function rcrPasosSesion(){
  return [
    {t:'Tu primera sesión', x:'Te enseñamos en 30 segundos cómo registrar tu entrenamiento. Lo que anotes hoy sirve para sugerirte el peso la próxima vez.', ic:'dumbbell'},
    {sel:'#en-ses .en-rail', t:'Tus ejercicios de hoy', x:'Aquí ves en cuál vas y cuáles ya terminaste. Toca cualquiera para saltar a él.'},
    {sel:'#en-ses .en-media', t:'Cómo se hace', x:'Toca la imagen o Ver técnica: ves el movimiento, los músculos que trabajas y el error más común.'},
    {sel:'#en-ses .en-cambia', t:'¿Máquina ocupada?', x:'Cámbialo por otro ejercicio parecido, solo por hoy. Tu rutina no se modifica.'},
    {sel:'#en-ses .en-tres', t:'Lo que te toca', x:'Cuántas series, cuántas repeticiones y cuánto descansar entre cada serie.'},
    {sel:'#en-ses .en-data', t:'Lo que te toca', x:'Cuántas rondas o minutos haces y cuánto descansas.'},
    {sel:'#en-ses .en-esp .en-btn', t:'Calentamiento y cardio', x:'Aquí no anotas peso: haz los movimientos y toca este botón cuando termines. En los ejercicios con pesas te enseñamos a anotar tu peso.'},
    {sel:'#en-ses .en-steps', serie:1, t:'Anota tu peso y tus repeticiones', x:'Usa + y – o escribe el número. Si es tu primera vez, elige un peso con el que llegues a las repeticiones sin perder la forma.'},
    {sel:'#en-ses .en-lista', t:'Terminé la serie', x:'Tócalo al acabar cada serie: se guarda y arranca solo el cronómetro de descanso.'},
    {sel:'#en-ses .en-next', t:'Lo que sigue', x:'Cuando acabes las series, pasa al siguiente ejercicio desde aquí.'},
    {sel:'#en-ses .en-s-top .en-btn-sm', t:'Terminar', x:'Al final toca Terminar: se guarda tu sesión y sumas puntos. Si sales con la flecha, lo que llevas no se pierde.'},
    {t:'¡A entrenar!', x:'Si algo no te queda claro, pregúntale a tu entrenador en Mensajes.', ic:'flame', fin:true}
  ];
}
function rcrTocaSesion(){
  const s=rcrSocio();
  if(!s || rcrActivo) return false;
  let forzar=false; try{ forzar=localStorage.getItem('rcr_forzarSes')==='1'; }catch(e){}
  if(!forzar){
    if((s.avisosVistos||{}).recorridoSes) return false;
    try{ if(localStorage.getItem('rcr_recorridoSes_'+s.code)) return false; }catch(e){}
  }
  if(typeof vistaSocioActiva==='function' && vistaSocioActiva()) return false;
  const sc=document.getElementById('s-ses'); if(!sc || !sc.classList.contains('on')) return false;
  if(!document.querySelector('#en-ses .en-ex')) return false;   // ya en el ejercicio (no en la introducción)
  if(document.querySelector('.modal.open, #av-ov, #chat-ov, .en-f.on, dialog[open]')) return false;
  return true;
}
function rcrPasosSerie(){
  return [
    {sel:'#en-ses .en-steps', t:'Tu primer ejercicio con peso', x:'Anota el peso que usaste y tus repeticiones con + y –, o escribe el número. Si es tu primera vez, elige un peso con el que llegues a las repeticiones sin perder la forma.'},
    {sel:'#en-ses .en-lista', t:'Terminé la serie', x:'Tócalo al acabar cada serie: se guarda y arranca solo el cronómetro de descanso. La próxima vez la app te sugiere el peso.', fin:true}
  ];
}
function rcrTocaSerie(){
  const s=rcrSocio();
  if(!s || rcrActivo || (s.avisosVistos||{}).recorridoSerie) return false;
  try{ if(localStorage.getItem('rcr_recorridoSerie_'+s.code)) return false; }catch(e){}
  if(!(s.avisosVistos||{}).recorridoSes) return false;   // primero el recorrido de la sesión
  if(typeof vistaSocioActiva==='function' && vistaSocioActiva()) return false;
  const sc=document.getElementById('s-ses'); if(!sc || !sc.classList.contains('on')) return false;
  if(!document.querySelector('#en-ses .en-steps')) return false;
  if(document.querySelector('.modal.open, #av-ov, #chat-ov, .en-f.on, dialog[open]')) return false;
  return true;
}
let rcrTimerSes=null;
function rcrIntentarSesion(){ clearTimeout(rcrTimerSes); rcrTimerSes=setTimeout(()=>{ if(rcrTocaSerie()){ rcrIniciar('recorridoSerie'); return; } if(rcrTocaSesion()){ try{ localStorage.removeItem('rcr_forzarSes'); }catch(e){} rcrIniciar('recorridoSes'); } },900); }
function rcrSesionOtraVez(){ const so=rcrSocio(); try{ localStorage.setItem('rcr_forzarSes','1'); if(so) localStorage.removeItem('rcr_recorridoSerie_'+so.code); }catch(e){} if(so&&so.avisosVistos){ delete so.avisosVistos.recorridoSerie; } showToast('Listo: te lo mostramos la próxima vez que inicies un entrenamiento.'); }

// ¿Toca mostrarlo? Primera vez, con rutina, en Inicio y sin otra ventana encima
function rcrToca(){
  const s=rcrSocio();
  if(!s || rcrActivo || !s.rutina) return false;
  if((s.avisosVistos||{}).recorrido) return false;
  try{ if(localStorage.getItem('rcr_visto_'+s.code)) return false; }catch(e){}
  if(typeof vistaSocioActiva==='function' && vistaSocioActiva()) return false;
  const sd=document.getElementById('s-dash'); if(!sd || !sd.classList.contains('on') || sd.dataset.tab!=='inicio') return false;
  if(document.querySelector('.modal.open, #av-ov, #masc-sel, #chat-ov, .masc-ov')) return false;
  return true;
}
let rcrTimer=null;
function rcrIntentar(){ clearTimeout(rcrTimer); rcrTimer=setTimeout(()=>{ if(rcrToca()) rcrIniciar(); },1400); }

function rcrIniciar(clave){
  rcrClave=clave||'recorrido';
  rcrPasos=rcrClave==='recorridoSes'?rcrPasosSesion():rcrClave==='recorridoSerie'?rcrPasosSerie():rcrDefinirPasos(); rcrI=0; rcrActivo=true;
  let ov=document.getElementById('rcr'); if(ov) ov.remove();
  ov=document.createElement('div'); ov.id='rcr'; ov.className='rcr'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-labelledby','rcr-t');
  ov.innerHTML=`<div class="rcr-hueco" id="rcr-hueco"></div>
    <div class="rcr-card" id="rcr-card" tabindex="-1">
      <div class="rcr-ic" id="rcr-ic"></div>
      <h2 id="rcr-t"></h2><p id="rcr-x"></p>
      <div class="rcr-pie"><span class="rcr-pts" id="rcr-pts" aria-hidden="true"></span>
        <div class="rcr-bts"><button type="button" class="rcr-saltar" id="rcr-saltar" onclick="rcrTerminar()">Saltar</button>
        <button type="button" class="rcr-atras" id="rcr-atras" onclick="rcrIr(-1)" aria-label="Anterior">${ico('chevl')}</button>
        <button type="button" class="rcr-sig" id="rcr-sig" onclick="rcrIr(1)">Siguiente</button></div></div>
    </div>`;
  ov.addEventListener('click',e=>{ if(e.target===ov||e.target.id==='rcr-hueco') rcrIr(1); });
  document.body.appendChild(ov);
  document.addEventListener('keydown',rcrTecla);
  window.addEventListener('resize',rcrColocar);
  requestAnimationFrame(()=>{ ov.classList.add('on'); rcrMostrar(); });
}
function rcrTecla(e){ if(e.key==='Escape') rcrTerminar(); else if(e.key==='ArrowRight') rcrIr(1); else if(e.key==='ArrowLeft') rcrIr(-1); }
function rcrElemento(p){ if(!p||!p.sel) return null; const el=document.querySelector(p.sel); if(!el) return null; const r=el.getBoundingClientRect(); return (r.width&&r.height&&getComputedStyle(el).visibility!=='hidden')?el:null; }
function rcrIr(d){
  let i=rcrI+d;
  // Saltar pasos cuyo elemento no existe (sin compañero, sin mensajes…)
  while(i>0 && i<rcrPasos.length-1 && rcrPasos[i].sel && !rcrElemento(rcrPasos[i])){
    if(rcrPasos[i].tab && typeof dashTab==='function' && document.getElementById('s-dash').dataset.tab!==rcrPasos[i].tab){ dashTab(rcrPasos[i].tab); if(rcrElemento(rcrPasos[i])) break; }
    i+=d;
  }
  if(i<0) return;
  if(i>=rcrPasos.length) return rcrTerminar();
  rcrI=i; rcrMostrar();
}
function rcrMostrar(){
  const p=rcrPasos[rcrI]; if(!p) return;
  if(p.serie && rcrElemento(p)){ const so=rcrSocio(); if(so){ so.avisosVistos=Object.assign({},so.avisosVistos,{recorridoSerie:fechaISO(new Date())}); } }
  if(p.tab && document.getElementById('s-dash').dataset.tab!==p.tab && typeof dashTab==='function') dashTab(p.tab);
  const el=rcrElemento(p);
  document.getElementById('rcr-t').textContent=p.t;
  document.getElementById('rcr-x').textContent=p.x;
  const ic=document.getElementById('rcr-ic'); ic.innerHTML=p.ic?ico(p.ic):''; ic.hidden=!p.ic;
  // Puntos: solo los pasos que se van a ver
  const visibles=rcrPasos.map((q,k)=>k).filter(k=>!rcrPasos[k].sel||rcrElemento(rcrPasos[k])||rcrPasos[k].tab);
  const pos=visibles.indexOf(rcrI);
  document.getElementById('rcr-pts').innerHTML=`<span class="rcr-bar"><i style="width:${Math.round((pos+1)/visibles.length*100)}%"></i></span>${pos+1} de ${visibles.length}`;
  document.getElementById('rcr-sig').textContent=p.fin?'Empezar':(rcrI===0&&!p.sel)?'Empezar recorrido':'Siguiente';
  document.getElementById('rcr-saltar').hidden=!!p.fin;
  document.getElementById('rcr-atras').hidden=rcrI===0;
  const ov=document.getElementById('rcr'); ov.classList.toggle('centro',!el);
  if(el && !el.closest('.bnav')){
    const r=el.getBoundingClientRect();
    if(r.top<70 || r.bottom>window.innerHeight-260) el.scrollIntoView({block:'center',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  }
  clearTimeout(rcrMostrar._t); rcrMostrar._t=setTimeout(rcrColocar, el?320:0);
  rcrColocar();
  setTimeout(()=>{ const b=document.getElementById('rcr-sig'); if(b) b.focus({preventScroll:true}); },60);
}
// Coloca el hueco sobre el elemento y la tarjeta arriba o abajo de él
function rcrColocar(){
  const p=rcrPasos[rcrI], h=document.getElementById('rcr-hueco'), c=document.getElementById('rcr-card'); if(!p||!h||!c) return;
  const el=rcrElemento(p), W=window.innerWidth, H=window.innerHeight;
  if(!el){ h.style.cssText='left:50%;top:50%;width:0;height:0;'; c.style.cssText=''; return; }
  const r=el.getBoundingClientRect(), m=8, rad=Math.min(28,Math.max(14,Math.min(r.width,r.height)/2));
  h.style.cssText=`left:${r.left-m}px;top:${r.top-m}px;width:${r.width+m*2}px;height:${r.height+m*2}px;border-radius:${rad}px;`;
  const cw=Math.min(380,W-32), ch=c.offsetHeight||180;
  let left=Math.max(16,Math.min(W-cw-16,r.left+r.width/2-cw/2));
  let top=(r.top-m-ch-14>=16 && (r.top>H/2 || r.bottom+m+ch+14>H-16)) ? r.top-m-ch-14 : r.bottom+m+14;
  if(top+ch>H-16) top=Math.max(16,H-ch-16);
  c.style.cssText=`left:${left}px;top:${top}px;width:${cw}px;`;
}
function rcrTerminar(){
  rcrActivo=false;
  document.removeEventListener('keydown',rcrTecla); window.removeEventListener('resize',rcrColocar);
  const ov=document.getElementById('rcr'); if(ov){ ov.classList.remove('on'); setTimeout(()=>ov.remove(),220); }
  const s=rcrSocio(); if(!s) return;
  const k=rcrClave;
  try{ localStorage.setItem((k==='recorrido'?'rcr_visto_':'rcr_'+k+'_')+s.code,'1'); }catch(e){}
  if(!(s.avisosVistos||{})[k] && !(typeof vistaSocioActiva==='function' && vistaSocioActiva())){
    s.avisosVistos=Object.assign({},s.avisosVistos,{[k]:fechaISO(new Date())}); dbSave(s.code);
  }
  if(k!=='recorrido') return;   // en la sesión se queda donde está
  if(typeof dashTab==='function' && document.getElementById('s-dash').dataset.tab!=='inicio') dashTab('inicio');
  window.scrollTo({top:0,behavior:'auto'});
}
function rcrVerDeNuevo(){
  if(typeof dashTab==='function') dashTab('inicio');
  window.scrollTo({top:0,behavior:'auto'});
  setTimeout(rcrIniciar,350);
}

// ── Enganches ──
(function(){
  if(typeof go==='function'){ const g=go; window.go=go=function(id){ const r=g.apply(this,arguments); if(id==='s-dash') try{ rcrIntentar(); }catch(e){} return r; }; }
  if(typeof renderSes==='function'){ const o=renderSes; window.renderSes=renderSes=function(){ const r=o.apply(this,arguments); try{ if(rcrActivo&&rcrClave==='recorridoSes') setTimeout(rcrColocar,30); else rcrIntentarSesion(); }catch(e){} return r; }; }
  if(typeof refreshDash==='function'){ const o=refreshDash; window.refreshDash=refreshDash=function(){ const r=o.apply(this,arguments); try{ rcrIntentar(); }catch(e){} return r; }; }
  if(typeof renderPerfilTab==='function'){
    const o=renderPerfilTab;
    window.renderPerfilTab=renderPerfilTab=function(){
      const r=o.apply(this,arguments);
      try{
        const sec=document.getElementById('dsec-perfil'); if(!sec || sec.querySelector('.rcr-fila')) return r;
        const card=[...sec.querySelectorAll('.pf-card')].find(c=>c.querySelector('.pf-tema'))||sec.querySelector('.pf-card');
        if(card) card.insertAdjacentHTML('afterbegin',`<button type="button" class="pf-row rcr-fila" onclick="rcrVerDeNuevo()">${it('spark','sm')}<span class="pf-row-t">Ver el recorrido de la app</span>${ico('chev')}</button><button type="button" class="pf-row rcr-fila-ses" onclick="rcrSesionOtraVez()">${it('dumbbell','sm')}<span class="pf-row-t">Ver cómo registrar una sesión</span>${ico('chev')}</button>`);
      }catch(e){}
      return r;
    };
  }
})();
