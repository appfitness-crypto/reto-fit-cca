/* ═══ Reto Fit CCA: socios de prueba para ver el tablero ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global).
   Solo el director. Menú → Reto:
   · "Cargar 15 socios de prueba": 5 por objetivo, con sesiones (pesos por ejercicio), peso corporal y medidas
     de las últimas 5 semanas, repartidos entre los entrenadores que existan. Se guardan en Firebase como
     cualquier socio, con código "demo-NN", la marca demo:true y "(PRUEBA)" en el nombre.
   · "Borrar socios de prueba": borra solo los expedientes demo-NN (y su índice). Los socios reales no se tocan.
   · Los socios de prueba viven el reto como si ya hubiera arrancado para ellos (retoDemoInicio, hace 8 semanas):
     suman puntos, crecen sus mascotas, aparecen en el tablero con posiciones y algunos traen sesiones que no
     cuentan (cortas, fuera del gym, repetidas) y un salto de peso sospechoso, para ver los candados.
     La fecha real del reto (GYM.reto.inicio) no cambia para nadie más. ═══ */

const DEMO_DIAS=56;            // 8 semanas de historia
// Trampas de ejemplo por socio (índice en DEMO_SOCIOS): corta, fuera del gym, repetida el mismo día, salto de peso
const DEMO_TRAMPAS={1:['corta','dup'], 6:['dup'], 7:['salto'], 12:['corta','fuera','dup']};

const DEMO_PREFIJO='demo-';
const DEMO_SOCIOS=[
  // [nombre, género, objetivo, perfil] · perfil: constancia (0-1), mejora (0-1), dejó de venir (días)
  ['ANA LÓPEZ','MUJER','PERDER PESO',{c:.95,m:.9}],
  ['MARIO SÁNCHEZ','HOMBRE','PERDER PESO',{c:.8,m:.7}],
  ['LUCÍA HERRERA','MUJER','PERDER PESO',{c:.65,m:.5}],
  ['JAVIER RUIZ','HOMBRE','PERDER PESO',{c:.45,m:.3,deja:9}],
  ['PAOLA MÉNDEZ','MUJER','PERDER PESO',{c:.85,m:.6}],
  ['DIEGO TORRES','HOMBRE','GANAR MÚSCULO',{c:.95,m:.85}],
  ['SOFÍA RAMOS','MUJER','GANAR MÚSCULO',{c:.75,m:.7}],
  ['RICARDO VEGA','HOMBRE','GANAR MÚSCULO',{c:.6,m:.55}],
  ['FERNANDA CRUZ','MUJER','GANAR MÚSCULO',{c:.9,m:.5}],
  ['ALBERTO NAVA','HOMBRE','GANAR MÚSCULO',{c:.4,m:.35,deja:7}],
  ['VALERIA ORTIZ','MUJER','RECOMPOSICIÓN CORPORAL',{c:.9,m:.8}],
  ['LUIS MORALES','HOMBRE','RECOMPOSICIÓN CORPORAL',{c:.7,m:.65}],
  ['KARLA DÍAZ','MUJER','RECOMPOSICIÓN CORPORAL',{c:.8,m:.45}],
  ['ÓSCAR FLORES','HOMBRE','RECOMPOSICIÓN CORPORAL',{c:.55,m:.6}],
  ['DANIELA SOTO','MUJER','RECOMPOSICIÓN CORPORAL',{c:.35,m:.25,deja:12}],
];
const DEMO_EJ={
  HOMBRE:[['Sentadilla libre',60],['Press banca plano',50],['Remo con barra',45],['Peso muerto rumano',60],['Press militar con barra',30],['Jalón al pecho',45]],
  MUJER:[['Sentadilla goblet',16],['Hip thrust',40],['Jalón al pecho',30],['Peso muerto rumano con mancuernas',12],['Press de hombro con mancuernas',8],['Remo en polea baja',25]]
};

function demoAzar(seed){ let x=seed||7; return ()=>{ x=(x*9301+49297)%233280; return x/233280; }; }

function demoSocio(i, ents, plantilla){
  const [nom,gen,obj,pf]=DEMO_SOCIOS[i];
  const rnd=demoAzar(i*131+17), code=DEMO_PREFIJO+String(i+1).padStart(2,'0');
  const dia=86400000, hoy=new Date(); hoy.setHours(0,0,0,0);
  const inicio=hoy.getTime()-DEMO_DIAS*dia, mujer=gen==='MUJER';
  const peso0=Math.round((mujer?58:74)+rnd()*22), est=mujer?160+Math.round(rnd()*10):170+Math.round(rnd()*12);
  const ent=ents.length?ents[i%ents.length]:null;
  const ejs=DEMO_EJ[gen];
  // Sesiones: 4 días por semana según su constancia; los que "dejaron de venir" paran unos días antes de hoy
  const ses=[], ultimoDia=DEMO_DIAS-(pf.deja||0);
  for(let d=1; d<=ultimoDia; d++){
    const dow=new Date(inicio+d*dia).getDay();
    if(dow===0 || dow===6) continue;
    if(rnd()>pf.c*0.85) continue;
    const ts=inicio+d*dia+ (17+Math.floor(rnd()*4))*3600000, f=d/DEMO_DIAS;
    const del=ejs.slice(0,4+Math.floor(rnd()*2)).map(([n,kg0])=>{
      const kg=Math.round(kg0*(1+f*0.22*pf.m)*2)/2; return {n, s:4, p:4, kg};
    });
    const completa=rnd()<0.75;
    ses.push({fecha:fechaISO(new Date(ts)), ts, diaKey:['dom','lun','mar','mie','jue','vie','sab'][dow], tipo:'Fuerza', ejercicios:del.length,
      ejPlan:del.length, sh:completa?del.length*4:del.length*3, sp:del.length*4, estado:completa?'completa':'parcial',
      volumen:del.reduce((a,e)=>a+e.kg*4*10,0), tut:0, cardioMin:0, hora:new Date(ts).toTimeString().slice(0,5), cambios:[], detalle:del,
      min:45+Math.floor(rnd()*30), geo:'gym'});
  }
  // Candados: sesiones que no suman y un salto de peso sospechoso (solo en algunos socios)
  (DEMO_TRAMPAS[i]||[]).forEach((t,k)=>{
    const base=ses[ses.length-2-k*3]; if(!base) return;
    if(t==='corta') base.min=12;
    else if(t==='fuera') base.geo='fuera';
    else if(t==='dup') ses.push(Object.assign({},base,{ts:base.ts+2*3600000, hora:'21:00', detalle:base.detalle.map(e=>Object.assign({},e))}));
    else if(t==='salto'){ const u=ses[ses.length-1]; if(u&&u.detalle[0]) u.detalle=u.detalle.map((e,j)=>j?e:Object.assign({},e,{kg:Math.round(e.kg*1.45)})); }
  });
  ses.sort((a,b)=>a.ts-b.ts);
  // Peso y medidas semanales (la semana 0 es el registro: no suma puntos de medición)
  const dPeso= obj==='PERDER PESO'? -5.5*pf.m : obj==='GANAR MÚSCULO'? 2.4*pf.m : -1.6*pf.m;
  const dCint= obj==='GANAR MÚSCULO'? 0.4 : -6*pf.m;
  const pesos=[], medidas=[];
  const cin0=mujer?84+Math.round(rnd()*8):92+Math.round(rnd()*8), cue=mujer?32+Math.round(rnd()*2):38+Math.round(rnd()*2);
  const cad0=mujer?102+Math.round(rnd()*6):100+Math.round(rnd()*6), bra0=mujer?28+Math.round(rnd()*3):33+Math.round(rnd()*3);
  for(let w=0; w<=DEMO_DIAS/7; w++){
    if(w>0 && rnd()>pf.c) continue;               // no todos miden cada semana
    const f=w/(DEMO_DIAS/7), fecha=fechaISO(new Date(inicio+(w*7+(w?1:0))*dia));
    pesos.push({fecha, kg:Math.round((peso0+dPeso*f)*10)/10});
    medidas.push({fecha, cintura:Math.round((cin0+dCint*f)*10)/10, cuello:cue, cadera:Math.round((cad0+(obj==='GANAR MÚSCULO'?0:-2*pf.m)*f)*10)/10,
      brazo:Math.round((bra0+(obj==='PERDER PESO'?0:1.6*pf.m)*f)*10)/10});
  }
  const base=plantilla?JSON.parse(JSON.stringify(plantilla)):{};
  return Object.assign(base,{
    code, id:'#RF-'+code.toUpperCase(), nombre:nom+' (PRUEBA)', demo:true,
    objetivo:obj, nivel:pf.c>0.8?'INTERMEDIO':'PRINCIPIANTE', edad:24+Math.floor(rnd()*22), genero:gen,
    peso:peso0, estatura:est, dias:4, cintura:cin0, status:'activo',
    asignado:ent?ent.nombre:'Plan de la app', entrenadorId:ent?ent.id:'', codigoEnt:ent&&ent.codigo||'',
    fechaRegistro:fechaISO(new Date(inicio)),
    retoDemoInicio:fechaISO(inicioSemana(new Date(inicio+dia))),   // su reto arrancó ese lunes
    mascota:(typeof MASCOTAS!=='undefined')?{id:MASCOTAS[i%MASCOTAS.length].id, nombre:MASCOTAS[i%MASCOTAS.length].nm, fecha:fechaISO(new Date(inicio))}:undefined,
    logs:{sesiones:ses, pesoCorporal:pesos, medidas, prs:{}, asistencia:[], lesiones:[]}
  });
}

function demoEntrenadores(){
  return Object.values(DB.entrenadores||{}).filter(e=>e && e.id && e.rol!=='coordinador' && (!e.funciones || e.funciones.includes('entrenamiento')));
}
function demoCodigos(){ return Object.keys(DB.socios||{}).filter(c=>c.indexOf(DEMO_PREFIJO)===0); }

function demoRetoCargar(){
  if(staffRol!=='coordinador'){ showToast('Solo el director puede cargar socios de prueba'); return; }
  const ya=demoCodigos().length;
  const ents=demoEntrenadores();
  uiConfirm(`Se cargarán 15 socios de prueba (5 por objetivo) en la base de datos del reto, ${ents.length?'repartidos entre '+ents.length+' entrenador'+(ents.length>1?'es':''):'sin entrenador asignado'}. Llevan "(PRUEBA)" en el nombre y se borran con "Borrar socios de prueba".${ya?' Los '+ya+' que ya existen se reemplazan.':''}`, ()=>{
    let plantilla=null;
    try{ const db=seedDB(); const s0=Object.values(db.socios||db)[0]; plantilla={rutina:s0.rutina, zonas:s0.zonas||[], limitaciones:[], cardio:s0.cardio||''}; }catch(e){}
    for(let i=0;i<DEMO_SOCIOS.length;i++){
      const s=demoSocio(i, ents, plantilla);
      if(typeof asegurarLogs==='function') asegurarLogs(s);
      DB.socios[s.code]=s;
      try{ delete BASE[s.code]; }catch(e){}   // si se borró antes, permitir crearlo de nuevo
      dbSave(s.code);
    }
    try{ baseGuardar(); }catch(e){}
    guardarLocal();
    if(typeof staffRenderList==='function') staffRenderList();
    showToast('✓ 15 socios de prueba cargados');
    if(typeof abrirTableroReto==='function') abrirTableroReto();
  });
}

function demoRetoBorrar(){
  if(staffRol!=='coordinador'){ showToast('Solo el director puede borrar socios de prueba'); return; }
  // También los que estén solo en el índice (expedientes no cargados en este dispositivo)
  const cods=new Set(demoCodigos());
  try{ Object.keys(IDX||{}).forEach(c=>{ if(c.indexOf(DEMO_PREFIJO)===0) cods.add(c); }); }catch(e){}
  if(!cods.size){ showToast('No hay socios de prueba'); return; }
  uiConfirm(`Se borrarán ${cods.size} socios de prueba (los que empiezan con "${DEMO_PREFIJO}"). Los socios reales no se tocan.`, ()=>{
    cods.forEach(c=>{
      delete DB.socios[c];
      try{ if(typeof IDX!=='undefined') delete IDX[c]; delete BASE[c]; }catch(e){}
      if(fbListo){
        fbEncolar('/socios/'+c,'remove');
        fbEncolar('/indice/'+c,'remove');
        fbEncolar('/huellas/'+c,'remove');
      }
    });
    try{ baseGuardar(); }catch(e){}
    guardarLocal();
    if(typeof staffRenderList==='function') staffRenderList();
    showToast('✓ Socios de prueba borrados');
    if(typeof abrirTableroReto==='function') abrirTableroReto();
  });
}


// ═════════════ Los socios de prueba ya están dentro del reto ═════════════
// Para ellos (y solo para ellos) el reto arrancó en s.retoDemoInicio. Mientras se calcula algo de un socio de prueba,
// retoEstado() responde con esa fecha; para todos los demás sigue la fecha real de js/config.js.
let RETO_DEMO_INI=null;
function demoRetoInicio(s){ return (s&&s.demo&&(s.retoDemoInicio||s.fechaRegistro))||null; }
function demoCon(s,fn){ const ini=demoRetoInicio(s); if(!ini) return fn(); const prev=RETO_DEMO_INI; RETO_DEMO_INI=ini; try{ return fn(); } finally{ RETO_DEMO_INI=prev; } }
function demoEnSuApp(){
  // La app del socio de prueba abierta (desde "Ver su perfil" o con su cuenta), no el panel del staff
  const a=typeof activeSocio!=='undefined'&&activeSocio, p=document.getElementById('s-panel');
  return a&&a.demo&&!(p&&p.classList.contains('on'))?demoRetoInicio(a):null;
}
(function(){
  if(typeof retoEstado==='function'){
    const o=retoEstado;
    window.retoEstado=retoEstado=function(hoy){
      const ini=RETO_DEMO_INI||demoEnSuApp(); if(!ini||!GYM.reto) return o.apply(this,arguments);
      const R=GYM.reto; GYM.reto=Object.assign({},R,{inicio:ini});
      try{ return o.apply(this,arguments); } finally{ GYM.reto=R; }
    };
  }
  if(typeof trCalcSocio==='function'){
    const o=trCalcSocio;
    window.trCalcSocio=trCalcSocio=function(s,desde,P){ if(!demoRetoInicio(s)) return o.apply(this,arguments); return demoCon(s,()=>o(s,trDesde(),P)); };
  }
  ['trResumenIndice','socioPuntos'].forEach(fn=>{
    if(typeof window[fn]!=='function') return; const o=window[fn];
    window[fn]=function(s){ const a=arguments; return demoCon(s,()=>o.apply(this,a)); };
  });
  // Tablero: aviso de que los socios de prueba ya están dentro del reto
  if(typeof abrirTableroReto==='function'){
    const o=abrirTableroReto;
    window.abrirTableroReto=abrirTableroReto=function(){
      const r=o.apply(this,arguments);
      try{
        const d=(typeof staffGetSocios==='function'?staffGetSocios():[]).find(x=>x&&x.demo);
        const p=document.querySelector('#staff-content .tr-p');
        if(d&&p){ const e=demoCon(d,()=>retoEstado()); if(e&&e.estado==='en curso'){ const n=document.createElement('p'); n.className='tr-p tr-demo';
          n.textContent='Socios de prueba: para ellos el reto ya va en la semana '+e.semana+' (día '+e.dia+'), para ver posiciones, puntos, mascotas y candados. Los socios reales no se mueven.';
          p.insertAdjacentElement('afterend',n); } }
      }catch(_){}
      return r;
    };
  }
})();

// Al recargar, el staff ve la ficha ligera del índice: lleva la marca de prueba y la fecha de su reto,
// para que sus puntos y su mascota no regresen a "antes del reto" (etapa inicial).
(function(){
  if(typeof idxDeSocio==='function'){
    const o=idxDeSocio;
    window.idxDeSocio=idxDeSocio=function(s){ const r=o.apply(this,arguments); if(r&&s&&s.demo){ r.dm=demoRetoInicio(s); r.dz=1; } return r; };
  }
  if(typeof idxLite==='function'){
    const o=idxLite;
    window.idxLite=idxLite=function(code){
      const l=o.apply(this,arguments); if(!l) return l;
      const x=(typeof IDX!=='undefined'&&IDX[code])||{};
      if(x.dz||String(code).indexOf(DEMO_PREFIJO)===0){ l.demo=true; l.retoDemoInicio=x.dm||(x.rt&&x.rt.d&&x.rt.d!=='0000-00-00'?x.rt.d:null)||l.fechaRegistro; }
      return l;
    };
  }
})();
