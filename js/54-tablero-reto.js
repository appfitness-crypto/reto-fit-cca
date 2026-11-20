/* ═══ Reto Fit CCA: tablero del reto y ranking por objetivo ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global).
   · Panel del staff → 🏆 Tablero del reto. El director ve a todos; cada entrenador solo a sus socios.
   · Indicadores: socios, quién entrenó en los últimos 7 días, sesiones de la semana, socios en riesgo, sin entrenador.
   · Ranking: una tabla por cada objetivo del reto (masa muscular, bajar grasa, recomposición).
     Puntos = constancia (sesiones, semanas cumplidas, mediciones) + progreso según su objetivo.
     Solo cuenta lo registrado desde el inicio del reto (GYM.reto.inicio); antes del arranque cuenta todo
     (vista previa).
   · El % de grasa es una estimación con la fórmula de la Marina de EE. UU. (cintura, cuello, cadera y
     estatura); si faltan medidas se usa la cintura. No es una medición clínica. ═══ */

const TR_PUNTOS_DEF = {
  sesion: 30,        // cada sesión registrada
  completa: 10,      // extra si la sesión se completó entera
  semana: 60,        // cada semana con 3 o más sesiones
  medicion: 20,      // cada semana con peso o medidas registradas
  grasaPct: 100,     // por cada punto de % de grasa estimado que baja
  cinturaCm: 30,     // por cada cm de cintura que baja (si no hay % de grasa)
  pesoPct: 40,       // por cada 1% del peso corporal perdido (bajar grasa)
  fuerzaPct: 10,     // por cada 1% de fuerza ganada (promedio de sus ejercicios)
  musculoKg: 60,     // por cada kg ganado (masa muscular; tope 6 kg)
  brazoCm: 50        // por cada cm de brazo ganado (masa muscular)
};
function trPuntos(){ return Object.assign({}, TR_PUNTOS_DEF, (GYM.reto && GYM.reto.puntos) || {}); }

let trObj = '';          // objetivo de la tabla de ranking que se está viendo
let trVerTodos = false;  // mostrar todo el ranking o solo los primeros 20

const TR_OBJ_CORTO = {'GANAR MÚSCULO':'Masa muscular','PERDER PESO':'Bajar % de grasa','RECOMPOSICIÓN CORPORAL':'Recomposición'};
function trObjetivos(){ return (GYM.reto && GYM.reto.objetivos) || ['GANAR MÚSCULO','PERDER PESO','RECOMPOSICIÓN CORPORAL']; }

// Desde cuándo cuenta: inicio del reto si ya arrancó; si no, todo (vista previa)
function trDesde(){
  const e = typeof retoEstado==='function' ? retoEstado() : null;
  if(e && e.estado!=='antes') return {ts:e.inicio.getTime(), iso:fechaISO(e.inicio), previa:false};
  return {ts:0, iso:'0000-00-00', previa:true};
}

function trSemanaIdx(ts, desdeTs){ return Math.floor((ts - (desdeTs||0)) / (7*86400000)); }
function trTsFecha(iso){ const [y,m,d]=String(iso||'').split('-').map(Number); return (y&&m&&d)?new Date(y,m-1,d).getTime():0; }

// % de grasa estimado (fórmula de la Marina de EE. UU., en cm). null si faltan datos.
function trGrasaNavy(genero, estatura, cintura, cuello, cadera){
  const h=+estatura, w=+cintura, n=+cuello;
  if(!(h>100 && w>40 && n>20)) return null;
  const mujer = /MUJER|FEM/i.test(genero||'');
  let v;
  if(mujer){ const hp=+cadera; if(!(hp>50) || w+hp-n<=0) return null; v = 495/(1.29579-0.35004*Math.log10(w+hp-n)+0.22100*Math.log10(h))-450; }
  else { if(w-n<=0) return null; v = 495/(1.0324-0.19077*Math.log10(w-n)+0.15456*Math.log10(h))-450; }
  return (v>2 && v<70) ? Math.round(v*10)/10 : null;
}

// Primera y última medición (dentro del reto) de un campo; para la cintura usa la del registro como base
function trSerie(lista, campo, desdeIso){
  const xs = comoArray(lista).filter(m=>m && m[campo]>0 && String(m.fecha||'')>=desdeIso)
    .sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)));
  return xs;
}

// Calcula todo lo del socio para el tablero
function trCalcSocio(s, desde, P){
  const ses = sesValidas(s).filter(x=>(x.ts||0)>=desde.ts);
  const completas = ses.filter(x=>x.estado==='completa').length;
  // Semanas con 3+ sesiones
  const porSem = {};
  ses.forEach(x=>{ const k=trSemanaIdx(x.ts, desde.ts); porSem[k]=(porSem[k]||0)+1; });
  const semanasOk = Object.values(porSem).filter(n=>n>=3).length;
  // Semanas con mediciones (peso o medidas)
  const semMed = new Set();
  // El peso que se anota en la evaluación del registro es la línea base: no suma puntos de medición
  [...comoArray(s.logs?.pesoCorporal), ...comoArray(s.logs?.medidas)].forEach(m=>{
    if(m && m.fecha && String(m.fecha)>=desde.iso && m.fecha!==s.fechaRegistro) semMed.add(trSemanaIdx(trTsFecha(m.fecha), desde.ts));
  });

  // Peso corporal
  const pesos = trSerie(s.logs?.pesoCorporal, 'kg', desde.iso);
  let p0 = pesos.length ? pesos[0].kg : null, p1 = pesos.length ? pesos[pesos.length-1].kg : null;
  if(pesos.length<2 && s.peso>0 && p1!=null && desde.previa){ p0 = s.peso; }
  const dPeso = (p0!=null && p1!=null && pesos.length>=1 && p0!==p1) ? Math.round((p1-p0)*10)/10 : (pesos.length>=2?0:null);
  const dPesoPct = (dPeso!=null && p0>0) ? dPeso/p0*100 : null;

  // Medidas
  const med = comoArray(s.logs?.medidas);
  const delta = campo=>{ const xs=trSerie(med,campo,desde.iso); return xs.length>=2 ? Math.round((xs[xs.length-1][campo]-xs[0][campo])*10)/10 : null; };
  let dCint = delta('cintura');
  if(dCint==null && s.cintura>0){ const xs=trSerie(med,'cintura',desde.iso); if(xs.length && desde.previa) dCint=Math.round((xs[xs.length-1].cintura - s.cintura)*10)/10; }
  const dBrazo = delta('brazo');
  // % de grasa estimado: primera y última medición con cintura y cuello (y cadera en mujeres)
  const grasas = med.filter(m=>m && String(m.fecha||'')>=desde.iso)
    .sort((a,b)=>String(a.fecha).localeCompare(String(b.fecha)))
    .map(m=>({fecha:m.fecha, g:trGrasaNavy(s.genero, s.estatura, m.cintura, m.cuello, m.cadera)})).filter(x=>x.g!=null);
  const grasaIni = grasas.length ? grasas[0].g : null, grasaAct = grasas.length ? grasas[grasas.length-1].g : null;
  const dGrasa = grasas.length>=2 ? Math.round((grasaAct-grasaIni)*10)/10 : null;

  // Fuerza: por ejercicio, peso de la primera vez vs el mejor de las últimas 3 veces (con 7+ días entre ambas)
  const porEj = {};
  // Cada sesión guarda los pesos por ejercicio en "detalle" ({n, s, p, kg}); "ejercicios" es solo el conteo
  ses.forEach(x=>{ const lista=Array.isArray(x.detalle)?x.detalle:(Array.isArray(x.ejercicios)?x.ejercicios:[]);
    lista.forEach(e=>{ if(e && e.n && e.kg>0){ (porEj[e.n]=porEj[e.n]||[]).push({ts:x.ts, kg:+e.kg}); } }); });
  const cambios = [];
  Object.values(porEj).forEach(l=>{
    if(l.length<2) return; l.sort((a,b)=>a.ts-b.ts);
    const ult = l.slice(-3), mejor = Math.max(...ult.map(x=>x.kg));
    if(l[l.length-1].ts - l[0].ts < 7*86400000 || !(l[0].kg>0)) return;
    cambios.push(Math.max(-50, Math.min(100, (mejor-l[0].kg)/l[0].kg*100)));
  });
  const fuerzaPct = cambios.length ? Math.round(cambios.reduce((a,b)=>a+b,0)/cambios.length*10)/10 : null;

  // Puntos
  const ptsConst = ses.length*P.sesion + completas*P.completa + semanasOk*P.semana + semMed.size*P.medicion;
  const pos = v=>Math.max(0, v||0);
  let ptsProg = 0;
  if(s.objetivo==='PERDER PESO'){
    ptsProg = dGrasa!=null ? pos(-dGrasa)*P.grasaPct + pos(-dPesoPct)*P.pesoPct/2
                           : pos(-dCint)*P.cinturaCm + pos(-dPesoPct)*P.pesoPct;
  } else if(s.objetivo==='GANAR MÚSCULO'){
    ptsProg = pos(fuerzaPct)*P.fuerzaPct + Math.min(6, pos(dPeso))*P.musculoKg + pos(dBrazo)*P.brazoCm;
  } else if(s.objetivo==='RECOMPOSICIÓN CORPORAL'){
    ptsProg = pos(fuerzaPct)*P.fuerzaPct*0.6 + (dGrasa!=null ? pos(-dGrasa)*P.grasaPct*0.8 : pos(-dCint)*P.cinturaCm*0.8);
  }
  ptsProg = Math.round(ptsProg);

  const ult = ses.length ? ses[ses.length-1] : null;
  const ultTs = ult ? ult.ts : null;
  const diasSin = ultTs!=null ? Math.floor((Date.now()-ultTs)/86400000) : (typeof diasDesde==='function' ? diasDesde(s.fechaRegistro) : null);
  const hace7 = Date.now()-7*86400000;
  return {
    s, sesiones:ses.length, completas, semanasOk, mediciones:semMed.size,
    dPeso, dPesoPct, dCint, dBrazo, dGrasa, grasaAct, fuerzaPct,
    ptsConst, ptsProg, puntos:ptsConst+ptsProg,
    entreno7: ses.some(x=>x.ts>=hace7), diasSin
  };
}

function trFmt(v, suf, dec){ if(v==null) return ''; const n=dec!=null?v.toFixed(dec):String(v); return (v>0?'+':v<0?'−':'')+n.replace('-','')+suf; }
function trCambioTxt(r){
  const p=[];
  if(r.dPeso!=null && r.dPeso!==0) p.push(trFmt(r.dPeso,' kg'));
  if(r.dGrasa!=null) p.push(trFmt(r.dGrasa,'% grasa'));
  else if(r.dCint!=null && r.dCint!==0) p.push(trFmt(r.dCint,' cm cintura'));
  if(r.s.objetivo!=='PERDER PESO' && r.dBrazo) p.push(trFmt(r.dBrazo,' cm brazo'));
  if(r.fuerzaPct!=null && r.s.objetivo!=='PERDER PESO') p.push('fuerza '+trFmt(Math.round(r.fuerzaPct),'%'));
  return p.join(' · ') || '—';
}

function trCalcTablero(){
  const P = trPuntos(), desde = trDesde();
  const socios = staffGetSocios().filter(s=>s && s.status!=='inactivo');
  const filas = socios.map(s=>trCalcSocio(s, desde, P));
  const hoy = new Date(); hoy.setHours(0,0,0,0);
  const iniSem = inicioSemana(new Date()).getTime();
  // Sesiones por día de la semana en curso (lun → dom)
  const dias = Array.from({length:7},(_,i)=>({ts:iniSem+i*86400000, n:0}));
  socios.forEach(s=>sesValidas(s).forEach(x=>{ const i=Math.floor(((x.ts||0)-iniSem)/86400000); if(i>=0 && i<7) dias[i].n++; }));
  // Por objetivo
  const porObj = {}; trObjetivos().forEach(o=>porObj[o]=0);
  socios.forEach(s=>{ if(porObj[s.objetivo]!=null) porObj[s.objetivo]++; });
  // Por entrenador
  const porEnt = {};
  filas.forEach(r=>{
    const s=r.s, sinEnt = typeof socioSinEntrenador==='function' ? socioSinEntrenador(s) : !s.entrenadorId;
    const k = sinEnt ? '_sin' : s.entrenadorId;
    if(!porEnt[k]) porEnt[k] = {sin:k==='_sin', nombre: k==='_sin' ? 'Sin entrenador (tu filosofía)' : ((getEntrenador(k)||{}).nombre || s.asignado || 'Entrenador'), total:0, activos7:0, riesgo:0, puntos:0};
    const e=porEnt[k]; e.total++; if(r.entreno7) e.activos7++; if(r.diasSin!=null && r.diasSin>=5) e.riesgo++; e.puntos+=r.puntos;
  });
  const riesgo = filas.filter(r=>r.diasSin!=null && r.diasSin>=5).sort((a,b)=>b.diasSin-a.diasSin);
  const sinEnt = porEnt._sin ? porEnt._sin.total : 0;
  return {
    desde, filas, dias, porObj, porEnt, riesgo, sinEnt,
    total: filas.length,
    activos7: filas.filter(r=>r.entreno7).length,
    sesSemana: dias.reduce((a,d)=>a+d.n,0),
    conMedidas: filas.filter(r=>r.mediciones>0).length
  };
}

function trRanking(filas, obj){
  return filas.filter(r=>r.s.objetivo===obj)
    .sort((a,b)=>b.puntos-a.puntos || b.sesiones-a.sesiones || String(a.s.nombre).localeCompare(String(b.s.nombre)));
}

function abrirTableroReto(obj){
  if(staffRol!=='coordinador' && !staffActivoEntId){ showToast('Entra con tu cuenta de staff para ver el tablero'); return; }
  // El director necesita los expedientes completos (sesiones y medidas) de todos los socios
  if(staffRol==='coordinador' && typeof idxCargarTodos==='function' && fbListo && !idxTodosCargados){
    idxCargarTodos().then(()=>{ if(idxTodosCargados) abrirTableroReto(obj); }); return;
  }
  if(obj) { trObj=obj; trVerTodos=false; }
  const objs = trObjetivos();
  if(!objs.includes(trObj)) trObj = objs[0];
  staffActivoId=null; if(typeof staffRenderList==='function') staffRenderList();
  if(typeof staffVista==='function') staffVista('detalle');

  const T = trCalcTablero(), P = trPuntos();
  // Sin pestaña elegida a mano: abre en el primer objetivo que tenga socios
  if(!obj && !(T.porObj[trObj]>0)){ const o=objs.find(x=>T.porObj[x]>0); if(o) trObj=o; }
  const e = typeof retoEstado==='function' ? retoEstado() : null;
  const dir = staffRol==='coordinador';
  const pct = (a,b)=>b?Math.round(a/b*100):0;
  const kpi = (lab,val,sub,cls)=>`<div class="tr-card tr-kpi"><div class="tr-lab">${lab}</div><div class="tr-val${cls?' '+cls:''}">${val}</div><div class="tr-sub">${sub||''}</div></div>`;
  const maxDia = Math.max(1, ...T.dias.map(d=>d.n));
  const hoyIdx = Math.floor((new Date().setHours(0,0,0,0) - T.dias[0].ts)/86400000);
  const DN = ['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];
  const totObj = Math.max(1, Object.values(T.porObj).reduce((a,b)=>a+b,0));
  const ents = Object.values(T.porEnt).sort((a,b)=>b.total-a.total);
  const rk = trRanking(T.filas, trObj);
  const rkVis = trVerTodos ? rk : rk.slice(0,20);
  const iniciales = n=>String(n||'?').trim().split(/\s+/).slice(0,2).map(w=>w[0]).join('').toUpperCase();

  const subReto = !e ? '' : e.estado==='antes'
    ? `El reto arranca el ${esc(retoFechaTxt(e.inicio))} (faltan ${e.faltan} días). Vista previa: se cuentan todos los registros.`
    : e.estado==='terminado' ? 'Reto terminado: este es el resultado final.'
    : `Día ${e.dia} de ${e.totalDias} · Semana ${e.semana} de ${e.semanas}${e.fase?' · Fase: '+esc(e.fase.nombre):''}`;

  document.getElementById('staff-content').innerHTML = `
  <div class="tr-wrap">
    <div class="tr-head">
      <div><h2 class="tr-h">Tablero del reto</h2><p class="tr-p">${subReto}${dir?'':' · Solo tus socios.'}</p></div>
      ${e && e.estado==='en curso' ? `<div class="tr-ring" style="--p:${e.pct}"><b>${e.dia}</b><small>de ${e.totalDias}</small></div>`:''}
    </div>

    <div class="tr-grid tr-g4">
      ${kpi('Socios en el reto', T.total, dir&&T.sinEnt?`${T.sinEnt} sin entrenador`:'con plan activo')}
      ${kpi('Entrenaron (7 días)', pct(T.activos7,T.total)+'<small>%</small>', `${T.activos7} de ${T.total} socios`)}
      ${kpi('Sesiones esta semana', T.sesSemana, 'desde el lunes')}
      ${kpi('En riesgo', T.riesgo.length, '5 días o más sin entrenar', T.riesgo.length?'tr-bad':'')}
    </div>

    <div class="tr-grid tr-g21">
      <div class="tr-card">
        <h3 class="tr-h3">Sesiones de la semana</h3>
        <div class="tr-chart">${T.dias.map((d,i)=>`<div class="tr-col${i===hoyIdx?' hoy':''}"><span class="tr-n">${d.n||''}</span><i style="height:${Math.round(d.n/maxDia*100)}%"></i><span>${i===hoyIdx?'Hoy':DN[i]}</span></div>`).join('')}</div>
        <h3 class="tr-h3" style="margin-top:18px">Socios por objetivo</h3>
        ${objs.map((o,i)=>`<div class="tr-load"><span class="tr-ln">${esc(TR_OBJ_CORTO[o]||objNombre(o))}</span><div class="tr-bar"><i style="width:${pct(T.porObj[o]||0,totObj)}%;background:${['var(--v2)','var(--n)','var(--p)'][i%3]}"></i></div><b>${T.porObj[o]||0}</b></div>`).join('')}
      </div>
      <div class="tr-card">
        <h3 class="tr-h3">En riesgo de abandono</h3>
        ${T.riesgo.length ? T.riesgo.slice(0,8).map(r=>`<button type="button" class="tr-it" onclick="staffOpenSocio('${esc(r.s.code)}')"><span class="tr-av">${esc(iniciales(r.s.nombre))}</span><span class="tr-it-t"><b>${esc(tc(r.s.nombre))}</b><small>${esc(r.s.asignado||'—')}</small></span><span class="tr-tag tr-t-bad">${r.diasSin} d</span></button>`).join('')
          + (T.riesgo.length>8?`<p class="tr-mu">y ${T.riesgo.length-8} más. Están en la lista con el filtro de inactivos.</p>`:'')
          : '<p class="tr-mu">Nadie lleva 5 días o más sin entrenar.</p>'}
      </div>
    </div>

    ${dir ? `<div class="tr-card">
      <h3 class="tr-h3">Seguimiento por entrenador</h3>
      <div class="tr-scroll"><table class="tr-table">
        <tr><th>Entrenador</th><th>Socios</th><th>Entrenaron (7 días)</th><th>En riesgo</th><th>Puntos promedio</th></tr>
        ${ents.map(x=>`<tr><td>${esc(x.sin?x.nombre:tc(x.nombre))}</td><td>${x.total}</td><td><div class="tr-bar sm"><i style="width:${pct(x.activos7,x.total)}%"></i></div><small class="tr-mu">${pct(x.activos7,x.total)}%</small></td><td><span class="tr-tag ${x.riesgo?'tr-t-bad':'tr-t-ok'}">${x.riesgo}</span></td><td>${x.total?Math.round(x.puntos/x.total):0}</td></tr>`).join('')}
      </table></div>
    </div>` : ''}

    <div class="tr-card">
      <div class="tr-rk-head">
        <h3 class="tr-h3" style="margin:0">Ranking del reto</h3>
        <button type="button" class="tb-btn" onclick="trExportarCSV()">⬇ Exportar ranking</button>
      </div>
      <p class="tr-mu" style="margin:4px 0 12px">Cada objetivo compite en su propia tabla.</p>
      <div class="tr-tabs" role="tablist">${objs.map(o=>`<button type="button" role="tab" aria-selected="${o===trObj}" class="tr-tab${o===trObj?' on':''}" onclick="abrirTableroReto('${esc(o)}')">${esc(TR_OBJ_CORTO[o]||objNombre(o))} · ${T.porObj[o]||0}</button>`).join('')}</div>
      ${rk.length ? `<div class="tr-scroll"><table class="tr-table tr-rk">
        <tr><th>#</th><th>Socio</th><th>Sesiones</th><th>Cambio</th><th>Constancia</th><th>Progreso</th><th>Puntos</th></tr>
        ${rkVis.map((r,i)=>`<tr class="tr-click" onclick="staffOpenSocio('${esc(r.s.code)}')">
          <td><b class="tr-pos${i<3?' top':''}">${i+1}</b></td>
          <td><div class="tr-who">${(()=>{ const st=typeof mascotaEstado==='function'?mascotaEstado(r.s):null; return st?`<span class="tr-av tr-masc" title="${esc(st.nombre)} · ${esc(st.etapa.nm)}">${mascotaImgHTML(st.m,st.etapa.n)}</span>`:`<span class="tr-av">${esc(iniciales(r.s.nombre))}</span>`; })()}<span><b>${esc(tc(r.s.nombre))}</b><small>${esc(r.s.asignado||'—')}</small></span></div></td>
          <td>${r.sesiones}<small class="tr-mu"> · ${r.semanasOk} sem</small></td>
          <td class="tr-cambio">${esc(trCambioTxt(r))}</td>
          <td>${r.ptsConst}</td><td>${r.ptsProg}</td><td><b>${r.puntos.toLocaleString('es-MX')}</b></td></tr>`).join('')}
      </table></div>
      ${rk.length>20?`<button type="button" class="tb-btn" style="margin-top:10px" onclick="trVerTodos=!trVerTodos;abrirTableroReto()">${trVerTodos?'Ver solo los primeros 20':'Ver los '+rk.length}</button>`:''}`
      : `<p class="tr-mu">Todavía no hay socios con este objetivo.</p>`}
    </div>

    <div class="tr-card">
      <h3 class="tr-h3">Cómo se calculan los puntos</h3>
      <div class="tr-grid tr-g2 tr-rules">
        <div>
          <b>Constancia (todos)</b>
          <p>+${P.sesion} por sesión registrada, +${P.completa} si la completa entera.<br>+${P.semana} por semana con 3 o más sesiones.<br>+${P.medicion} por semana con peso o medidas registradas.</p>
        </div>
        <div>
          <b>Progreso (según su objetivo)</b>
          <p><b>Bajar % de grasa:</b> +${P.grasaPct} por punto de grasa que baja (o +${P.cinturaCm} por cm de cintura si faltan medidas) y por el % de peso perdido.<br>
          <b>Masa muscular:</b> +${P.fuerzaPct} por cada 1% de fuerza ganada, +${P.musculoKg} por kg ganado (tope 6 kg) y +${P.brazoCm} por cm de brazo.<br>
          <b>Recomposición:</b> fuerza ganada y grasa (o cintura) perdida.</p>
        </div>
      </div>
      <p class="tr-mu">El % de grasa se estima con cintura, cuello, cadera y estatura (fórmula de la Marina de EE. UU.); pide a los socios registrar esas medidas en Progreso → Mi cuerpo. La fuerza compara el peso de cada ejercicio la primera vez contra sus últimas sesiones. Solo cuenta lo registrado desde el inicio del reto.</p>
    </div>
  </div>`;
  const sc = document.getElementById('staff-content'); if(sc) sc.scrollTop = 0;
}

function trExportarCSV(){
  const T = trCalcTablero();
  const q = v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
  const filas = [['Objetivo','Lugar','Socio','Folio','Entrenador','Sesiones','Semanas cumplidas','Cambio de peso (kg)','Cambio de cintura (cm)','Cambio de % grasa (estimado)','Fuerza ganada (%)','Puntos de constancia','Puntos de progreso','Puntos']];
  trObjetivos().forEach(o=>trRanking(T.filas,o).forEach((r,i)=>filas.push([objNombre(o), i+1, tc(r.s.nombre), r.s.id||'', r.s.asignado||'', r.sesiones, r.semanasOk, r.dPeso??'', r.dCint??'', r.dGrasa??'', r.fuerzaPct??'', r.ptsConst, r.ptsProg, r.puntos])));
  const csv = '﻿'+filas.map(f=>f.map(q).join(',')).join('\n');
  descargarArchivo('ranking-reto-'+fechaISO(new Date())+'.csv', csv, 'text/csv;charset=utf-8');
}
