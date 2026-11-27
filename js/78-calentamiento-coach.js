/* ═══ Reto Fit CCA: calentamiento del entrenador ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global). Estilos en css/estilos.css (.cal-*).
   · El entrenador escribe en Mi filosofía (paso "Anatomía de tu sesión") cómo inicia su sesión: pasos con nombre,
     cantidad, nota y a qué días aplican (todos · pierna · torso · cardio). Se guarda en filosofia.calentamiento.
   · En el editor de rutinas (pestaña Rutina) cada día de entreno lo muestra arriba de los ejercicios; se puede
     ajustar solo para un socio (socio.calentamiento) o volver al de la filosofía.
   · El socio lo ve en "Calienta" (js/63-plan-intro.js). Sin calentamiento propio se usa el del sistema
     (lubricación articular + 3 pasos según el tipo de día).
   · No es un ejercicio: no suma series ni carga, pero sí minutos a la duración del día (minutosDia). ═══ */

const CAL_DIAS=[['todos','Todos los días'],['pierna','Pierna'],['torso','Torso'],['cardio','Cardio'],['general','Full body y otros']];
const CAL_SUGERIDOS=[
  {t:'Lubricación articular',v:'1 min',det:'Cabeza a pies: cuello, hombros, codos, muñecas, cadera, rodillas, tobillos. 5 círculos por lado.',dias:'todos'},
  {t:'Caminadora o bici',v:'3 min',det:'Ritmo suave, que puedas platicar.',dias:'todos'},
  {t:'Sentadilla sin peso',v:'2 × 10',det:'',dias:'pierna'},
  {t:'Zancadas alternas',v:'1 × 8 por pierna',det:'',dias:'pierna'},
  {t:'Círculos de hombro',v:'2 × 10',det:'',dias:'torso'},
  {t:'Lagartijas en pared',v:'1 × 10',det:'',dias:'torso'}
];
const CAL_CHIPS=[['Sentadilla sin peso','2 × 10'],['Zancadas alternas','1 × 8 por pierna'],['Círculos de hombro','2 × 10'],['Puente de glúteo con liga','2 × 12'],['Face pull con liga','2 × 15'],['Plancha','2 × 20 s'],['Saltos de tijera','1 min']];

/* ── De dónde sale el calentamiento ── */
function calLimpia(l){ return comoArray(l).filter(p=>p&&String(p.t||'').trim()); }
function calDeCoach(ent){
  const c=ent&&ent.filosofia&&ent.filosofia.calentamiento;
  return c&&c.activo!==false?calLimpia(c.pasos):[];
}
function calTienePropio(filo){ const c=filo&&filo.calentamiento; return !!(c&&c.activo!==false&&calLimpia(c.pasos).length); }
function calFuente(s){
  const ent=s&&s.entrenadorId?getEntrenador(s.entrenadorId):null;
  const aj=s&&s.calentamiento&&calLimpia(s.calentamiento.pasos);
  if(aj&&aj.length) return {pasos:aj,fuente:'socio',ent};
  const c=calDeCoach(ent);
  if(c.length) return {pasos:c,fuente:'coach',ent};
  return {pasos:null,fuente:'sistema',ent};
}
// Pasos que tocan en un día según su tipo (pierna / torso / cardio / general)
function calPasosDia(s,d){
  const cat=introTipoCal(d&&d.tipo), f=calFuente(s);
  const pasos=f.pasos
    ? f.pasos.filter(p=>!p.dias||p.dias==='todos'||p.dias===cat)
    : [INTRO_LUB,...INTRO_CAL[cat]].map(([t,v,det])=>({t,v,det:det||''}));
  return {pasos,fuente:f.fuente,ent:f.ent};
}
// Minutos aproximados: "3 min" cuenta 3; "2 × 10" ≈ 45 s por serie; "30 s" en segundos
function calMinPaso(v){
  v=String(v||'');
  let m=v.match(/(\d+(?:[.,]\d+)?)\s*min/i); if(m) return parseFloat(m[1].replace(',','.'));
  m=v.match(/(\d+)\s*[×x]\s*(\d+)\s*s\b/i); if(m) return (+m[1])*(+m[2]+15)/60;
  m=v.match(/(\d+)\s*[×x]/i); if(m) return (+m[1])*0.75;
  m=v.match(/(\d+)\s*s\b/i); if(m) return (+m[1])/60;
  return 1;
}
function calMinutos(pasos){ return Math.max(1,Math.round(pasos.reduce((a,p)=>a+calMinPaso(p.v),0))); }

// La duración del día incluye el calentamiento
if(typeof minutosDia==='function'){
  const _mdOrig=minutosDia;
  window.minutosDia=minutosDia=function(d,s){
    const m=_mdOrig(d,s); if(!m) return m;
    try{
      const so=s||(typeof cdSocio==='function'?cdSocio():null);
      return Math.round((m+calMinutos(calPasosDia(so,d).pasos))/5)*5;
    }catch(_){ return m; }
  };
}

/* ── Editor de pasos (sirve para la filosofía y para el ajuste de un socio) ──
   ref 'f' = filoDraft.calentamiento · ref 's:CODE' = socio.calentamiento */
function calRefLista(ref){
  if(ref==='f'){
    if(!filoDraft.calentamiento||typeof filoDraft.calentamiento!=='object') filoDraft.calentamiento={activo:true,pasos:[]};
    filoDraft.calentamiento.pasos=comoArray(filoDraft.calentamiento.pasos);
    return filoDraft.calentamiento.pasos;
  }
  const s=getSocio(ref.slice(2)); if(!s) return [];
  if(!s.calentamiento) s.calentamiento={pasos:[]};
  s.calentamiento.pasos=comoArray(s.calentamiento.pasos);
  return s.calentamiento.pasos;
}
function calTocado(ref){ if(ref!=='f'&&typeof staffDirty!=='undefined') staffDirty.add(ref.slice(2)); }
function calRepintar(ref){
  if(ref==='f'){ const el=document.getElementById('cal-ed-f'); if(el) el.outerHTML=calEdHTML('f'); return; }
  rtRefrescar(ref.slice(2));
}
function calEdHTML(ref){
  const l=calRefLista(ref), q=`'${esc(ref)}'`;
  const fila=(p,i)=>`<div class="cal-row">
      <div class="cal-row-a">
        <input class="cal-in cal-t" value="${esc(p.t||'')}" placeholder="Paso, ej. Lubricación articular" aria-label="Nombre del paso ${i+1}" onchange="calSet(${q},${i},'t',this.value)">
        <input class="cal-in cal-v" value="${esc(p.v||'')}" placeholder="1 min" aria-label="Cantidad del paso ${i+1}" onchange="calSet(${q},${i},'v',this.value)">
      </div>
      <input class="cal-in cal-d" value="${esc(p.det||'')}" placeholder="Nota corta (opcional)" aria-label="Nota del paso ${i+1}" onchange="calSet(${q},${i},'det',this.value)">
      <div class="cal-row-b">
        <select class="cal-in cal-s" aria-label="Días del paso ${i+1}" onchange="calSet(${q},${i},'dias',this.value)">${CAL_DIAS.map(([v,t])=>`<option value="${v}"${(p.dias||'todos')===v?' selected':''}>${t}</option>`).join('')}</select>
        <button type="button" class="cal-ib" aria-label="Subir" ${i?'':'disabled'} onclick="calMover(${q},${i},-1)">${ico('up')}</button>
        <button type="button" class="cal-ib dn" aria-label="Bajar" ${i<l.length-1?'':'disabled'} onclick="calMover(${q},${i},1)">${ico('up')}</button>
        <button type="button" class="cal-ib" aria-label="Quitar paso" onclick="calQuitar(${q},${i})">${ico('trash')}</button>
      </div>
    </div>`;
  const usados=new Set(l.map(p=>String(p.t||'').toLowerCase()));
  const chips=CAL_CHIPS.filter(([t])=>!usados.has(t.toLowerCase()));
  return `<div class="cal-ed" id="cal-ed-${ref==='f'?'f':'s'}">
    ${l.length?l.map(fila).join(''):`<div class="cal-vacio"><p>Aún no escribes tu calentamiento. Puedes partir del sugerido y cambiarlo a tu manera.</p>
      <button type="button" class="sd-b p" onclick="calSugerido(${q})">${ico('spark')}Empezar con el sugerido</button></div>`}
    <button type="button" class="cal-add" onclick="calAgregar(${q})">${ico('plus')}Agregar paso</button>
    ${chips.length?`<div class="cal-chips">${chips.map(([t,v])=>`<button type="button" onclick="calAgregar(${q},'${esc(t)}','${esc(v)}')">${ico('plus')}${esc(t)}</button>`).join('')}</div>`:''}
  </div>`;
}
function calSet(ref,i,campo,val){ const l=calRefLista(ref); if(!l[i]) return; l[i][campo]=String(val||'').trim(); calTocado(ref); }
function calMover(ref,i,dir){ const l=calRefLista(ref), j=i+dir; if(!l[i]||!l[j]) return; [l[i],l[j]]=[l[j],l[i]]; calTocado(ref); calRepintar(ref); }
function calQuitar(ref,i){ const l=calRefLista(ref); l.splice(i,1); calTocado(ref); calRepintar(ref); }
function calAgregar(ref,t,v){
  calRefLista(ref).push({t:t||'',v:v||'',det:'',dias:'todos'}); calTocado(ref); calRepintar(ref);
  if(!t) setTimeout(()=>{ const ins=document.querySelectorAll('.cal-ed .cal-t'); ins[ins.length-1]?.focus(); },30);
}
function calSugerido(ref){ const l=calRefLista(ref); l.splice(0,l.length,...JSON.parse(JSON.stringify(CAL_SUGERIDOS))); calTocado(ref); calRepintar(ref); }

/* ── Mi filosofía: bloque "Cómo inicias tu sesión" ── */
function calFiloHTML(){
  calRefLista('f');
  const on=filoDraft.calentamiento.activo!==false;
  return `<div class="cal-filo">
    <div class="q-sub" style="margin:4px 0 4px">Cómo inicias tu sesión</div>
    <p class="cal-ayuda">Escribe tu calentamiento tal como lo haces con tus socios. Se pone solo al inicio de cada día de entreno, de lunes a domingo, en las rutinas de todos tus socios.</p>
    <label class="cal-sw"><span><b>Usarlo en todas mis rutinas</b><small>Si lo apagas, se usa el calentamiento del sistema</small></span>
      <input type="checkbox" ${on?'checked':''} onchange="filoDraft.calentamiento.activo=this.checked"></label>
    ${calEdHTML('f')}
  </div>`;
}

/* ── Editor de rutinas (staff): bloque arriba de los ejercicios ── */
const calAjAbierto={};
function calPuedeEditarCoach(s){
  return !!(s&&s.entrenadorId&&((typeof staffActivoEntId!=='undefined'&&staffActivoEntId===s.entrenadorId)||staffRol==='coordinador'));
}
function calStaffHTML(s,k){
  const d=s.rutina[k], c=s.code, q=`'${esc(c)}'`;
  const {pasos,fuente,ent}=calPasosDia(s,d), cat=introTipoCal(d.tipo);
  const nom=ent?tc(ent.nombre).split(' ')[0]:'';
  const etiqueta=fuente==='socio'?'Ajustado para '+esc(tc(s.nombre).split(' ')[0]):fuente==='coach'?(calPuedeEditarCoach(s)&&staffActivoEntId===s.entrenadorId?'De tu filosofía':'De la filosofía de '+esc(nom)):'Del sistema';
  const diaTxt={pierna:'Solo días de pierna',torso:'Solo días de torso',cardio:'Solo días de cardio',general:'Solo días full body'};
  if(calAjAbierto[c]&&fuente==='socio'){
    return `<section class="cal-st edit" aria-label="Calentamiento de este socio">
      <div class="cal-st-h"><b>Calentamiento</b><small>Ajustado para ${esc(tc(s.nombre).split(' ')[0])}</small></div>
      <p class="cal-ayuda">Solo cambia en la rutina de este socio. Cada paso aplica a los días que elijas. Presiona Guardar cambios para que lo vea.</p>
      ${calEdHTML('s:'+c)}
      <div class="cal-st-f"><button type="button" onclick="calVolverFilo(${q})">Volver al de la filosofía</button><button type="button" class="p" onclick="calAjCerrar(${q})">Listo</button></div>
    </section>`;
  }
  return `<section class="cal-st" aria-label="Calentamiento del día">
    <div class="cal-st-h"><b>Calentamiento</b><small>${etiqueta} · ${calMinutos(pasos)} min</small></div>
    ${pasos.length?pasos.map(p=>`<div class="cal-mini"><span>${esc(p.t)}${p.det||(p.dias&&p.dias!=='todos')?`<em>${esc(p.dias&&p.dias!=='todos'?diaTxt[p.dias]||'':p.det)}</em>`:''}</span><small>${esc(p.v||'')}</small></div>`).join('')
      :`<p class="cal-ayuda">Ningún paso aplica a este día (${esc(cat)}).</p>`}
    <div class="cal-st-f">
      <button type="button" onclick="calAjustar(${q})">${fuente==='socio'?'Editar ajuste':'Ajustar para '+esc(tc(s.nombre).split(' ')[0])}</button>
      ${calPuedeEditarCoach(s)?`<button type="button" onclick="calEditarCoach(${q})">${fuente==='sistema'?'Escribir mi calentamiento':'Editar mi calentamiento'}</button>`:''}
    </div>
  </section>`;
}
function calAjustar(code){
  const s=getSocio(code); if(!s) return;
  if(!(s.calentamiento&&calLimpia(s.calentamiento.pasos).length)){
    const f=calFuente(s);
    // copia completa (todos los días) del calentamiento vigente para editarlo a la medida
    const base=f.pasos||[{t:INTRO_LUB[0],v:INTRO_LUB[1],det:INTRO_LUB[2],dias:'todos'},
      ...Object.entries(INTRO_CAL).flatMap(([k,l])=>l.map(([t,v])=>({t,v,det:'',dias:k})))];
    s.calentamiento={pasos:JSON.parse(JSON.stringify(base))};
    staffDirty.add(code);
  }
  calAjAbierto[code]=true; rtRefrescar(code);
}
function calAjCerrar(code){
  const s=getSocio(code);
  if(s&&s.calentamiento&&!calLimpia(s.calentamiento.pasos).length){ delete s.calentamiento; staffDirty.add(code); }
  calAjAbierto[code]=false; rtRefrescar(code);
}
function calVolverFilo(code){
  const s=getSocio(code); if(!s) return;
  delete s.calentamiento; staffDirty.add(code); calAjAbierto[code]=false; rtRefrescar(code);
  showToast('Vuelve al calentamiento de la filosofía. Presiona Guardar cambios para confirmarlo');
}
function calEditarCoach(code){
  const s=getSocio(code); if(!s||!s.entrenadorId) return;
  abrirMiFilosofia(s.entrenadorId===staffActivoEntId?undefined:s.entrenadorId);
  const i=FILO_PASOS.indexOf('anatomia'); if(i>=0){ filoStep=i+1; renderFiloStep(); }
}
