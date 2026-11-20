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
