/* ═══ Reto Fit CCA: marcado de clases y actividad medida ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global). Estilos en css/plan-nutri.css.
   1) Inicio del socio: los días que tiene clase en su plan (clasesGrupales) aparece "Hoy te toca …" con Sí fui / No fui
      por cada clase (y la de ayer si no la marcó). Solo las clases de su plan; no se agregan otras. Se guarda en
      s.logs.clases = [{fecha, clase, fue, ts}]. Las clases marcadas NO suman puntos del reto: solo sirven para calorías.
   2) Actividad medida: semanas 1 a 4 se usa el factor fijo (+0.05 por día de entreno, js/03). Desde la semana 5, con al
      menos 3 registros de cada día de la semana, el gasto de ese día es el promedio de lo que realmente hizo:
      · rutina de gym: (MET 4 − 1) × peso × horas (60 min si no hay duración) + cardio registrado (MET 7)
      · clase: (MET de la clase − 1) × peso × 1 h
      El factor queda: base del trabajo + gasto promedio por día / basal, sin bajar más de 15 % del estimado
      (por si olvidó marcar). Se ve en Requerimientos (paso 2a) y en el Dietocálculo del plan del nutriólogo,
      que puede usarlo o fijar otro. La recalibración con el peso (2b) sigue corrigiendo lo que falte. ═══ */

const AM_SEMANAS_FIJO=4, AM_MIN_REG=3, AM_TOPE_BAJA=0.15;   // reglas de diseño: revisar con nutrición
const AM_MET_GYM=4, AM_MET_CARDIO=7, AM_MIN_GYM=60;
// MET aproximado por clase (Compendio de actividad física). Gasto extra = (MET − 1) × kg × horas.
const AM_MET_CLASE={body_combat:7.3, spinning:7, rpm:7, bootcamp:8, funcional:6, body_pump:5, trx:5, fit_mom:5, yoga:2.5, body_balance:2.5, acond_am:3};
const AM_DIAS=[['lun','Lun'],['mar','Mar'],['mie','Mié'],['jue','Jue'],['vie','Vie'],['sab','Sáb'],['dom','Dom']];
const AM_JS=['dom','lun','mar','mie','jue','vie','sab'];

function amClasesPlan(s,dia){ const out=[]; comoArray(s&&s.clasesGrupales).forEach(c=>{ if(c&&(c.dias||[]).includes(dia)&&!out.includes(c.clase)) out.push(c.clase); }); return out; }
function amMarcas(s){ return comoArray(s&&s.logs&&s.logs.clases); }
function amMarca(s,fecha,clase){ return amMarcas(s).find(x=>x&&x.fecha===fecha&&x.clase===clase)||null; }
function amEntrenaMismoDia(s,dia){ return comoArray(s&&s.clasesGrupales).some(c=>c&&c.entrenaMismoDia&&(c.dias||[]).includes(dia)); }

// ═════════════ 1) Marcado en el Inicio del socio ═════════════
function amTarjetaHTML(s){
  if(!s||!comoArray(s.clasesGrupales).length) return '';
  const hoy=new Date(), dHoy=AM_JS[hoy.getDay()], fHoy=fechaISO(hoy);
  const ay=new Date(hoy.getTime()-86400000), dAy=AM_JS[ay.getDay()], fAy=fechaISO(ay);
  const filas=[];
  amClasesPlan(s,dHoy).forEach(c=>filas.push({f:fHoy, c, cuando:'hoy'}));
  amClasesPlan(s,dAy).forEach(c=>{ if(!amMarca(s,fAy,c)) filas.push({f:fAy, c, cuando:'ayer'}); });
  if(!filas.length) return '';
  const conGym=amEntrenaMismoDia(s,dHoy)&&amClasesPlan(s,dHoy).length;
  return `<section class="am-card" aria-label="Tus clases">
    <div class="am-h"><b>${filas.some(x=>x.cuando==='hoy')?'Hoy te toca clase':'¿Fuiste a tu clase?'}</b>
      <small>${conGym?'Hoy es clase + tu rutina de gym. ':''}Márcala para que tu plan de comida use lo que de verdad haces.</small></div>
    <ul class="am-lista">${filas.map(x=>{ const m=amMarca(s,x.f,x.c), id=esc(x.f)+'|'+esc(x.c);
      return `<li class="${m?(m.fue?'am-si':'am-no'):''}"><span class="am-c"><b>${esc(x.c)}</b><small>${x.cuando==='hoy'?'Hoy':'Ayer'}</small></span>
        ${m?`<span class="am-est">${m.fue?ico('check')+'Fuiste':'No fuiste'}</span><button type="button" class="am-cambiar" onclick="amMarcar('${esc2(x.f)}','${esc2(x.c)}',null)">Cambiar</button>`
          :`<button type="button" class="am-b am-bsi" onclick="amMarcar('${esc2(x.f)}','${esc2(x.c)}',true)">Sí fui</button><button type="button" class="am-b am-bno" onclick="amMarcar('${esc2(x.f)}','${esc2(x.c)}',false)">No fui</button>`}</li>`; }).join('')}</ul>
  </section>`;
}
function amMarcar(fecha,clase,fue){
  const s=activeSocio; if(!s) return;
  asegurarLogs(s); s.logs.clases=amMarcas(s).filter(x=>x&&!(x.fecha===fecha&&x.clase===clase));
  if(fue!==null) s.logs.clases.push({fecha, clase, fue:!!fue, ts:Date.now()});
  s.logs.clases=s.logs.clases.slice(-200);
  dbSave(s.code);
  const y=window.scrollY; refreshDash(); window.scrollTo(0,y);
  if(fue===true) showToast('¡Bien! Clase registrada');
}

// ═════════════ 2) Actividad medida ═════════════
function amInicio(s){
  // Semana 1 = inicio del reto (o su fecha de registro si el reto todavía no arranca para él)
  let e=null; try{ e=(typeof demoCon==='function'&&s&&s.demo)?demoCon(s,()=>retoEstado()):retoEstado(); }catch(_){}
  let ini=e&&e.estado!=='antes'?e.inicio:null;
  if(!ini&&s&&s.fechaRegistro){ const [y,m,d]=String(s.fechaRegistro).split('-').map(Number); if(y) ini=new Date(y,m-1,d); }
  if(!ini) return null; const x=new Date(ini); x.setHours(0,0,0,0); return x;
}
function amGastoDia(s,fecha,kg){
  let k=0, que=[];
  sesValidas(s).filter(x=>x&&x.fecha===fecha&&!x._lite).forEach(x=>{
    const min=+x.min>0?+x.min:AM_MIN_GYM, car=Math.min(min,+x.cardioMin||0);
    k+=(AM_MET_GYM-1)*kg*((min-car)/60)+(AM_MET_CARDIO-1)*kg*(car/60); que.push('gym');
  });
  amMarcas(s).filter(x=>x&&x.fecha===fecha&&x.fue).forEach(x=>{
    const c=typeof KB_CLASES_IDX!=='undefined'&&KB_CLASES_IDX[x.clase], met=(c&&AM_MET_CLASE[c.id])||5;
    k+=(met-1)*kg; que.push(x.clase);
  });
  return {k:Math.round(k), que};
}
function amActividad(s,base){
  if(!s||s._lite) return null;
  const ini=amInicio(s); if(!ini) return null;
  const hoy=new Date(); hoy.setHours(0,0,0,0);
  const dias=Math.floor((hoy-ini)/86400000), semana=Math.floor(Math.max(0,dias)/7)+1;
  const kg=+pesoActual(s)||+s.peso||70;
  const out={semana, activa:false, porDia:[], faltan:Math.max(0,AM_SEMANAS_FIJO+1-semana)};
  if(dias<0) return out;
  // Por día de la semana: sus últimas 4 fechas ya pasadas desde el inicio (sin contar hoy)
  let total=0, completos=0;
  AM_DIAS.forEach(([k,lb])=>{
    const fechas=[]; for(let i=1;i<=dias&&fechas.length<4;i++){ const f=new Date(hoy.getTime()-i*86400000); if(AM_JS[f.getDay()]===k) fechas.push(fechaISO(f)); }
    const g=fechas.map(f=>amGastoDia(s,f,kg)), prom=g.length?Math.round(g.reduce((a,x)=>a+x.k,0)/g.length):0;
    const que=[]; g.forEach(x=>x.que.forEach(q=>{ if(!que.includes(q)) que.push(q); }));
    if(g.length>=AM_MIN_REG) completos++;
    total+=prom; out.porDia.push({k, lb, n:g.length, prom, que});
  });
  out.semanal=total; out.diario=Math.round(total/7);
  if(base&&base.bmr){
    const act=ACTIVIDAD_TRABAJO[s.actividad], fBase=act?act.f:1.2;
    out.fBase=fBase; out.factorMedido=Math.round((fBase+out.diario/base.bmr)*1000)/1000;
    out.factorFijo=base.factor;
    out.factor=Math.max(out.factorMedido, Math.round(base.factor*(1-AM_TOPE_BAJA)*1000)/1000);
    out.topado=out.factor>out.factorMedido;
  }
  out.activa=semana>AM_SEMANAS_FIJO && completos===7 && !!base;
  return out;
}
// El motor (js/03, envuelto por js/70) usa el factor medido desde la semana 5
(function(){
  if(typeof calcNutricion!=='function') return;
  const o=calcNutricion;
  window.calcNutricion=calcNutricion=function(s){
    const b=o.apply(this,arguments); let m=null;
    try{ m=amActividad(s,b); }catch(e){ console.warn('actividad',e); }
    if(!m) return b;
    if(!m.activa||!m.factor||Math.abs(m.factor-b.factor)<0.005) return Object.assign({},b,{actMedida:m});
    const ratio=b.tdeeEst?b.tdee/b.tdeeEst:1, tdeeEst=Math.round(b.bmr*m.factor), tdee=Math.round(tdeeEst*ratio);
    let kcal=Math.round(b.kcal*tdee/b.tdee);
    const g=(s.genero||'').toUpperCase(), piso=Math.min(tdee,/MUJER|FEM/.test(g)?1200:/HOMBRE|MASC/.test(g)?1500:1350);
    if(b.ajustePct<0&&kcal<b.bmr) kcal=b.bmr; if(kcal<piso) kcal=piso;
    const carbs=Math.max(0,Math.round((kcal-b.prot*4-b.grasas*9)/4));
    return Object.assign({},b,{factor:m.factor, factorTxt:'actividad medida en sus últimas semanas', tdeeEst, tdee, tdeeRango:[Math.round(tdee*0.9),Math.round(tdee*1.1)],
      kcal, carbs, ajustePct:tdee?Math.round((kcal/tdee-1)*1000)/10:0, actMedida:m});
  };
})();
function amResumenHTML(m,b,compacto){
  if(!m) return '';
  const tabla=`<div class="am-sem">${m.porDia.map(d=>`<div class="${d.n>=AM_MIN_REG?'':'pend'}"><b>${d.lb}</b><span>${d.prom?'+'+d.prom:'—'}</span><small>${d.n}/${AM_MIN_REG}${d.que.length?' · '+esc(d.que.map(q=>q==='gym'?'Gym':q).join(' + ')):''}</small></div>`).join('')}</div>`;
  const estado=m.activa?`Medido: <b>${m.factor}</b> (estimado con +0.05 por día: ${m.factorFijo})${m.topado?' · limitado a −15 % por si faltan marcas':''}`
    :m.semana<=AM_SEMANAS_FIJO?`Semana ${m.semana} de ${AM_SEMANAS_FIJO}: se usa el estimado (+0.05 por día). Desde la semana ${AM_SEMANAS_FIJO+1} se usa lo medido.`
    :`Faltan registros: se necesitan ${AM_MIN_REG} de cada día de la semana. Mientras, se usa el estimado.`;
  return `<div class="am-res${compacto?' c':''}"><p>${estado}${m.factorMedido?` · Gasto por ejercicio: <b>~${m.diario.toLocaleString('es-MX')} kcal/día</b> (${m.semanal.toLocaleString('es-MX')} a la semana)`:''}</p>${tabla}
    <p class="am-nota">Rutina de gym: (MET ${AM_MET_GYM} − 1) × peso × horas; cada clase con su MET. Las clases cuentan solo si las marcó.</p></div>`;
}
(function(){
  // Requerimientos de la ficha: paso 2a entre el gasto total y la recalibración
  if(typeof nutDesgloseHTML==='function'){
    const o=nutDesgloseHTML;
    window.nutDesgloseHTML=nutDesgloseHTML=function(b){
      const h=o.apply(this,arguments), m=b&&b.actMedida; if(!m) return h;
      const li=`<li class="am-li"><span>2a · Actividad medida</span><b>${m.activa?'Factor '+m.factor:'Estimado'}</b><small>${amResumenHTML(m,b,true)}</small></li>`;
      const i=h.indexOf('<li><span>3 ·'); const j=h.indexOf('<li><span>2b ·');
      const at=j>=0?j:i; return at>=0?h.slice(0,at)+li+h.slice(at):h;
    };
  }
  // Dietocálculo del plan del nutriólogo: lo medido y un botón para usarlo como factor
  if(typeof pnPaso1==='function'){
    const o=pnPaso1;
    window.pnPaso1=pnPaso1=function(s){
      const h=o.apply(this,arguments), b=calcNutricion(s), m=b&&b.actMedida; if(!m) return h;
      const usar=m.factorMedido?`<button type="button" class="sd-b am-usar" onclick="pnCalc('factorNum',${m.factorMedido})">Usar el factor medido (${m.factorMedido})</button>`:'';
      const blk=`<section class="pn-card"><h3>Actividad real <small>Clases marcadas y rutinas registradas</small></h3>${amResumenHTML(m,b)}${usar}</section>`;
      const k=h.indexOf('<section class="pn-card">\n      <h3>Macronutrientes'); return k>=0?h.slice(0,k)+blk+h.slice(k):h+blk;
    };
  }
  // Inicio del socio: la tarjeta de clases arriba de "Tu semana"
  if(typeof refreshDash==='function'){
    const o=refreshDash;
    window.refreshDash=refreshDash=function(){
      const r=o.apply(this,arguments);
      try{ const s=activeSocio, sem=document.querySelector('#dsec-inicio .ih-sem'), html=amTarjetaHTML(s);
        const prev=document.querySelector('#dsec-inicio .am-card'); if(prev) prev.remove();
        if(html&&sem) sem.insertAdjacentHTML('beforebegin',html); }catch(e){ console.warn('clases',e); }
      return r;
    };
  }
})();
