/* ═══ Reto Fit CCA: patrocinadores del reto ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global). Estilos en css/cine.css.
   · Panel del director → Menú → Reto → 🤝 Patrocinadores: subir logo, nombre, promoción, enlace o WhatsApp,
     fechas y dónde sale cada uno (Portada, Inicio, Fin de sesión). Se pueden pausar, cambiar de lugar y borrar.
   · Se guardan como los avisos, en /config/patrocinadores/<id> (todos los usuarios con sesión los leen y solo
     el director escribe). El logo se comprime en el celular a 240 px (data:image/webp) antes de guardarlo.
   · Copia pública en /patrocinadores para la portada de quien todavía no tiene cuenta: funciona cuando se
     publique la regla de firebase-rules.json; mientras, la portada usa la copia que ya tiene el celular.
   · Socio: franja de logos en la portada, tarjetas que se deslizan al final de Inicio y un premio con código
     del día al terminar una sesión que cuenta. Nunca durante el registro de series. ═══ */

const PAT_LUGARES={portada:'Portada', inicio:'Inicio', fin:'Fin de sesión'};
let patPublicos=null;   // copia pública leída antes de entrar (portada)

function patTodos(){
  const a=(DB.config&&DB.config.patrocinadores)||patPublicos||{};
  return Object.keys(a).map(id=>Object.assign({id},a[id])).filter(x=>x&&x.nombre);
}
function patVigente(p,hoy){ hoy=hoy||fechaISO(new Date()); return p.activo!==false && (!p.desde||p.desde<=hoy) && (!p.hasta||p.hasta>=hoy); }
function patEn(lugar){ const hoy=fechaISO(new Date()); return patTodos().filter(p=>patVigente(p,hoy) && p.lugares && p.lugares[lugar]).sort((x,y)=>String(x.creado||'').localeCompare(String(y.creado||''))); }
function patFecha(iso){ const d=typeof retoFechaLocal==='function'?retoFechaLocal(iso):null; if(!d) return ''; try{ return d.toLocaleDateString('es-MX',{day:'numeric',month:'short'}); }catch(e){ return iso; } }

// Enlace: número → WhatsApp; texto con dominio → página
function patUrl(p){
  const e=String(p&&p.enlace||'').trim(); if(!e) return '';
  const dig=e.replace(/[^\d]/g,'');
  if(/^[\d\s()+-]+$/.test(e) && dig.length>=10) return 'https://wa.me/'+(dig.length===10?'52'+dig:dig);
  if(/^https?:\/\//i.test(e)) return e;
  if(/^[\w.-]+\.[a-z]{2,}/i.test(e)) return 'https://'+e;
  return '';
}
function patEsWa(p){ return /wa\.me/.test(patUrl(p)); }
function patAbrir(id){ const p=patTodos().find(x=>x.id===id); const u=p&&patUrl(p); if(u) window.open(u,'_blank','noopener'); }

// Logo en tarjeta blanca (se ve bien en los tres temas); sin logo, la inicial
function patLogoHTML(p,cls){
  return `<span class="pat-lg ${cls||''}">${p.logo?`<img src="${esc(p.logo)}" alt="" decoding="async">`:`<i aria-hidden="true">${esc(String(p.nombre).trim().charAt(0).toUpperCase())}</i>`}<b>${esc(p.nombre)}</b></span>`;
}

// Imagen grande del patrocinador (cartel o foto); si no subieron una, su logo
function patFoto(p){ return (p&&(p.img||p.logo))||''; }
// Tarjeta con la imagen grande: la imagen completa sobre su propio fondo difuminado (nunca se recorta)
function patTarjetaHTML(p,lugar,i){
  const f=patFoto(p);
  return `<button type="button" class="pat-big${p.img?'':' solo-logo'}" onclick="patVer('${esc(lugar)}',${i})" aria-label="${esc(p.nombre)}${p.promo?': '+esc(p.promo):''}. Toca para ver la promoción.">
    <span class="pat-big-m">${f?`<img class="pat-big-bg" src="${esc(f)}" alt="" aria-hidden="true"><img class="pat-big-img" src="${esc(f)}" alt="" decoding="async">`:`<i aria-hidden="true">${esc(String(p.nombre).trim().charAt(0).toUpperCase())}</i>`}</span>
    <span class="pat-big-t"><b>${esc(p.promo||p.nombre)}</b><small>${esc(p.nombre)}</small></span>
  </button>`;
}
// Carrusel: 2 tarjetas en pantalla; si hay más, avanza solo cada 4.5 s (se detiene al tocarlo)
function patCarruselHTML(L,lugar){
  return `<div class="pat-car2${L.length===1?' uno':''}" data-lugar="${esc(lugar)}">${L.map((p,i)=>patTarjetaHTML(p,lugar,i)).join('')}</div>
    ${L.length>2?`<div class="pat-dots" aria-hidden="true">${L.map((_,i)=>`<i class="${i?'':'on'}"></i>`).join('')}</div>`:''}`;
}
function patCarruselVivo(root){
  (root||document).querySelectorAll('.pat-car2').forEach(car=>{
    if(car._vivo) return; car._vivo=1;
    const dots=car.nextElementSibling&&car.nextElementSibling.classList.contains('pat-dots')?car.nextElementSibling.children:null;
    const marcar=()=>{ if(!dots) return; const w=car.firstElementChild?car.firstElementChild.offsetWidth+10:1; const k=Math.round(car.scrollLeft/w); [...dots].forEach((d,n)=>d.classList.toggle('on',n===k)); };
    car.addEventListener('scroll',()=>{ clearTimeout(car._t); car._t=setTimeout(marcar,80); },{passive:true});
    if(car.children.length<=2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let pausa=0; ['pointerdown','touchstart'].forEach(ev=>car.addEventListener(ev,()=>{ pausa=Date.now()+8000; },{passive:true}));
    const iv=setInterval(()=>{
      if(!document.body.contains(car)){ clearInterval(iv); return; }
      if(Date.now()<pausa || car.offsetParent===null) return;
      const w=car.firstElementChild.offsetWidth+10, fin=car.scrollLeft+car.clientWidth>=car.scrollWidth-4;
      car.scrollTo({left:fin?0:car.scrollLeft+w,behavior:'smooth'});
    },4500);
  });
}

// ── Portada: "Presentado por" en la barra de arriba, a la derecha del logo; rota cada 4 s ──
const PAT_PORTADA_MODO='firma';   // 'firma' (arriba) o 'abajo' (carrusel al deslizar)
let patFirmaI=0, patFirmaIv=null;
function patFirmaHTML(L,i){
  const p=L[i%L.length], f=p.logo||p.img;
  return `<button type="button" class="pat-firma" onclick="patVer('portada',${i%L.length})" aria-label="Presentado por ${esc(p.nombre)}. Toca para ver la promoción.">
    ${f?`<img src="${esc(f)}" alt="" decoding="async">`:`<i aria-hidden="true">${esc(String(p.nombre).trim().charAt(0).toUpperCase())}</i>`}
    <span class="pat-firma-t"><small>Presentado por</small><b>${esc(p.nombre)}</b></span></button>`;
}
function patFirmaPintar(L){
  L=L||patEn('portada');
  const tba=document.getElementById('tb-actions'), enInicio=document.getElementById('s-inicio')?.classList.contains('on');
  clearInterval(patFirmaIv); patFirmaIv=null;
  if(!tba || !enInicio || !L.length || PAT_PORTADA_MODO!=='firma'){ const v=tba&&tba.querySelector('.pat-firma'); if(v) v.remove(); return; }
  patFirmaI=patFirmaI%L.length;
  tba.innerHTML=patFirmaHTML(L,patFirmaI);
  if(L.length<2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  patFirmaIv=setInterval(()=>{
    const b=tba.querySelector('.pat-firma'); if(!b || !document.getElementById('s-inicio')?.classList.contains('on')){ clearInterval(patFirmaIv); return; }
    b.classList.add('cambia');
    setTimeout(()=>{ patFirmaI=(patFirmaI+1)%L.length; const n=document.createElement('div'); n.innerHTML=patFirmaHTML(L,patFirmaI); const nb=n.firstElementChild; nb.classList.add('cambia'); b.replaceWith(nb); requestAnimationFrame(()=>nb.classList.remove('cambia')); },320);
  },4000);
}

// ── Portada: carrusel de imágenes grandes ──
function patPintarPortada(){
  const box=document.getElementById('pat-portada'); if(!box) return;
  const L=patEn('portada');
  const mas=document.querySelector('#s-inicio .wc-mas');
  patFirmaPintar(L);
  // Portada elegida por el club: "Presentado por" arriba a la derecha (opción A). La sección de abajo queda apagada.
  if(!L.length || PAT_PORTADA_MODO==='firma'){ box.innerHTML=''; box.hidden=true; if(mas) mas.hidden=true; return; }
  box.hidden=false; if(mas) mas.hidden=false;
  // Aparece al deslizar hacia abajo
  if('IntersectionObserver' in window && !box._obs){ box._obs=new IntersectionObserver(es=>es.forEach(e=>{ if(e.isIntersecting) box.classList.add('visto'); }),{threshold:.15}); box._obs.observe(box); }
  box.innerHTML=`<p class="pat-h">Patrocinan el reto</p>${patCarruselHTML(L,'portada')}`;
  patCarruselVivo(box);
}

// ── Inicio: el mismo carrusel, al final ──
function patInicioHTML(){
  const L=patEn('inicio'); if(!L.length) return '';
  setTimeout(()=>patCarruselVivo(document.getElementById('dsec-inicio')),50);
  return `<section class="pat-ini" aria-label="Aliados del reto">
    <div class="sec-row"><div class="sec-t">Aliados del reto</div></div>
    ${patCarruselHTML(L,'inicio')}
  </section>`;
}

// ── Al tocar: banner con las imágenes arriba (se deslizan) y abajo la promoción del que se ve ──
function patVer(lugar,i){
  const L=patEn(lugar); if(!L.length) return;
  i=Math.max(0,Math.min(L.length-1,i||0));
  let ov=document.getElementById('pat-ov'); if(ov) ov.remove();
  ov=document.createElement('div'); ov.id='pat-ov'; ov.className='av-ov pat-ov'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-label','Patrocinadores del reto');
  ov.innerHTML=`<div class="av-sheet pat-sheet">
    <span class="av-grab" aria-hidden="true"></span>
    <div class="pat-vis">${L.map(p=>{ const f=patFoto(p); return `<div class="pat-vis-i">${f?`<img class="pat-big-bg" src="${esc(f)}" alt="" aria-hidden="true"><img class="pat-vis-img" src="${esc(f)}" alt="${esc(p.nombre)}">`:`<i aria-hidden="true">${esc(String(p.nombre).trim().charAt(0).toUpperCase())}</i>`}</div>`; }).join('')}</div>
    ${L.length>1?`<div class="pat-dots pat-vis-dots" aria-hidden="true">${L.map((_,n)=>`<i class="${n===i?'on':''}"></i>`).join('')}</div>`:''}
    <div class="pat-info" aria-live="polite"></div>
    <button type="button" class="av-link" onclick="patCerrarVer()">Cerrar</button>
  </div>`;
  const info=()=>{
    const vis=ov.querySelector('.pat-vis'), k=Math.round(vis.scrollLeft/Math.max(1,vis.clientWidth)), p=L[Math.max(0,Math.min(L.length-1,k))], u=patUrl(p);
    ov.querySelectorAll('.pat-vis-dots i').forEach((d,n)=>d.classList.toggle('on',n===k));
    ov.querySelector('.pat-info').innerHTML=`${p.logo&&p.img?`<span class="pat-info-lg"><img src="${esc(p.logo)}" alt=""></span>`:''}
      <small class="pat-info-k">${esc(p.nombre)}</small>
      <h2>${esc(p.promo||p.nombre)}</h2>
      ${p.detalle?`<p>${esc(p.detalle)}</p>`:''}
      ${p.hasta?`<p class="pat-info-f">${ico('calendar')}Válido hasta el ${esc(patFecha(p.hasta))}</p>`:''}
      ${u?`<button type="button" class="av-go" onclick="patAbrir('${esc(p.id)}')">${ico(patEsWa(p)?'chat':'arrow')}${patEsWa(p)?'Escribir por WhatsApp':'Ver más'}</button>`:''}`;
  };
  ov.addEventListener('click',e=>{ if(e.target===ov) patCerrarVer(); });
  document.addEventListener('keydown',patEsc);
  document.body.appendChild(ov);
  const vis=ov.querySelector('.pat-vis');
  vis.addEventListener('scroll',()=>{ clearTimeout(vis._t); vis._t=setTimeout(info,90); },{passive:true});
  requestAnimationFrame(()=>{ vis.scrollLeft=i*vis.clientWidth; info(); ov.classList.add('on'); });
  const sh=ov.querySelector('.av-sheet'); sh.tabIndex=-1; sh.focus({preventScroll:true});
}
function patEsc(e){ if(e.key==='Escape') patCerrarVer(); }
function patCerrarVer(){ document.removeEventListener('keydown',patEsc); document.getElementById('pat-ov')?.remove(); }

// ── Fin de sesión: un patrocinador por sesión (rota) con un código del día ──
function patCodigo(s){
  const t=String(s&&s.code||'')+fechaISO(new Date()); let h=0; for(let i=0;i<t.length;i++) h=(h*31+t.charCodeAt(i))>>>0;
  return 'RETO-'+String(1000+h%9000);
}
function patFinHTML(s,est){
  if(est==='incompleta') return '';
  const L=patEn('fin'); if(!L.length) return '';
  const n=(s&&s.logs&&Array.isArray(s.logs.sesiones))?s.logs.sesiones.length:0, p=L[n%L.length], u=patUrl(p);
  return `<section class="pat-prem${p.img?' con-img':''}" aria-label="Premio de ${esc(p.nombre)}">
    ${p.img?`<div class="pat-prem-img"><img class="pat-big-bg" src="${esc(p.img)}" alt="" aria-hidden="true"><img src="${esc(p.img)}" alt=""></div>`:''}
    <div class="pat-prem-h">${patLogoHTML(p,'solo')}<p>${esc(p.promo||'Gracias por entrenar')}<small>${esc(p.nombre)} · regalo por terminar tu sesión</small></p></div>
    <div class="pat-cod"><b class="num">${patCodigo(s)}</b><span>Muestra esta pantalla<br>${p.detalle?esc(p.detalle):'Válido solo hoy'}</span></div>
    ${u?`<button type="button" class="pat-cta" onclick="patAbrir('${esc(p.id)}')">${ico(patEsWa(p)?'chat':'arrow')}${patEsWa(p)?'Escribir':'Ver más'}</button>`:''}
  </section>`;
}

// ── Director: subir, pausar, cambiar de lugar y borrar ──
let patDraft={logo:'', img:'', lugares:{portada:true, inicio:true, fin:false}};
function abrirPatrocinadores(){
  if(staffRol!=='coordinador'){ showToast('Los patrocinadores los da de alta el director'); return; }
  staffActivoId=null; if(typeof staffRenderList==='function') staffRenderList();
  if(typeof staffVista==='function') staffVista('detalle');
  const hoy=fechaISO(new Date()), todos=patTodos().sort((x,y)=>String(y.creado||'').localeCompare(String(x.creado||'')));
  const estado=p=>{ if(p.activo===false) return ['Pausado','']; if(p.desde&&p.desde>hoy) return ['Programado','tr-t-ok']; if(p.hasta&&p.hasta<hoy) return ['Vencido','']; return ['Visible ahora','tr-t-ok']; };
  document.getElementById('staff-content').innerHTML=`
  <div class="tr-wrap">
    <div><h2 class="tr-h">Patrocinadores</h2><p class="tr-p">Salen en la app de los socios donde elijas. Nunca mientras registran una serie.</p></div>
    <div class="tr-card av-form pat-form">
      <h3 class="tr-h3">Nuevo patrocinador</h3>
      <label class="pat-up-big" id="pat-img-prev">${patDraft.img?`<img src="${patDraft.img}" alt="Imagen grande">`:`${ico('plus')}<b>Imagen grande</b><span>Cartel, foto del producto o del lugar. Es lo que más se ve.</span>`}<input type="file" accept="image/*" onchange="patImagen(this)" hidden></label>
      <div class="pat-up">
        <label class="pat-up-b" id="pat-prev">${patDraft.logo?`<img src="${patDraft.logo}" alt="Logo">`:`${ico('plus')}<span>Logo (opcional)</span>`}<input type="file" accept="image/*" onchange="patLogo(this)" hidden></label>
        <label class="av-l" style="flex:1">Nombre<input id="pat-nombre" class="av-in" maxlength="40" placeholder="Ej. Farmacia del club"></label>
      </div>
      <label class="av-l">Promoción<input id="pat-promo" class="av-in" maxlength="90" placeholder="Ej. 10 % en suplementos para socios del reto"></label>
      <label class="av-l">Detalle (opcional)<input id="pat-detalle" class="av-in" maxlength="70" placeholder="Ej. Muestra tu app en la tienda"></label>
      <label class="av-l">Página o WhatsApp (opcional)<input id="pat-enlace" class="av-in" maxlength="120" placeholder="Ej. 55 1234 5678 o www.ejemplo.mx"></label>
      <div class="av-l">Dónde sale<div class="pat-lug" role="group" aria-label="Dónde sale">${Object.entries(PAT_LUGARES).map(([k,nm])=>`<button type="button" class="tr-tab${patDraft.lugares[k]?' on':''}" aria-pressed="${!!patDraft.lugares[k]}" onclick="patDraft.lugares.${k}=!patDraft.lugares.${k};this.classList.toggle('on');this.setAttribute('aria-pressed',patDraft.lugares.${k})">${esc(nm)}</button>`).join('')}</div></div>
      <div class="av-fechas">
        <label class="av-l">Desde<input id="pat-desde" class="av-in" type="date" value="${hoy}"></label>
        <label class="av-l">Hasta (opcional)<input id="pat-hasta" class="av-in" type="date"></label>
      </div>
      <p class="tr-mu">En el fin de sesión sale uno a la vez, rotando, con un código del día que el socio muestra en la tienda.</p>
      <div class="av-err" id="pat-err" role="alert"></div>
      <button type="button" class="tb-btn av-pub" onclick="patPublicar()">${ico('check')}Publicar patrocinador</button>
    </div>
    <div class="tr-card">
      <h3 class="tr-h3">Publicados</h3>
      ${todos.length?todos.map(p=>{ const [et,cl]=estado(p); return `<div class="av-row pat-row">
        ${patLogoHTML(p,'solo')}
        <div class="av-row-t"><b>${esc(p.nombre)}</b>${p.promo?`<span>${esc(p.promo)}</span>`:''}<small>${p.desde?esc(patFecha(p.desde)):'hoy'} → ${p.hasta?esc(patFecha(p.hasta)):'sin fecha final'}${patUrl(p)?' · '+(patEsWa(p)?'WhatsApp':'página'):''}</small>
          <div class="pat-lug">${Object.entries(PAT_LUGARES).map(([k,nm])=>`<button type="button" class="tr-tab${p.lugares&&p.lugares[k]?' on':''}" aria-pressed="${!!(p.lugares&&p.lugares[k])}" onclick="patLugar('${esc(p.id)}','${k}')">${esc(nm)}</button>`).join('')}</div></div>
        <span class="tr-tag ${cl}">${et}</span>
        <div class="pat-acc"><label class="tb-btn pat-img-btn">${p.img?'Cambiar imagen':'Subir imagen grande'}<input type="file" accept="image/*" hidden onchange="patImagenDe('${esc(p.id)}',this)"></label><button type="button" class="tb-btn" onclick="patPausar('${esc(p.id)}')">${p.activo===false?'Reanudar':'Pausar'}</button><button type="button" class="tb-btn" style="color:var(--r)" onclick="patBorrar('${esc(p.id)}')">Borrar</button></div>
      </div>`; }).join(''):'<p class="tr-mu">Todavía no hay patrocinadores.</p>'}
    </div>
  </div>`;
}
// Imagen grande: hasta 960 px para que se vea nítida a todo lo ancho
async function patImagen(inp){
  const f=inp.files&&inp.files[0]; if(!f) return;
  try{ patDraft.img=await aparComprimir(f,960); const b=document.getElementById('pat-img-prev'); if(b){ b.querySelectorAll('img,span,b,svg').forEach(x=>x.remove()); b.insertAdjacentHTML('afterbegin',`<img src="${patDraft.img}" alt="Imagen grande">`); } }
  catch(e){ showToast('No se pudo usar esa imagen: '+(e&&e.message||'')); }
}
async function patImagenDe(id,inp){
  const f=inp.files&&inp.files[0]; const p=patCopia(id); if(!f||!p) return;
  try{ p.img=await aparComprimir(f,960); patGuardar(id,p,'✓ Imagen actualizada'); }
  catch(e){ showToast('No se pudo usar esa imagen: '+(e&&e.message||'')); }
}
async function patLogo(inp){
  const f=inp.files&&inp.files[0]; if(!f) return;
  try{ patDraft.logo=await aparComprimir(f,240); const b=document.getElementById('pat-prev'); if(b){ b.querySelectorAll('img,span,svg').forEach(x=>x.remove()); b.insertAdjacentHTML('afterbegin',`<img src="${patDraft.logo}" alt="Logo">`); } }
  catch(e){ showToast('No se pudo usar esa imagen: '+(e&&e.message||'')); }
}
function patGuardar(id,p,msg){
  if(!DB.config) DB.config={};
  if(!DB.config.patrocinadores) DB.config.patrocinadores={};
  if(p) DB.config.patrocinadores[id]=p; else delete DB.config.patrocinadores[id];
  guardarLocal();
  fbEncolar('/config/patrocinadores/'+id, p?'set':'remove', p||undefined);
  // Copia pública para la portada (si la regla todavía no está publicada, no pasa nada)
  fbEncolar('/patrocinadores/'+id, p?'set':'remove', p||undefined, {err:()=>{}});
  if(msg) showToast(msg);
  patRepintar(); abrirPatrocinadores();
}
function patPublicar(){
  const v=id=>(document.getElementById(id)?.value||'').trim();
  const nombre=v('pat-nombre'), promo=v('pat-promo'), detalle=v('pat-detalle'), enlace=v('pat-enlace'), desde=v('pat-desde'), hasta=v('pat-hasta');
  const err=document.getElementById('pat-err');
  if(!nombre){ err.textContent='Escribe el nombre del patrocinador.'; return; }
  // Sin lugar se puede dar de alta: no se ve en la app hasta acomodarlo (aquí o en el mapa de lugares, js/77)
  if(desde && hasta && hasta<desde){ err.textContent='La fecha final no puede ser antes de la inicial.'; return; }
  if(enlace && !patUrl({enlace})){ err.textContent='Escribe un WhatsApp de 10 dígitos o una página (ej. www.ejemplo.mx).'; return; }
  if(!fbListo){ err.textContent='Necesitas conexión con la base de datos para publicar.'; return; }
  const id='p'+Date.now().toString(36);
  const p={nombre, promo, detalle, enlace, logo:patDraft.logo||'', img:patDraft.img||'', lugares:Object.assign({},patDraft.lugares), desde:desde||fechaISO(new Date()), hasta:hasta||'', activo:true, creado:new Date().toISOString()};
  patDraft={logo:'', img:'', lugares:{portada:true, inicio:true, fin:false}};
  patGuardar(id,p,'✓ Patrocinador publicado');
}
function patCopia(id){ const a=(DB.config&&DB.config.patrocinadores)||{}; return a[id]?Object.assign({},a[id]):null; }
function patLugar(id,k){ const p=patCopia(id); if(!p) return; p.lugares=Object.assign({},p.lugares); p.lugares[k]=!p.lugares[k]; patGuardar(id,p); }
function patPausar(id){ const p=patCopia(id); if(!p) return; p.activo=p.activo===false; patGuardar(id,p,p.activo?'Patrocinador visible de nuevo':'Patrocinador en pausa'); }
function patBorrar(id){ uiConfirm('¿Borrar este patrocinador? Deja de verse en la app de todos los socios.', ()=>patGuardar(id,null,'Patrocinador borrado')); }

function patRepintar(){
  try{ patPintarPortada(); }catch(e){}
  try{ if(document.getElementById('dsec-inicio')?.classList.contains('on') && activeSocio && typeof refreshDash==='function'){ const sc=document.querySelector('#dsec-inicio .pat-ini'); if(sc) sc.outerHTML=patInicioHTML()||''; } }catch(e){}
}

// Antes de entrar: intenta leer la copia pública (si la regla está publicada)
function patLeerPublicos(){
  try{ if(typeof fbDB==='undefined'||!fbDB) return;
    fbDB.ref('/patrocinadores').once('value').then(s=>{ patPublicos=s.val()||null; patPintarPortada(); }).catch(()=>{});
  }catch(e){}
}

// Se vuelven a pintar cuando llegan cambios de /config, al volver a la portada y al arrancar
['kbAplicarExtra'].forEach(fn=>{
  if(typeof window[fn]!=='function') return;
  const orig=window[fn];
  window[fn]=function(){ const r=orig.apply(this,arguments); try{ patRepintar(); }catch(e){} return r; };
});
if(typeof go==='function'){
  const _goP=go;
  window.go=go=function(id){ const r=_goP.apply(this,arguments); if(id==='s-inicio'){ try{ patPintarPortada(); }catch(e){} } return r; };
}
(function(){
  const ir=()=>{ patPintarPortada(); setTimeout(patLeerPublicos,1500); };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',ir,{once:true}); else ir();
})();
