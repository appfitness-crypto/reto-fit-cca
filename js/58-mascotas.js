/* ═══ Reto Fit CCA: mascota del socio que evoluciona con sus puntos ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global).
   · La primera vez que el socio entra le aparece "Elige a tu compañero del reto": 9 mascotas en 3 estilos
     (divertidos, enérgicos, serenos) y le pone nombre. Se guarda en su expediente: s.mascota = {id, nombre, fecha}.
   · La mascota tiene 5 etapas según sus puntos del reto (los mismos del ranking, js/55-socio-reto.js).
     Antes del arranque del reto siempre es Cría. Si lleva 5 días o más sin entrenar se ve cansada.
   · Se ve en la tarjeta del reto (arriba de todas las pestañas), grande en el Perfil y en el tablero del staff.
   · Imágenes: img/mascotas/<id>-<etapa>.webp (etapa 1 a 5). Mientras no existan se dibuja una provisional. ═══ */

const MASCOTA_ESTILOS=[
  {id:'divertidos', nm:'Divertidos', d:'Alegres y juguetones'},
  {id:'energicos',  nm:'Enérgicos',  d:'Deportistas, siempre en movimiento'},
  {id:'serenos',    nm:'Serenos',    d:'Elegantes, enfocados y constantes'}
];
const MASCOTAS=[
  {id:'ajolote', nm:'Ajolote', estilo:'divertidos', color:'#F49AC1', frase:'Se regenera y nunca se rinde.'},
  {id:'xolo',    nm:'Xolo',    estilo:'divertidos', color:'#6B7A8F', frase:'Leal y con energía para todo.'},
  {id:'panda',   nm:'Panda',   estilo:'divertidos', color:'#3A3F47', frase:'Tranquilo, pero fuerte como nadie.'},
  {id:'jaguar',  nm:'Jaguar',  estilo:'energicos',  color:'#E0A020', frase:'Potencia y velocidad.'},
  {id:'lobo',    nm:'Lobo',    estilo:'energicos',  color:'#7C8CA3', frase:'Entrena en manada, llega más lejos.'},
  {id:'colibri', nm:'Colibrí', estilo:'energicos',  color:'#1FA38A', frase:'Pequeño, rápido e incansable.'},
  {id:'buho',    nm:'Búho',    estilo:'serenos',    color:'#8A6A4F', frase:'Sabio: entrena con cabeza.'},
  {id:'aguila',  nm:'Águila real', estilo:'serenos', color:'#6E4B2A', frase:'Visión clara, metas altas.'},
  {id:'venado',  nm:'Venado',  estilo:'serenos',    color:'#B07A4A', frase:'Elegante, ágil y constante.'}
];
const MASCOTA_ETAPAS=[
  {n:1, nm:'Cría',      pts:0},
  {n:2, nm:'Joven',     pts:300},
  {n:3, nm:'Entrenado', pts:800},
  {n:4, nm:'Atleta',    pts:1500},
  {n:5, nm:'Leyenda',   pts:2300}
];
function mascotaEtapas(){ const c=GYM.reto&&GYM.reto.mascotaEtapas; return Array.isArray(c)&&c.length===5?MASCOTA_ETAPAS.map((e,i)=>Object.assign({},e,{pts:c[i]})):MASCOTA_ETAPAS; }
function mascotaDef(id){ return MASCOTAS.find(m=>m.id===id)||null; }

// Imagen provisional: tarjeta con el color y la inicial de la mascota y la etapa (se reemplaza al subir las imágenes)
function mascotaProvisional(m, etapa){
  const ini=(m.nm||'?').trim()[0].toUpperCase(), r=36+etapa*6;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><radialGradient id="g" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><rect width="200" height="200" rx="44" fill="${m.color}" opacity=".18"/><circle cx="100" cy="104" r="${r}" fill="${m.color}"/><circle cx="100" cy="104" r="${r}" fill="url(#g)"/><text x="100" y="${118}" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="${26+etapa*5}" fill="#fff">${ini}</text><g fill="${m.color}">${[1,2,3,4,5].map(i=>`<circle cx="${60+i*13.3}" cy="182" r="4" opacity="${i<=etapa?1:.25}"/>`).join('')}</g></svg>`;
  return 'data:image/svg+xml,'+encodeURIComponent(svg);
}
function mascotaImgHTML(m, etapa, cls){
  if(!m) return '';
  const src=imgSrc(`mascotas/${m.id}-${etapa}.webp`), alt=`${m.nm}, etapa ${etapa}`;
  return `<img class="${cls||''}" src="${src}" alt="${esc(alt)}" loading="lazy" decoding="async" onerror="this.onerror=null;this.src='${mascotaProvisional(m,etapa)}'">`;
}

// Estado actual de la mascota del socio
function mascotaEstado(s){
  if(!s||!s.mascota||!mascotaDef(s.mascota.id)) return null;
  const m=mascotaDef(s.mascota.id), E=mascotaEtapas();
  const x=typeof socioPuntos==='function'?socioPuntos(s):null;
  const pts=x?x.r.puntos:0, antes=x?x.antes:true;
  let i=0; E.forEach((e,k)=>{ if(pts>=e.pts) i=k; });
  const sig=E[i+1]||null;
  const desde=E[i].pts, pct=sig?Math.round((pts-desde)/(sig.pts-desde)*100):100;
  const dias=x&&!antes?x.r.diasSin:null;
  return {m, nombre:s.mascota.nombre||m.nm, etapa:E[i], sig, faltan:sig?sig.pts-pts:0, pct, pts, antes, cansada:dias!=null&&dias>=5, dias};
}

// Miniatura para la tarjeta del reto
function mascotaMiniHTML(s){
  const st=mascotaEstado(s); if(!st) return '';
  return `<button type="button" class="rb-masc${st.cansada?' cansada':''}" onclick="dashTab('perfil')" aria-label="${esc(st.nombre)}: ${esc(st.etapa.nm)}">${mascotaImgHTML(st.m, st.etapa.n)}</button>`;
}

// Tarjeta grande en el Perfil
function mascotaPerfilHTML(s){
  const st=mascotaEstado(s); if(!st) return '';
  const E=mascotaEtapas();
  const msg = st.antes ? `Tu ${esc(st.m.nm.toLowerCase())} empieza a crecer cuando arranque el reto.`
    : st.cansada ? `${esc(st.nombre)} te extraña: llevas ${st.dias} días sin entrenar. Una sesión hoy lo anima.`
    : st.sig ? `Faltan <b>${st.faltan.toLocaleString('es-MX')} pts</b> para que evolucione a <b>${esc(st.sig.nm)}</b>.`
    : `¡${esc(st.nombre)} llegó a su forma final!`;
  return `<div class="masc-card${st.cansada?' cansada':''}" id="mi-mascota">
    <div class="masc-fig">${mascotaImgHTML(st.m, st.etapa.n, 'masc-img')}</div>
    <div class="masc-tx">
      <div class="masc-k">${esc(st.m.nm)} · Etapa ${st.etapa.n} de 5</div>
      <div class="masc-n">${esc(st.nombre)}</div>
      <div class="masc-e">${esc(st.etapa.nm)}</div>
      ${st.sig?`<div class="masc-bar" aria-hidden="true"><i style="width:${Math.max(3,st.pct)}%"></i></div>`:''}
      <p class="masc-msg">${msg}</p>
    </div>
    <div class="masc-etapas" aria-label="Etapas">${E.map(e=>`<div class="masc-et${e.n<=st.etapa.n?' on':''}">${mascotaImgHTML(st.m, e.n)}<span>${esc(e.nm)}</span><small>${e.pts.toLocaleString('es-MX')}</small></div>`).join('')}</div>
    <button type="button" class="masc-cambiar" onclick="mascotaAbrirSelector(true)">Cambiar nombre o mascota</button>
  </div>`;
}

// ── Selector: "Elige a tu compañero del reto" ──
let mascotaSel=null;
function mascotaAbrirSelector(cambio){
  const s=activeSocio; if(!s) return;
  mascotaSel=s.mascota?s.mascota.id:null;
  let ov=document.getElementById('masc-sel'); if(ov) ov.remove();
  ov=document.createElement('div'); ov.id='masc-sel'; ov.className='masc-ov'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-labelledby','masc-sel-t');
  ov.innerHTML=`<div class="masc-hoja">
    <h2 id="masc-sel-t">Elige a tu compañero del reto</h2>
    <p class="masc-sub">Crece contigo: cada punto que ganas lo hace evolucionar en 5 etapas, de Cría a Leyenda.</p>
    ${MASCOTA_ESTILOS.map(e=>`<div class="masc-grupo"><div class="masc-gt">${esc(e.nm)}<small>${esc(e.d)}</small></div>
      <div class="masc-grid">${MASCOTAS.filter(m=>m.estilo===e.id).map(m=>`<button type="button" class="masc-op${mascotaSel===m.id?' on':''}" data-id="${m.id}" aria-pressed="${mascotaSel===m.id}" onclick="mascotaElegir('${m.id}')">
        ${mascotaImgHTML(m,5)}<b>${esc(m.nm)}</b><small>${esc(m.frase)}</small></button>`).join('')}</div></div>`).join('')}
    <label class="masc-nl">Ponle nombre<input id="masc-nombre" maxlength="18" placeholder="Ej. Toto" value="${esc(s.mascota&&s.mascota.nombre||'')}"></label>
    <div class="masc-acc">
      ${cambio?'':`<button type="button" class="masc-luego" onclick="mascotaLuego()">Después</button>`}
      ${cambio?`<button type="button" class="masc-luego" onclick="document.getElementById('masc-sel').remove()">Cancelar</button>`:''}
      <button type="button" class="masc-ok" id="masc-ok" onclick="mascotaGuardar()" ${mascotaSel?'':'disabled'}>Elegir</button>
    </div>
  </div>`;
  document.body.appendChild(ov);
}
function mascotaElegir(id){
  mascotaSel=id;
  document.querySelectorAll('.masc-op').forEach(b=>{ const on=b.dataset.id===id; b.classList.toggle('on',on); b.setAttribute('aria-pressed',on); });
  const ok=document.getElementById('masc-ok'); if(ok) ok.disabled=false;
  const n=document.getElementById('masc-nombre'); if(n && !n.value) n.placeholder='Ej. '+mascotaDef(id).nm;
}
function mascotaGuardar(){
  const s=activeSocio; if(!s||!mascotaSel) return;
  const nombre=(document.getElementById('masc-nombre')?.value||'').trim().slice(0,18)||mascotaDef(mascotaSel).nm;
  s.mascota={id:mascotaSel, nombre, fecha:(s.mascota&&s.mascota.id===mascotaSel&&s.mascota.fecha)||fechaISO(new Date())};
  dbSave(s.code);
  document.getElementById('masc-sel')?.remove();
  showToast(`✓ ${nombre} será tu compañero del reto`);
  if(typeof refreshDash==='function') refreshDash();
  if(document.getElementById('dsec-perfil')?.classList.contains('on') && typeof renderPerfilTab==='function') renderPerfilTab();
}
let _mascotaLuego=false;
function mascotaLuego(){ _mascotaLuego=true; document.getElementById('masc-sel')?.remove(); }

// Al abrir su tablero: si aún no tiene mascota, se le ofrece elegirla (una vez por visita)
if(typeof abrirPlanSocio==='function'){
  const _apOrig=abrirPlanSocio;
  abrirPlanSocio=function(){ const r=_apOrig.apply(this,arguments);
    try{ if(GYM.reto && activeSocio && !activeSocio.mascota && !_mascotaLuego) setTimeout(()=>mascotaAbrirSelector(false),600); }catch(e){}
    return r; };
}
// Perfil: la mascota arriba de los puntos
if(typeof renderPerfilTab==='function'){
  const _rpM=renderPerfilTab;
  renderPerfilTab=function(){ _rpM.apply(this,arguments);
    try{
      const ancla=document.querySelector('#dsec-perfil #mis-puntos')||document.querySelector('#dsec-perfil .pf-h');
      const s=activeSocio; if(!ancla||!s||!GYM.reto) return;
      const html=s.mascota?mascotaPerfilHTML(s):`<button type="button" class="masc-elige" onclick="mascotaAbrirSelector(false)">${ico('star')}<span><b>Elige a tu compañero del reto</b><small>Una mascota que evoluciona con tus puntos</small></span>${ico('chev')}</button>`;
      ancla.insertAdjacentHTML(ancla.id==='mis-puntos'?'beforebegin':'afterend', html);
    }catch(e){ console.warn('mascota',e); }
  };
}
