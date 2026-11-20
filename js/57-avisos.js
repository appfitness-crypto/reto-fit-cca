/* ═══ Reto Fit CCA: avisos del director para todos los socios ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global).
   · Panel del director → Menú → Reto → 📣 Avisos: publicar (título, mensaje, tipo, desde / hasta) y borrar.
   · Se guardan en Firebase en /config/avisos/<id>: todos los usuarios con sesión los leen y solo el director
     escribe (reglas de /config). La app ya escucha /config en tiempo real, así que el aviso llega al momento
     a quien tenga la app abierta, y a los demás al abrirla.
   · Socio: los avisos vigentes salen hasta arriba de todas sus pestañas. Puede cerrar cada uno (se recuerda
     en su celular); los "Importante" no se pueden cerrar mientras estén vigentes. ═══ */

const AVISO_TIPOS={
  clase:     {nm:'Clase especial', ic:'calendar'},
  aviso:     {nm:'Aviso',          ic:'bell'},
  importante:{nm:'Importante',     ic:'warn'}
};
const AVISOS_VISTOS_LS='avisos_cerrados_v1';

function avisosTodos(){ const a=(DB.config&&DB.config.avisos)||{}; return Object.keys(a).map(id=>Object.assign({id},a[id])).filter(x=>x&&x.titulo); }
function avisoVigente(a,hoy){ hoy=hoy||fechaISO(new Date()); return (!a.desde||a.desde<=hoy) && (!a.hasta||a.hasta>=hoy); }
function avisosActivos(){
  const hoy=fechaISO(new Date()), orden={importante:0,clase:1,aviso:2};
  return avisosTodos().filter(a=>avisoVigente(a,hoy))
    .sort((x,y)=>(orden[x.tipo]??3)-(orden[y.tipo]??3) || String(y.creado||'').localeCompare(String(x.creado||'')));
}
function avisosCerrados(){ try{ return JSON.parse(localStorage.getItem(AVISOS_VISTOS_LS))||[]; }catch(e){ return []; } }
function avisoCerrar(id){
  const c=avisosCerrados(); if(!c.includes(id)) c.push(id);
  try{ localStorage.setItem(AVISOS_VISTOS_LS,JSON.stringify(c.slice(-100))); }catch(e){}
  avisosPintar();
}
function avisoFechaTxt(iso){ const d=retoFechaLocal(iso); if(!d) return ''; try{ return d.toLocaleDateString('es-MX',{weekday:'short',day:'numeric',month:'short'}); }catch(e){ return iso; } }

// ── Socio: avisos arriba de su tablero ──
function avisosPintar(){
  const box=document.getElementById('avisos-socio'); if(!box) return;
  const cerr=avisosCerrados();
  const lista=avisosActivos().filter(a=>a.tipo==='importante' || !cerr.includes(a.id));
  box.innerHTML=lista.map(a=>{
    const t=AVISO_TIPOS[a.tipo]||AVISO_TIPOS.aviso;
    return `<div class="aviso aviso-${esc(a.tipo||'aviso')}" role="status">
      <span class="aviso-ic">${ico(t.ic)}</span>
      <div class="aviso-tx"><div class="aviso-k">${esc(t.nm)}${a.hasta?' · hasta el '+esc(avisoFechaTxt(a.hasta)):''}</div>
        <div class="aviso-t">${esc(a.titulo)}</div>${a.texto?`<div class="aviso-m">${esc(a.texto)}</div>`:''}</div>
      ${a.tipo==='importante'?'':`<button type="button" class="aviso-x" aria-label="Cerrar aviso" onclick="avisoCerrar('${esc(a.id)}')">${ico('x')}</button>`}
    </div>`;
  }).join('');
}

// ── Director: publicar y borrar avisos ──
let avisoTipoSel='clase';
function abrirAvisos(){
  if(staffRol!=='coordinador'){ showToast('Los avisos los publica el director'); return; }
  staffActivoId=null; if(typeof staffRenderList==='function') staffRenderList();
  if(typeof staffVista==='function') staffVista('detalle');
  const hoy=fechaISO(new Date()), en7=fechaISO(new Date(Date.now()+7*86400000));
  const todos=avisosTodos().sort((x,y)=>String(y.creado||'').localeCompare(String(x.creado||'')));
  const estado=a=>{ if(a.desde&&a.desde>hoy) return ['Programado','tr-t-ok']; if(a.hasta&&a.hasta<hoy) return ['Vencido','']; return ['Visible ahora','tr-t-ok']; };
  document.getElementById('staff-content').innerHTML=`
  <div class="tr-wrap">
    <div><h2 class="tr-h">Avisos</h2><p class="tr-p">Lo que publiques aquí sale hasta arriba en la app de todos los socios, en todas sus pestañas.</p></div>
    <div class="tr-card av-form">
      <h3 class="tr-h3">Nuevo aviso</h3>
      <div class="av-tipos" role="radiogroup" aria-label="Tipo de aviso">
        ${Object.entries(AVISO_TIPOS).map(([k,t])=>`<button type="button" role="radio" aria-checked="${k===avisoTipoSel}" class="tr-tab${k===avisoTipoSel?' on':''}" onclick="avisoTipoSel='${k}';document.querySelectorAll('.av-tipos .tr-tab').forEach(b=>{const on=b.dataset.k===avisoTipoSel;b.classList.toggle('on',on);b.setAttribute('aria-checked',on)})" data-k="${k}">${ico(t.ic)} ${esc(t.nm)}</button>`).join('')}
      </div>
      <label class="av-l">Título<input id="av-titulo" class="av-in" maxlength="80" placeholder="Ej. Clase especial de cardio"></label>
      <label class="av-l">Mensaje<textarea id="av-texto" class="av-in" rows="3" maxlength="280" placeholder="Ej. Jueves 11 a las 7:00 pm en el salón 2. Trae toalla y agua."></textarea></label>
      <div class="av-fechas">
        <label class="av-l">Mostrar desde<input id="av-desde" class="av-in" type="date" value="${hoy}"></label>
        <label class="av-l">Hasta<input id="av-hasta" class="av-in" type="date" value="${en7}"></label>
      </div>
      <p class="tr-mu">"Importante" no se puede cerrar: se queda visible hasta la fecha final. Los demás el socio los puede cerrar.</p>
      <div class="av-err" id="av-err" role="alert"></div>
      <button type="button" class="tb-btn av-pub" onclick="avisoPublicar()">📣 Publicar aviso</button>
    </div>
    <div class="tr-card">
      <h3 class="tr-h3">Avisos publicados</h3>
      ${todos.length?todos.map(a=>{ const [et,cl]=estado(a), t=AVISO_TIPOS[a.tipo]||AVISO_TIPOS.aviso; return `<div class="av-row">
        <span class="tr-av">${ico(t.ic)}</span>
        <div class="av-row-t"><b>${esc(a.titulo)}</b><small>${esc(t.nm)} · ${a.desde?esc(avisoFechaTxt(a.desde)):'hoy'} → ${a.hasta?esc(avisoFechaTxt(a.hasta)):'sin fecha final'}</small>${a.texto?`<span>${esc(a.texto)}</span>`:''}</div>
        <span class="tr-tag ${cl}">${et}</span>
        <button type="button" class="tb-btn" style="color:var(--r)" onclick="avisoBorrar('${esc(a.id)}')">Borrar</button>
      </div>`; }).join(''):'<p class="tr-mu">Todavía no hay avisos.</p>'}
    </div>
  </div>`;
}
function avisoPublicar(){
  const v=id=>(document.getElementById(id)?.value||'').trim();
  const titulo=v('av-titulo'), texto=v('av-texto'), desde=v('av-desde'), hasta=v('av-hasta');
  const err=document.getElementById('av-err');
  if(!titulo){ err.textContent='Escribe un título.'; return; }
  if(desde && hasta && hasta<desde){ err.textContent='La fecha final no puede ser antes de la inicial.'; return; }
  if(!fbListo){ err.textContent='Necesitas conexión con la base de datos para publicar.'; return; }
  const id='a'+Date.now().toString(36);
  const aviso={titulo, texto, tipo:avisoTipoSel, desde:desde||fechaISO(new Date()), hasta:hasta||'', creado:new Date().toISOString()};
  if(!DB.config) DB.config={};
  if(!DB.config.avisos) DB.config.avisos={};
  DB.config.avisos[id]=aviso; guardarLocal();
  fbEncolar('/config/avisos/'+id,'set',aviso);
  showToast('✓ Aviso publicado');
  avisoTipoSel='clase';
  abrirAvisos();
}
function avisoBorrar(id){
  uiConfirm('¿Borrar este aviso? Deja de verse en la app de todos los socios.', ()=>{
    if(DB.config&&DB.config.avisos) delete DB.config.avisos[id];
    guardarLocal();
    if(fbListo) fbEncolar('/config/avisos/'+id,'remove');
    showToast('Aviso borrado');
    abrirAvisos();
  });
}

// Se vuelven a pintar cuando llegan cambios de /config y cuando cambia el tablero del socio
['kbAplicarExtra','refreshDash','dashTab'].forEach(fn=>{
  if(typeof window[fn]!=='function') return;
  const orig=window[fn];
  window[fn]=function(){ const r=orig.apply(this,arguments); try{ avisosPintar(); }catch(e){} return r; };
});
