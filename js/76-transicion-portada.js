/* ═══ Reto Fit CCA · la foto que se queda: portada → acceso → Inicio ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global). Estilos en css/transicion.css.
   · La portada, el acceso (s-login, s-registro) y la tarjeta de Inicio usan la misma foto y el mismo recorte.
     Al pasar de la portada al acceso, y del acceso a Inicio, la foto, la persona y el 12 de la pantalla nueva
     arrancan exactamente donde estaban en la anterior y se acomodan en su lugar (FLIP con Web Animations).
     Funciona en cualquier navegador; si algo no se puede medir, el cambio es directo, como antes.
   · La primera vez que se ve Inicio en cada apertura de la app (al entrar con la cuenta, al terminar la evaluación
     o al abrir la app con la sesión iniciada), el 12 aparece en la tarjeta y se convierte en el entrenamiento de hoy.
   · Con "reducir movimiento" no hay nada de esto. Para quitarlo: borrar este archivo y css/transicion.css
     de index.html y sw.js. ═══ */

const RF_POCO_MOV = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const RF_DUR = 850, RF_EASE = 'cubic-bezier(.16,1,.3,1)';
let RF_INTRO = true;   // la siguiente vez que se pinte Inicio, el 12 se vuelve el entrenamiento

// Rectángulo donde realmente se dibuja una foto con object-fit: cover (incluye la escala que tenga el elemento)
function rfDibujo(img){
  const r = img.getBoundingClientRect();
  if(!r.width || !r.height) return null;
  const nw = img.naturalWidth, nh = img.naturalHeight, cs = getComputedStyle(img);
  if(!nw || !nh || cs.objectFit!=='cover') return {x:r.left, y:r.top, w:r.width, h:r.height};
  const s = Math.max(r.width/nw, r.height/nh), w = nw*s, h = nh*s;
  const [px,py] = (cs.objectPosition||'50% 50%').split(' ').map(v=>/%$/.test(v)?parseFloat(v)/100:0.5);
  return {x:r.left+(r.width-w)*px, y:r.top+(r.height-h)*py, w, h};
}
// Las tres piezas compartidas de una pantalla: foto, persona recortada y número
function rfPiezas(raiz){
  if(!raiz) return null;
  const vis = el => el && el.getClientRects().length && getComputedStyle(el).display!=='none' ? el : null;
  const foto = vis(raiz.querySelector('.wc-pic img, .lg-ph:not(.lg-cut), .ci-bg'));
  const cut = vis(raiz.querySelector('.wc-cut, .lg-cut, .ci-cut'));
  const num = vis(raiz.querySelector('.wc-num, .lg-num, .rf-num'));
  const d = el => { if(!el) return null; const s = el.tagName==='IMG' ? rfDibujo(el) : (()=>{ const sp=el.querySelector('span'); const r=(sp||el).getBoundingClientRect(); return r.height?{x:r.left,y:r.top,w:r.width,h:r.height}:null; })(); return s?{el, r:s}:null; };
  return {foto:d(foto), cut:d(cut), num:d(num), src:foto?foto.currentSrc||foto.src:''};
}
// La pieza nueva arranca donde estaba la vieja y se acomoda
function rfDesde(nuevo, viejo){
  if(!nuevo || !viejo) return;
  const el = nuevo.el, b = el.getBoundingClientRect(), k = viejo.r.h/nuevo.r.h;
  if(!isFinite(k) || k<=0) return;
  const tx = viejo.r.x - b.left - (nuevo.r.x - b.left)*k, ty = viejo.r.y - b.top - (nuevo.r.y - b.top)*k;
  el.style.transformOrigin = '0 0';
  const a = el.animate([{transform:`translate(${tx}px,${ty}px) scale(${k})`},{transform:'none'}],{duration:RF_DUR, easing:RF_EASE});
  a.finished.catch(()=>{}).then(()=>{ el.style.transformOrigin=''; });
}

(function(){
  if(typeof go!=='function') return;
  const actual = () => { const s=document.querySelector('.sc.on'); return s?s.id:''; };
  const _go = go;
  window.go = go = function(id){
    const de = actual();
    if(id==='s-dash' && /^s-(login|registro|quiz)$/.test(de)) RF_INTRO = true;
    const conFoto = (de==='s-inicio' && /^s-(login|registro)$/.test(id)) || (/^s-(login|registro)$/.test(de) && id==='s-dash');
    if(!conFoto || RF_POCO_MOV() || !Element.prototype.animate){
      const r = _go.apply(this,arguments);
      if(id==='s-dash' && RF_INTRO){ try{ rfIntro(); }catch(e){} }   // al abrir la app con la sesión iniciada
      return r;
    }
    // Inicio ya se pintó oculto: se espera a que su foto esté decodificada para no mostrar un cuadro vacío (máx. 450 ms)
    if(id==='s-dash' && !go._rfListo){
      const fotos = [...document.querySelectorAll('#ci-scene .ci-bg, #ci-scene .ci-cut')].filter(i=>i.decode);
      if(fotos.length){
        const self=this, args=arguments;
        Promise.race([Promise.all(fotos.map(i=>i.decode().catch(()=>{}))), new Promise(res=>setTimeout(res,450))])
          .then(()=>{ go._rfListo=true; try{ go.apply(self,args); } finally{ go._rfListo=false; } });
        return;
      }
    }
    let antes = null; try{ antes = rfPiezas(document.getElementById(de)); }catch(e){}
    const r = _go.apply(this,arguments);
    try{
      if(id==='s-dash'){ try{ cineAjustar(document.getElementById('ci-scene')); }catch(e){} if(RF_INTRO){ try{ rfIntro(); }catch(e){} } }   // se pintó oculto: medir ya visible y poner el 12
      const ahora = rfPiezas(document.getElementById(id==='s-dash'?'ci-scene':id));
      // Solo si es la misma foto (con una foto propia de Apariencia en una pantalla y no en la otra, cambio directo)
      if(antes && ahora && antes.foto && ahora.foto && antes.src && antes.src===ahora.src){
        const raiz = document.documentElement; raiz.classList.add('rf-mov');
        rfDesde(ahora.foto, antes.foto); rfDesde(ahora.cut, antes.cut); rfDesde(ahora.num, antes.num);
        setTimeout(()=>raiz.classList.remove('rf-mov'), RF_DUR+50);
      }
    }catch(e){ console.warn('rf transición',e); }
    return r;
  };
})();

// ── En Inicio: el 12 se vuelve el entrenamiento de hoy ──
function rfIntro(){
  const sc = document.getElementById('ci-scene'), dash = document.getElementById('s-dash');
  if(!RF_INTRO || !sc || !dash || !dash.classList.contains('on')) return;   // se espera a que Inicio esté en pantalla
  RF_INTRO = false;
  // Solo con la foto original del panel (el recorte de la persona va encima del número) y si se ve Inicio
  if(RF_POCO_MOV() || !sc.classList.contains('con-recorte') || (typeof tabActiva==='function' && tabActiva()!=='inicio')) return;
  const cam = sc.querySelector('.ci-cam'), t = sc.querySelector('.ci-title'), sec = document.getElementById('dsec-inicio');
  if(!cam || !t) return;
  const sem = String((typeof GYM!=='undefined' && GYM.reto && +GYM.reto.semanas) || 12);
  const n = document.createElement('p'); n.className = 'rf-num'; n.setAttribute('aria-hidden','true');
  n.innerHTML = sem.split('').map(c=>`<span>${c}</span>`).join('');
  t.after(n);
  sc.classList.add('rf-doce'); if(sec) sec.classList.add('rf-llega');
  const forma = () => {
    if(!n.isConnected) return;   // Inicio se volvió a pintar mientras tanto
    if(document.documentElement.classList.contains('rf-mov')){ setTimeout(forma,120); return; }
    // Cada cifra viaja al lugar del título (la primera a su inicio, la segunda más adelante) mientras se encoge
    const tr = t.getBoundingClientRect();
    [...n.children].forEach((s,i)=>{
      const r = s.getBoundingClientRect();
      s.style.setProperty('--dx', (tr.left + tr.width*(i?0.62:0.2) - (r.left + r.width/2)).toFixed(1)+'px');
      s.style.setProperty('--dy', (tr.top + tr.height*0.5 - (r.top + r.height/2)).toFixed(1)+'px');
    });
    sc.classList.remove('rf-doce'); sc.classList.add('rf-forma');
    setTimeout(()=>{ n.remove(); sc.classList.remove('rf-forma'); if(sec) sec.classList.remove('rf-llega'); }, 1700);
  };
  setTimeout(forma, 600);
}
if(typeof cineInicio==='function'){
  const _ci = cineInicio;
  window.cineInicio = cineInicio = function(){ const r=_ci.apply(this,arguments); try{ rfIntro(); }catch(e){ console.warn('rfIntro',e); } return r; };
}
// El título de Inicio ajusta su letra midiéndose; mientras espera agrandado (rf-doce) se mide con su tamaño real
if(typeof cineAjustar==='function'){
  const _ca = cineAjustar;
  window.cineAjustar = cineAjustar = function(raiz){
    const sc = document.getElementById('ci-scene'), t = sc && sc.classList.contains('rf-doce') ? sc.querySelector('.ci-title') : null;
    if(!t) return _ca.apply(this,arguments);
    const st = t.style, prev = [st.transition, st.scale, st.translate];
    st.transition = 'none'; st.scale = '1'; st.translate = '0 0';
    try{ return _ca.apply(this,arguments); }
    finally{ st.scale = prev[1]; st.translate = prev[2]; void t.offsetWidth; st.transition = prev[0]; }
  };
}
