/* ═══ Reto Fit CCA: socios de prueba para ver el tablero ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global).
   Solo el director. Menú → Reto:
   · "Cargar 15 socios de prueba": 5 por objetivo, con sesiones (pesos por ejercicio), peso corporal y medidas
     de las últimas 5 semanas, repartidos entre los entrenadores que existan. Se guardan en Firebase como
     cualquier socio, con código "demo-NN", la marca demo:true y "(PRUEBA)" en el nombre.
   · "Borrar socios de prueba": borra solo los expedientes demo-NN (y su índice). Los socios reales no se tocan. ═══ */

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
  const inicio=hoy.getTime()-35*dia, mujer=gen==='MUJER';
  const peso0=Math.round((mujer?58:74)+rnd()*22), est=mujer?160+Math.round(rnd()*10):170+Math.round(rnd()*12);
  const ent=ents.length?ents[i%ents.length]:null;
  const ejs=DEMO_EJ[gen];
  // Sesiones: 4 días por semana según su constancia; los que "dejaron de venir" paran unos días antes de hoy
  const ses=[], ultimoDia=35-(pf.deja||0);
  for(let d=1; d<=ultimoDia; d++){
    const dow=new Date(inicio+d*dia).getDay();
    if(dow===0 || dow===6) continue;
    if(rnd()>pf.c*0.85) continue;
    const ts=inicio+d*dia+ (17+Math.floor(rnd()*4))*3600000, f=d/35;
    const del=ejs.slice(0,4+Math.floor(rnd()*2)).map(([n,kg0])=>{
      const kg=Math.round(kg0*(1+f*0.22*pf.m)*2)/2; return {n, s:4, p:4, kg};
    });
    const completa=rnd()<0.75;
    ses.push({fecha:fechaISO(new Date(ts)), ts, diaKey:['dom','lun','mar','mie','jue','vie','sab'][dow], tipo:'Fuerza', ejercicios:del.length,
      ejPlan:del.length, sh:completa?del.length*4:del.length*3, sp:del.length*4, estado:completa?'completa':'parcial',
      volumen:del.reduce((a,e)=>a+e.kg*4*10,0), tut:0, cardioMin:0, hora:new Date(ts).toTimeString().slice(0,5), cambios:[], detalle:del});
  }
  // Peso y medidas semanales (la semana 0 es el registro: no suma puntos de medición)
  const dPeso= obj==='PERDER PESO'? -5.5*pf.m : obj==='GANAR MÚSCULO'? 2.4*pf.m : -1.6*pf.m;
  const dCint= obj==='GANAR MÚSCULO'? 0.4 : -6*pf.m;
  const pesos=[], medidas=[];
  const cin0=mujer?84+Math.round(rnd()*8):92+Math.round(rnd()*8), cue=mujer?32+Math.round(rnd()*2):38+Math.round(rnd()*2);
  const cad0=mujer?102+Math.round(rnd()*6):100+Math.round(rnd()*6), bra0=mujer?28+Math.round(rnd()*3):33+Math.round(rnd()*3);
  for(let w=0; w<=5; w++){
    if(w>0 && rnd()>pf.c) continue;               // no todos miden cada semana
    const f=w/5, fecha=fechaISO(new Date(inicio+(w*7+(w?1:0))*dia));
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
