/* ═══ Reto Fit CCA: portada y fin de sesión "cine" ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global). Estilos en css/cine.css.
   · Portada: la persona recortada (img/hero/bienvenida-recorte.webp) va encima del número de semanas del reto.
     El recorte solo coincide con la foto original: si el director sube otra foto de portada (Apariencia),
     se quitan el número y el recorte y queda la foto sola.
   · Una sola entrada animada por pantalla, y nada si el teléfono pide menos movimiento.
   · cineContar(): números que cuentan hacia arriba (lo usa el fin de sesión de js/38-entreno.js). ═══ */

const CINE_POCO_MOV = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

function cineReproducir(el){
  if(!el) return;
  el.classList.remove('cine-play'); void el.offsetWidth; el.classList.add('cine-play');
}

// ¿La foto de portada es la original? (Apariencia guarda las fotos propias en window.IMG_DATA)
function cinePortadaOriginal(){
  const D=window.IMG_DATA;
  return !(D && D.k && (D.k['hero/bienvenida.webp']!=null || D.k['hero/bienvenida.jpg']!=null));
}

function cinePortada(){
  const sc=document.getElementById('s-inicio'); if(!sc) return;
  const n=document.getElementById('wc-num');
  if(n){ const sem=(typeof GYM!=='undefined' && GYM.reto && +GYM.reto.semanas) || 12; n.textContent=sem; }
  sc.classList.toggle('con-recorte', cinePortadaOriginal() && !!document.getElementById('wc-cut'));
}

// Números que cuentan hacia arriba: <b data-count="40" data-from="0" data-delay="200">40</b>
function cineContar(raiz){
  if(!raiz) return;
  const fmt=v=>Math.round(v).toLocaleString('es-MX');
  raiz.querySelectorAll('[data-count]').forEach(el=>{
    const a=+el.dataset.count, de=+(el.dataset.from||0), espera=+(el.dataset.delay||0), dur=1100;
    if(CINE_POCO_MOV() || !(a>de)){ el.textContent=fmt(a); return; }
    el.textContent=fmt(de);
    const t0=performance.now()+espera;
    const paso=t=>{
      const k=Math.min(1,Math.max(0,(t-t0)/dur)), e=k===1?1:1-Math.pow(2,-10*k);
      el.textContent=fmt(de+(a-de)*e);
      if(k<1 && el.isConnected) requestAnimationFrame(paso);
    };
    requestAnimationFrame(paso);
  });
}

// Al aplicar una apariencia nueva (otra foto de portada) se revisa si el recorte sigue sirviendo
if(typeof aparAplicar==='function'){
  const _aparAplicar=aparAplicar;
  window.aparAplicar=aparAplicar=function(){ const r=_aparAplicar.apply(this,arguments); try{ cinePortada(); }catch(_){} return r; };
}
// Cada vez que se vuelve a la portada, la entrada se repite
if(typeof go==='function'){
  const _go=go;
  window.go=go=function(id){ const r=_go.apply(this,arguments); if(id==='s-inicio'){ cinePortada(); cineReproducir(document.getElementById('s-inicio')); } return r; };
}

(function cineArranque(){
  const ir=()=>{
    cinePortada();
    const sc=document.getElementById('s-inicio');
    if(!sc || !sc.classList.contains('on')) return;
    const img=sc.querySelector('.wc-cut');
    let hecho=false;
    const listo=()=>{ if(hecho) return; hecho=true; requestAnimationFrame(()=>cineReproducir(sc)); };
    if(img && !img.complete){ img.addEventListener('load',listo,{once:true}); img.addEventListener('error',listo,{once:true}); setTimeout(listo,900); }
    else listo();
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ir,{once:true}); else ir();
})();

/* ── Letra gigante: cada línea con data-fit="0.74" se ajusta a esa fracción del ancho de su caja ── */
function cineAjustar(raiz){
  (raiz||document).querySelectorAll('[data-fit]').forEach(el=>{
    const caja=el.closest('.ci-title,.ms-name,.rt-title'); if(!caja || !caja.clientWidth) return;
    el.style.fontSize='100px';
    const w=el.getBoundingClientRect().width; if(!w) return;
    el.style.fontSize=Math.min(220,100*caja.clientWidth*parseFloat(el.dataset.fit)/w).toFixed(1)+'px';
  });
}
function cineTrasFuentes(fn){ (document.fonts&&document.fonts.ready?document.fonts.ready:Promise.resolve()).then(fn); }

/* ═══ INICIO ═══ El socio recortado (img/hero/inicio-recorte.webp) solo sirve con la foto original del panel */
function cineInicio(){
  const sc=document.getElementById('ci-scene'); if(!sc) return;
  const D=window.IMG_DATA;
  const propia=!!(D && D.k && (D.k['hero/inicio.webp']!=null || D.k['hero/inicio.jpg']!=null));
  sc.classList.toggle('con-recorte', !propia && !!sc.querySelector('.ci-cut'));
  cineAjustar(sc);
  cineTrasFuentes(()=>{ cineAjustar(sc); cineReproducir(sc); });
  cineContar(sc);
}
// Al bajar, el título se mueve más lento que la foto (profundidad)
(function(){
  let raf=0;
  addEventListener('scroll',()=>{
    if(raf) return;
    raf=requestAnimationFrame(()=>{ raf=0;
      const sc=document.getElementById('ci-scene'); if(!sc || CINE_POCO_MOV()) return;
      sc.style.setProperty('--sy', Math.max(0,Math.min(scrollY,600)));
    });
  },{passive:true});
  let rt=0; addEventListener('resize',()=>{ clearTimeout(rt); rt=setTimeout(()=>{ cineAjustar(document.getElementById('ci-scene')); cineAjustar(document.getElementById('ms-w')); },120); });
})();

/* ═══ MASCOTA ═══ Pantalla propia: nombre gigante detrás, la mascota en su luz y las etapas que faltan en silueta */
function mascotaInicioHTML(s){
  if(s && s.mascotaOculta) return '';   // modo discreto: medalla en vez de mascota
  const st=typeof mascotaEstado==='function'?mascotaEstado(s):null; if(!st) return '';
  const sub=st.antes?'Empieza a crecer cuando arranque el reto'
    : st.sig?`Te faltan ${st.faltan.toLocaleString('es-MX')} pts para ${esc(st.sig.nm)}`:'Llegó a su forma final';
  return `<button type="button" class="ci-masc" onclick="mascotaAbrir()">${mascotaImgHTML(st.m, st.etapa.n)}
    <span class="t"><b>${esc(st.nombre)} va en ${esc(st.etapa.nm)}</b><small>${sub}</small>${st.sig?`<span class="ci-bar"><i style="width:${Math.max(3,st.pct)}%"></i></span>`:''}</span>${ico('chev')}</button>`;
}

let _msOrigen='inicio';
function mascotaAbrir(){
  const s=activeSocio, w=document.getElementById('ms-w'); if(!s||!w) return;
  if(s.mascotaOculta){ dashTab('perfil'); return; }
  const st=mascotaEstado(s);
  if(!st){ mascotaAbrirSelector(false); return; }
  const tabOn=document.querySelector('.dash-section.on'); _msOrigen=tabOn?tabOn.id.replace('dsec-',''):'inicio';
  const E=mascotaEtapas(), P=typeof trPuntos==='function'?trPuntos():{sesion:30,completa:10,semana:60,medicion:20};
  const pts=st.pts.toLocaleString('es-MX');
  const msg = st.antes ? `Tu ${esc(st.m.nm.toLowerCase())} empieza a crecer cuando arranque el reto.`
    : st.cansada ? `${esc(st.nombre)} te extraña: llevas ${st.dias} días sin entrenar. Una sesión hoy lo anima.` : '';
  w.innerHTML=`
    <div class="ms-top"><button type="button" class="ms-back" onclick="mascotaCerrar()" aria-label="Volver">${ico('chevl')}</button><span class="ms-tt">Mi compañero</span><span class="ms-pts"><b>${pts}</b> pts</span></div>
    <div class="ms-stage">
      <p class="ms-name" aria-hidden="true"><span data-fit="0.9">${esc(st.nombre)}</span></p>
      <div class="ms-light"></div><div class="ms-ring"></div><div class="ms-sh"></div>
      <div class="ms-bubble" id="ms-bubble">${esc(st.m.frase)}</div>
      <button type="button" class="ms-pet${st.cansada?' cansada':''}" id="ms-pet" onclick="mascotaSaltar()" aria-label="${esc(st.nombre)}, ${esc(st.m.nm)} en etapa ${esc(st.etapa.nm)}. Tócalo para que salte.">${mascotaImgHTML(st.m, st.etapa.n)}</button>
    </div>
    <div class="ms-body">
      <h1>${esc(st.etapa.nm)}</h1>
      <p class="ms-meta"><b>${esc(st.nombre)}</b> · ${esc(st.m.nm.toLowerCase())} · etapa ${st.etapa.n} de 5</p>
      <p class="ms-frase">“${esc(st.m.frase)}”</p>
      ${msg?`<p class="ms-msg">${msg}</p>`:''}
      <div class="ms-prog">
        ${st.sig?`<div class="ms-row"><b>${pts} <small>/ ${st.sig.pts.toLocaleString('es-MX')} pts</small></b><span>Te faltan ${st.faltan.toLocaleString('es-MX')} para ${esc(st.sig.nm)}</span></div>
        <div class="ms-bar"><i style="width:${Math.max(2,st.pct)}%"></i></div>`:`<div class="ms-row"><b>${pts} <small>pts</small></b><span>¡Llegó a su forma final!</span></div>`}
      </div>
      <div class="ms-evo" role="group" aria-label="Etapas de ${esc(st.nombre)}">${E.map((e,i)=>{
        const lk=e.n>st.etapa.n, now=e.n===st.etapa.n;
        const tip=now?`${e.nm} · su etapa actual`:lk?`${e.nm} · se desbloquea con ${e.pts.toLocaleString('es-MX')} pts`:`${e.nm} · lo lograste${e.pts?' con '+e.pts.toLocaleString('es-MX')+' pts':''}`;
        return `<button type="button" class="${lk?'lk':''}${now?' now':''}" style="--i:${i}" data-tip="${esc(tip)}" onclick="document.getElementById('ms-tip').textContent=this.dataset.tip">${mascotaImgHTML(st.m, e.n)}${lk?ico('lock'):''}<span>${esc(e.nm)}</span><small>${e.pts.toLocaleString('es-MX')}</small></button>`;
      }).join('')}</div>
      <p class="ms-tip" id="ms-tip" aria-live="polite">Toca una etapa para ver cuándo se desbloquea.</p>
      <section class="ms-earn"><h2>Cómo gana puntos ${esc(st.nombre)}</h2><ul>
        <li><span>Cada sesión registrada</span><b>+${P.sesion}</b></li>
        <li><span>Si la completas entera</span><b>+${P.completa}</b></li>
        <li><span>Semana con 3 o más sesiones</span><b>+${P.semana}</b></li>
        <li><span>Semana con peso o medidas</span><b>+${P.medicion}</b></li>
      </ul><p class="ms-nota">También suma tu progreso según tu objetivo.</p></section>
      <button type="button" class="ms-cambiar" onclick="mascotaAbrirSelector(true)">Cambiar nombre o mascota</button>
    </div>`;
  go('s-mascota');
  cineAjustar(w);
  cineTrasFuentes(()=>{ cineAjustar(w); cineReproducir(w); });
}
function mascotaCerrar(){ go('s-dash'); dashTab(_msOrigen||'inicio'); }
let _msBt=0;
function mascotaSaltar(){
  const p=document.getElementById('ms-pet'), b=document.getElementById('ms-bubble'); if(!p) return;
  p.classList.remove('hop'); void p.offsetWidth; p.classList.add('hop');
  if(b){ b.classList.add('on'); clearTimeout(_msBt); _msBt=setTimeout(()=>b.classList.remove('on'),1800); }
}
// La miniatura de arriba y la tarjeta del Perfil abren la pantalla de la mascota
if(typeof mascotaMiniHTML==='function'){
  const _mm=mascotaMiniHTML;
  window.mascotaMiniHTML=mascotaMiniHTML=function(s){ const h=_mm.apply(this,arguments); if(s && s.mascotaOculta) return h; return h.replace(`onclick="dashTab('perfil')"`,'onclick="mascotaAbrir()"'); };
}
if(typeof mascotaPerfilHTML==='function'){
  const _mp=mascotaPerfilHTML;
  window.mascotaPerfilHTML=mascotaPerfilHTML=function(s){
    const h=_mp.apply(this,arguments); if(!h || (s && s.mascotaOculta)) return h;
    return h.replace('<div class="masc-fig">','<button type="button" class="masc-fig masc-abrir" onclick="mascotaAbrir()" aria-label="Ver a mi compañero">').replace(/(<div class="masc-tx">)/,'$1').replace('</div>\n    <div class="masc-tx">','</button>\n    <div class="masc-tx">');
  };
}
// Si cambia el nombre o la mascota con la pantalla abierta, se vuelve a pintar
if(typeof mascotaGuardar==='function'){
  const _mg=mascotaGuardar;
  window.mascotaGuardar=mascotaGuardar=function(){ const r=_mg.apply(this,arguments); if(document.getElementById('s-mascota')?.classList.contains('on')) mascotaAbrir(); return r; };
}


/* ═══ SESIÓN, MI PLAN Y DETALLE DEL DÍA ═══
   El título gigante se ajusta al ancho; la entrada animada corre al cambiar de ejercicio o de día,
   no en cada toque de los controles − / +. */
if(typeof renderSes==='function'){
  const _rs=renderSes; let _ultEj=null;
  window.renderSes=renderSes=function(){
    const r=_rs.apply(this,arguments);
    const c=document.getElementById('en-ses'), k=(sesUI&&sesUI.k)+':'+(sesUI&&sesUI.cur);
    // misma pantalla (toques de − / + o serie marcada): sin repetir la entrada
    if(c){ if(k!==_ultEj){ _ultEj=k; cineReproducir(c); } else c.classList.remove('cine-play'); }
    return r;
  };
}
function cineRutina(){ const c=document.getElementById('dsec-rutina'); if(!c) return; cineAjustar(c); cineTrasFuentes(()=>cineAjustar(c)); const st=c.querySelector('.en-card-cine'); if(st) cineReproducir(st); }
['renderRutinaTab','rutElegir'].forEach(n=>{
  const f=window[n]; if(typeof f!=='function') return;
  window[n]=function(){ const r=f.apply(this,arguments); try{ cineRutina(); }catch(_){} return r; };
});
if(typeof openDay==='function'){
  const _od=openDay;
  window.openDay=openDay=function(){ const r=_od.apply(this,arguments); try{ const d=document.getElementById('dd'); cineAjustar(d); cineTrasFuentes(()=>cineAjustar(d)); cineReproducir(d); }catch(_){} return r; };
}
addEventListener('resize',()=>{ clearTimeout(cineRutina._t); cineRutina._t=setTimeout(()=>{ cineAjustar(document.getElementById('dsec-rutina')); cineAjustar(document.getElementById('dd')); },150); });
