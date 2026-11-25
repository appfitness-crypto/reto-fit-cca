/* ═══ Reto Fit CCA: paso de clases grupales en dos pantallas cortas ═══
   Módulo cargado por index.html después de js/72 y js/73 (script clásico: comparte el ámbito global). Estilos en css/cuestionario.css (.cg-*).
   Misma lógica y mismo guardado que js/72 (máximo 2 clases por día, mínimo de días con gym, avisos); solo cambia cómo se ve:
   1) Tus clases: agrupadas por cómo van con su objetivo (la explicación una vez por grupo), cada clase en un renglón;
      al marcarla se abren sus días, con un puntito en los días que eligió para el gym.
   2) Tu semana: la semana en 7 casillas, el conteo de días con gym en una barra, solo los días que piden decidir
      "Clase + gym" o "Solo la clase", y lo que ya quedó junto en pocos renglones. ═══ */

let CG_VISTA='clases';
const CG_ICO={
  gym:'<svg class="cg-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/></svg>',
  grupo:'<svg class="cg-i" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="7.5" r="3"/><path d="M6.5 19.5v-.8a5.5 5.5 0 0 1 11 0v.8"/><circle cx="5" cy="9.5" r="2"/><path d="M1.8 17.5v-.4A3.4 3.4 0 0 1 5.6 13.7"/><circle cx="19" cy="9.5" r="2"/><path d="M22.2 17.5v-.4a3.4 3.4 0 0 0-3.8-3.4"/></svg>',
  ok:'<svg class="cg-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
  warn:'<svg class="cg-i" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4 2.8 20h18.4L12 4Z"/><path d="M12 10v4.5M12 17.2v.3"/></svg>'
};
// La figura de palitos de js/72 también pasa a ser el grupo
if(typeof CL_ICO!=='undefined') CL_ICO.clase=CG_ICO.grupo;

const CG_GRUPOS=[['c','Te convienen'],['m','Con moderación'],['x','Complemento']];
function cgMin(){ return Math.min(clMinGym(), (qAnswers.diasSemana||[]).length||clMinGym()); }
function cgNomDia(d){ return CL_DIAS.find(z=>z[0]===d)[2]; }
function cgCortos(ds){ return CL_DIAS.filter(z=>ds.includes(z[0])).map(z=>z[1]); }

// ── 1) Tus clases ──
function cgClaseHTML(nm){
  const on=qAnswers.clasesSel.includes(nm), ds=qAnswers.claseDias[nm]||[], gym=qAnswers.diasSemana||[], n=esc2(nm);
  const dias=on?`<div class="cg-dias" role="group" aria-label="Días de ${esc(nm)}">${CL_DIAS.map(([d,lb])=>{
      const sel=ds.includes(d), lleno=!sel&&clClasesDelDia(d).length>=CL_MAX_DIA;
      return `<button type="button" class="cg-d${sel?' on':''}${gym.includes(d)?' g':''}${lleno?' lleno':''}" aria-pressed="${sel}"${lleno?' aria-disabled="true"':''} aria-label="${CL_DIAS.find(z=>z[0]===d)[2]}${gym.includes(d)?', día de gym':''}" onclick="clDia('${n}','${d}')">${lb}</button>`; }).join('')}</div>
    <p class="cg-ley">${ds.length?'<i></i>Días que elegiste para el gym':'<b>Marca qué días tomas esta clase.</b>'}</p>`:'';
  return `<div class="cg-cl${on?' on':''}"><button type="button" class="cg-h" aria-expanded="${on}" onclick="clClase('${n}')">
      <span class="cg-box">${on?CG_ICO.ok:''}</span><span class="cg-nm">${esc(nm)}</span>${on&&ds.length?`<span class="cg-ds">${cgCortos(ds).join(' · ')}</span>`:''}</button>${dias}</div>`;
}
function cgClasesHTML(){
  const nombres=typeof CLASES_GRUPALES_OPC!=='undefined'?CLASES_GRUPALES_OPC:[];
  const obj=qAnswers.objetivo, conTips=!!CL_TIPS[obj];
  if(!conTips) return `<div class="cg-grp"><div class="cg-lst">${nombres.map(cgClaseHTML).join('')}</div></div>`;
  return CG_GRUPOS.map(([k,lb])=>{
    const ns=nombres.filter(nm=>{ const t=clTip(nm); return (t?t.k:'x')===k; }); if(!ns.length) return '';
    return `<section class="cg-grp k-${k}"><h3 class="cg-gh"><b>${lb}</b><small>${esc((CL_TIP_TXT[k][obj]||'').replace(/\.$/,''))}</small></h3>
      <div class="cg-lst">${ns.map(cgClaseHTML).join('')}</div></section>`;
  }).join('');
}

// ── 2) Tu semana ──
function cgSemanaHTML(){
  const R=clResumen(), min=cgMin(), gymDias=qAnswers.diasSemana||[];
  const porDia={}; R.dias.forEach(x=>porDia[x.d]=x);
  const tira=CL_DIAS.map(([d,lb])=>{
    const x=porDia[d];
    if(!x) return `<div class="cg-wd off"><small>${lb}</small><span class="cg-wi">—</span></div>`;
    if(x.cl.length&&x.enGym&&!x.modo) return `<div class="cg-wd pend"><small>${lb}</small><span class="cg-wi"><b>?</b></span></div>`;
    const ic=(x.cl.length?CG_ICO.grupo:'')+(x.modo==='gym'?CG_ICO.gym:'');
    return `<div class="cg-wd ${x.modo==='gym'?'gym':'cls'}"><small>${lb}</small><span class="cg-wi">${ic}</span></div>`;
  }).join('');
  const ok=R.gym>=min, total=Math.max(gymDias.length,R.gym,min);
  const barra=Array.from({length:total},(_,i)=>`<i${i<R.gym?'':' class="e"'}></i>`).join('');
  const dec=R.dias.filter(x=>x.cl.length&&x.enGym), listos=dec.filter(x=>x.modo).length;
  const decHTML=dec.map(x=>{
    const nom=cgNomDia(x.d), clTxt=clLista(x.cl), exceso=x.cl.length>CL_MAX_DIA, av=clAvisosDia(x.cl,x.modo);
    return `<div class="cg-dec${x.modo?'':' pend'}"><div class="cg-dh"><span class="cg-dn">${nom}</span><span class="cg-dc">${esc(clTxt)}</span></div>
      <div class="cg-sw" role="radiogroup" aria-label="${nom}: ${esc(clTxt)}">
        <button type="button" role="radio" aria-checked="${x.modo==='gym'}" class="${x.modo==='gym'?'on':''}" onclick="clModo('${x.d}','gym')">Clase + gym<small>${x.cl.map(clInfo).some(clIntensa)?'Rutina corta':'Tu rutina'}</small></button>
        <button type="button" role="radio" aria-checked="${x.modo==='clase'}" class="${x.modo==='clase'?'on':''}" onclick="clModo('${x.d}','clase')">Solo la clase<small>Sin rutina de gym</small></button>
      </div>${av.map(a=>`<p class="cg-av${exceso?' mal':''}">${CG_ICO.warn}<span>${esc(a)}</span></p>`).join('')}</div>`;
  }).join('');
  // Lo que ya quedó: gym puro en un renglón; días solo de clase juntos por clase
  const puros=R.dias.filter(x=>!x.cl.length).map(x=>x.d);
  const soloCl={}; R.dias.filter(x=>x.cl.length&&!x.enGym).forEach(x=>{ const k=clLista(x.cl); (soloCl[k]=soloCl[k]||[]).push(x.d); });
  const fijos=(puros.length?`<div class="cg-fr"><span class="cg-fi">${CG_ICO.gym}</span><span class="cg-ft"><b>Gimnasio</b><small>Tu rutina completa</small></span><span class="cg-fd">${cgCortos(puros).join(' · ')}</span></div>`:'')
    +Object.entries(soloCl).map(([k,ds])=>`<div class="cg-fr"><span class="cg-fi c">${CG_ICO.grupo}</span><span class="cg-ft"><b>Solo ${esc(k)}</b><small>No elegiste ${ds.length>1?'estos días':'este día'} para el gym</small></span><span class="cg-fd">${cgCortos(ds).join(' · ')}</span></div>`).join('');
  return `<h2 class="cg-t">Tu semana</h2>
    <p class="cg-s">Los días con clase y gym, dinos qué harás. <b>Solo la clase</b> = ese día no hay rutina de gym.</p>
    <div class="cg-wk">${tira}</div>
    <div class="cg-wl"><span class="g">${CG_ICO.gym}Gym</span><span class="c">${CG_ICO.grupo}Clase</span>${dec.length?'<span class="p"><b>?</b>Falta elegir</span>':''}</div>
    <div class="cg-cnt ${ok?'ok':'mal'}" role="status"><span class="cg-bar">${barra}</span><span><b>${R.gym} ${R.gym===1?'día':'días'} con gym</b> · mínimo ${min}${ok?'':'<br><small>Tu reto se mide con tus sesiones de gym: elige "Clase + gym" en algún día.</small>'}</span></div>
    ${dec.length?`<div class="cg-sec"><b>Elige qué harás</b><small>${listos} de ${dec.length} ${dec.length===1?'lista':'listas'}</small></div>${decHTML}`:''}
    ${fijos?`<div class="cg-sec"><b>Ya quedó</b></div><div class="cg-fij">${fijos}</div>`:''}`;
}

// ── Pintar, botón y resumen ──
function cgResumenTxt(){
  if(qAnswers.tomaClases!=='si') return '';
  if(CG_VISTA==='clases'){
    const sel=qAnswers.clasesSel; if(!sel.length) return 'Marca las clases que tomas';
    const sin=sel.find(n=>!(qAnswers.claseDias[n]||[]).length); if(sin) return `Faltan los días de <b>${esc(sin)}</b>`;
    return `<b>${sel.length} ${sel.length===1?'clase':'clases'}</b> · ${sel.map(n=>esc(n)+' ('+cgCortos(qAnswers.claseDias[n]).join(', ')+')').join(' y ')}`;
  }
  const R=clResumen();
  if(R.falta.length) return `Falta elegir el <b>${clLista(R.falta.map(d=>cgNomDia(d).toLowerCase()))}</b>`;
  if(R.gym<cgMin()) return `Necesitas al menos <b>${cgMin()} días con gym</b>`;
  return '<b>Listo</b> · tu semana quedó armada';
}
clRender=window.clRender=function(){
  clEstado();
  const sc=document.getElementById('qq4c'), box=document.getElementById('clases-bloque'); if(!sc||!box) return;
  const si=qAnswers.tomaClases==='si'; if(!si) CG_VISTA='clases';
  sc.classList.toggle('cg-semana', si&&CG_VISTA==='semana');
  box.innerHTML=CG_VISTA==='semana'?cgSemanaHTML():`<div class="cg-clases">${cgClasesHTML()}</div>`;
  actualizarBotonClases();
};
actualizarBotonClases=window.actualizarBotonClases=function(){
  const btn=document.getElementById('qb4c'); if(!btn) return;
  const sc=document.getElementById('qq4c'); let res=document.getElementById('cg-res');
  if(!res&&sc){ const nav=sc.querySelector('.nav-row'); if(nav){ res=document.createElement('p'); res.id='cg-res'; res.className='cg-res'; res.setAttribute('aria-live','polite'); nav.before(res); } }
  const si=qAnswers.tomaClases==='si';
  if(res){ res.innerHTML=cgResumenTxt(); res.hidden=!si; }
  if(qAnswers.tomaClases==='no'){ btn.disabled=false; btn.textContent='Continuar'; return; }
  if(!si){ btn.disabled=true; btn.textContent='Continuar'; return; }
  clEstado();
  const R=clResumen(), clasesOk=qAnswers.clasesSel.length && qAnswers.clasesSel.every(n=>(qAnswers.claseDias[n]||[]).length) && !R.dias.some(x=>x.cl.length>CL_MAX_DIA);
  if(CG_VISTA==='clases'){ btn.textContent='Ver mi semana'; btn.disabled=!clasesOk; return; }
  btn.textContent='Continuar';
  btn.disabled=!(clasesOk && !R.falta.length && R.gym>=cgMin());
};
function cgAtras(){
  if(qAnswers.tomaClases==='si'&&CG_VISTA==='semana'){ CG_VISTA='clases'; clRender(); window.scrollTo(0,0); return; }
  mostrarSub('qq4b');
}
(function(){
  const sc=document.getElementById('qq4c'); if(!sc) return;
  const prev=sc.querySelector('.nav-row .btn-prev'); if(prev) prev.setAttribute('onclick','cgAtras()');
  // "Ver mi semana" lleva a la segunda pantalla; "Continuar" guarda como siempre (js/72)
  const o4c=qNext4c;
  window.qNext4c=qNext4c=function(){
    if(document.getElementById('qb4c').disabled) return;
    if(qAnswers.tomaClases==='si'&&CG_VISTA==='clases'){ CG_VISTA='semana'; clRender(); window.scrollTo(0,0); return; }
    return o4c.apply(this,arguments);
  };
  // Entrar al paso desde los días: empieza en Tus clases. Regresar desde la edad: vuelve a Tu semana
  const o4b=qNext4b;
  window.qNext4b=qNext4b=function(){ CG_VISTA='clases'; return o4b.apply(this,arguments); };
  const oPrev=qPrev;
  window.qPrev=qPrev=function(step){ const r=oPrev.apply(this,arguments); if(step===5&&qAnswers.tomaClases==='si'){ CG_VISTA='semana'; clRender(); } return r; };
  const oSel=qSelTomaClases;
  window.qSelTomaClases=qSelTomaClases=function(el,val){ CG_VISTA='clases'; const r=oSel.apply(this,arguments); actualizarBotonClases(); return r; };
  // El encabezado (←) también regresa de Tu semana a Tus clases
  if(typeof quizBack==='function'){
    const oq=quizBack;
    window.quizBack=quizBack=function(){ if(sc.classList.contains('on')&&qAnswers.tomaClases==='si'&&CG_VISTA==='semana'){ cgAtras(); return; } return oq.apply(this,arguments); };
  }
})();
