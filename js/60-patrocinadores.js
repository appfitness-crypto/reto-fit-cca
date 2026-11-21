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

// ── Portada: franja que se mueve sola (se detiene al tocarla) ──
function patPintarPortada(){
  const box=document.getElementById('pat-portada'); if(!box) return;
  const L=patEn('portada');
  if(!L.length){ box.innerHTML=''; box.hidden=true; return; }
  const item=(p,dup)=>`<button type="button" class="pat-chip" onclick="patAbrir('${esc(p.id)}')"${dup?' aria-hidden="true" tabindex="-1"':` aria-label="${esc(p.nombre)}${p.promo?': '+esc(p.promo):''}"`}>${patLogoHTML(p)}</button>`;
  const rep=L.length<4?Math.ceil(4/L.length):1, base=[].concat(...Array(rep).fill(L));
  box.hidden=false;
  box.innerHTML=`<p class="pat-h">Patrocinan el reto</p>
    <div class="pat-marq${base.length<3?' quieta':''}"><div class="pat-track" style="--n:${base.length}">${base.map(p=>item(p,false)).join('')}${base.length>=3?base.map(p=>item(p,true)).join(''):''}</div></div>`;
}

// ── Inicio: tarjetas al final, una promoción y un botón cada una ──
function patInicioHTML(){
  const L=patEn('inicio'); if(!L.length) return '';
  return `<section class="pat-ini" aria-label="Aliados del reto">
    <div class="sec-row"><div class="sec-t">Aliados del reto</div></div>
    <div class="pat-car">${L.map(p=>{ const u=patUrl(p);
      return `<article class="pat-card">${patLogoHTML(p,'en-card')}${p.promo?`<p>${esc(p.promo)}</p>`:''}${p.detalle?`<small>${esc(p.detalle)}</small>`:''}
        ${u?`<button type="button" class="pat-cta" onclick="patAbrir('${esc(p.id)}')">${ico(patEsWa(p)?'chat':'arrow')}${patEsWa(p)?'Escribir':'Ver más'}</button>`:''}</article>`; }).join('')}</div>
  </section>`;
}

// ── Fin de sesión: un patrocinador por sesión (rota) con un código del día ──
function patCodigo(s){
  const t=String(s&&s.code||'')+fechaISO(new Date()); let h=0; for(let i=0;i<t.length;i++) h=(h*31+t.charCodeAt(i))>>>0;
  return 'RETO-'+String(1000+h%9000);
}
function patFinHTML(s,est){
  if(est==='incompleta') return '';
  const L=patEn('fin'); if(!L.length) return '';
  const n=(s&&s.logs&&Array.isArray(s.logs.sesiones))?s.logs.sesiones.length:0, p=L[n%L.length], u=patUrl(p);
  return `<section class="pat-prem" aria-label="Premio de ${esc(p.nombre)}">
    <div class="pat-prem-h">${patLogoHTML(p,'solo')}<p>${esc(p.promo||'Gracias por entrenar')}<small>${esc(p.nombre)} · regalo por terminar tu sesión</small></p></div>
    <div class="pat-cod"><b class="num">${patCodigo(s)}</b><span>Muestra esta pantalla<br>${p.detalle?esc(p.detalle):'Válido solo hoy'}</span></div>
    ${u?`<button type="button" class="pat-cta" onclick="patAbrir('${esc(p.id)}')">${ico(patEsWa(p)?'chat':'arrow')}${patEsWa(p)?'Escribir':'Ver más'}</button>`:''}
  </section>`;
}

// ── Director: subir, pausar, cambiar de lugar y borrar ──
let patDraft={logo:'', lugares:{portada:true, inicio:true, fin:false}};
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
      <div class="pat-up">
        <label class="pat-up-b" id="pat-prev">${patDraft.logo?`<img src="${patDraft.logo}" alt="Logo">`:`${ico('plus')}<span>Subir logo</span>`}<input type="file" accept="image/*" onchange="patLogo(this)" hidden></label>
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
      <button type="button" class="tb-btn av-pub" onclick="patPublicar()">🤝 Publicar patrocinador</button>
    </div>
    <div class="tr-card">
      <h3 class="tr-h3">Publicados</h3>
      ${todos.length?todos.map(p=>{ const [et,cl]=estado(p); return `<div class="av-row pat-row">
        ${patLogoHTML(p,'solo')}
        <div class="av-row-t"><b>${esc(p.nombre)}</b>${p.promo?`<span>${esc(p.promo)}</span>`:''}<small>${p.desde?esc(patFecha(p.desde)):'hoy'} → ${p.hasta?esc(patFecha(p.hasta)):'sin fecha final'}${patUrl(p)?' · '+(patEsWa(p)?'WhatsApp':'página'):''}</small>
          <div class="pat-lug">${Object.entries(PAT_LUGARES).map(([k,nm])=>`<button type="button" class="tr-tab${p.lugares&&p.lugares[k]?' on':''}" aria-pressed="${!!(p.lugares&&p.lugares[k])}" onclick="patLugar('${esc(p.id)}','${k}')">${esc(nm)}</button>`).join('')}</div></div>
        <span class="tr-tag ${cl}">${et}</span>
        <div class="pat-acc"><button type="button" class="tb-btn" onclick="patPausar('${esc(p.id)}')">${p.activo===false?'Reanudar':'Pausar'}</button><button type="button" class="tb-btn" style="color:var(--r)" onclick="patBorrar('${esc(p.id)}')">Borrar</button></div>
      </div>`; }).join(''):'<p class="tr-mu">Todavía no hay patrocinadores.</p>'}
    </div>
  </div>`;
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
  try{ if(typeof fbDB!=='undefined'&&fbDB&&fbListo){ const r=fbDB.ref('/patrocinadores/'+id); (p?r.set(p):r.remove()).catch(()=>{}); } }catch(e){}
  if(msg) showToast(msg);
  patRepintar(); abrirPatrocinadores();
}
function patPublicar(){
  const v=id=>(document.getElementById(id)?.value||'').trim();
  const nombre=v('pat-nombre'), promo=v('pat-promo'), detalle=v('pat-detalle'), enlace=v('pat-enlace'), desde=v('pat-desde'), hasta=v('pat-hasta');
  const err=document.getElementById('pat-err');
  if(!nombre){ err.textContent='Escribe el nombre del patrocinador.'; return; }
  if(!Object.values(patDraft.lugares).some(Boolean)){ err.textContent='Elige al menos un lugar donde salga.'; return; }
  if(desde && hasta && hasta<desde){ err.textContent='La fecha final no puede ser antes de la inicial.'; return; }
  if(enlace && !patUrl({enlace})){ err.textContent='Escribe un WhatsApp de 10 dígitos o una página (ej. www.ejemplo.mx).'; return; }
  if(!fbListo){ err.textContent='Necesitas conexión con la base de datos para publicar.'; return; }
  const id='p'+Date.now().toString(36);
  const p={nombre, promo, detalle, enlace, logo:patDraft.logo||'', lugares:Object.assign({},patDraft.lugares), desde:desde||fechaISO(new Date()), hasta:hasta||'', activo:true, creado:new Date().toISOString()};
  patDraft={logo:'', lugares:{portada:true, inicio:true, fin:false}};
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
