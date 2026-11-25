/* ═══ Reto Fit CCA: clases grupales sin confusiones y "rehacer el cuestionario" ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global). Estilos en css/cuestionario.css.
   1) Paso de clases del cuestionario (qq4c), en dos partes:
      · Qué clases tomas: cada clase trae una pista según su objetivo (te conviene / con moderación / complemento)
        y sus días. Máximo 2 clases por día.
      · Tu semana: por cada día con clase se elige, sin opción marcada de antemano, entre "Clase + entreno"
        (también hace su rutina de gym) o "Solo la clase". Se exige un mínimo de días con gimnasio (GYM.reto.minDiasGym, 2),
        porque el reto se mide con las sesiones de gym. Avisa combinaciones que no convienen el mismo día.
      · Se guarda igual que antes (clasesGrupales con entrenaMismoDia), partiendo una clase en dos entradas si
        unos días lleva entreno y otros no, así todo lo que ya lee clasesGrupales sigue funcionando.
      · Corrige que con 2 clases el mismo día solo se guardaba una (js/01 y js/31 ahora juntan los nombres).
   2) "Pedir que rehaga su cuestionario" (ficha del socio → Datos): el staff escribe el motivo y la próxima vez que el socio
      entra ve "Ajustemos tu plan". El cuestionario se abre lleno con sus respuestas, conserva a su entrenador, y al
      confirmar se REESCRIBE el mismo socio: cambia perfil y rutina; conserva cuenta, historial, mediciones, chat,
      puntos, mascota, mensualidad y nutrición. Las respuestas anteriores quedan en s.cuestionarios. ═══ */

// ═════════════ Reglas y pistas ═════════════
function clMinGym(){ const n=+(GYM.reto&&GYM.reto.minDiasGym); return n>0?n:2; }
const CL_MAX_DIA=2;
const CL_DIAS=[['lun','Lun','Lunes'],['mar','Mar','Martes'],['mie','Mié','Miércoles'],['jue','Jue','Jueves'],['vie','Vie','Viernes'],['sab','Sáb','Sábado'],['dom','Dom','Domingo']];
// Pista por objetivo: c = te conviene, m = con moderación, x = complemento
const CL_TIPS={
  'PERDER PESO':{body_combat:'c',spinning:'c',rpm:'c',bootcamp:'c',funcional:'c',body_pump:'m',trx:'m',fit_mom:'m',yoga:'x',body_balance:'x',acond_am:'x'},
  'GANAR MÚSCULO':{body_pump:'c',trx:'c',funcional:'m',fit_mom:'m',bootcamp:'m',body_combat:'m',spinning:'m',rpm:'m',yoga:'x',body_balance:'x',acond_am:'x'},
  'RECOMPOSICIÓN CORPORAL':{body_pump:'c',trx:'c',funcional:'c',fit_mom:'c',body_combat:'m',spinning:'m',rpm:'m',bootcamp:'m',yoga:'x',body_balance:'x',acond_am:'x'}
};
const CL_TIP_TXT={
  c:{lb:'Te conviene', 'PERDER PESO':'Mucho gasto de energía: suma a tu meta de bajar grasa.', 'GANAR MÚSCULO':'Trabaja fuerza: apoya tu ganancia de músculo.', 'RECOMPOSICIÓN CORPORAL':'Fuerza y gasto a la vez: va con tu meta.'},
  m:{lb:'Con moderación', 'PERDER PESO':'Suma, pero no sustituye tu rutina de fuerza.', 'GANAR MÚSCULO':'Mucho cardio frena la ganancia de músculo: 1 o 2 por semana.', 'RECOMPOSICIÓN CORPORAL':'Bien 1 o 2 por semana; más te quita recuperación.'},
  x:{lb:'Complemento', 'PERDER PESO':'Movilidad y recuperación: no cuenta como entreno fuerte.', 'GANAR MÚSCULO':'Movilidad y recuperación: no cuenta como entreno fuerte.', 'RECOMPOSICIÓN CORPORAL':'Movilidad y recuperación: no cuenta como entreno fuerte.'}
};
function clInfo(nm){ return (typeof KB_CLASES_IDX!=='undefined'&&KB_CLASES_IDX[nm])||null; }
function clTip(nm){
  const c=clInfo(nm), m=CL_TIPS[qAnswers.objetivo]; if(!c||!m||!m[c.id]) return null;
  const k=m[c.id]; return {k, lb:CL_TIP_TXT[k].lb, txt:CL_TIP_TXT[k][qAnswers.objetivo]||''};
}
function clPierna(c){ return !!c && c.tipo!=='flexibilidad' && c.tipo!=='bajo_impacto' && (c.enfoque||[]).some(e=>['cuadriceps','gluteo','femoral','pierna'].includes(e)); }
function clIntensa(c){ return !!c && !['flexibilidad','bajo_impacto'].includes(c.tipo) && c.id!=='trx'; }

// ═════════════ Estado del paso ═════════════
// qAnswers.clasesSel: nombres · qAnswers.claseDias: {nombre:[días]} · qAnswers.diaModo: {día:'gym'|'clase'}
function clEstado(){
  if(!Array.isArray(qAnswers.clasesSel)) qAnswers.clasesSel=[];
  if(!qAnswers.claseDias||typeof qAnswers.claseDias!=='object') qAnswers.claseDias={};
  if(!qAnswers.diaModo||typeof qAnswers.diaModo!=='object') qAnswers.diaModo={};
  // Respuestas en el formato viejo (clasesGrupales con entrenaMismoDia por clase): se pasan a días
  if(!qAnswers._clMigrado){
    (qAnswers.clasesGrupales||[]).forEach(c=>{
      if(!c||!c.clase) return;
      if(!qAnswers.clasesSel.includes(c.clase)) qAnswers.clasesSel.push(c.clase);
      const ds=qAnswers.claseDias[c.clase]||(qAnswers.claseDias[c.clase]=[]);
      (c.dias||[]).forEach(d=>{ if(!ds.includes(d)) ds.push(d); if(qAnswers.diaModo[d]==null&&c.entrenaMismoDia!=null&&c.modoFijado) qAnswers.diaModo[d]=c.entrenaMismoDia?'gym':'clase'; });
    });
    qAnswers._clMigrado=true;
  }
}
function clClasesDelDia(d){ return qAnswers.clasesSel.filter(n=>(qAnswers.claseDias[n]||[]).includes(d)); }
function clResumen(){
  const gymDias=qAnswers.diasSemana||[], res={gym:0, falta:[], dias:[]};
  CL_DIAS.forEach(([d])=>{
    const cl=clClasesDelDia(d), enGym=gymDias.includes(d);
    if(!cl.length&&!enGym) return;
    let modo=!cl.length?'gym':enGym?(qAnswers.diaModo[d]||''):'clase';
    if(cl.length&&enGym&&!modo) res.falta.push(d);
    if(modo==='gym') res.gym++;
    res.dias.push({d, cl, enGym, modo});
  });
  return res;
}
function clLista(a){ return a.length<=1?(a[0]||''):a.slice(0,-1).join(', ')+' y '+a[a.length-1]; }
function clAvisosDia(cl,modo){
  const C=cl.map(clInfo).filter(Boolean), out=[];
  if(cl.length>CL_MAX_DIA) return ['Tienes '+cl.length+' clases este día: deja máximo '+CL_MAX_DIA+'. Quita los días que sobran en la lista de arriba.'];
  if(C.length>=2){
    if(C.filter(clPierna).length>=2) out.push('Dos clases de pierna el mismo día: tu pierna no alcanza a recuperarse.');
    else if(C.filter(clIntensa).length>=2) out.push('Dos clases intensas seguidas. Mejor combina una intensa con una de bajo impacto (Yoga o Body Balance).');
  }
  if(modo==='gym'&&C.some(clIntensa)) out.push('Ese día tu rutina de gym será corta y no repite los músculos de la clase.');
  if(modo==='gym'&&C.length>=2) out.push('Dos clases y gym el mismo día es mucho: considera dejarlo en "Solo la clase".');
  return out;
}

// ═════════════ Pintar el paso ═════════════
const CL_ICO={
  gym:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  clase:'<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2.2" fill="currentColor"/><path d="M12 8v6m0 0-3.5 6M12 14l3.5 6M6.5 10.5 12 9l5.5 1.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  warn:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.8 20h18.4L12 4Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 10v4.5M12 17.2v.3" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  ok:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>'
};
function clRender(){
  clEstado();
  const box=document.getElementById('clases-bloque'); if(!box) return;
  const nombres=typeof CLASES_GRUPALES_OPC!=='undefined'?CLASES_GRUPALES_OPC:[];
  const lista=nombres.map(nm=>{
    const on=qAnswers.clasesSel.includes(nm), t=clTip(nm), ds=qAnswers.claseDias[nm]||[];
    const dias=on?`<div class="cl-dias" role="group" aria-label="Días de ${esc(nm)}">${CL_DIAS.map(([d,lb])=>{
        const lleno=!ds.includes(d)&&clClasesDelDia(d).length>=CL_MAX_DIA;
        return `<button type="button" class="cl-d${ds.includes(d)?' on':''}${lleno?' lleno':''}" aria-pressed="${ds.includes(d)}" ${lleno?'aria-disabled="true"':''} onclick="clDia('${esc2(nm)}','${d}')">${lb}</button>`; }).join('')}</div>
      ${ds.length?'':'<p class="cl-pide">Marca qué días tomas esta clase.</p>'}`:'';
    return `<div class="cl-it${on?' on':''}">
      <button type="button" class="cl-h" aria-expanded="${on}" onclick="clClase('${esc2(nm)}')">
        <span class="cl-box">${on?CL_ICO.ok:''}</span>
        <span class="cl-nm"><b>${esc(nm)}</b>${t?`<small>${esc(t.txt)}</small>`:''}</span>
        ${t?`<span class="cl-tip k-${t.k}">${esc(t.lb)}</span>`:''}
      </button>${dias}</div>`;
  }).join('');
  const R=clResumen(), min=Math.min(clMinGym(), (qAnswers.diasSemana||[]).length||clMinGym());
  const filas=R.dias.map(x=>{
    const nom=CL_DIAS.find(z=>z[0]===x.d)[2], clTxt=clLista(x.cl), exceso=x.cl.length>CL_MAX_DIA;
    if(!x.cl.length) return `<li class="cl-sem gym"><span class="cl-dn">${nom}</span><span class="cl-fijo">${CL_ICO.gym}<b>Gimnasio</b><small>Tu rutina completa</small></span></li>`;
    if(!x.enGym) return `<li class="cl-sem"><span class="cl-dn">${nom}</span><span class="cl-fijo">${CL_ICO.clase}<b>Solo ${esc(clTxt)}</b><small>No elegiste este día para el gym</small></span></li>`;
    const av=clAvisosDia(x.cl,x.modo);
    return `<li class="cl-sem${x.modo&&!exceso?'':' pend'}${exceso?' exceso':''}"><span class="cl-dn">${nom}</span>
      <div class="cl-elige" role="radiogroup" aria-label="${nom}: ${esc(clTxt)}">
        <button type="button" role="radio" aria-checked="${x.modo==='gym'}" class="cl-op${x.modo==='gym'?' on':''}" onclick="clModo('${x.d}','gym')">
          <span class="cl-op-i">${CL_ICO.clase}<em>+</em>${CL_ICO.gym}</span><b>Clase + entreno</b><small>Harás ${esc(clTxt)} y también tu rutina de gym</small></button>
        <button type="button" role="radio" aria-checked="${x.modo==='clase'}" class="cl-op${x.modo==='clase'?' on':''}" onclick="clModo('${x.d}','clase')">
          <span class="cl-op-i">${CL_ICO.clase}</span><b>Solo la clase</b><small>Harás ${esc(clTxt)}; ese día no entrenas en el gym</small></button>
      </div>
      ${x.modo?'':`<p class="cl-pide">Elige una opción para el ${nom.toLowerCase()}.</p>`}
      ${av.map(a=>`<p class="cl-av${exceso?' mal':''}">${CL_ICO.warn}<span>${esc(a)}</span></p>`).join('')}</li>`;
  }).join('');
  const okGym=R.gym>=min, hayClases=qAnswers.clasesSel.length>0;
  box.innerHTML=`
    <h3 class="cl-t">¿Cuáles tomas?</h3>
    <p class="cl-s">Máximo ${CL_MAX_DIA} clases el mismo día.${qAnswers.objetivo&&CL_TIPS[qAnswers.objetivo]?' La etiqueta te dice cómo va cada clase con tu objetivo.':''}</p>
    <div class="cl-lista">${lista}</div>
    ${hayClases&&R.dias.length?`
    <h3 class="cl-t">Tu semana</h3>
    <p class="cl-s">Los días que tienes clase y elegiste para el gym, dinos qué harás. Si eliges <b>Solo la clase</b>, ese día no hay rutina de gym.</p>
    <div class="cl-cuenta ${okGym?'ok':'mal'}" role="status">${okGym?CL_ICO.ok:CL_ICO.warn}<span><b>${R.gym} ${R.gym===1?'día':'días'} con gimnasio</b> · mínimo ${min}${okGym?'':'. Tu reto se mide con tus sesiones de gym: elige "Clase + entreno" en algún día o deja días sin clase.'}</span></div>
    <ul class="cl-semana">${filas}</ul>`:''}`;
  actualizarBotonClases();
}
function clClase(nm){
  clEstado();
  const i=qAnswers.clasesSel.indexOf(nm);
  if(i>=0){ qAnswers.clasesSel.splice(i,1); delete qAnswers.claseDias[nm]; }
  else { qAnswers.clasesSel.push(nm); qAnswers.claseDias[nm]=qAnswers.claseDias[nm]||[]; }
  clLimpiarModos(); clRender();
}
function clDia(nm,d){
  clEstado(); const ds=qAnswers.claseDias[nm]||(qAnswers.claseDias[nm]=[]), i=ds.indexOf(d);
  if(i>=0) ds.splice(i,1);
  else {
    if(clClasesDelDia(d).length>=CL_MAX_DIA){ showToast('Máximo '+CL_MAX_DIA+' clases el mismo día: quita otra para agregar esta'); return; }
    ds.push(d);
  }
  clLimpiarModos(); clRender();
}
function clModo(d,m){ clEstado(); qAnswers.diaModo[d]=m; clRender(); }
function clLimpiarModos(){ Object.keys(qAnswers.diaModo).forEach(d=>{ if(!clClasesDelDia(d).length) delete qAnswers.diaModo[d]; }); }
// De días a clasesGrupales (formato que lee el resto de la app)
function clAClasesGrupales(){
  clEstado(); const gymDias=qAnswers.diasSemana||[], out=[];
  qAnswers.clasesSel.forEach(nm=>{
    const ds=(qAnswers.claseDias[nm]||[]).slice(); if(!ds.length) return;
    const conGym=ds.filter(d=>gymDias.includes(d)&&qAnswers.diaModo[d]==='gym'), sin=ds.filter(d=>!conGym.includes(d));
    if(conGym.length) out.push({clase:nm, dias:conGym, entrenaMismoDia:true, modoFijado:true});
    if(sin.length) out.push({clase:nm, dias:sin, entrenaMismoDia:false, modoFijado:true});
  });
  qAnswers.clasesGrupales=out;
}

// ═════════════ Reemplazos del cuestionario (js/07) ═════════════
(function(){
  window.abrirClasesGrupales=abrirClasesGrupales=function(){ clRender(); };
  window.renderClasesDetalle=renderClasesDetalle=function(){ clRender(); };
  window.qChkClaseGrupal=qChkClaseGrupal=function(el,nombre){ clClase(nombre); };
  window.actualizarBotonClases=actualizarBotonClases=function(){
    const btn=document.getElementById('qb4c'); if(!btn) return;
    if(qAnswers.tomaClases==='no'){ btn.disabled=false; return; }
    if(qAnswers.tomaClases!=='si'){ btn.disabled=true; return; }
    clEstado(); const R=clResumen(), min=Math.min(clMinGym(), (qAnswers.diasSemana||[]).length||clMinGym());
    btn.disabled=!(qAnswers.clasesSel.length && qAnswers.clasesSel.every(n=>(qAnswers.claseDias[n]||[]).length) && !R.falta.length && R.gym>=min && !R.dias.some(x=>x.cl.length>CL_MAX_DIA));
  };
  const o4c=qNext4c;
  window.qNext4c=qNext4c=function(){
    if(document.getElementById('qb4c').disabled) return;
    if(qAnswers.tomaClases==='si') clAClasesGrupales(); else { qAnswers.clasesSel=[]; qAnswers.claseDias={}; qAnswers.diaModo={}; qAnswers.clasesGrupales=[]; }
    return o4c.apply(this,arguments);
  };
  const oSel=qSelTomaClases;
  window.qSelTomaClases=qSelTomaClases=function(el,val){ oSel.apply(this,arguments); if(val==='si') clRender(); };
  // Al volver a este paso no se borra lo que ya había elegido
  window.qNext4b=qNext4b=function(){
    if(qAnswers.diasSemana.length!==qAnswers.dias) return;
    clEstado();
    const b=document.getElementById('clases-bloque'), si=qAnswers.tomaClases==='si';
    document.querySelectorAll('#qq4c .opts .opt').forEach((o,i)=>o.classList.toggle('sel', (i===0&&si)||(i===1&&qAnswers.tomaClases==='no')));
    if(b) b.style.display=si?'block':'none';
    if(si) clRender(); else actualizarBotonClases();
    mostrarSub('qq4c'); window.scrollTo(0,0);
  };
  // Rehacer: los días de gym ya elegidos se quedan marcados
  const oDias=abrirDiasSemana;
  window.abrirDiasSemana=abrirDiasSemana=function(){
    const prev=(qAnswers.diasSemana||[]).slice();
    oDias.apply(this,arguments);
    if(prev.length===qAnswers.dias){
      qAnswers.diasSemana=prev;
      document.querySelectorAll('#dias-sem-opts .chk').forEach(el=>{ const m=(el.getAttribute('onclick')||'').match(/'(\w+)'\)/); if(m&&prev.includes(m[1])) el.classList.add('ck'); });
      actualizarContadorDiasSemana();
    }
  };
})();

// ═════════════ Problemas del plan (para el staff) ═════════════
function rcProblemas(s){
  const out=[]; if(!s) return out;
  const base=(s.diasSemana&&s.diasSemana.length)?s.diasSemana:DIAS_ORDER.slice(0,s.dias||4);
  const porDia={}, modo={};
  (s.clasesGrupales||[]).forEach(c=>(c.dias||[]).forEach(d=>{ (porDia[d]=porDia[d]||[]).push(c.clase); if(c.entrenaMismoDia) modo[d]='gym'; else if(!modo[d]) modo[d]='clase'; }));
  const gym=base.filter(d=>!porDia[d]||modo[d]==='gym').length, min=Math.min(clMinGym(),base.length);
  if(gym<min) out.push(gym===0?'Sus días quedaron solo con clases: no tiene ningún día de gimnasio, así que no hay rutina ni sesiones que medir.':'Solo tiene '+gym+' día'+(gym===1?'':'s')+' de gimnasio (mínimo '+min+').');
  Object.keys(porDia).forEach(d=>{ const u=[...new Set(porDia[d])]; if(u.length>CL_MAX_DIA) out.push('El '+DIAS_NAMES[d].toLowerCase()+' marcó '+u.length+' clases ('+u.join(', ')+').'); });
  return out;
}

// ═════════════ Staff: pedir que rehaga el cuestionario ═════════════
function rcPuede(s){ return staffRol==='coordinador' || (typeof staffActivoEntId!=='undefined' && staffActivoEntId && s && s.entrenadorId===staffActivoEntId); }
function rcBloqueHTML(s){
  if(!s||s._lite) return '';
  const p=rcProblemas(s), r=s.reCuestionario, puede=rcPuede(s), c=esc(s.code);
  if(!p.length && !r) return puede?`<div class="rc-staff"><button type="button" class="fx-lnk" onclick="rcAbrir('${c}')">${ico('refresh')}Pedir que rehaga su cuestionario</button></div>`:'';
  const pend=r&&r.estado==='pendiente', hecho=r&&r.estado==='hecho';
  return `<div class="rc-staff${p.length&&!pend?' alerta':''}">
    ${p.length&&!hecho?`<div class="rc-prob">${ico('warn')}<div><b>Su planificación no funciona para el reto</b>${p.map(x=>`<span>${esc(x)}</span>`).join('')}</div></div>`:''}
    ${pend?`<div class="rc-est">${ico('clock')}<span><b>Aviso enviado</b> el ${esc(fmtFecha(r.pedido))} por ${esc(r.por||'staff')}. Lo verá la próxima vez que entre.</span></div>`:''}
    ${hecho?`<div class="rc-est ok">${ico('check')}<span><b>Rehizo su cuestionario</b> el ${esc(fmtFecha(r.hecho))}. Su plan ya se actualizó.</span></div>`:''}
    ${puede?`<div class="rc-acc">${pend?`<button type="button" class="sd-b" onclick="rcCancelar('${c}')">Cancelar aviso</button>`
      :`<button type="button" class="sd-b p" onclick="rcAbrir('${c}')">${ico('refresh')}Pedir que rehaga su cuestionario</button>`}</div>`:''}
  </div>`;
}
function rcAbrir(code){
  const s=getSocio(code); if(!s||!rcPuede(s)) return;
  const p=rcProblemas(s);
  const sug=p.length&&/clases|gimnasio/.test(p.join(' '))?'Detectamos que tu semana quedó sin una buena planificación de gimnasio: tus días están solo con clases. Vuelve a hacer tu cuestionario para armar tu rutina y tus mediciones del reto.'
    :'Vuelve a hacer tu cuestionario para ajustar tu plan con tus datos actuales.';
  let m=document.getElementById('modal-rc');
  if(!m){ m=document.createElement('div'); m.className='modal'; m.id='modal-rc'; m.onclick=e=>{ if(e.target===m) m.classList.remove('open'); }; document.body.appendChild(m); }
  m.innerHTML=`<div class="mbox rc-box" role="dialog" aria-modal="true" aria-labelledby="rc-t"><div class="mx" onclick="document.getElementById('modal-rc').classList.remove('open')" aria-label="Cerrar">✕</div>
    <div class="m-title" id="rc-t" style="font-size:var(--fs-2xl)">Pedir a ${esc(tc(String(s.nombre||'').split(' ')[0]))} que rehaga su cuestionario</div>
    <p class="rc-p">La próxima vez que entre a su app verá este mensaje con un botón para rehacerlo. El cuestionario se abre con sus respuestas, así solo cambia lo necesario. Conserva su cuenta, historial, mediciones, puntos y entrenador.</p>
    <label class="rc-l" for="rc-motivo">Mensaje para el socio</label>
    <textarea id="rc-motivo" class="rc-ta" rows="4" maxlength="400">${esc(sug)}</textarea>
    <button type="button" class="sd-pri" style="width:100%;margin-top:12px" onclick="rcEnviar('${esc(code)}')">Enviar aviso</button></div>`;
  m.classList.add('open');
}
function rcEnviar(code){
  const s=getSocio(code); if(!s||!rcPuede(s)) return;
  const t=limpiarTexto((document.getElementById('rc-motivo')||{}).value||'').slice(0,400);
  s.reCuestionario={estado:'pendiente', pedido:fechaISO(new Date()), por:pqStaffNombre(), motivo:t||'Vuelve a hacer tu cuestionario para ajustar tu plan.'};
  pqGuardarStaff(s,['reCuestionario']);
  document.getElementById('modal-rc').classList.remove('open');
  staffRenderContent(s); showToast('Aviso enviado. Lo verá la próxima vez que entre');
}
function rcCancelar(code){
  const s=getSocio(code); if(!s||!rcPuede(s)) return;
  uiConfirm('¿Cancelar el aviso? Ya no le pedirá rehacer su cuestionario.',()=>{ s.reCuestionario=null; pqGuardarStaff(s,['reCuestionario']); staffRenderContent(s); showToast('Aviso cancelado'); },{label:'Cancelar aviso'});
}

// ═════════════ Socio: aviso y cuestionario de nuevo ═════════════
let REHACER=null;            // {code} mientras el socio rehace su cuestionario
const rcMostrado={};         // una vez por sesión de la app
function rcAvisoSocio(){
  const s=typeof activeSocio!=='undefined'&&activeSocio; if(!s||(typeof VISTA_SOCIO!=='undefined'&&VISTA_SOCIO)) return;
  const r=s.reCuestionario; if(!r||r.estado!=='pendiente'||rcMostrado[s.code]) return;
  rcMostrado[s.code]=true;
  let m=document.getElementById('modal-rc-socio');
  if(!m){ m=document.createElement('div'); m.className='modal'; m.id='modal-rc-socio'; document.body.appendChild(m); }
  m.innerHTML=`<div class="mbox rc-box rc-socio" role="dialog" aria-modal="true" aria-labelledby="rcs-t">
    <div class="m-title" id="rcs-t">Ajustemos tu plan</div>
    <p class="rc-msg">${esc(r.motivo||'')}</p>
    <p class="rc-p">Tu cuestionario se abre con tus respuestas: solo cambia lo que haga falta. Tu historial, tus puntos y tu entrenador se quedan igual.${r.por?' Te lo pide '+esc(r.por)+'.':''}</p>
    <button type="button" class="sd-pri" style="width:100%" onclick="rcIniciar()">Rehacer mi cuestionario</button>
    <button type="button" class="sd-b" style="width:100%;margin-top:8px" onclick="document.getElementById('modal-rc-socio').classList.remove('open')">Más tarde</button></div>`;
  setTimeout(()=>m.classList.add('open'),500);
}
function rcPrefill(s){
  const lim=(s.limitaciones&&s.limitaciones.length)?[...s.limitaciones]:['Sin limitaciones'];
  Object.assign(qAnswers,{nombre:tc(s.nombre||''), objetivo:s.objetivoMeta||s.objetivo||'', nivel:s.nivel||'', edad:+s.edad||35, genero:s.genero||'',
    peso:Math.round(+pesoActual(s)||+s.peso||70), estatura:+s.estatura||170, dias:+s.dias||4, cintura:+s.cintura||0, actividad:s.actividad||'',
    diasSemana:[...(s.diasSemana||[])], zonas:[...(s.zonas||[])], limitaciones:lim, cardio:s.cardio||'', disciplina:s.disciplina||'', entorno:s.entorno||'',
    entrenadorId:s.entrenadorId||'', entrenadorNombre:s.asignado||'',
    clasesGrupales:(s.clasesGrupales||[]).map(c=>Object.assign({},c,{dias:[...(c.dias||[])], modoFijado:true})),
    tomaClases:(s.clasesGrupales&&s.clasesGrupales.length)?'si':'no', clasesSel:[], claseDias:{}, diaModo:{}, _clMigrado:false});
  clEstado();
}
function rcIniciar(){
  const s=activeSocio; if(!s) return;
  const m=document.getElementById('modal-rc-socio'); if(m) m.classList.remove('open');
  REHACER={code:s.code};
  if(typeof quizBorrarGuardado==='function') quizBorrarGuardado();
  if(typeof qtReiniciar==='function') qtReiniciar();
  rcPrefill(s);
  const i=document.getElementById('qi-nom'); if(i){ i.value=qAnswers.nombre; i.dispatchEvent(new Event('input')); }
  quizPintarRespuestas();
  showQStep(2); go('s-quiz'); window.scrollTo(0,0);
  showToast('Tu cuestionario trae tus respuestas: cambia solo lo necesario');
}
(function(){
  // Un registro nuevo empieza sin las clases de un cuestionario anterior en este celular
  if(typeof startQuiz==='function'){ const o=startQuiz; window.startQuiz=startQuiz=function(){ if(!REHACER){ Object.assign(qAnswers,{clasesSel:[],claseDias:{},diaModo:{},_clMigrado:false}); } return o.apply(this,arguments); }; }
  // El aviso sale al entrar el socio a su app
  if(typeof refreshDash==='function'){ const o=refreshDash; window.refreshDash=refreshDash=function(){ const r=o.apply(this,arguments); try{ rcAvisoSocio(); }catch(e){ console.warn('rc',e); } return r; }; }
  // Al rehacerlo conserva a su entrenador: no pasa por el reparto
  if(typeof qNextToTrainer==='function'){
    const o=qNextToTrainer;
    window.qNextToTrainer=qNextToTrainer=function(returnFn,prev){
      const s=REHACER&&getSocio(REHACER.code);
      if(s&&s.entrenadorId){ qAnswers.entrenadorId=s.entrenadorId; qAnswers.entrenadorNombre=s.asignado||''; return returnFn(); }
      return o.apply(this,arguments);
    };
  }
  // Confirmar: se reescribe el mismo socio conservando todo lo suyo
  if(typeof confirmarRutina==='function'){
    const o=confirmarRutina;
    window.confirmarRutina=confirmarRutina=function(){
      const code=REHACER&&REHACER.code, viejo=code&&getSocio(code);
      if(!viejo||code!==(typeof cuentaUid==='function'&&cuentaUid())) return o.apply(this,arguments);
      const ant=JSON.parse(JSON.stringify(viejo)), sv=window.dbSave;
      window.dbSave=dbSave=function(){};           // el original escribe un socio nuevo: aquí solo se arma
      let r; try{ r=o.apply(this,arguments); } finally{ window.dbSave=dbSave=sv; }
      const nuevo=getSocio(code); if(!nuevo||nuevo===viejo) return r;
      const hoy=fechaISO(new Date());
      const PERFIL=['nombre','objetivo','nivel','edad','genero','peso','estatura','dias','cintura','actividad','diasSemana','clasesGrupales','zonas','limitaciones','cardio','disciplina','lesionRehab','entorno','origenRutina','rutina','metodo','objetivoMeta','gimnasta','casa','modo'];
      const fin=JSON.parse(JSON.stringify(ant));
      PERFIL.forEach(k=>{ if(nuevo[k]!==undefined) fin[k]=nuevo[k]; else delete fin[k]; });
      fin.logs=ant.logs||{}; fin.logs.pesoCorporal=comoArray(fin.logs.pesoCorporal);
      if(+qAnswers.peso>0||+nuevo.peso>0){ const kg=+nuevo.peso; const i=fin.logs.pesoCorporal.findIndex(p=>p&&p.fecha===hoy); if(i>=0) fin.logs.pesoCorporal[i].kg=kg; else fin.logs.pesoCorporal.push({fecha:hoy,kg}); }
      if(nuevo.logs&&nuevo.logs.lesiones&&nuevo.logs.lesiones.length&&!comoArray(fin.logs.lesiones).length) fin.logs.lesiones=nuevo.logs.lesiones;
      const prevResp={}; PERFIL.filter(k=>!['rutina','metodo','gimnasta'].includes(k)).forEach(k=>{ if(ant[k]!==undefined) prevResp[k]=ant[k]; });
      fin.cuestionarios=comoArray(ant.cuestionarios).concat([{fecha:hoy, motivo:(ant.reCuestionario&&ant.reCuestionario.motivo)||'', respuestas:prevResp}]).slice(-5);
      fin.rutinaAnterior={fecha:hoy, rutina:ant.rutina||null};
      fin.reCuestionario=Object.assign({},ant.reCuestionario||{}, {estado:'hecho', hecho:hoy});
      DB.socios[code]=fin; activeSocio=fin; dbSave(code);
      REHACER=null;
      const ps=document.getElementById('pend-sub'); if(ps) ps.textContent='Tu plan se actualizó con tus nuevas respuestas. Tu historial, tus mediciones, tus puntos y tu entrenador se quedan igual.';
      return r;
    };
  }
  // Ficha del staff: problemas detectados y el botón, al final de Datos
  if(typeof fxDatosHTML==='function'){
    const o=fxDatosHTML;
    window.fxDatosHTML=fxDatosHTML=function(s){
      const h=o.apply(this,arguments), b=rcBloqueHTML(s); if(!b) return h;
      const i=h.lastIndexOf('</div></section>'); return i>0?h.slice(0,i)+b+h.slice(i):h+b;
    };
  }
})();
