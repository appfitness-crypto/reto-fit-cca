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

function avisosClub(){ const a=(DB.config&&DB.config.avisos)||{}; return Object.keys(a).map(id=>Object.assign({id},a[id])).filter(x=>x&&x.titulo); }
// Los del director (todos) + los del entrenador del socio (solo su grupo: js/61-reparto.js)
function avisosTodos(){
  const s=typeof activeSocio!=='undefined'?activeSocio:null;
  const g=(s && s.entrenadorId && typeof avisosDeGrupo==='function') ? avisosDeGrupo(s.entrenadorId) : [];
  return avisosClub().concat(g);
}
function avisoGrupoMio(){ return (typeof staffRol!=='undefined' && staffRol!=='coordinador' && staffActivoEntId) ? staffActivoEntId : ''; }
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

// ── Socio: el aviso lo dice su mascota en un globo; al tocarlo se abre como banner con imagen ──
function avisoHora(h){ const m=String(h||'').match(/^(\d{1,2}):(\d{2})/); if(!m) return ''; let H=+m[1]; const ap=H>=12?'pm':'am'; H=H%12||12; return H+':'+m[2]+' '+ap; }
function avisoCuandoTxt(a){ return [a.cuando?avisoFechaTxt(a.cuando):'', avisoHora(a.hora), a.lugar||''].filter(Boolean).join(' · '); }
function avisoMascota(){
  const s=typeof activeSocio!=='undefined'?activeSocio:null;
  const m=(s && !s.mascotaOculta && typeof mascotaEstado==='function')?mascotaEstado(s):null;
  return m?{img:mascotaImgHTML(m.m, m.etapa.n), nombre:m.nombre}:null;
}
function avisosVisibles(){ const cerr=avisosCerrados(); return avisosActivos().filter(a=>a.tipo==='importante' || !cerr.includes(a.id)); }
function avisosPintar(){
  const box=document.getElementById('avisos-socio'); if(!box) return;
  const lista=avisosVisibles();
  if(!lista.length){ box.innerHTML=''; return; }
  const a=lista[0], t=AVISO_TIPOS[a.tipo]||AVISO_TIPOS.aviso, m=avisoMascota(), linea=avisoCuandoTxt(a)||a.texto||'';
  box.innerHTML=`<button type="button" class="av-m av-m-${esc(a.tipo||'aviso')}" onclick="avisoAbrir('${esc(a.id)}')" aria-label="${esc(t.nm)}: ${esc(a.titulo)}. Toca para ver el aviso.">
    <span class="av-m-pet${m?'':' sin'}" aria-hidden="true">${m?m.img:ico(t.ic)}</span>
    <span class="av-m-b"><span class="av-m-k"><i></i>${a.grupo?esc(a.autor||'Tu entrenador')+' · tu grupo':(m?esc(m.nombre)+' te avisa · ':'')+esc(t.nm.toLowerCase())}</span><b>${esc(a.titulo)}</b>${linea?`<small>${esc(linea)}</small>`:''}</span>
    ${a.img?`<span class="av-m-th" aria-hidden="true"><img src="${esc(a.img)}" alt="" decoding="async"></span>`:''}
    ${lista.length>1?`<span class="av-m-n">+${lista.length-1} ${lista.length===2?'aviso':'avisos'}</span>`:''}
  </button>`;
}
function avisoAbrir(id){
  const lista=avisosVisibles(), a=lista.find(x=>x.id===id)||avisosTodos().find(x=>x.id===id); if(!a) return;
  const t=AVISO_TIPOS[a.tipo]||AVISO_TIPOS.aviso, m=avisoMascota();
  let ov=document.getElementById('av-ov'); if(ov) ov.remove();
  ov=document.createElement('div'); ov.id='av-ov'; ov.className='av-ov'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-labelledby','av-ov-t');
  const dat=[a.cuando?['calendar',avisoFechaTxt(a.cuando)]:null, a.hora?['clock',avisoHora(a.hora)]:null, a.lugar?['pin',a.lugar]:null].filter(Boolean);
  const otros=lista.filter(x=>x.id!==a.id);
  ov.innerHTML=`<div class="av-sheet">
    <span class="av-grab" aria-hidden="true"></span>
    <div class="av-ban av-m-${esc(a.tipo||'aviso')}${a.img?'':' sin-img'}">
      ${a.img?`<img class="av-ban-img" src="${esc(a.img)}" alt="">`:`<span class="av-ban-ic" aria-hidden="true">${ico(t.ic)}</span>`}
      ${m?`<span class="av-ban-pet" aria-hidden="true">${m.img}</span>`:''}
      <div class="av-ban-t"><span>${ico(t.ic)}${esc(t.nm)}${a.grupo?' · de '+esc(a.autor||'tu entrenador'):''}</span><h2 id="av-ov-t">${esc(a.titulo)}</h2></div>
    </div>
    ${dat.length?`<div class="av-dat">${dat.map(d=>`<div>${ico(d[0])}<b>${esc(d[1])}</b></div>`).join('')}</div>`:''}
    ${a.texto?`<p class="av-msg">${esc(a.texto)}</p>`:''}
    ${a.cuando?`<button type="button" class="av-go" onclick="avisoCalendario('${esc(a.id)}')">${ico('calendar')}Agregarlo a mi calendario</button>`:''}
    <button type="button" class="av-link" onclick="avisoCerrarHoja()">Cerrar</button>
    ${a.tipo==='importante'?'':`<button type="button" class="av-link av-link-s" onclick="avisoCerrar('${esc(a.id)}');avisoCerrarHoja()">Ya no mostrar este aviso</button>`}
    ${otros.length?`<div class="av-otros"><b>Otros avisos</b>${otros.map(o=>`<button type="button" onclick="avisoAbrir('${esc(o.id)}')">${o.img?`<img src="${esc(o.img)}" alt="">`:`<span>${ico((AVISO_TIPOS[o.tipo]||AVISO_TIPOS.aviso).ic)}</span>`}<em>${esc(o.titulo)}</em>${ico('chev')}</button>`).join('')}</div>`:''}
  </div>`;
  ov.addEventListener('click',e=>{ if(e.target===ov) avisoCerrarHoja(); });
  document.addEventListener('keydown',avisoEsc);
  document.body.appendChild(ov);
  requestAnimationFrame(()=>ov.classList.add('on'));
  ov.querySelector('.av-link')?.focus({preventScroll:true});
}
function avisoEsc(e){ if(e.key==='Escape') avisoCerrarHoja(); }
function avisoCerrarHoja(){ document.removeEventListener('keydown',avisoEsc); const ov=document.getElementById('av-ov'); if(ov) ov.remove(); }
// Archivo de calendario (.ics) con la fecha, hora y lugar del aviso
function avisoCalendario(id){
  const a=avisosTodos().find(x=>x.id===id); if(!a||!a.cuando) return;
  const d=String(a.cuando).replace(/-/g,''), h=String(a.hora||'').replace(':','');
  const ini=h?`DTSTART:${d}T${h}00`:`DTSTART;VALUE=DATE:${d}`;
  const fin=h?`DTEND:${d}T${String((+h.slice(0,2)+1)%24).padStart(2,'0')}${h.slice(2)}00`:'';
  const limp=x=>String(x||'').replace(/[\\,;]/g,m=>'\\'+m).replace(/\n/g,'\\n');
  const ics=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Reto Fit CCA//Avisos//ES','BEGIN:VEVENT','UID:'+a.id+'@retofitcca',ini,fin,'SUMMARY:'+limp(a.titulo),a.lugar?'LOCATION:'+limp(a.lugar):'',a.texto?'DESCRIPTION:'+limp(a.texto):'','END:VEVENT','END:VCALENDAR'].filter(Boolean).join('\r\n');
  const url=URL.createObjectURL(new Blob([ics],{type:'text/calendar'})), l=document.createElement('a');
  l.href=url; l.download='aviso-reto.ics'; document.body.appendChild(l); l.click(); l.remove(); setTimeout(()=>URL.revokeObjectURL(url),4000);
}

// ── Director: publicar y borrar avisos ──
let avisoTipoSel='clase', avisoImgDraft='';
async function avisoImg(inp){
  const f=inp.files&&inp.files[0]; if(!f) return;
  try{ avisoImgDraft=await aparComprimir(f,720); const b=document.getElementById('av-prev'); if(b){ b.querySelectorAll('img,span,svg').forEach(x=>x.remove()); b.insertAdjacentHTML('afterbegin',`<img src="${avisoImgDraft}" alt="Imagen del aviso">`); } }
  catch(e){ showToast('No se pudo usar esa imagen: '+(e&&e.message||'')); }
}
function abrirAvisos(){
  const grupo=avisoGrupoMio();
  if(staffRol!=='coordinador' && !grupo){ showToast('Los avisos los publica el director'); return; }
  if(grupo && typeof avisosGrupoMios==='function') avisosGrupoMios();
  staffActivoId=null; if(typeof staffRenderList==='function') staffRenderList();
  if(typeof staffVista==='function') staffVista('detalle');
  const hoy=fechaISO(new Date()), en7=fechaISO(new Date(Date.now()+7*86400000));
  const todos=(grupo?avisosDeGrupo(grupo):avisosClub()).sort((x,y)=>String(y.creado||'').localeCompare(String(x.creado||'')));
  const estado=a=>{ if(a.desde&&a.desde>hoy) return ['Programado','tr-t-ok']; if(a.hasta&&a.hasta<hoy) return ['Vencido','']; return ['Visible ahora','tr-t-ok']; };
  document.getElementById('staff-content').innerHTML=`
  <div class="tr-wrap${grupo?' av-grupo':''}">
    ${grupo?avisoGrupoCabeza(grupo):`<div><h2 class="tr-h">Avisos</h2><p class="tr-p">Lo que publiques aquí sale hasta arriba en la app de todos los socios, en todas sus pestañas.</p></div>`}
    <div class="tr-card av-form">
      <h3 class="tr-h3">${grupo?'Aviso a mi grupo':'Nuevo aviso'}</h3>
      <div class="av-tipos" role="radiogroup" aria-label="Tipo de aviso">
        ${Object.entries(AVISO_TIPOS).map(([k,t])=>`<button type="button" role="radio" aria-checked="${k===avisoTipoSel}" class="tr-tab${k===avisoTipoSel?' on':''}" onclick="avisoTipoSel='${k}';document.querySelectorAll('.av-tipos .tr-tab').forEach(b=>{const on=b.dataset.k===avisoTipoSel;b.classList.toggle('on',on);b.setAttribute('aria-checked',on)})" data-k="${k}">${ico(t.ic)} ${esc(t.nm)}</button>`).join('')}
      </div>
      <div class="pat-up">
        <label class="pat-up-b" id="av-prev">${avisoImgDraft?`<img src="${avisoImgDraft}" alt="Imagen del aviso">`:`${ico('plus')}<span>Imagen</span>`}<input type="file" accept="image/*" onchange="avisoImg(this)" hidden></label>
        <label class="av-l" style="flex:1">Título<input id="av-titulo" class="av-in" maxlength="80" placeholder="Ej. Clase especial de cardio"></label>
      </div>
      <label class="av-l">Mensaje<textarea id="av-texto" class="av-in" rows="3" maxlength="280" placeholder="Ej. Jueves 11 a las 7:00 pm en el salón 2. Trae toalla y agua."></textarea></label>
      <div class="av-fechas">
        <label class="av-l">Día del evento (opcional)<input id="av-cuando" class="av-in" type="date"></label>
        <label class="av-l">Hora (opcional)<input id="av-hora" class="av-in" type="time"></label>
      </div>
      <label class="av-l">Lugar (opcional)<input id="av-lugar" class="av-in" maxlength="40" placeholder="Ej. Salón 4"></label>
      <div class="av-fechas">
        <label class="av-l">Mostrar desde<input id="av-desde" class="av-in" type="date" value="${hoy}"></label>
        <label class="av-l">Hasta<input id="av-hasta" class="av-in" type="date" value="${en7}"></label>
      </div>
      <p class="tr-mu">"Importante" no se puede cerrar: se queda visible hasta la fecha final. Los demás el socio los puede cerrar.</p>
      <div class="av-err" id="av-err" role="alert"></div>
      ${grupo?`<div class="av-to">${ico('user')}<span>Le llega a <b>tus ${avisoGrupoN()} atleta${avisoGrupoN()===1?'':'s'}</b>, no a todo el gym.</span></div>`:''}
      <button type="button" class="tb-btn av-pub" onclick="avisoPublicar()">📣 ${grupo?'Publicar a mi grupo':'Publicar aviso'}</button>
    </div>
    <div class="tr-card">
      <h3 class="tr-h3">Avisos publicados</h3>
      ${todos.length?todos.map(a=>{ const [et,cl]=estado(a), t=AVISO_TIPOS[a.tipo]||AVISO_TIPOS.aviso; return `<div class="av-row">
        ${a.img?`<span class="tr-av av-row-img"><img src="${esc(a.img)}" alt=""></span>`:`<span class="tr-av">${ico(t.ic)}</span>`}
        <div class="av-row-t"><b>${esc(a.titulo)}</b><small>${esc(t.nm)} · ${a.desde?esc(avisoFechaTxt(a.desde)):'hoy'} → ${a.hasta?esc(avisoFechaTxt(a.hasta)):'sin fecha final'}</small>${a.texto?`<span>${esc(a.texto)}</span>`:''}</div>
        <span class="tr-tag ${cl}">${et}</span>
        <button type="button" class="tb-btn" style="color:var(--r)" onclick="avisoBorrar('${esc(a.id)}')">Borrar</button>
      </div>`; }).join(''):'<p class="tr-mu">Todavía no hay avisos.</p>'}
    </div>
  </div>`;
}
function avisoPublicar(){
  const v=id=>(document.getElementById(id)?.value||'').trim();
  const titulo=v('av-titulo'), texto=v('av-texto'), desde=v('av-desde'), hasta=v('av-hasta'), cuando=v('av-cuando'), hora=v('av-hora'), lugar=v('av-lugar');
  const err=document.getElementById('av-err');
  if(!titulo){ err.textContent='Escribe un título.'; return; }
  if(desde && hasta && hasta<desde){ err.textContent='La fecha final no puede ser antes de la inicial.'; return; }
  if(!fbListo){ err.textContent='Necesitas conexión con la base de datos para publicar.'; return; }
  const id='a'+Date.now().toString(36);
  const aviso={titulo, texto, tipo:avisoTipoSel, desde:desde||fechaISO(new Date()), hasta:hasta||'', creado:new Date().toISOString()};
  if(cuando) aviso.cuando=cuando; if(hora) aviso.hora=hora; if(lugar) aviso.lugar=lugar; if(avisoImgDraft) aviso.img=avisoImgDraft;
  avisoImgDraft='';
  const grupo=avisoGrupoMio();
  if(grupo){
    const e=DB.entrenadores&&DB.entrenadores[grupo]; aviso.autor=(e&&e.nombre)||'';
    if(!DB.avisosGrupo) DB.avisosGrupo={};
    if(!DB.avisosGrupo[grupo]) DB.avisosGrupo[grupo]={};
    DB.avisosGrupo[grupo][id]=aviso; guardarLocal();
    fbEncolar('/avisosGrupo/'+grupo+'/'+id,'set',aviso);
  } else {
    if(!DB.config) DB.config={};
    if(!DB.config.avisos) DB.config.avisos={};
    DB.config.avisos[id]=aviso; guardarLocal();
    fbEncolar('/config/avisos/'+id,'set',aviso);
  }
  showToast('✓ Aviso publicado');
  avisoTipoSel='clase';
  abrirAvisos();
}
function avisoBorrar(id){
  const grupo=avisoGrupoMio();
  uiConfirm(grupo?'¿Borrar este aviso? Deja de verse en la app de tu grupo.':'¿Borrar este aviso? Deja de verse en la app de todos los socios.', ()=>{
    if(grupo){ if(DB.avisosGrupo&&DB.avisosGrupo[grupo]) delete DB.avisosGrupo[grupo][id]; }
    else if(DB.config&&DB.config.avisos) delete DB.config.avisos[id];
    guardarLocal();
    if(fbListo) fbEncolar(grupo?'/avisosGrupo/'+grupo+'/'+id:'/config/avisos/'+id,'remove');
    showToast('Aviso borrado');
    abrirAvisos();
  });
}

// Cabeza del panel del entrenador: su grupo, cuántos son y su foto
function avisoGrupoN(){ return (typeof sociosParaStaff==='function'?sociosParaStaff():[]).filter(x=>x && x.entrenadorId===staffActivoEntId).length; }
function avisoGrupoCabeza(id){
  const e=(DB.entrenadores&&DB.entrenadores[id])||{}, socios=(typeof sociosParaStaff==='function'?sociosParaStaff():[]).filter(x=>x && x.entrenadorId===id);
  const n=socios.length, muestra=socios.slice(0,5);
  return `<div class="rep-hero av-g-hero">
    <label class="av-g-foto" title="Cambiar mi foto">${typeof entAvatarHTML==='function'?entAvatarHTML(Object.assign({id},e),'ent-av'):''}<input type="file" accept="image/*" hidden onchange="entFotoSubir('${esc(id)}',this)"><span>Mi foto</span></label>
    <small>${esc(e.nombre||'')} · entrenador del reto</small><h2>${n} atleta${n===1?'':'s'}</h2>
    <p>Solo ves y editas a tu grupo. Lo que publiques aquí solo les llega a ellos. Los avisos del director siguen llegando a todos.</p>
    ${n?`<div class="av-g-stack" aria-hidden="true">${muestra.map(x=>`<span>${esc(entIniciales(x.nombre))}</span>`).join('')}${n>5?`<span class="mas">+${n-5}</span>`:''}</div>`:''}
  </div>`;
}

// Se vuelven a pintar cuando llegan cambios de /config y cuando cambia el tablero del socio
['kbAplicarExtra','refreshDash','dashTab'].forEach(fn=>{
  if(typeof window[fn]!=='function') return;
  const orig=window[fn];
  window[fn]=function(){ const r=orig.apply(this,arguments); try{ avisosPintar(); }catch(e){} return r; };
});
