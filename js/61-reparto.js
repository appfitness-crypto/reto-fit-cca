/* ═══ Reto Fit CCA: reparto de atletas entre los entrenadores del gym ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global).
   · Al terminar el cuestionario ya no se pide código: la app asigna al socio el siguiente entrenador de la lista,
     por turno (rueda), y se lo muestra en un carrusel ("Te toca con Pedro").
   · La lista: entrenadores con función de entrenamiento y código, en el orden en que se dieron de alta.
     El director puede pausar a uno (deja de recibir atletas nuevos) desde Menú → Reto → Reparto.
   · El turno vive en /reparto/turno (un número que solo puede subir de uno en uno: reglas en firebase-rules.json),
     así dos socios que se registran al mismo tiempo no caen con el mismo entrenador por error.
   · Pasar a un atleta a otro entrenador se sigue haciendo desde su ficha (el turno no se mueve).
   · Avisos de grupo: el entrenador publica en /avisosGrupo/<su id>/<aviso>; solo los ven sus atletas. ═══ */

const LS_REPARTO='reparto_asignado_v1';

function entIniciales(n){ return String(n||'?').trim().split(/\s+/).slice(0,2).map(p=>p[0]||'').join('').toUpperCase()||'?'; }
function entAvatarHTML(e,cls){
  const nm=(e&&e.nombre)||'';
  return `<span class="${cls||'ent-av'}" aria-hidden="true">${e&&e.foto?`<img src="${esc(e.foto)}" alt="" decoding="async">`:esc(entIniciales(nm))}</span>`;
}
function entEspLimpias(e){ return ((e&&e.especialidades)||[]).map(x=>String(x).replace(/^[^\p{L}\p{N}]+/u,'').trim()).filter(Boolean); }
function entCorto(n){ return String(n||'').trim().split(/\s+/)[0]||'tu entrenador'; }

// Entrenadores que reciben atletas, en orden de alta
function repartoTodos(){
  return Object.entries(DB.entrenadores||{}).map(([k,e])=>e?Object.assign({},e,{id:e.id||k}):null)
    .filter(e=>e && e.rol!=='coordinador' && e.codigo && (typeof entHace!=='function' || entHace(e,'entrenamiento')))
    .sort((a,b)=>String(a.creado||'').localeCompare(String(b.creado||'')) || String(a.nombre||'').localeCompare(String(b.nombre||'')) || String(a.id).localeCompare(String(b.id)));
}
function repartoLista(){ return repartoTodos().filter(e=>!e.repartoPausa); }
function repartoHash(t){ let h=0; for(const c of String(t||'')) h=(h*31+c.charCodeAt(0))>>>0; return h; }

async function repartoCargarEntrenadores(){
  if(repartoLista().length || !fbListo || !fbDB) return;
  try{
    await fbConUsuario(6000);
    const v=(await fbDB.ref('/entrenadores').once('value')).val();
    if(v){ DB.entrenadores=Object.assign({},DB.entrenadores||{},v); guardarLocal(); }
  }catch(e){ console.warn('reparto: entrenadores',e); }
}

// Decide el entrenador del socio. Si ya tenía uno (o ya se le asignó en este celular), se queda con él.
async function repartoAsignar(){
  const uid=(typeof cuentaUid==='function' && cuentaUid()) || '';
  const prev=uid && DB.socios && DB.socios[uid];
  if(prev && prev.entrenadorId && DB.entrenadores[prev.entrenadorId]) return Object.assign({id:prev.entrenadorId},DB.entrenadores[prev.entrenadorId],{codigo:prev.codigoEnt||DB.entrenadores[prev.entrenadorId].codigo});
  await repartoCargarEntrenadores();
  let g=null; try{ g=JSON.parse(localStorage.getItem(LS_REPARTO)); }catch(e){}
  if(g && g.uid===uid && g.id){ const e=repartoTodos().find(x=>x.id===g.id); if(e) return e; }
  const lista=repartoLista();
  if(!lista.length) return null;
  let n=null;
  if(fbListo && fbDB && navigator.onLine){
    try{ const r=await fbDB.ref('/reparto/turno').transaction(c=>(typeof c==='number'?c:0)+1); if(r && r.committed) n=r.snapshot.val(); }
    catch(e){ console.warn('reparto: turno',e); }
  }
  if(typeof n!=='number') n=repartoHash(uid||String(Date.now()))+1;   // sin conexión: reparto parejo por cuenta
  const e=lista[(n-1)%lista.length];
  try{ localStorage.setItem(LS_REPARTO,JSON.stringify({uid,id:e.id,ts:Date.now()})); }catch(er){}
  return e;
}

// ── Último paso del cuestionario: carrusel con el entrenador asignado ──
let qtAsignado=null, qtBuscando=false;
function qtReiniciar(){ qtAsignado=null; qtBuscando=false; }
function qtTarjeta(e,on,i){
  const esp=entEspLimpias(e).slice(0,3), frase=e.filosofia&&e.filosofia.tagline;
  return `<div class="qt-card${on?' on':''}" ${on?'id="qt-on"':''} aria-hidden="${on?'false':'true'}">
    <span class="qt-n">${String(i+1).padStart(2,'0')}</span>
    ${entAvatarHTML(e,'qt-av')}
    <div class="qt-nm"><b>${esc(e.nombre||'Entrenador')}</b>${frase?`<small>“${esc(frase)}”</small>`:(esp.length?`<small>${esc(esp.slice(0,2).join(' · '))}</small>`:'')}</div>
    ${esp.length?`<div class="qt-tags">${esp.map(s=>`<span>${esc(s)}</span>`).join('')}</div>`:''}
  </div>`;
}
function renderTrainerPicker(){
  const box=document.getElementById('qt-carrusel'), b=document.getElementById('qbT');
  if(!box) return;
  if(qtBuscando && !qtAsignado){ box.innerHTML=`<div class="qt-wait"><span class="qt-spin" aria-hidden="true"></span>Buscando tu entrenador…</div>`; if(b) b.disabled=true; return; }
  if(!qtAsignado){
    box.innerHTML=`<div class="qt-txt"><h3>La app arma tu plan</h3><p>Todavía no hay entrenadores en el reparto del reto. Tu plan sale con el método del club y un entrenador lo podrá tomar después.</p></div>`;
    if(b) b.disabled=false; return;
  }
  const lista=repartoTodos().filter(e=>!e.repartoPausa || e.id===qtAsignado.id);
  if(!lista.some(e=>e.id===qtAsignado.id)) lista.push(qtAsignado);
  const corto=entCorto(qtAsignado.nombre);
  box.innerHTML=`<div class="qt-stage">
      <span class="qt-badge">${ico('check')}Te toca con ${esc(corto)}</span>
      <div class="qt-row" tabindex="-1">${lista.map((e,i)=>qtTarjeta(e,e.id===qtAsignado.id,i)).join('')}</div>
    </div>
    ${lista.length>1?`<div class="qt-dots" aria-hidden="true">${lista.map(e=>`<i class="${e.id===qtAsignado.id?'on':''}"></i>`).join('')}</div>`:''}
    <div class="qt-txt"><h3>${esc(corto)} arma tu rutina</h3><p>Los entrenadores del gym se reparten a los atletas en orden de inscripción. ${esc(corto)} revisa tu plan y te manda los avisos de su grupo.</p></div>`;
  if(b) b.disabled=false;
  // El carrusel arranca en el primero y "aterriza" en el que te tocó
  const row=box.querySelector('.qt-row'), on=box.querySelector('#qt-on');
  if(row && on){
    row.scrollLeft=0;
    const reduce=window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    setTimeout(()=>{ row.scrollTo({left:on.offsetLeft-(row.clientWidth-on.offsetWidth)/2, behavior:reduce?'auto':'smooth'}); }, 350);
  }
}
async function qtPrepararEntrenador(){
  if(qtAsignado || qtBuscando) { renderTrainerPicker(); return; }
  qtBuscando=true; renderTrainerPicker();
  try{ qtAsignado=await repartoAsignar(); }catch(e){ console.warn('reparto',e); qtAsignado=null; }
  qtBuscando=false;
  if(qtAsignado){ qAnswers.entrenadorId=qtAsignado.id; qAnswers.entrenadorNombre=qtAsignado.nombre||''; qAnswers.entrenadorCodigo=qtAsignado.codigo||''; }
  else { qAnswers.entrenadorId=''; qAnswers.entrenadorNombre=''; qAnswers.entrenadorCodigo=''; }
  renderTrainerPicker();
}
function qNextToTrainer(returnFn, prevScreenId){
  window._trainerReturnFn = returnFn;
  window._trainerPrevScreen = prevScreenId||'qq11';
  mostrarSub('qqT');
  qtPrepararEntrenador();
}
function qConfirmTrainerAndGenerate(){
  if(qtBuscando) return;
  if(window._trainerReturnFn) window._trainerReturnFn();
}

// ── Director: Menú → Reto → Reparto ──
let repTurno=null;
function abrirReparto(){
  if(staffRol!=='coordinador'){ showToast('El reparto lo maneja el director'); return; }
  staffActivoId=null; if(typeof staffRenderList==='function') staffRenderList();
  if(typeof staffVista==='function') staffVista('detalle');
  repartoPintar();
  if(fbListo && fbDB) fbDB.ref('/reparto/turno').once('value').then(s=>{ repTurno=s.val()||0; repartoPintar(); }).catch(()=>{});
}
function repartoPintar(){
  const c=document.getElementById('staff-content'); if(!c) return;
  const todos=repartoTodos(), activos=todos.filter(e=>!e.repartoPausa);
  const cuenta=id=>(typeof sociosDeEntrenador==='function'?sociosDeEntrenador(id):[]).length;
  const total=todos.reduce((t,e)=>t+cuenta(e.id),0), max=Math.max(1,...todos.map(e=>cuenta(e.id)));
  const sig=activos.length && typeof repTurno==='number' ? activos[repTurno%activos.length] : null;
  let n=0;
  c.innerHTML=`<div class="tr-wrap rep">
    <div class="rep-hero"><small>Así se reparten los atletas</small><h2>${total} atleta${total===1?'':'s'}<br>${activos.length} entrenador${activos.length===1?'':'es'}</h2><p>Cada atleta nuevo va al siguiente de la lista, en el orden en que diste de alta a cada entrenador. Pausa a quien ya no pueda recibir más.</p></div>
    ${todos.length?`<div class="rep-l">${todos.map(e=>{ const k=cuenta(e.id), pausa=!!e.repartoPausa, esSig=sig&&sig.id===e.id; if(!pausa) n++;
      return `<div class="rep-r${esSig?' sig':''}${pausa?' pausa':''}">
        <span class="rep-n">${pausa?'–':n}</span>
        <label class="rep-av" title="Cambiar foto">${entAvatarHTML(e,'ent-av')}<input type="file" accept="image/*" hidden onchange="entFotoSubir('${esc(e.id)}',this)"><span class="vh">Cambiar foto de ${esc(e.nombre)}</span></label>
        <div class="rep-t"><b>${esc(e.nombre)}</b><small>${pausa?'En pausa · no recibe nuevos':k+' atleta'+(k===1?'':'s')}</small>${pausa?'':`<span class="rep-bar"><i style="width:${Math.round(k/max*100)}%"></i></span>`}${esSig?'<span class="rep-sig">Siguiente en recibir</span>':''}</div>
        <button type="button" class="rep-sw${pausa?'':' on'}" role="switch" aria-checked="${!pausa}" aria-label="${esc(e.nombre)} recibe atletas nuevos" onclick="repartoPausar('${esc(e.id)}')"></button>
      </div>`; }).join('')}</div>`:'<p class="tr-mu">Todavía no hay entrenadores. Dalos de alta en Menú → Personas → Nuevo entrenador y entran solos al reparto.</p>'}
    <div class="tr-card rep-nota">${ico('refresh')}<div><b>Cambiar a un atleta de entrenador</b><small>Abre su ficha en la lista y cambia el entrenador. El turno del reparto no se mueve.</small></div></div>
  </div>`;
}
function repartoPausar(id){
  const e=DB.entrenadores[id]; if(!e) return;
  e.repartoPausa=!e.repartoPausa; if(!e.repartoPausa) delete e.repartoPausa;
  dbSaveEntrenador(id);
  showToast(e.repartoPausa?e.nombre+' ya no recibe atletas nuevos':e.nombre+' vuelve a recibir atletas');
  repartoPintar();
}
async function entFotoSubir(id,inp){
  const f=inp.files&&inp.files[0]; const e=DB.entrenadores[id]; if(!f||!e) return;
  try{ e.foto=await aparComprimir(f,240); dbSaveEntrenador(id); showToast('✓ Foto actualizada'); }
  catch(er){ showToast('No se pudo usar esa imagen: '+(er&&er.message||'')); return; }
  if(document.querySelector('.rep')) repartoPintar(); else if(typeof abrirAvisos==='function') abrirAvisos();
}

// ── Avisos de grupo: el socio escucha los de su entrenador ──
let avgEscuchando='';
function avisosGrupoEscuchar(){
  const s=typeof activeSocio!=='undefined'?activeSocio:null;
  const id=(s && s.entrenadorId) || '';
  if(id===avgEscuchando || !fbListo || !fbDB) return;
  if(avgEscuchando){ try{ fbDB.ref('/avisosGrupo/'+avgEscuchando).off('value'); }catch(e){} }
  avgEscuchando=id;
  if(!id) return;
  fbDB.ref('/avisosGrupo/'+id).on('value', sn=>{
    if(!DB.avisosGrupo) DB.avisosGrupo={};
    DB.avisosGrupo[id]=sn.val()||{};
    try{ avisosPintar(); }catch(e){}
  }, ()=>{ avgEscuchando=''; });
}
// El entrenador escucha los suyos para verlos en su panel
let avgMioEscuchando='';
function avisosGrupoMios(){
  const id=staffActivoEntId; if(!id || avgMioEscuchando===id || !fbListo || !fbDB) return;
  avgMioEscuchando=id;
  fbDB.ref('/avisosGrupo/'+id).on('value', sn=>{
    if(!DB.avisosGrupo) DB.avisosGrupo={};
    DB.avisosGrupo[id]=sn.val()||{};
    if(document.querySelector('.av-grupo')) abrirAvisos();
  }, ()=>{ avgMioEscuchando=''; });
}
function avisosDeGrupo(id){
  const g=(DB.avisosGrupo&&DB.avisosGrupo[id])||{};
  return Object.keys(g).map(k=>Object.assign({id:k},g[k],{grupo:id})).filter(x=>x&&x.titulo);
}
['refreshDash'].forEach(fn=>{
  if(typeof window[fn]!=='function') return;
  const orig=window[fn];
  window[fn]=function(){ const r=orig.apply(this,arguments); try{ avisosGrupoEscuchar(); }catch(e){} return r; };
});
