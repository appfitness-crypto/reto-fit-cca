/* ═══ Reto Fit CCA: plan de alimentación del nutriólogo (estilo "dietocálculo → porciones → distribuye → entrega") ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global). Estilos en css/plan-nutri.css.
   · De entrada todo es automático (como las rutinas): la app calcula metas, porciones, reparto y platillos con la
     filosofía del nutriólogo del socio (o la del gimnasio). El nutriólogo abre "Plan de alimentación" en la ficha y
     cambia lo que necesite en 4 pasos:
       1. Dietocálculo: datos (ficha o InBody), fórmula, factor de actividad, ajuste, kcal y macros (% o g/kg).
       2. Porciones: equivalentes SMAE por grupo con semáforo contra la meta y botón Autogenerar.
       3. Distribuye: porciones por tiempo de comida, platillo por comida (con intercambio de ingredientes) y semana.
       4. Entrega: recomendaciones, guardar y asignar, PDF, lista de súper y guardar como plantilla.
   · Lo guardado vive en s.nutricion (override + calc) y s.nutricion.plan (comidas, porciones, semana, variantes):
     la app del socio (js/49, js/50) lo sigue leyendo igual.
   · Recetas propias del gimnasio: /nutri/recetas/<id> (foto aparte en /nutri/fotos/<id>). Plantillas: /nutri/plantillas.
   · Filosofía de nutrición: /entrenadores/<id>/nutFilo (del nutriólogo) y /config/nutFilo (la del gimnasio).
   · Reglas de .claude/skills/nutricion-deportiva: SMAE con kcal oficiales, tolerancias ±5 % kcal del día,
     ±10 % proteína, ±15 % grasa y carbohidrato; menores sin déficit; nada por debajo del basal sin aviso. ═══ */

// ═════════════ Constantes ═════════════
// Fórmulas de gasto basal. Coeficientes publicados; las marcadas PENDIENTE deben verificarse con la fuente primaria.
const PN_FORMULAS=[
  ['auto','Automática de la app'],
  ['mifflin','Mifflin-St Jeor'],
  ['harris','Harris-Benedict'],
  ['fao','FAO/OMS (1985)'],
  ['valencia','Valencia (población mexicana)'],
  ['cunningham','Cunningham (masa libre de grasa)'],
  ['katch','Katch-McArdle (masa libre de grasa)'],
  ['kcal','Kcal directas'],
];
// FAO/OMS 1985 (Schofield, solo peso): [edad mínima, a, b] → a·peso + b
const PN_FAO={h:[[0,60.9,-54],[3,22.7,495],[10,17.5,651],[18,15.3,679],[30,11.6,879],[60,13.5,487]],
              m:[[0,61,-51],[3,22.5,499],[10,12.2,746],[18,14.7,496],[30,8.7,829],[60,10.5,596]]};
// Valencia et al. (adultos mexicanos). PENDIENTE: verificar coeficientes con el artículo original antes de usarla como regla.
const PN_VALENCIA={h:[[18,13.37,747],[30,13.08,693],[60,14.21,429]], m:[[18,11.02,679],[30,10.92,677],[60,10.98,520]]};
const PN_FACTORES=[[1.2,'Sedentario'],[1.375,'Ligera'],[1.55,'Moderada'],[1.725,'Intensa'],[1.9,'Muy intensa']];
// Grupos SMAE que maneja la biblioteca de platillos (js/48). Orden de la tabla de porciones.
const PN_GRUPOS=[
  ['VER','Verduras'],['FRU','Frutas'],['CER','Cereales sin grasa'],['LEG','Leguminosas'],
  ['AOAMB','Origen animal muy bajo en grasa'],['AOAB','Origen animal bajo en grasa'],['AOAM','Origen animal moderado en grasa'],
  ['LECD','Leche descremada'],['GRA','Grasas sin proteína'],['GRAP','Grasas con proteína'],
];
// Familias para intercambiar ingredientes (1 equivalente ↔ 1 equivalente)
const PN_FAMILIA={VER:'VER',FRU:'FRU',CER:'CER',LEG:'LEG',AOAMB:'AOA',AOAB:'AOA',AOAM:'AOA',LECD:'LEC',GRA:'GRA',GRAP:'GRA'};
// Tolerancias de la skill (regla de diseño): kcal ±5 %, proteína ±10 %, grasa y carbohidrato ±15 %
const PN_TOL={k:0.05,p:0.10,l:0.15,c:0.15};
const PN_DIAS=[['lun','Lun'],['mar','Mar'],['mie','Mié'],['jue','Jue'],['vie','Vie'],['sab','Sáb'],['dom','Dom']];
const PN_DIA_JS=['dom','lun','mar','mie','jue','vie','sab'];   // Date.getDay() → clave
const PN_RECS=['Toma agua natural durante el día; lleva tu botella al gym.','Cocina con poco aceite: asado, al vapor, horneado o en comal.',
  'Puedes cambiar un alimento por otro del mismo grupo (1 equivalente por 1).','Mide las porciones con taza y cucharas las primeras semanas.',
  'Si comes fuera, elige asados y pide la salsa aparte.','Duerme 7 a 9 horas: también es parte del plan.'];
// Filosofía de nutrición por defecto (lo que hoy hace js/03). Proteína en g/kg del peso de referencia.
const PN_FILO_DEF={formula:'auto', comidas:4, grasaPct:25, cargaDia:{on:false, pesado:15, descanso:15},
  ajuste:{'PERDER PESO':-18,'RECOMPOSICIÓN CORPORAL':-7,'GANAR MÚSCULO':10,'FUERZA PURA':5,'RESISTENCIA':0},
  protKg:{'PERDER PESO':2.0,'RECOMPOSICIÓN CORPORAL':2.2,'GANAR MÚSCULO':1.8,'FUERZA PURA':1.8,'RESISTENCIA':1.6}};
const PN_OBJETIVOS=[['PERDER PESO','Perder grasa'],['RECOMPOSICIÓN CORPORAL','Recomposición'],['GANAR MÚSCULO','Ganar músculo'],['FUERZA PURA','Fuerza'],['RESISTENCIA','Resistencia']];

let PN=null;             // plan en edición
let PNQ=null;            // buscador de platillos {i, dia, q, t}
let NR={};               // recetas propias cargadas (/nutri/recetas)
let NPL={};              // plantillas (/nutri/plantillas)
const NFOTO={};          // id → dataURL de la foto de una receta propia ('' = sin foto, null = cargando)
let nrRef=null, nplRef=null;

function pnNum(x){ return Math.round(+x||0).toLocaleString('es-MX'); }
function pnR1(x){ return Math.round((+x||0)*10)/10; }
function pnMujer(s){ const g=String(s&&s.genero||'').toUpperCase(); return g.includes('MUJER')||g.includes('FEMENINO'); }
function pnHombre(s){ const g=String(s&&s.genero||'').toUpperCase(); return g.includes('HOMBRE')||g.includes('MASCULINO'); }
function pnId(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

// ═════════════ Cálculo ═════════════
// Datos para el dietocálculo: InBody (si hay) o la ficha
function pnDatos(s){
  const ib=typeof nutInbody==='function'?nutInbody(s):null;
  const peso=ib&&ib.peso?ib.peso:(+pesoActual(s)||0);
  return {peso:pnR1(peso), est:+s.estatura||0, edad:+s.edad||0, sexo:pnMujer(s)?'m':pnHombre(s)?'h':'', mlg:ib?ib.mlg:0,
    fuente:ib?'InBody del '+ib.fecha:'ficha del socio'};
}
function pnTabla(t,edad,peso){ let f=t[0]; t.forEach(r=>{ if(edad>=r[0]) f=r; }); return f[1]*peso+f[2]; }
// Gasto basal con la fórmula elegida. Devuelve null si faltan datos para esa fórmula.
function pnGEB(formula,d,base){
  const {peso,est,edad,sexo,mlg}=d, P=+peso||0, E=+est||0, A=+edad||0;
  const prom=(h,m)=>sexo==='h'?h:sexo==='m'?m:(h+m)/2;
  switch(formula){
    case 'auto': return base?base.bmr:null;
    case 'mifflin': if(!P||!E||!A) return null; return prom(10*P+6.25*E-5*A+5, 10*P+6.25*E-5*A-161);
    case 'harris': if(!P||!E||!A) return null; return prom(66.5+13.75*P+5.003*E-6.755*A, 655.1+9.563*P+1.85*E-4.676*A);
    case 'fao': if(!P||!A) return null; return prom(pnTabla(PN_FAO.h,A,P), pnTabla(PN_FAO.m,A,P));
    case 'valencia': if(!P||!A||A<18) return null; return prom(pnTabla(PN_VALENCIA.h,A,P), pnTabla(PN_VALENCIA.m,A,P));
    case 'cunningham': return mlg>20?500+22*mlg:null;
    case 'katch': return mlg>20?370+21.6*mlg:null;
    default: return null;
  }
}
// Metas del paso 1 a partir del estado de cálculo C
function pnMetas(C,base){
  const geb=C.formula==='kcal'?null:pnGEB(C.formula,C.datos,base);
  const factor=C.factor==='auto'?base.factor:(+C.factor||1.55);
  // Con la fórmula y el factor de la app se usa su gasto ya recalibrado con el peso real (js/03)
  const get=C.formula==='auto'&&C.factor==='auto'?base.tdee:geb?Math.round(geb*factor):null;
  let kcal=C.formula==='kcal'||C.kcalManual?Math.round(+C.kcal||0):Math.round((get||base.kcal)*(1+(+C.ajuste||0)/100));
  if(C.formula==='auto'&&!C.kcalManual&&C.factor==='auto'&&+C.ajuste===base.ajustePct) kcal=base.kcal;   // igual que la app
  const peso=+C.datos.peso||base.pesoBase||70;
  const prot=C.modo==='gkg'?Math.round((+C.pk||0)*peso):Math.round(kcal*(+C.pp||0)/100/4);
  const grasas=C.modo==='gkg'?Math.round((+C.gk||0)*peso):Math.round(kcal*(+C.gp||0)/100/9);
  const carbs=Math.max(0,Math.round((kcal-prot*4-grasas*9)/4));
  return {geb:geb?Math.round(geb):null, factor, get, kcal, prot, grasas, carbs, peso};
}
// Avisos de seguridad del paso 1 (no bloquean: decide el nutriólogo)
function pnAvisos(s,M){
  const a=[], edad=+s.edad||0, P=M.prot/M.peso, G=M.grasas/M.peso, gPct=M.kcal?M.grasas*9/M.kcal*100:0;
  if(edad>0&&edad<12) a.push('Menor de 12 años: la guía del gimnasio pide no dar plan de calorías, solo orientación a los padres.');
  else if(edad>0&&edad<18&&M.get&&M.kcal<M.get) a.push('Menor de edad con déficit: la guía del gimnasio pide no reducir calorías en menores.');
  if(M.geb&&M.kcal<M.geb) a.push('Las calorías quedan por debajo del gasto basal ('+pnNum(M.geb)+' kcal).');
  if(M.kcal<(pnMujer(s)?1200:1500)) a.push('Menos de '+(pnMujer(s)?'1,200':'1,500')+' kcal: solo con supervisión.');
  if(P<1.2) a.push('Proteína baja para alguien que entrena ('+pnR1(P)+' g/kg; la guía sugiere 1.6 a 2.2).');
  if(P>3.1) a.push('Proteína muy alta ('+pnR1(P)+' g/kg). Revisa función renal si se mantiene así.');
  if(G<0.5||gPct<15) a.push('Grasa baja ('+pnR1(G)+' g/kg, '+Math.round(gPct)+' % de las kcal). La guía pide al menos 0.5 g/kg y 15 a 20 %.');
  if(M.kcal-M.prot*4-M.grasas*9<0) a.push('Proteína y grasa ya pasan de las calorías: no queda lugar para carbohidratos.');
  return a;
}
// Aporte de un conjunto de equivalentes {GRUPO: n}
function pnAporte(eq){
  const t={k:0,p:0,l:0,c:0};
  Object.keys(eq||{}).forEach(g=>{ const b=SMAE_EQ[g], n=+eq[g]||0; if(!b||!n) return; t.k+=b.k*n; t.p+=b.p*n; t.l+=b.l*n; t.c+=b.c*n; });
  return t;
}
function pnEstado(v,meta,tol){ if(!meta) return 'ok'; const d=(v-meta)/meta; return Math.abs(d)<=tol?'ok':Math.abs(d)<=tol*2?'warn':'bad'; }
// Porciones automáticas: búsqueda local sobre los equivalentes del día para acercarse a kcal y macros
const PN_RANGO={VER:[3,6,1],FRU:[1,5,1],CER:[1,18,1],LEG:[0,3,0.5],AOAMB:[0,12,1],AOAB:[0,6,1],AOAM:[0,4,1],LECD:[0,3,0.5],GRA:[0,10,1],GRAP:[0,4,1]};
function pnAutoPorciones(M){
  const ini={VER:4, FRU:M.kcal<1700?2:3, CER:0, LEG:1, AOAMB:0, AOAB:1, AOAM:1, LECD:1, GRA:0, GRAP:1};
  // arranque: proteína con AOA muy bajo en grasa, carbohidrato con cereal, grasa con grasas
  const t0=pnAporte(ini);
  ini.AOAMB=Math.max(0,Math.min(12,Math.round((M.prot-t0.p)/7)));
  const t1=pnAporte(ini); ini.CER=Math.max(1,Math.min(18,Math.round((M.carbs-t1.c)/15)));
  const t2=pnAporte(ini); ini.GRA=Math.max(0,Math.min(10,Math.round((M.grasas-t2.l)/5)));
  const keys=Object.keys(PN_RANGO);
  const medir=q=>{ const t=pnAporte(q); let dev=0; keys.forEach(k=>{ dev+=Math.abs(q[k]-ini[k])/PN_RANGO[k][2]; });
    const eP=t.p<M.prot?(M.prot-t.p)/Math.max(M.prot,5)*3:(t.p-M.prot)/Math.max(M.prot,5);
    return Math.abs(t.k-M.kcal)/M.kcal*3+eP+Math.abs(t.c-M.carbs)/Math.max(M.carbs,20)+Math.abs(t.l-M.grasas)/Math.max(M.grasas,8)+dev*0.004; };
  let q=Object.assign({},ini), err=medir(q);
  for(let it=0; it<200; it++){
    let mejor=null, mErr=err;
    keys.forEach(k=>{ const [mn,mx,st]=PN_RANGO[k]; [-st,st].forEach(d=>{ const v=Math.round((q[k]+d)*100)/100; if(v<mn||v>mx) return;
      const q2=Object.assign({},q,{[k]:v}), e=medir(q2); if(e<mErr-1e-9){ mErr=e; mejor=q2; } }); });
    if(!mejor) break; q=mejor; err=mErr;
  }
  return q;
}
// Reparto de las porciones del día entre las comidas (por % del tiempo de comida, en pasos de ½)
function pnRepartir(porc,comidas){
  const n=comidas.length, plant=(MEAL_TEMPLATES[n]||MEAL_TEMPLATES[4]);
  const pct=comidas.map((m,i)=>(plant[i]?plant[i].pct:100/n)/100);
  const tag=comidas.map((m,i)=>plant[i]?plant[i].tag:'media');
  // peso de cada grupo por comida (regla de diseño): verduras en comidas fuertes y medias, lácteo y fruta también en colaciones
  const peso=(g,i)=>{ const t=tag[i], p=pct[i];
    if(g==='VER') return t==='ligera'?0:p;
    if(g==='LECD') return t==='fuerte'?p*0.3:p*1.4;
    if(g==='FRU') return t==='ligera'?p*2:p;
    if(g==='LEG') return t==='ligera'?0:t==='fuerte'?p*1.6:p;
    if(g.indexOf('AOA')===0) return t==='ligera'?p*0.6:p;
    return p; };
  const out=comidas.map(()=>({}));
  Object.keys(porc).forEach(g=>{
    const total=+porc[g]||0; if(!total) return;
    const w=comidas.map((m,i)=>peso(g,i)), sw=w.reduce((a,b)=>a+b,0)||1;
    const pasos=Math.round(total*2);                         // en medias porciones
    const raw=w.map(x=>x/sw*pasos), base=raw.map(Math.floor);
    let falta=pasos-base.reduce((a,b)=>a+b,0);
    raw.map((x,i)=>[x-base[i],i]).sort((a,b)=>b[0]-a[0]).forEach(([,i])=>{ if(falta>0&&w[i]>0){ base[i]++; falta--; } });
    base.forEach((b,i)=>{ if(b) out[i][g]=b/2; });
  });
  return out;
}
// Meta de una comida a partir de sus equivalentes (para escalar platillos con menuEscalar)
function pnMetaComida(eq){ const t=pnAporte(eq); return {k:Math.max(60,t.k),p:t.p,l:t.l,c:t.c}; }

// ═════════════ Motor de equivalentes: lo que hay en el plato manda ═════════════
// Cada comida tiene sus equivalentes por subgrupo SMAE (m.eq). El platillo se ajusta exactamente a ellos y lo que el
// platillo no tiene (p. ej. fruta en unos huevos) va como complemento (m.extra), cambiable por otro equivalente.
// Las porciones del día son siempre la suma de las comidas: todo queda conectado.
const PN_EXTRA_DEF={VER:'ensalada',FRU:'papaya',CER:'tortilla',LEG:'frijol',AOAMB:'pollo',AOAB:'res',AOAM:'panela',LECD:'leche',GRA:'aceite',GRAP:'almendra'};
function pnPasoAlim(f){ const a=MENU_ALIM[f]; if(!a||a.u==='libre') return 0; return a.u==='n'&&(a.por||1)<2?1:0.5; }
function pnRed(v,st){ return st?Math.max(0,Math.round(v/st)*st):0; }
function pnR2(x){ return Math.round((+x||0)*100)/100; }
function pnEqReal(m){
  const o={}, add=(f,q)=>{ const a=MENU_ALIM[f]; if(!a||a.g==='LIB'||!(q>0)) return; o[a.g]=pnR2((o[a.g]||0)+q); };
  const p=m.id&&maPlat(m.id); if(p) p.c.forEach(([f],i)=>add(f,+(m.q||[])[i]||0));
  comoArray(m.extra).forEach(x=>add(x.f,+x.q||0));
  return o;
}
function pnAjustarAEq(m,eq){
  eq=Object.assign({},eq||m.eq||{});
  const p=m.id&&maPlat(m.id), prev={};
  comoArray(m.extra).forEach(x=>{ const a=MENU_ALIM[x.f]; if(a) prev[a.g]=x.f; });
  const q=p?p.c.map(()=>0):[], extra=[];
  Object.keys(eq).forEach(g=>{
    const v=+eq[g]||0; if(v<=0||!SMAE_EQ[g]||g==='LIB') return;
    const idx=p?p.c.map((c,i)=>MENU_ALIM[c[0]]&&MENU_ALIM[c[0]].g===g?i:-1).filter(i=>i>=0):[];
    if(idx.length){
      const base=idx.map(i=>Math.max(0.5,+p.c[i][1]||0)), sb=base.reduce((a,b)=>a+b,0);
      idx.forEach((i,k)=>{ q[i]=pnRed(v*base[k]/sb,pnPasoAlim(p.c[i][0])); });
      // lo que falte o sobre por redondeo va al alimento con paso más fino
      const fino=idx.slice().sort((a,b)=>pnPasoAlim(p.c[a][0])-pnPasoAlim(p.c[b][0]))[0];
      const dif=v-idx.reduce((a,i)=>a+q[i],0); if(Math.abs(dif)>=0.25) q[fino]=Math.max(0,pnRed(q[fino]+dif,pnPasoAlim(p.c[fino][0])));
    } else {
      const f=prev[g]||PN_EXTRA_DEF[g]; if(f&&MENU_ALIM[f]){ const st=pnPasoAlim(f); extra.push({f, q:pnRed(v,st)||st}); }
    }
  });
  m.q=q.map(pnR2); m.extra=extra.filter(x=>x.q>0); m.eq=pnEqReal(m);
}
function pnSyncPorc(){ const o={}; PN.comidas.forEach(m=>Object.keys(m.eq||{}).forEach(g=>{ o[g]=pnR2((o[g]||0)+m.eq[g]); })); PN.porc=o; }
// Al sumar (d>0) o quitar (d<0) equivalentes de un grupo en una comida, las demás compensan para mantener el día
function pnCompensar(i,g,d){
  if(!PN.compensar||Math.abs(d)<0.25) return;
  let rest=Math.abs(d);
  const otros=PN.comidas.map((m,j)=>j).filter(j=>j!==i&&(+(PN.comidas[j].eq||{})[g]||0)>0)
    .sort((a,b)=>(+PN.comidas[b].eq[g]||0)-(+PN.comidas[a].eq[g]||0));
  for(const j of otros){
    if(rest<0.25) break; const m=PN.comidas[j], antes=+m.eq[g]||0;
    const mov=d>0?Math.min(antes,pnRed(rest,0.5)||0.5):pnRed(rest,0.5)||0.5;
    pnAjustarAEq(m,Object.assign({},m.eq,{[g]:Math.max(0,antes+(d>0?-mov:mov))}));
    rest-=Math.abs((+m.eq[g]||0)-antes);
  }
}
function pnTrasCambio(){ pnSyncPorc(); PN.porcManual=true; PN.cambios=true; }

// ═════════════ Recetas propias y variantes ═════════════
function nrComoPlatillo(id,r){
  return {id:'r-'+id, n:r.n||'Receta', t:comoArray(r.t).length?comoArray(r.t):['com'], prep:r.prep||'', propia:true, autor:r.autor||'', foto:!!r.foto,
    c:comoArray(r.c).filter(x=>Array.isArray(x)&&MENU_ALIM[x[0]]).map(x=>[x[0],+x[1]||0,+x[2]||0,+x[3]||0].concat(x[4]?[+x[4]]:[]))};
}
function nrSincronizar(){
  for(let i=MENU_PLATILLOS.length-1;i>=0;i--) if(MENU_PLATILLOS[i].propia) MENU_PLATILLOS.splice(i,1);
  Object.keys(NR).forEach(id=>{ const r=NR[id]; if(r&&!r.borrada) MENU_PLATILLOS.push(nrComoPlatillo(id,r)); });
}
// Variantes (un platillo con un ingrediente intercambiado) viven dentro del plan del socio: se registran al leerlo
function pnRegistrarVariantes(s){
  const v=s&&s.nutricion&&s.nutricion.plan&&s.nutricion.plan.var; if(!v) return;
  Object.keys(v).forEach(id=>pnRegistrarVar(id,v[id]));
}
function pnRegistrarVar(id,x){
  if(!x) return; const p={id, n:x.n||'Platillo', t:[], tOrig:comoArray(x.t), prep:x.prep||'', variante:true, base:x.base||'',
    c:comoArray(x.c).filter(c=>Array.isArray(c)&&MENU_ALIM[c[0]]).map(c=>[c[0],+c[1]||0,+c[2]||0,+c[3]||0].concat(c[4]?[+c[4]]:[]))};
  const i=MENU_PLATILLOS.findIndex(q=>q.id===id); if(i>=0) MENU_PLATILLOS[i]=p; else MENU_PLATILLOS.push(p);
}
// Fotos: las de la biblioteca están en img/menu; las propias se bajan de /nutri/fotos/<id> la primera vez
const PN_PIXEL='data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==';
(function(){
  const fid=menuFotoId, fsrc=menuFotoSrc;
  window.menuFotoId=menuFotoId=function(id){
    const p=id&&MENU_PLATILLOS.find(x=>x.id===id);
    if(p&&p.variante) return p.base?menuFotoId(p.base):'';
    if(p&&p.propia) return p.foto?id:'';
    return fid(id);
  };
  window.menuFotoSrc=menuFotoSrc=function(id){
    if(String(id).indexOf('r-')!==0) return fsrc(id);
    const k=id.slice(2);
    if(NFOTO[k]) return NFOTO[k];
    if(NFOTO[k]===undefined){ NFOTO[k]=null; nrBajarFoto(k); }
    return PN_PIXEL+'#'+id;
  };
})();
function nrBajarFoto(k){
  if(typeof fbDB==='undefined'||!fbDB||!fbListo){ NFOTO[k]=''; return; }
  fbDB.ref('/nutri/fotos/'+k).once('value').then(sn=>{
    const v=sn.val(); NFOTO[k]=typeof v==='string'?v:'';
    if(NFOTO[k]) document.querySelectorAll('img[src$="#r-'+k+'"]').forEach(im=>{ im.src=NFOTO[k]; });
  }).catch(()=>{ NFOTO[k]=''; });
}

// ═════════════ Filosofía de nutrición (lo automático) ═════════════
function pnFiloDe(s){
  const D=DB.entrenadores||{}, cfg=(DB.config&&DB.config.nutFilo)||null;
  let e=s&&s.nutriologoId&&D[s.nutriologoId];
  if(!(e&&e.nutFilo)){ const t=s&&s.entrenadorId&&D[s.entrenadorId]; if(t&&t.nutFilo&&entHace(t,'nutricion')) e=t; }
  const f=(e&&e.nutFilo)||cfg; if(!f) return null;
  return {formula:f.formula||'auto', comidas:+f.comidas||4, grasaPct:+f.grasaPct||PN_FILO_DEF.grasaPct,
    ajuste:Object.assign({},PN_FILO_DEF.ajuste,f.ajuste||{}), protKg:Object.assign({},PN_FILO_DEF.protKg,f.protKg||{}),
    cargaDia:Object.assign({},PN_FILO_DEF.cargaDia,f.cargaDia||{}),
    autor:e&&e.nutFilo?e.nombre:'nutrición del gimnasio'};
}
// Envuelve el motor (js/03): si el socio tiene filosofía, se recalcula con ella respetando las mismas reglas de seguridad
(function(){
  if(typeof calcNutricion!=='function') return;
  const orig=calcNutricion;
  window.calcNutricion=calcNutricion=function(s){
    const b=orig.apply(this,arguments), F=pnFiloDe(s);
    if(!F) return b;
    try{
      const obj=b.objetivoAplicado||s.objetivo, d=pnDatos(s);
      let bmr=b.bmr, metodo=b.bmrMetodo;
      if(F.formula!=='auto'){ const g=pnGEB(F.formula,d,b); if(g){ bmr=Math.round(g); metodo=(PN_FORMULAS.find(x=>x[0]===F.formula)||[,''])[1]; } }
      const tdee=Math.round(bmr*b.factor*(b.tdee/(b.tdeeEst||b.tdee)));   // conserva la recalibración con el peso
      const aj=+(F.ajuste[obj]??PN_FILO_DEF.ajuste[obj]??0);
      let kcal=Math.round(tdee*(1+aj/100)), ajusteTxt=(aj>0?'Superávit':aj<0?'Déficit':'Mantenimiento')+' ('+(aj>0?'+':'')+aj+'% del gasto total, filosofía de '+F.autor+')';
      const edad=+s.edad||0, menor=edad>0&&edad<18;
      if(aj<0&&kcal<bmr) kcal=bmr;
      if(menor&&kcal<tdee){ kcal=tdee; ajusteTxt='Mantenimiento (menor de edad, sin déficit)'; }
      const piso=Math.min(tdee,pnMujer(s)?1200:pnHombre(s)?1500:1350); if(kcal<piso) kcal=piso;
      const pRef=b.pesoRef||b.pesoBase, protKg=+(F.protKg[obj]??b.protKg);
      const prot=Math.round(protKg*pRef), grasas=Math.round(Math.max(0.6*pRef,kcal*F.grasaPct/100/9));
      const carbs=Math.max(0,Math.round((kcal-prot*4-grasas*9)/4));
      return Object.assign({},b,{bmr, bmrMetodo:metodo, tdee, tdeeRango:[Math.round(tdee*0.9),Math.round(tdee*1.1)], kcal, prot, protKg, grasas, carbs,
        ajusteTxt, ajustePct:tdee?Math.round((kcal/tdee-1)*1000)/10:0, filosofia:F.autor});
    }catch(e){ console.warn('nutFilo',e); return b; }
  };
})();

// ═════════════ Carga del día: el carbohidrato sigue al entrenamiento ═════════════
// Tipo de día según la rutina del socio (s.rutina.lun…dom): descanso, ligero, medio o pesado.
// Pesado = pierna o cuerpo completo, o carga ≥ 25 % arriba del promedio de su semana (regla de diseño, PN_DIA_PESADO).
const PN_DIA_PESADO=1.25, PN_DIA_LIGERO=0.85;
function pnTipoDia(s,k){
  const R=(s&&s.rutina)||{}, d=R[k], nom=String(d&&(d.tipo||d.nombre)||'');
  if(!d||!comoArray(d.ejercicios).length) return {t:'descanso', nombre:'Descanso', pierna:false};
  const limpio=nom.replace(/\s*·\s*D[ií]a (pesado|medio|ligero)\s*$/i,'').trim()||'Entrenamiento';
  const pierna=/pierna|gl[uú]te|full|cuerpo completo|tren inferior/i.test(nom);
  let r=1;
  try{
    const dd=x=>Object.assign({},x,{ejercicios:comoArray(x.ejercicios)});
    const ent=DIAS_ORDER.map(x=>R[x]).filter(x=>x&&comoArray(x.ejercicios).length);
    const c=ent.map(x=>cargaDia(dd(x),s)), con=c.filter(v=>v>0), prom=con.reduce((a,b)=>a+b,0)/(con.length||1);
    if(prom&&con.length>=2) r=cargaDia(dd(d),s)/prom;
    else r=/pesado/i.test(nom)?1.2:/ligero/i.test(nom)?0.8:1;
  }catch(e){ r=/pesado/i.test(nom)?1.2:/ligero/i.test(nom)?0.8:1; }
  return {t:pierna||r>=PN_DIA_PESADO?'pesado':r<=PN_DIA_LIGERO?'ligero':'medio', nombre:limpio, pierna};
}
// Regla activa para el socio: la del plan del nutriólogo si existe, si no la de su filosofía
function pnReglaDia(s){
  const plan=s&&s.nutricion&&s.nutricion.plan;
  if(plan&&plan.ajusteDia) return plan.ajusteDia.on?plan.ajusteDia:null;
  const F=pnFiloDe(s); return F&&F.cargaDia&&F.cargaDia.on?F.cargaDia:null;
}
// Factor de carbohidrato para un día (+% pesado, −% descanso, igual en medio y ligero)
function pnFactorDia(regla,tipo){ if(!regla) return 0; return tipo==='pesado'?(+regla.pesado||0)/100:tipo==='descanso'?-(+regla.descanso||0)/100:0; }
function pnEqDia(eq,f){ if(!f) return eq; const o=Object.assign({},eq); ['CER','FRU'].forEach(g=>{ if(o[g]) o[g]=Math.round(o[g]*(1+f)*2)/2; }); return o; }
function pnNotaDiaHTML(tipo,f){
  if(tipo.t==='pesado') return `<div class="pn-dia-nota pesado">${ico('flame')}<p><b>Recuerda: hoy es día pesado${tipo.pierna?' ('+esc(tipo.nombre.toLowerCase())+')':''}.</b> Tu menú trae ${f>0?Math.round(f*100)+' % más carbohidrato':'la energía'} para rendir y recuperarte. Come tu comida de antes del entreno a tiempo y toma agua extra.</p></div>`;
  if(tipo.t==='descanso'&&f<0) return `<div class="pn-dia-nota">${ico('moonz')}<p><b>Hoy descansas.</b> Tu menú trae un poco menos de carbohidrato (${Math.round(-f*100)} %) y la misma proteína para seguir recuperando músculo.</p></div>`;
  return '';
}
// Solo la pestaña del socio usa el ajuste del día (la ficha del staff y el asistente siguen con la meta base)
let PN_DIA_CTX=null;   // {tipo, f} mientras se pinta la pestaña Nutrición del socio
(function(){
  if(typeof nutricionFinal==='function'){
    const o=nutricionFinal;
    window.nutricionFinal=nutricionFinal=function(s){
      const n=o.apply(this,arguments); const C=PN_DIA_CTX;
      if(!C||!C.f||!n||C.code!==(s&&s.code)) return n;
      const dc=Math.round(n.carbs*C.f);
      return Object.assign({},n,{carbs:n.carbs+dc, kcal:n.kcal+dc*4, diaAjuste:C});
    };
  }
  if(typeof nutTabHTML==='function'){
    const o=nutTabHTML;
    window.nutTabHTML=nutTabHTML=function(s){
      const regla=pnReglaDia(s), tipo=pnTipoDia(s,PN_DIA_JS[new Date().getDay()]), f=pnFactorDia(regla,tipo.t);
      const edad=+(s&&s.edad)||0;
      if(!regla||(edad>0&&edad<12)) return o.apply(this,arguments);
      PN_DIA_CTX={code:s.code, tipo, f};
      try{ return pnNotaDiaHTML(tipo,f)+o.apply(this,arguments); } finally { PN_DIA_CTX=null; }
    };
  }
})();

// ═════════════ Asistente: estado ═════════════
function pnComidasVacias(n){
  return (MEAL_TEMPLATES[n]||MEAL_TEMPLATES[4]).map(t=>({nombre:t.nombre, hora:MA_HORAS[t.nombre]||'', eq:{}, id:null, q:[], nota:''}));
}
function pnInit(s){
  const base=calcNutricion(s), nut=nutricionFinal(s), o=s.nutricion||{}, plan=o.plan||{}, F=pnFiloDe(s), d=pnDatos(s);
  pnRegistrarVariantes(s);
  const k0=o.calc||{}, peso=d.peso||base.pesoBase||70;
  const C={datos:d, formula:k0.formula||(F&&F.formula)||'auto', factor:k0.factor!=null?k0.factor:'auto',
    ajuste:k0.ajuste!=null?+k0.ajuste:base.ajustePct, kcal:nut.kcal, kcalManual:k0.kcalManual!=null?!!k0.kcalManual:!!nut.manual, modo:k0.modo||'gkg',
    pk:Math.round(nut.prot/peso*100)/100||1.8, gk:Math.round(nut.grasas/peso*100)/100||0.8,
    pp:nut.kcal?Math.round(nut.prot*4/nut.kcal*100):25, gp:nut.kcal?Math.round(nut.grasas*9/nut.kcal*100):25};
  const previas=comoArray(plan.comidas).map(m=>({nombre:m.nombre||'Comida', hora:m.hora||'', eq:Object.assign({},m.eq||{}), id:m.id||null, q:comoArray(m.q).map(Number), extra:[], nota:m.nota||''}));
  const n=previas.length||(F&&F.comidas)||([3,4,5,6].includes(+s.comidasPorDia)?+s.comidasPorDia:4);
  PN={code:s.code, paso:1, sub:'dia', C, porc:null, porcManual:!!plan.porciones, distManual:previas.some(m=>Object.keys(m.eq).length),
    comidas:previas.length?previas:pnComidasVacias(n), semana:JSON.parse(JSON.stringify(plan.semana||{})), var:JSON.parse(JSON.stringify(plan.var||{})),
    recs:o.nota||'', agua:nut.agua, pref:Object.assign({},s.nutPrefs||{}), cambios:false, compensar:true,
    ajusteDia:Object.assign({on:false,pesado:15,descanso:15},(F&&F.cargaDia)||{},plan.ajusteDia||{})};
  const M=pnMetas(C,base);
  PN.porc=plan.porciones?Object.assign({},plan.porciones):pnAutoPorciones(M);
  if(previas.length&&previas.some(m=>m.id)){ PN.comidas.forEach(pnSepararExtras); PN.comidas.forEach(m=>{ m.eq=pnEqReal(m); }); pnSyncPorc(); PN.porcManual=true; }   // plan guardado: lo que hay en el plato
  else { PN.porcManual=false; pnAutoDia(false); }
  PN_DIAS.forEach(([d])=>{ const a=PN.semana[d]; if(a) PN.semana[d]=comoArray(a).map(x=>{ if(!x) return null; const o=Object.assign({extra:[]},x,{q:comoArray(x.q).map(Number)}); pnSepararExtras(o); return o; }); });
}
// Un platillo guardado con complementos (variante "platillo + …") se vuelve a separar al abrir el plan
function pnSepararExtras(m){
  const v=m&&m.id&&maPlat(m.id); if(!v||!v.variante||!v.base||!/ \+ /.test(v.n)) return;
  const b=maPlat(v.base); if(!b||v.c.length<=b.c.length||!b.c.every((c,i)=>v.c[i]&&v.c[i][0]===c[0])) return;
  const q=comoArray(m.q).map(Number);
  m.id=b.id; m.q=q.slice(0,b.c.length); m.extra=v.c.slice(b.c.length).map((c,k)=>({f:c[0], q:+q[b.c.length+k]||+c[1]||0})).filter(x=>x.q>0);
}
function pnSocio(){ return PN&&getSocio(PN.code); }
function pnBase(){ const s=pnSocio(); return s?calcNutricion(s):null; }
function pnM(){ return pnMetas(PN.C,pnBase()); }
function pnAplicarReparto(){
  const r=pnRepartir(PN.porc,PN.comidas);
  PN.comidas.forEach((m,i)=>pnAjustarAEq(m,r[i]));
  pnSyncPorc();
}
// Plan automático: platillos escalados a la meta de cada comida (reparto y pre/post de js/48), con ajuste del día a ±5 %.
// keep = conserva los platillos ya elegidos y solo reescala; las comidas vacías reciben platillo.
function pnAutoDia(keep){
  const s=pnSocio(), M=pnM(), n=PN.comidas.length, nut={kcal:M.kcal,prot:M.prot,carbs:M.carbs,grasas:M.grasas};
  if(!keep||PN.comidas.some(m=>!m.id)){
    const d=generarMenuDia(Object.assign({},s,{menuAlt:null,nutPrefs:PN.pref}),nut,n);
    PN.comidas.forEach((m,i)=>{ const c=d.comidas[i]; if(c&&c.r&&(!keep||!m.id)){ m.id=c.r.platillo.id; m.q=c.r.q.slice(); m.extra=[]; } });
  }
  const metas=menuMetasComidas(s,nut,n), meta=i=>(metas[i]||metas[metas.length-1]);
  const escalar=(i,T)=>{ const m=PN.comidas[i], p=m.id&&maPlat(m.id); if(!p) return; const r=menuEscalar(p,T,meta(i).rol==='pre'); if(r){ m.q=r.q.slice(); m.extra=[]; } };
  if(keep) PN.comidas.forEach((m,i)=>escalar(i,meta(i).T));
  for(let it=0; it<n; it++){
    const tots=PN.comidas.map(pnComidaTot), t=tots.reduce((a,x)=>({k:a.k+x.k,p:a.p+x.p,c:a.c+x.c,l:a.l+x.l}),{k:0,p:0,c:0,l:0}), dk=M.kcal-t.k;
    if(Math.abs(dk)/M.kcal<=MENU_TOL_DIA) break;
    const i=tots.map((x,j)=>[x.k,j]).sort((a,b)=>b[0]-a[0])[it%n][1], x=tots[i];
    escalar(i,{k:Math.max(80,x.k+dk), p:Math.max(0,x.p+(M.prot-t.p)), c:Math.max(0,x.c+(M.carbs-t.c)), l:Math.max(0,x.l+(M.grasas-t.l))});
  }
  PN.comidas.forEach(m=>{ m.eq=pnEqReal(m); }); pnSyncPorc();
}
function pnReescalar(i){ const m=PN.comidas[i]; if(m) pnAjustarAEq(m,m.eq); }
function pnComidaTot(m){
  const t={k:0,p:0,l:0,c:0}, add=(f,q)=>{ if(!(q>0)||!MENU_ALIM[f]) return; const r=menuMacros(f,q); t.k+=r.k; t.p+=r.p; t.l+=r.l; t.c+=r.c; };
  const p=m.id&&maPlat(m.id); if(p) p.c.forEach(([f],i)=>add(f,+(m.q||[])[i]||0));
  comoArray(m.extra).forEach(x=>add(x.f,+x.q)); return t;
}
// Elige platillos para las comidas (vacías o todas) según la meta de equivalentes de cada una
function pnAutoPlatillos(soloVacias){
  const usados=new Set(soloVacias?PN.comidas.map(m=>m.id).filter(Boolean):[]);
  PN.comidas.forEach((m,i)=>{
    if(soloVacias&&m.id) return;
    const r=pnMejores(i,usados,1)[0];
    if(r){ m.id=r.platillo.id; m.extra=[]; pnAjustarAEq(m,m.eq); usados.add(m.id); }
  });
  pnSyncPorc();
}
// Platillos ordenados por qué tan bien llegan a la meta de una comida
function pnMejores(i,excluir,cuantos,todos){
  const m=PN.comidas[i], T=pnMetaComida(m.eq), tiempo=menuTiempo(m.nombre), gs=Object.keys(m.eq||{}).filter(g=>(+m.eq[g]||0)>=1);
  return MENU_PLATILLOS.filter(p=>!p.variante&&(todos||p.t.includes(tiempo))&&!(excluir&&excluir.has(p.id))&&menuPlatilloApto(p,PN.pref,false))
    .map(p=>{ const r=menuEscalar(p,T,false); if(!r) return null; const tiene=new Set(p.c.map(c=>MENU_ALIM[c[0]].g));
      r.err+=gs.filter(g=>!tiene.has(g)).length*0.25; return r; })   // prefiere platillos que ya traen los grupos de la comida
    .filter(Boolean).sort((a,b)=>a.err-b.err).slice(0,cuantos||999);
}
// ═════════════ Asistente: abrir, pintar ═════════════
function pnAbrir(code){
  const s=getSocio(code); if(!s) return;
  if(!nutPuedeEditar(s)){ showToast('No tienes permiso para editar la nutrición de este socio'); return; }
  pnInit(s); pnAsegurarModales(); pnRender();
  document.getElementById('modal-pn').classList.add('open');
}
function pnCerrar(forzar){
  if(PN&&PN.cambios&&!forzar){ uiConfirm('¿Salir sin guardar? Se pierden los cambios del plan.',()=>pnCerrar(true),{label:'Salir sin guardar',danger:true}); return; }
  const m=document.getElementById('modal-pn'); if(m) m.classList.remove('open'); PN=null;
}
function pnAsegurarModales(){
  if(document.getElementById('modal-pn')) return;
  const w=document.createElement('div');
  w.innerHTML=`<div class="modal pn-modal" id="modal-pn" onclick="if(event.target===this)pnCerrar()">
      <div class="mbox pn-box" role="dialog" aria-modal="true" aria-labelledby="pn-titulo"><div class="mx" onclick="pnCerrar()" aria-label="Cerrar">✕</div><div id="pn-cuerpo"></div></div></div>
    <div class="modal" id="modal-pn-plat" onclick="if(event.target===this)pnqCerrar()">
      <div class="mbox mq-box" role="dialog" aria-modal="true" aria-labelledby="pnq-titulo"><div class="mx" onclick="pnqCerrar()" aria-label="Cerrar">✕</div><div id="pnq-cuerpo"></div></div></div>
    <div class="modal" id="modal-pn-aux" onclick="if(event.target===this)pnAuxCerrar()">
      <div class="mbox pn-aux" role="dialog" aria-modal="true" aria-labelledby="pnx-titulo"><div class="mx" onclick="pnAuxCerrar()" aria-label="Cerrar">✕</div><div id="pnx-cuerpo"></div></div></div>`;
  while(w.firstChild) document.body.appendChild(w.firstChild);
}
function pnAuxCerrar(){ const m=document.getElementById('modal-pn-aux'); if(m) m.classList.remove('open'); }
function pnAux(html){ pnAsegurarModales(); const b=document.querySelector('#modal-pn-aux .pn-aux'); if(b) b.classList.remove('pn-aux-prev'); document.getElementById('pnx-cuerpo').innerHTML=html; document.getElementById('modal-pn-aux').classList.add('open'); }
function pnPaso(n){ if(!PN) return; PN.paso=n; pnPrepararPaso(); pnRender(); const b=document.querySelector('#modal-pn .pn-box'); if(b) b.scrollTop=0; }
// Al pasar de paso, lo que no se ha tocado a mano se recalcula con las metas nuevas
function pnPrepararPaso(){ if(PN.paso>=2&&!PN.porcManual) pnAutoDia(true); }
const PN_PASOS=[[1,'Dietocálculo'],[2,'Porciones'],[3,'Distribuye'],[4,'Entrega']];
function pnRender(){
  if(!PN) return; const s=pnSocio(); if(!s) return;
  const M=pnM(), tp=pnAporte(PN.porc), tm=PN.comidas.reduce((a,m)=>{ const t=pnComidaTot(m); return {k:a.k+t.k,p:a.p+t.p,l:a.l+t.l,c:a.c+t.c}; },{k:0,p:0,l:0,c:0});
  const dv=(v,meta)=>meta?Math.round((v-meta)/meta*100):0, sg=x=>(x>0?'+':'')+x+'%';
  const cuerpo=PN.paso===1?pnPaso1(s,M):PN.paso===2?pnPaso2(s,M,tp):PN.paso===3?pnPaso3(s,M):pnPaso4(s,M,tm);
  document.getElementById('pn-cuerpo').innerHTML=`
    <div class="m-tag">Plan de alimentación · ${esc(tc(s.nombre))}</div>
    <div class="m-title" id="pn-titulo">${esc(PN_PASOS[PN.paso-1][1])}</div>
    <nav class="pn-pasos" aria-label="Pasos del plan">${PN_PASOS.map(([n,lb])=>`<button type="button" class="${n===PN.paso?'on':n<PN.paso?'ya':''}" aria-current="${n===PN.paso?'step':'false'}" onclick="pnPaso(${n})"><i>${n<PN.paso?ico('check'):n}</i><span>${lb}</span></button>`).join('')}</nav>
    <div class="pn-sum">
      <div><small>Meta</small><b>${pnNum(M.kcal)}</b><span>kcal · P ${M.prot} · C ${M.carbs} · G ${M.grasas}</span></div>
      <div class="${pnEstado(tp.k,M.kcal,PN_TOL.k)}"><small>Porciones</small><b>${pnNum(tp.k)}</b><span>${sg(dv(tp.k,M.kcal))} · P ${pnNum(tp.p)} g</span></div>
      <div class="${pnEstado(tm.k,M.kcal,PN_TOL.k)}"><small>Menú</small><b>${pnNum(tm.k)}</b><span>${sg(dv(tm.k,M.kcal))} · P ${pnNum(tm.p)} g</span></div>
    </div>
    <div class="pn-paso">${cuerpo}</div>
    <div class="pn-f">
      ${PN.paso>1?`<button type="button" class="sd-b" onclick="pnPaso(${PN.paso-1})">${ico('chevl')}Anterior</button>`:'<span></span>'}
      ${PN.paso<4?`<button type="button" class="sd-pri" onclick="pnPaso(${PN.paso+1})">Siguiente: ${esc(PN_PASOS[PN.paso][1])}</button>`
        :`<button type="button" class="sd-pri" onclick="pnGuardar()">${ico('check')}Guardar y asignar</button>`}
    </div>`;
}
function pnSet(campo,v){ if(!PN) return; PN[campo]=v; PN.cambios=true; pnRender(); }

// ── Paso 1: Dietocálculo ──
function pnPaso1(s,M){
  const C=PN.C, d=C.datos, base=pnBase(), num=v=>v==null||v===''?'':v;
  const forms=PN_FORMULAS.map(([k,lb])=>{ const g=k==='kcal'||k==='auto'?1:pnGEB(k,d,base); return `<option value="${k}" ${C.formula===k?'selected':''} ${g?'':'disabled'}>${lb}${g||k==='kcal'?'':' (faltan datos)'}</option>`; }).join('');
  const fCustom=C.factor!=='auto'&&!PN_FACTORES.some(f=>+f[0]===+C.factor);
  const plantillas=Object.keys(NPL).filter(k=>NPL[k]&&!NPL[k].borrada);
  const avisos=pnAvisos(s,M);
  const pc=x=>M.kcal?Math.round(x/M.kcal*100):0;
  const fila=(lb,cls,g,kc,campo,val,step,unid)=>`<tr><th><i class="${cls}"></i>${lb}</th>
    <td>${campo?`<div class="pn-in"><input inputmode="decimal" value="${val}" aria-label="${lb} en ${unid}" onchange="pnCalc('${campo}',this.value)"><span>${unid}</span></div>`:`<span class="pn-auto">resto</span>`}</td>
    <td><b>${pnNum(g)} g</b></td><td>${pnR1(g/M.peso)} g/kg</td><td>${pc(kc)} %</td></tr>`;
  return `
    ${plantillas.length?`<div class="pn-card pn-tpl"><label class="f-lbl" for="pn-tpl">Partir de una plantilla</label>
      <select id="pn-tpl" class="ti" onchange="if(this.value)pnUsarPlantilla(this.value)"><option value="">Elegir…</option>${plantillas.map(k=>`<option value="${esc(k)}">${esc(NPL[k].nombre||'Plantilla')}</option>`).join('')}</select></div>`:''}
    <section class="pn-card">
      <h3>Datos del paciente <small>De ${esc(d.fuente)}</small></h3>
      <div class="pn-datos">
        <label><span>Peso</span><div class="pn-in"><input inputmode="decimal" value="${num(d.peso)}" onchange="pnDato('peso',this.value)"><span>kg</span></div></label>
        <label><span>Estatura</span><div class="pn-in"><input inputmode="decimal" value="${num(d.est)}" onchange="pnDato('est',this.value)"><span>cm</span></div></label>
        <label><span>Edad</span><div class="pn-in"><input inputmode="numeric" value="${num(d.edad)}" onchange="pnDato('edad',this.value)"><span>años</span></div></label>
        <label><span>Sexo</span><select class="ti" onchange="pnDato('sexo',this.value)"><option value="m" ${d.sexo==='m'?'selected':''}>Femenino</option><option value="h" ${d.sexo==='h'?'selected':''}>Masculino</option><option value="" ${!d.sexo?'selected':''}>Sin dato</option></select></label>
        <label><span>Masa libre de grasa</span><div class="pn-in"><input inputmode="decimal" value="${d.mlg||''}" placeholder="InBody" onchange="pnDato('mlg',this.value)"><span>kg</span></div></label>
      </div>
      <p class="pn-nota">Estos datos solo se usan para este cálculo; no cambian la ficha del socio.${d.mlg?'':' Con una medición InBody se habilitan Cunningham y Katch-McArdle.'}</p>
    </section>
    <section class="pn-card">
      <h3>Cálculo de necesidades energéticas</h3>
      <div class="pn-calc">
        <label><span>Fórmula</span><select class="ti" onchange="pnCalc('formula',this.value)">${forms}</select></label>
        <div class="pn-res"><small>GEB</small><b>${M.geb?pnNum(M.geb):'—'}</b><span>kcal</span></div>
        <label><span>Factor de actividad</span><select class="ti" onchange="pnCalc('factor',this.value)">
          <option value="auto" ${C.factor==='auto'?'selected':''}>De la app: ${base.factor} (${esc(base.factorTxt||'')})</option>
          ${PN_FACTORES.map(([f,lb])=>`<option value="${f}" ${+C.factor===f&&C.factor!=='auto'?'selected':''}>${lb} · ${f}</option>`).join('')}
          <option value="otro" ${fCustom?'selected':''}>Otro…</option></select>
          ${fCustom?`<div class="pn-in" style="margin-top:6px"><input inputmode="decimal" value="${C.factor}" aria-label="Factor de actividad" onchange="pnCalc('factorNum',this.value)"><span>×</span></div>`:''}</label>
        <div class="pn-res"><small>GET</small><b>${M.get?pnNum(M.get):'—'}</b><span>kcal${C.formula==='auto'&&C.factor==='auto'&&base.recal?' · recalibrado con su peso':''}</span></div>
      </div>
      ${C.formula==='valencia'?'<p class="pn-nota warn">Valencia: coeficientes pendientes de verificar con el artículo original.</p>':''}
      <div class="pn-kcal">
        <label><span>Ajuste por objetivo</span><div class="pn-in"><input inputmode="decimal" value="${C.ajuste}" ${C.formula==='kcal'?'disabled':''} onchange="pnCalc('ajuste',this.value)"><span>%</span></div></label>
        <div class="ch-row">${[-20,-15,-10,0,5,10,15].map(a=>`<button type="button" class="ch${+C.ajuste===a&&!C.kcalManual?' on':''}" ${C.formula==='kcal'?'disabled':''} onclick="pnCalc('ajuste',${a})">${a>0?'+':''}${a}%</button>`).join('')}</div>
        <label class="pn-big"><span>Calorías para el plan</span><div class="pn-in"><input inputmode="numeric" value="${M.kcal}" aria-label="Calorías para el plan" onchange="pnCalc('kcal',this.value)"><span>kcal</span></div></label>
        ${C.kcalManual&&C.formula!=='kcal'?`<button type="button" class="ma-lnk" onclick="pnCalc('recalcular')">${ico('refresh')}Volver a calcular con la fórmula</button>`:''}
      </div>
      <p class="pn-nota">Automático de la app: ${pnNum(base.kcal)} kcal (${esc(base.bmrMetodo||'')} × ${base.factor}, ${esc(base.ajusteTxt||'')}).${base.filosofia?' Filosofía de '+esc(base.filosofia)+'.':''}</p>
    </section>
    <section class="pn-card">
      <h3>Macronutrientes</h3>
      <div class="ch-row"><button type="button" class="ch${C.modo==='gkg'?' on':''}" onclick="pnCalc('modo','gkg')">Por g/kg</button><button type="button" class="ch${C.modo==='pct'?' on':''}" onclick="pnCalc('modo','pct')">Por % de las kcal</button></div>
      <table class="pn-mac"><thead><tr><th></th><th>Meta</th><th>Gramos</th><th>g/kg</th><th>% kcal</th></tr></thead><tbody>
        ${fila('Proteína','m-p',M.prot,M.prot*4,C.modo==='gkg'?'pk':'pp',C.modo==='gkg'?C.pk:C.pp,0.1,C.modo==='gkg'?'g/kg':'%')}
        ${fila('Grasas','m-g',M.grasas,M.grasas*9,C.modo==='gkg'?'gk':'gp',C.modo==='gkg'?C.gk:C.gp,0.1,C.modo==='gkg'?'g/kg':'%')}
        ${fila('Carbohidratos','m-c',M.carbs,M.carbs*4,null)}
      </tbody></table>
      <p class="pn-nota">g/kg sobre ${pnR1(M.peso)} kg. El carbohidrato es lo que queda de las calorías, así los macros siempre cuadran.</p>
      ${avisos.length?`<ul class="pn-avisos">${avisos.map(a=>`<li>${ico('warn')}<span>${esc(a)}</span></li>`).join('')}</ul>`:''}
    </section>`;
}
function pnDato(k,v){
  if(!PN) return; const d=PN.C.datos;
  d[k]=k==='sexo'?v:(parseFloat(String(v).replace(',','.'))||0); d.fuente='datos capturados aquí';
  if(PN.C.formula!=='auto'&&PN.C.formula!=='kcal'&&!pnGEB(PN.C.formula,d,pnBase())) PN.C.formula='mifflin';
  PN.cambios=true; pnRender();
}
function pnCalc(k,v){
  if(!PN) return; const C=PN.C, M0=pnM(), n=x=>parseFloat(String(x).replace(',','.'));
  if(k==='formula'){ C.formula=v; if(v!=='kcal') C.kcalManual=false; else C.kcal=M0.kcal; }
  else if(k==='factor'){ if(v==='otro') C.factor=M0.factor; else C.factor=v==='auto'?'auto':+v; C.kcalManual=false; }
  else if(k==='factorNum'){ const x=n(v); if(x>=1&&x<=2.5) C.factor=x; C.kcalManual=false; }
  else if(k==='ajuste'){ const x=n(v); if(!isNaN(x)) C.ajuste=Math.max(-40,Math.min(40,x)); C.kcalManual=false; }
  else if(k==='kcal'){ const x=n(v); if(x>=500&&x<=7000){ C.kcal=Math.round(x); C.kcalManual=true; } }
  else if(k==='recalcular'){ C.kcalManual=false; }
  else if(k==='modo'&&v!==C.modo){ C.modo=v; C.pk=Math.round(M0.prot/M0.peso*100)/100; C.gk=Math.round(M0.grasas/M0.peso*100)/100;
    C.pp=Math.round(M0.prot*4/M0.kcal*100); C.gp=Math.round(M0.grasas*9/M0.kcal*100); }
  else if(['pk','gk','pp','gp'].includes(k)){ const x=n(v); if(!isNaN(x)&&x>=0) C[k]=x; }
  PN.cambios=true; pnRender();
}

// ── Paso 2: Porciones ──
function pnPaso2(s,M,tp){
  const fila=([g,lb])=>{ const b=SMAE_EQ[g], n=+PN.porc[g]||0, st=PN_RANGO[g][2];
    return `<tr class="${n?'':'cero'}"><th>${esc(lb)}<small>${b.k} kcal · HC ${b.c} · P ${b.p} · L ${b.l}</small></th>
      <td><div class="ma-st pn-st"><button type="button" onclick="pnPorc('${g}',${-st})" aria-label="Menos ${esc(lb)}" ${n<=0?'disabled':''}>−</button><b>${menuFrac(n)||0}</b><button type="button" onclick="pnPorc('${g}',${st})" aria-label="Más ${esc(lb)}">+</button></div></td>
      <td>${pnNum(b.c*n)}</td><td>${pnNum(b.p*n)}</td><td>${pnNum(b.l*n)}</td><td><b>${pnNum(b.k*n)}</b></td></tr>`; };
  const celda=(v,meta,tol,u)=>{ const e=pnEstado(v,meta,tol), d=v-meta;
    return `<td class="pn-sem ${e}"><b>${pnNum(v)}${u}</b><small>${e==='ok'?'Dentro de rango':(d>0?'Sobran ':'Faltan ')+pnNum(Math.abs(d))+u}</small></td>`; };
  const kt=tp.p*4+tp.c*4+tp.l*9||1;
  return `<div class="ma-tools"><button type="button" class="sd-b" onclick="pnAutoPorc()">${ico('spark')}Autogenerar porciones</button>
      ${PN.porcManual?'<span class="pn-tag">Ajustadas a mano</span>':'<span class="pn-tag auto">Automáticas: se recalculan si cambias las metas</span>'}</div>
    <div class="pn-tabla-w"><table class="pn-tabla"><thead><tr><th>Grupo</th><th>Porciones</th><th>HC</th><th>Prot</th><th>Líp</th><th>Kcal</th></tr></thead>
      <tbody>${PN_GRUPOS.map(fila).join('')}</tbody>
      <tfoot><tr><th>Total</th><td></td>${celda(tp.c,M.carbs,PN_TOL.c,' g')}${celda(tp.p,M.prot,PN_TOL.p,' g')}${celda(tp.l,M.grasas,PN_TOL.l,' g')}${celda(tp.k,M.kcal,PN_TOL.k,'')}</tr>
        <tr class="pn-meta"><th>Meta</th><td></td><td>${M.carbs} g</td><td>${M.prot} g</td><td>${M.grasas} g</td><td>${pnNum(M.kcal)}</td></tr>
        <tr class="pn-meta"><th>Distribución real</th><td></td><td>${Math.round(tp.c*4/kt*100)} %</td><td>${Math.round(tp.p*4/kt*100)} %</td><td>${Math.round(tp.l*9/kt*100)} %</td><td></td></tr></tfoot></table></div>
    <p class="pn-nota">Equivalentes del Sistema Mexicano de Alimentos Equivalentes (kcal oficiales, sin recalcular con 4/4/9). Tolerancias: kcal ±5 %, proteína ±10 %, grasa y carbohidrato ±15 %.</p>`;
}
function pnPorc(g,d){
  if(!PN) return; const total=+PN.porc[g]||0, nuevo=Math.max(0,pnR2(total+d));
  if(!total){
    const tiene=j=>{ const p=maPlat(PN.comidas[j].id); return p&&p.c.some(c=>MENU_ALIM[c[0]].g===g)?1:0; };
    const j=PN.comidas.map((m,k)=>k).sort((a,b)=>tiene(b)-tiene(a)||pnComidaTot(PN.comidas[b]).k-pnComidaTot(PN.comidas[a]).k)[0];
    if(j!=null&&nuevo>0) pnAjustarAEq(PN.comidas[j],Object.assign({},PN.comidas[j].eq,{[g]:nuevo}));
  }
  else {
    // el cambio del día se reparte en las comidas que ya tienen ese grupo, empezando por la que más tiene
    let rest=Math.abs(d); const orden=PN.comidas.map((m,j)=>j).filter(j=>(+(PN.comidas[j].eq||{})[g]||0)>0).sort((a,b)=>(+PN.comidas[b].eq[g])-(+PN.comidas[a].eq[g]));
    for(const j of orden){ if(rest<0.25) break; const m=PN.comidas[j], antes=+m.eq[g]||0, mov=d>0?rest:Math.min(antes,rest);
      pnAjustarAEq(m,Object.assign({},m.eq,{[g]:Math.max(0,antes+(d>0?mov:-mov))})); rest-=Math.abs((+m.eq[g]||0)-antes); }
  }
  pnTrasCambio(); pnRender();
}
// Si el reparto ya se tocó a mano, el cambio de un grupo se reparte solo en ese grupo
function pnAjustarGrupo(g){ pnPorc(g,0); }
function pnAutoPorc(){ if(!PN) return; pnAutoDia(true); PN.porcManual=false; PN.distManual=false; PN.cambios=true; pnRender(); showToast('Porciones recalculadas: cada platillo se ajustó a la meta de su comida'); }
// ── Paso 3: Distribuye (día tipo y semana) ──
function pnPaso3(s,M){
  const tabs=`<div class="pn-sub"><button type="button" class="${PN.sub==='dia'?'on':''}" onclick="pnSet('sub','dia')">Día tipo</button><button type="button" class="${PN.sub==='semana'?'on':''}" onclick="pnSet('sub','semana')">Planeación semanal</button></div>`;
  return tabs+(PN.sub==='semana'?pnSemanaHTML():pnDiaHTML());
}
function pnDiaHTML(){
  const C=PN.comidas, grupos=PN_GRUPOS.filter(([g])=>(+PN.porc[g]||0)>0||C.some(m=>m.eq&&m.eq[g]));
  const head=C.map((m,i)=>`<th><input class="pn-cn" value="${esc(m.nombre)}" aria-label="Nombre de la comida ${i+1}" onchange="pnComida(${i},'nombre',this.value)"><input type="time" class="pn-ch" value="${esc(m.hora)}" aria-label="Hora de ${esc(m.nombre)}" onchange="pnComida(${i},'hora',this.value)"></th>`).join('');
  const filas=grupos.map(([g,lb])=>{
    const tot=+PN.porc[g]||0;
    return `<tr><th><span>${esc(lb)}</span><em class="ok">${menuFrac(tot)||0} en el día</em></th>${C.map((m,i)=>{ const v=+(m.eq||{})[g]||0;
      return `<td class="${v?'':'cero'}"><div class="pn-cel"><button type="button" onclick="pnEq(${i},'${g}',-0.5)" aria-label="Menos ${esc(lb)} en ${esc(m.nombre)}" ${v<=0?'disabled':''}>−</button><b>${v?menuFrac(v):'·'}</b><button type="button" onclick="pnEq(${i},'${g}',0.5)" aria-label="Más ${esc(lb)} en ${esc(m.nombre)}">+</button></div></td>`; }).join('')}</tr>`;
  }).join('');
  const pie=C.map(m=>{ const t=pnAporte(m.eq); return `<td><b>${pnNum(t.k)} kcal</b><small>HC ${pnNum(t.c)} · P ${pnNum(t.p)} · L ${pnNum(t.l)}</small></td>`; }).join('');
  return `<div class="ma-g"><div class="rt-gl">Comidas al día</div><div class="ch-row">${[3,4,5,6].map(n=>`<button type="button" class="ch${n===C.length?' on':''}" aria-pressed="${n===C.length}" onclick="pnSetN(${n})">${n}</button>`).join('')}</div></div>
    <div class="ma-tools"><button type="button" class="sd-b" onclick="pnRepartirTodo()">${ico('target')}Ajustar comidas a la meta</button>
      <button type="button" class="sd-b" onclick="pnAutoTodo()">${ico('spark')}Elegir platillos automático</button></div>
    <label class="pn-sw-row pn-comp"><input type="checkbox" ${PN.compensar?'checked':''} onchange="PN.compensar=this.checked;pnRender()"><span><b>Mantener el total del día.</b> Si subes o bajas porciones en una comida (en la tabla o en el platillo), las demás comidas compensan ese mismo grupo. Apágalo para sumar sin quitar.</span></label>
    <div class="pn-tabla-w"><table class="pn-dist"><thead><tr><th>Grupo · total del día</th>${head}</tr></thead><tbody>${filas}</tbody><tfoot><tr><th>Por comida</th>${pie}</tr></tfoot></table></div>
    <h3 class="pn-h">Platillo de cada comida</h3>
    <div class="ma-lista">${C.map((m,i)=>pnCardComida(m,i)).join('')}</div>
    <p class="pn-nota">Todo está conectado: el platillo se ajusta a las porciones de su comida, lo que el platillo no trae entra como complemento, y cualquier cambio actualiza la tabla de arriba y las porciones del día. Para agregar un grupo a una comida, súmalo en la tabla.</p>
    <button type="button" class="ma-lnk" onclick="nrEditor()">${ico('plus')}Crear receta propia</button>`;
}
function pnCardComida(m,i){
  const p=m.id&&maPlat(m.id), r=pnComidaTot(m), ex=comoArray(m.extra);
  const filaEx=(x,k)=>`<li class="pn-ex"><span><em>Complemento</em> ${esc(menuPorcion(x.f,x.q))}</span>
      <div class="ma-st"><button type="button" class="pn-sw" onclick="pnSwapAbrir(${i},'x${k}')" aria-label="Cambiar por otro equivalente" title="Cambiar por otro equivalente">${ico('shuffle')}</button><button type="button" onclick="pnExtra(${i},${k},-1)" aria-label="Menos">−</button><button type="button" onclick="pnExtra(${i},${k},1)" aria-label="Más">+</button></div></li>`;
  if(!p) return `<article class="ma-c vacia"><div class="ma-c-h"><b class="pn-cnom">${esc(m.hora||'')} · ${esc(m.nombre)}</b><span class="ma-meta">${pnNum(r.k)} kcal por equivalentes</span></div>
    ${ex.length?`<ul class="ma-ing">${ex.map(filaEx).join('')}</ul>`:''}
    <button type="button" class="ma-elegir" onclick="pnqAbrir(${i})">${ico('plus')}Elegir platillo</button></article>`;
  const fid=menuFotoId(p.id);
  const ing=p.c.map(([f],ci)=>{
    const a=MENU_ALIM[f], q=+m.q[ci]||0; if(a.u==='libre') return `<li class="libre"><span>${esc(a.s)}</span></li>`;
    return `<li class="${q?'':'cero'}"><span>${esc(q?menuPorcion(f,q):maSin(f))}</span>
      <div class="ma-st"><button type="button" class="pn-sw" onclick="pnSwapAbrir(${i},${ci})" aria-label="Cambiar ${esc(a.s)} por otro equivalente" title="Cambiar por otro equivalente">${ico('shuffle')}</button><button type="button" onclick="pnIng(${i},${ci},-1)" aria-label="Menos ${esc(a.s)}" ${q<=0?'disabled':''}>−</button><button type="button" onclick="pnIng(${i},${ci},1)" aria-label="Más ${esc(a.s)}">+</button></div></li>`;
  }).join('');
  return `<article class="ma-c">
    <div class="ma-c-h"><b class="pn-cnom">${esc(m.hora||'')} · ${esc(m.nombre)}</b><span class="ma-meta">${esc(menuEquivTxt({comps:Object.keys(m.eq||{}).map(g=>({f:Object.keys(MENU_ALIM).find(k=>MENU_ALIM[k].g===g&&!MENU_ALIM[k].lb),q:m.eq[g]})).filter(x=>x.f)}))}${p.variante?' · <b>variante</b>':p.propia?' · <b>receta propia</b>':''}</span></div>
    <div class="ma-c-p">${fid?`<img src="${menuFotoSrc(fid)}" alt="" width="96" height="60" loading="lazy">`:`<span class="ma-ph">${ico('food')}</span>`}
      <div class="ma-c-n"><b>${esc(p.n)}</b><small>${pnNum(r.k)} kcal · P ${pnNum(r.p)} · C ${pnNum(r.c)} · G ${pnNum(r.l)}</small></div>
      <button type="button" class="ma-chg" onclick="pnqAbrir(${i})">Cambiar</button></div>
    <ul class="ma-ing">${ing}${ex.map(filaEx).join('')}</ul>
    <div class="ma-c-a"><button type="button" class="ma-lnk dng" onclick="pnQuitarPlat(${i})">${ico('trash')}Quitar platillo</button></div>
  </article>`;
}
function pnComida(i,k,v){ const m=PN&&PN.comidas[i]; if(!m) return; m[k]=k==='hora'?String(v||''):limpiarTexto(v); PN.cambios=true; if(k!=='nota') pnRender(); }
function pnSetN(n){
  if(!PN||n===PN.comidas.length) return;
  const nuevas=pnComidasVacias(n), usadas=new Set();
  nuevas.forEach(c=>{ const j=PN.comidas.findIndex((m,ix)=>!usadas.has(ix)&&m.nombre===c.nombre); if(j>=0){ usadas.add(j); Object.assign(c,PN.comidas[j]); } });
  PN.comidas=nuevas; PN.semana={}; PN.distManual=false; pnAutoDia(true); PN.cambios=true; pnRender();
}
function pnEq(i,g,d){
  const m=PN&&PN.comidas[i]; if(!m) return; const antes=+(m.eq||{})[g]||0;
  for(let k=1;k<=3;k++){ pnAjustarAEq(m,Object.assign({},m.eq,{[g]:Math.max(0,antes+d*k)})); if(Math.abs((+m.eq[g]||0)-antes)>=0.25) break; }
  pnCompensar(i,g,(+m.eq[g]||0)-antes);
  PN.distManual=true; pnTrasCambio(); pnRender();
}
function pnRepartirTodo(){ if(!PN) return; pnAutoDia(true); PN.porcManual=false; PN.distManual=false; PN.cambios=true; pnRender(); showToast('Comidas ajustadas a la meta del día'); }
function pnAutoTodo(){ if(!PN) return; pnAutoPlatillos(false); PN.cambios=true; pnRender(); showToast('Platillos elegidos para cada comida'); }
function pnIng(i,ci,d){
  const m=PN&&PN.comidas[i], p=m&&maPlat(m.id); if(!p) return;
  const f=p.c[ci][0], g=MENU_ALIM[f].g, st=pnPasoAlim(f)||1, antes=+(m.eq||{})[g]||0;
  m.q[ci]=Math.max(0,pnR2((+m.q[ci]||0)+d*st)); m.eq=pnEqReal(m);
  pnCompensar(i,g,(+m.eq[g]||0)-antes);
  PN.distManual=true; pnTrasCambio(); pnRender();
}
function pnExtra(i,k,d){
  const m=PN&&PN.comidas[i], x=m&&comoArray(m.extra)[k]; if(!x) return;
  const g=MENU_ALIM[x.f].g, st=pnPasoAlim(x.f)||1, antes=+(m.eq||{})[g]||0;
  x.q=Math.max(0,pnR2(x.q+d*st)); m.extra=comoArray(m.extra).filter(e=>e.q>0); m.eq=pnEqReal(m);
  pnCompensar(i,g,(+m.eq[g]||0)-antes);
  PN.distManual=true; pnTrasCambio(); pnRender();
}
function pnAjustarComida(i){ pnReescalar(i); pnTrasCambio(); pnRender(); }
function pnQuitarPlat(i){ const m=PN&&PN.comidas[i]; if(!m) return; m.id=null; m.q=[]; m.extra=[]; pnAjustarAEq(m,m.eq); pnTrasCambio(); pnRender(); }
// Intercambiar un ingrediente por otro de la misma familia (crea una variante del platillo solo para este plan)
function pnSwapAbrir(i,ci){
  const m=PN.comidas[i]; if(!m) return; const esEx=String(ci)[0]==='x';
  const p=maPlat(m.id), x=esEx?comoArray(m.extra)[+String(ci).slice(1)]:null;
  const f=esEx?(x&&x.f):(p&&p.c[ci][0]); if(!f) return;
  const q=esEx?x.q:(+m.q[ci]||1), fam=PN_FAMILIA[MENU_ALIM[f].g];
  const usados=new Set((p?p.c.map(c=>c[0]):[]).concat(comoArray(m.extra).map(e=>e.f)));
  const alts=Object.keys(MENU_ALIM).filter(k=>k!==f&&MENU_ALIM[k].u!=='libre'&&PN_FAMILIA[MENU_ALIM[k].g]===fam&&!usados.has(k))
    .sort((a,b)=>(MENU_ALIM[a].g===MENU_ALIM[f].g?0:1)-(MENU_ALIM[b].g===MENU_ALIM[f].g?0:1));
  const nombre=g=>(PN_GRUPOS.find(x=>x[0]===g)||[,''])[1];
  pnAux(`<div class="m-title" id="pnx-titulo" style="font-size:var(--fs-2xl)">Cambiar ${esc(menuPorcion(f,q))}</div>
    <p class="pn-nota">Equivalentes del mismo grupo: ${menuFrac(q)} equivalente${q>1?'s':''} por ${menuFrac(q)}. ${esEx?'':'El cambio se guarda como variante del platillo solo en el plan de este socio.'}</p>
    <div class="pn-alts">${alts.map(k=>{ const a=MENU_ALIM[k], b=a.m||SMAE_EQ[a.g];
      return `<button type="button" onclick="pnSwap(${i},'${ci}','${k}')"><b>${esc(menuPorcion(k,q))}</b><small>${pnNum(b.k*q)} kcal · P ${pnNum(b.p*q)} g · C ${pnNum(b.c*q)} g · G ${pnNum(b.l*q)} g · ${esc(nombre(a.g))}</small></button>`; }).join('')||'<p class="pn-nota">No hay otro alimento de este grupo en la biblioteca.</p>'}</div>`);
}
function pnSwap(i,ci,nuevo){
  const m=PN.comidas[i]; if(!m) return; ci=String(ci);
  if(ci[0]==='x'){ const x=comoArray(m.extra)[+ci.slice(1)]; if(!x) return; const st=pnPasoAlim(nuevo)||1; x.f=nuevo; x.q=pnRed(x.q,st)||st; }
  else {
    const p=maPlat(m.id); if(!p) return; const k=+ci, viejo=p.c[k][0];
    const c=p.c.map((x,j)=>j===k?[nuevo,x[1],x[2],Math.max(x[3],x[1])].concat(x[4]?[x[4]]:[]):x.slice());
    const corto=x=>String(MENU_ALIM[x].pl||MENU_ALIM[x].s).replace(/^de /,'').split(/[,(]/)[0].trim();
    const vid='v-'+pnId(), v={n:(p.variante?p.n.replace(/ \(.*\)$/,''):p.n)+' ('+corto(nuevo)+' en lugar de '+corto(viejo)+')', t:(p.tOrig||p.t).slice(), c, prep:p.prep||'', base:p.variante?p.base:p.id};
    PN.var[vid]=v; pnRegistrarVar(vid,v); m.id=vid;
    const st=pnPasoAlim(nuevo)||1; m.q[k]=pnRed(+m.q[k]||0,st)||(m.q[k]>0?st:0);
  }
  m.eq=pnEqReal(m); pnTrasCambio(); pnAuxCerrar(); pnRender(); showToast('Cambiado por su equivalente');
}
// Semana: cada celda usa el platillo del día tipo, salvo que se elija otro para ese día
function pnSemanaHTML(){
  const C=PN.comidas;
  const filas=C.map((m,i)=>`<tr><th><b>${esc(m.nombre)}</b><small>${esc(m.hora||'')}</small></th>${PN_DIAS.map(([d])=>{
    const x=((PN.semana[d]||[])[i])||null, id=x?x.id:m.id, p=id&&maPlat(id), fid=p&&menuFotoId(p.id);
    return `<td><button type="button" class="pn-sem-c${x?' propio':''}" onclick="pnqAbrir(${i},'${d}')" aria-label="${esc(m.nombre)} del ${d}: ${p?esc(p.n):'sin platillo'}">
      ${fid?`<img src="${menuFotoSrc(fid)}" alt="" loading="lazy" width="120" height="76">`:`<span class="ma-ph">${ico('food')}</span>`}
      <span>${p?esc(p.n):'Sin platillo'}</span>${x?'':'<em>Día tipo</em>'}</button></td>`; }).join('')}</tr>`).join('');
  const conDias=PN_DIAS.filter(([d])=>(PN.semana[d]||[]).some(Boolean)).length;
  const s=pnSocio(), A=PN.ajusteDia;
  const tipos=PN_DIAS.map(([d])=>pnTipoDia(s,d));
  const chip=t=>{ const f=pnFactorDia(A.on?A:null,t.t); return `<span class="pn-td ${t.t}">${t.t==='descanso'?'Descanso':esc(t.nombre.length>14?t.nombre.slice(0,13)+'…':t.nombre)}<em>${t.t==='pesado'?'Pesado':t.t==='ligero'?'Ligero':t.t==='medio'?'Medio':''}${f?' · HC '+(f>0?'+':'')+Math.round(f*100)+'%':''}</em></span>`; };
  const ajuste=`<section class="pn-card pn-aj"><label class="pn-sw-row"><input type="checkbox" ${A.on?'checked':''} onchange="pnAjusteDia('on',this.checked)"><span><b>Ajustar al entrenamiento del día</b> · el carbohidrato sube el día pesado y baja el de descanso; proteína y grasa iguales. El día pesado el socio ve un recordatorio.</span></label>
    ${A.on?`<div class="pn-aj-in"><label><span>Pesado</span><div class="pn-in"><input inputmode="numeric" value="${A.pesado}" onchange="pnAjusteDia('pesado',this.value)"><span>% más HC</span></div></label>
      <label><span>Descanso</span><div class="pn-in"><input inputmode="numeric" value="${A.descanso}" onchange="pnAjusteDia('descanso',this.value)"><span>% menos HC</span></div></label></div>`:''}</section>`;
  return ajuste+`<p class="pn-nota">Cada día usa el platillo del día tipo. Toca una celda para poner otro platillo ese día: las porciones se ajustan a la misma meta de la comida.</p>
    <div class="ma-tools"><button type="button" class="sd-b" onclick="pnSemanaAuto()">${ico('spark')}Planeación semanal automática</button>
      ${conDias?`<button type="button" class="sd-b" onclick="pnSemanaLimpiar()">${ico('refresh')}Todos los días igual al día tipo</button>`:''}</div>
    <div class="pn-tabla-w"><table class="pn-semana"><thead><tr><th>Tiempo de comida</th>${PN_DIAS.map(([,lb])=>`<th>${lb}</th>`).join('')}</tr>
      <tr class="pn-ent"><th>Entrenamiento</th>${tipos.map(t=>`<th>${chip(t)}</th>`).join('')}</tr></thead><tbody>${filas}</tbody></table></div>`;
}
function pnFitDia(i,id){ const m=PN.comidas[i], t={id, q:[], extra:[], eq:{}}; pnAjustarAEq(t,m.eq); return {id, q:t.q, extra:t.extra}; }
function pnSemanaAuto(){
  if(!PN) return;
  const sem={}; PN_DIAS.forEach(([d])=>{ sem[d]=PN.comidas.map(()=>null); });
  PN.comidas.forEach((m,i)=>{
    const lista=pnMejores(i,null,12).filter(r=>{ const T=pnMetaComida(m.eq); return Math.abs(r.k-T.k)/T.k<=0.15&&r.p>=T.p*0.85; });
    const pool=lista.length?lista:pnMejores(i,null,4);
    const sinBase=pool.filter(r=>r.platillo.id!==m.id);
    PN_DIAS.forEach(([d],k)=>{ if(k===0||!sinBase.length) return; const r=sinBase[(k-1)%sinBase.length]; sem[d][i]=pnFitDia(i,r.platillo.id); });
  });
  // sin repetir platillo dentro del mismo día
  PN_DIAS.forEach(([d])=>{ const vistos=new Set(); sem[d].forEach((x,i)=>{ const id=x?x.id:PN.comidas[i].id; if(vistos.has(id)) sem[d][i]=null; vistos.add(id); }); });
  PN.semana=sem; PN.cambios=true; pnRender(); showToast('Semana armada: lunes es el día tipo y el resto rota platillos');
}
function pnAjusteDia(k,v){ if(!PN) return; PN.ajusteDia[k]=k==='on'?!!v:Math.max(0,Math.min(40,parseFloat(v)||0)); PN.cambios=true; pnRender(); }
function pnSemanaLimpiar(){ if(!PN) return; PN.semana={}; PN.cambios=true; pnRender(); }

// ── Buscador de platillos (para el día tipo o para un día de la semana) ──
function pnqAbrir(i,dia){
  if(!PN) return; PNQ={i, dia:dia||'', q:'', t:'sug'};
  pnAsegurarModales(); document.getElementById('modal-pn-plat').classList.add('open'); pnqRender();
}
function pnqCerrar(){ const m=document.getElementById('modal-pn-plat'); if(m) m.classList.remove('open'); }
function pnqRender(){
  if(!PN||!PNQ) return; const m=PN.comidas[PNQ.i], T=pnMetaComida(m.eq), tiempo=menuTiempo(m.nombre), q=kbNorm(PNQ.q||'');
  const actual=PNQ.dia?(((PN.semana[PNQ.dia]||[])[PNQ.i])||{}).id:m.id;
  let items=MENU_PLATILLOS.filter(p=>!p.variante&&menuPlatilloApto(p,PN.pref,false));
  if(q) items=items.filter(p=>kbNorm(p.n).includes(q)||p.c.some(([f])=>kbNorm(MENU_ALIM[f].s+' '+(MENU_ALIM[f].pl||'')).includes(q)));
  else if(PNQ.t==='sug') items=items.filter(p=>p.t.includes(tiempo));
  else if(PNQ.t==='propias') items=items.filter(p=>p.propia);
  else if(PNQ.t!=='todos') items=items.filter(p=>p.t.includes(PNQ.t));
  const filas=items.map(p=>{ const r=menuEscalar(p,T,false); return {p,r,err:r?r.err:9}; }).sort((a,b)=>a.err-b.err);
  const diaLb=PNQ.dia?(PN_DIAS.find(x=>x[0]===PNQ.dia)||[,''])[1]:'';
  document.getElementById('pnq-cuerpo').innerHTML=`
    <div class="m-title" id="pnq-titulo" style="font-size:var(--fs-3xl);margin-bottom:6px">${esc(m.nombre)}${diaLb?' · '+diaLb:''}</div>
    <div class="ep-ctx">Meta por porciones: ~${pnNum(T.k)} kcal · P ${pnNum(T.p)} g · C ${pnNum(T.c)} g · G ${pnNum(T.l)} g. Las porciones se ajustan solas al elegir.</div>
    <input class="sf-in mq-q" id="pnq-q" aria-label="Buscar platillo" placeholder="Buscar platillo o ingrediente…" value="${esc(PNQ.q)}" oninput="PNQ.q=this.value;pnqLista()" autocomplete="off">
    <div class="ep-rowc">${[['sug','Para esta comida'],['des','Desayunos'],['col','Colaciones'],['com','Comidas'],['cen','Cenas'],['propias','Recetas propias'],['todos','Todos']].map(([t,lb])=>`<button type="button" class="ch${PNQ.t===t?' on':''}" onclick="PNQ.t='${t}';pnqRender()">${lb}</button>`).join('')}</div>
    ${PNQ.dia&&((PN.semana[PNQ.dia]||[])[PNQ.i])?`<button type="button" class="ma-lnk" onclick="pnqElegir('')">${ico('refresh')}Usar el platillo del día tipo</button>`:''}
    <div id="pnq-lista" class="mq-lista">${filas.length?filas.map(({p,r})=>{ const fid=menuFotoId(p.id), e=r?pnEstado(r.k,T.k,0.15):'bad';
      return `<button type="button" class="mq-it${actual===p.id?' on':''}" data-n="${esc(kbNorm(p.n))}" onclick="pnqElegir('${p.id}')">
        ${fid?`<img src="${menuFotoSrc(fid)}" alt="" width="160" height="100" loading="lazy">`:`<span class="ma-ph">${ico('food')}</span>`}
        <b>${esc(p.n)}</b><span class="pn-e ${e}">${r?'~'+pnNum(r.k)+' kcal · P '+pnNum(r.p)+' g':''}${p.propia?' · propia':''}</span></button>`; }).join('')
      :'<div class="ep-vacio">No hay platillos con ese filtro.</div>'}</div>`;
}
function pnqLista(){ clearTimeout(pnqLista.t); pnqLista.t=setTimeout(()=>{ pnqRender(); const el=document.getElementById('pnq-q'); if(el){ el.focus(); el.setSelectionRange(el.value.length,el.value.length); } },180); }
function pnqElegir(id){
  if(!PN||!PNQ) return; const m=PN.comidas[PNQ.i];
  if(PNQ.dia){
    const arr=(PN.semana[PNQ.dia]||PN.comidas.map(()=>null)).slice(); while(arr.length<PN.comidas.length) arr.push(null);
    if(!id) arr[PNQ.i]=null;
    else arr[PNQ.i]=pnFitDia(PNQ.i,id);
    PN.semana[PNQ.dia]=arr;
  } else { m.id=id; m.extra=comoArray(m.extra); pnAjustarAEq(m,m.eq); pnSyncPorc(); }
  PN.cambios=true; pnqCerrar(); pnRender();
}

// ── Paso 4: Recomendaciones y entrega ──
function pnPaso4(s,M,tm){
  const sinPlat=PN.comidas.filter(m=>!m.id).length, dias=PN_DIAS.filter(([d])=>(PN.semana[d]||[]).some(Boolean)).length;
  const e=pnEstado(tm.k,M.kcal,PN_TOL.k);
  return `<section class="pn-card">
      <h3>Recomendaciones generales</h3>
      <textarea class="sf-in pn-ta" rows="4" placeholder="Ingresa aquí tu recomendación general" aria-label="Recomendaciones generales" onchange="pnSet('recs',limpiarTexto(this.value))">${esc(PN.recs)}</textarea>
      <div class="pn-chips">${PN_RECS.map((r,k)=>`<button type="button" class="ch" onclick="pnRecAgregar(${k})">${ico('plus')}${esc(r.split(/[;:.]/)[0])}</button>`).join('')}</div>
    </section>
    <section class="pn-card">
      <h3>Recomendaciones por comida</h3>
      ${PN.comidas.map((m,i)=>`<label class="pn-rc"><span>${esc(m.nombre)}</span><input class="sf-in" value="${esc(m.nota||'')}" placeholder="Ingresa aquí tu recomendación" onchange="pnComida(${i},'nota',this.value)"></label>`).join('')}
      <label class="pn-rc"><span>Agua al día</span><div class="pn-in"><input inputmode="decimal" value="${PN.agua}" onchange="pnSet('agua',Math.max(0,parseFloat(String(this.value).replace(',','.'))||0))"><span>L</span></div></label>
    </section>
    <section class="pn-card pn-resumen">
      <h3>Guarda tu plan</h3>
      <p>Se asignará a <b>${esc(tc(s.nombre))}</b>. Lo verá en su pestaña Nutrición como definitivo, con fotos, porciones y horarios.</p>
      <ul>
        <li>${ico('target')}<span>${pnNum(M.kcal)} kcal · P ${M.prot} g · C ${M.carbs} g · G ${M.grasas} g</span></li>
        <li class="${e}">${ico(e==='ok'?'check':'warn')}<span>El menú suma ${pnNum(tm.k)} kcal (${tm.k>=M.kcal?'+':''}${M.kcal?Math.round((tm.k-M.kcal)/M.kcal*100):0}% de la meta)</span></li>
        <li>${ico('calendar')}<span>${PN.comidas.length} comidas al día${dias?' · '+dias+' días con platillos propios':' · el mismo menú toda la semana'}</span></li>
        ${sinPlat?`<li class="warn">${ico('warn')}<span>${sinPlat} comida${sinPlat>1?'s':''} sin platillo: no se mostrará${sinPlat>1?'n':''} al socio.</span></li>`:''}
      </ul>
      <div class="pn-acc">
        <button type="button" class="sd-b" onclick="pnPrevia()">${ico('eye')}Así lo verá el socio</button>
        <button type="button" class="sd-b" onclick="pnPDF()">${ico('download')}Descargar PDF</button>
        <button type="button" class="sd-b" onclick="pnSuper()">${ico('clipboard')}Lista de súper</button>
        <button type="button" class="sd-b" onclick="pnPlantillaGuardar()">${ico('save')}Guardar como plantilla</button>
        ${s.nutricion&&(s.nutricion.override||s.nutricion.plan)?`<button type="button" class="sd-b rt-dng" onclick="pnVolverAuto()">Volver al automático</button>`:''}
      </div>
    </section>
    <p class="f-nota">Sugerencia educativa con equivalentes del SMAE. Revisa alergias, medicamentos y condiciones médicas del socio antes de asignar.</p>`;
}
// ── Vista previa: el menú tal como lo verá el socio en su app (mismos componentes de js/50), día por día ──
let PN_PREV_DIA='';
function pnPrevia(dia){
  if(!PN) return; const s=pnSocio(), M=pnM();
  const d=dia||PN_PREV_DIA||PN_DIA_JS[new Date().getDay()]; PN_PREV_DIA=d;
  const edad=+s.edad||0, menor=edad>0&&edad<18;
  const tipo=pnTipoDia(s,d), fd=pnFactorDia(PN.ajusteDia.on?PN.ajusteDia:null,tipo.t);
  const items=PN.comidas.map((m,i)=>{ const x=(PN.semana[d]||[])[i], t={id:x?x.id:m.id, q:(x?x.q:m.q).slice(), extra:comoArray(x?x.extra:m.extra).map(e=>Object.assign({},e)), eq:{}};
      if(fd&&m.eq) pnAjustarAEq(t,pnEqDia(m.eq,fd));
      const vr={}, r=pnConExtras(t.id,t.q,t.extra,vr,m.nombre); if(!r) return null; const p=maPlat(r.id), q=r.q;
      const mc=maCalc(r.id,q); return {nombre:m.nombre, hora:m.hora, p, k:mc.k, P:mc.p, C:mc.c, G:mc.l, nota:m.nota||'', rol:'', comps:p.c.map(([f],ci)=>({f,q:+q[ci]||0})).filter(c=>c.q>0||MENU_ALIM[c.f].u==='libre')}; })
    .filter(Boolean).sort((a,b)=>(nxMin(a.hora)??9999)-(nxMin(b.hora)??9999));
  const dc=Math.round(M.carbs*fd); if(dc){ M.carbs+=dc; M.kcal+=dc*4; }
  const suma=items.reduce((a,m)=>a+m.k,0), dev=M.kcal?(suma-M.kcal)/M.kcal:0, ok=Math.abs(dev)<=MENU_TOL_DIA;
  const tot=(M.prot*4+M.carbs*4+M.grasas*9)||1, pP=M.prot*4/tot*100, pC=M.carbs*4/tot*100, pG=Math.max(0,100-pP-pC);
  const lista=items.map((m,i)=>nxFilaHTML(m,i,true,false,menor,false)).join('');
  pnAux(`<div class="m-title" id="pnx-titulo" style="font-size:var(--fs-2xl)">Así lo verá ${esc(tc(String(s.nombre||'el socio').split(' ')[0]))}</div>
    <p class="pn-nota">Vista previa de su pestaña Nutrición. Cada día de la semana muestra los platillos que planeaste para ese día. Todavía no se guarda nada.</p>
    <div class="pn-prev-dias">${PN_DIAS.map(([k,lb])=>`<button type="button" class="ch${k===d?' on':''}" onclick="pnPrevia('${k}')">${lb}</button>`).join('')}</div>
    <div class="pn-tel"><div class="pn-tel-in">
      ${PN.ajusteDia.on?pnNotaDiaHTML(tipo,fd):''}
      <section class="nx-dia"><div class="nx-dia-h"><div><h2>Tu día</h2><p>Armado por ${esc(pqStaffNombre())}</p></div></div>
        <ol class="nx-lista">${lista||'<li class="nx-vacio">Sin platillos para este día.</li>'}</ol>
        ${menor?`<p class="nx-tot">${ico('info')}<span>Eres menor de edad: tu menú cubre lo que gastas, sin dietas para bajar de peso.</span></p>`
          :`<p class="nx-tot ${ok?'ok':'warn'}">${ico(ok?'check':'warn')}<span>Tu menú suma <b>${nxNum(suma)} kcal</b>${ok?', dentro de tu meta.':' ('+(dev>0?'+':'')+Math.round(dev*100)+'% de tu meta).'}</span></p>`}
      </section>
      <section class="nx-sum">
        <div class="nx-sum-top"><div>${menor?'<span class="nx-k sm">Tu energía del día</span>':`<span class="nx-k">${nxNum(M.kcal)}</span><span class="nx-u">kcal al día · ajustado por ${esc(pqStaffNombre())}</span>`}</div><span class="nx-obj">${esc(sc(s.objetivo||''))}</span></div>
        ${menor?'':`<div class="nx-bar" aria-hidden="true"><i class="m-p" style="flex:${pP}"></i><i class="m-c" style="flex:${pC}"></i><i class="m-g" style="flex:${pG}"></i></div>
        <dl class="nx-mac"><div><dt><i class="m-p"></i>Proteína</dt><dd>${M.prot} g</dd></div><div><dt><i class="m-c"></i>Carbohidratos</dt><dd>${M.carbs} g</dd></div><div><dt><i class="m-g"></i>Grasas</dt><dd>${M.grasas} g</dd></div></dl>`}
        <div class="nx-agua">${ico('drop')}<span>Agua: <b>${esc(PN.agua)} L</b> al día, más 0.5 L por sesión</span></div>
      </section>
      ${PN.recs?`<div class="nx-coach">${ico('star')}<p><b>Tu nutriólogo:</b> ${esc(PN.recs)}</p></div>`:''}
    </div></div>`);
  const box=document.querySelector('#modal-pn-aux .pn-aux'); if(box) box.classList.add('pn-aux-prev');
}
function pnRecAgregar(k){ if(!PN) return; const r=PN_RECS[k]; if(PN.recs.includes(r)) return; PN.recs=(PN.recs?PN.recs.trim()+' ':'')+r; PN.cambios=true; pnRender(); }

// Datos del plan tal como se guardan en el socio
function pnConExtras(id,q,extra,vr,nombreComida){
  const ex=comoArray(extra).filter(x=>x.q>0&&MENU_ALIM[x.f]); const p=id&&maPlat(id);
  if(!ex.length) return p?{id,q:comoArray(q).map(pnR2)}:null;
  const corto=x=>String(MENU_ALIM[x].pl||MENU_ALIM[x].s).replace(/^de /,'').split(/[,(]/)[0].trim();
  const c=(p?p.c.map((x,i)=>[x[0],+q[i]||0,+q[i]||0,+q[i]||0]):[]).concat(ex.map(x=>[x.f,x.q,x.q,x.q]));
  const vid='v-'+pnId(), v={n:p?p.n+' + '+ex.map(x=>corto(x.f)).join(' y '):(nombreComida||'Comida')+' por equivalentes', t:p?(p.tOrig||p.t).slice():['des','col','com','cen'], c, prep:p?p.prep||'':'Elige y prepara estos alimentos a tu gusto, en las porciones indicadas.', base:p?p.id:''};
  vr[vid]=v; pnRegistrarVar(vid,v);
  return {id:vid, q:c.map(x=>pnR2(x[1]))};
}
function pnPlanDatos(){
  const s=pnSocio(), M=pnM(), C=PN.C, vr={};
  const idx=[], comidas=[];
  PN.comidas.forEach((m,i)=>{ const r=pnConExtras(m.id,m.q,m.extra,vr,m.nombre); if(!r) return; idx.push(i);
    comidas.push({nombre:limpiarTexto(m.nombre)||'Comida', hora:m.hora||'', id:r.id, q:r.q, nota:limpiarTexto(m.nota||''), eq:m.eq||{}}); });
  const semana={}; PN_DIAS.forEach(([d])=>{ const a=PN.semana[d]; if(!a) return;
    const v=idx.map(i=>{ const x=a[i]; if(!x) return 0; const r=pnConExtras(x.id,x.q,x.extra,vr,PN.comidas[i].nombre); return r||0; });
    if(v.some(Boolean)) semana[d]=v; });
  const usadas=new Set(comidas.map(m=>m.id)); Object.values(semana).forEach(a=>a.forEach(x=>{ if(x) usadas.add(x.id); }));
  Object.keys(PN.var).forEach(k=>{ if(usadas.has(k)) vr[k]=PN.var[k]; });
  // las variantes con complementos se apoyan en variantes de intercambio: guárdalas también
  Object.values(vr).forEach(v=>{ if(v.base&&PN.var[v.base]) vr[v.base]=PN.var[v.base]; });
  return {s, M, C, comidas, semana, var:vr};
}
function pnGuardar(){
  if(!PN) return; const {s,M,C,comidas,semana,var:vr}=pnPlanDatos(); if(!s||!nutPuedeEditar(s)) return;
  if(!(M.kcal>=800&&M.kcal<=6000)){ showToast('Revisa las calorías (800 a 6000)'); pnPaso(1); return; }
  if(!comidas.length){ showToast('Elige al menos un platillo'); pnPaso(3); return; }
  const b=calcNutricion(s), o=s.nutricion||{};
  s.nutricion={ override:true, kcal:M.kcal, prot:M.prot, carbs:M.carbs, grasas:M.grasas, agua:+PN.agua||b.agua, nota:PN.recs||'', menu:comoArray(o.menu),
    por:pqStaffNombre(), fecha:fechaISO(new Date()), baseObj:s.objetivo||'', baseTdee:b.tdee, basePeso:b.pesoBase,
    calc:{formula:C.formula, factor:C.factor, ajuste:+C.ajuste||0, kcalManual:!!C.kcalManual, modo:C.modo, pk:+C.pk||0, gk:+C.gk||0, pp:+C.pp||0, gp:+C.gp||0,
      geb:M.geb||0, get:M.get||0, datos:{peso:+C.datos.peso||0, est:+C.datos.est||0, edad:+C.datos.edad||0, sexo:C.datos.sexo||'', mlg:+C.datos.mlg||0, fuente:C.datos.fuente||''}},
    plan:{comidas, porciones:Object.assign({},PN.porc), semana, var:vr, ajusteDia:{on:!!PN.ajusteDia.on, pesado:+PN.ajusteDia.pesado||0, descanso:+PN.ajusteDia.descanso||0},
      por:pqStaffNombre(), tipo:'nutri', fecha:fechaISO(new Date())} };
  // El gasto de referencia se toma ya con el plan puesto: la recalibración por peso usa las kcal del plan (js/03)
  const b2=calcNutricion(s); s.nutricion.baseTdee=b2.tdee; s.nutricion.basePeso=b2.pesoBase;
  pqGuardarStaff(s,['nutricion']);
  PN.cambios=false; pnCerrar(true); staffRenderList(); staffRenderContent(s);
  showToast('Plan asignado. El socio ya lo ve en su app');
}
function pnVolverAuto(){
  const s=pnSocio(); if(!s) return;
  uiConfirm('¿Quitar el plan y las metas ajustadas? El socio volverá a ver el cálculo y el menú automáticos de la app.',()=>{
    const o=Object.assign({},s.nutricion); delete o.plan; delete o.calc; o.override=false;
    if(comoArray(o.menu).length) s.nutricion=o; else delete s.nutricion;
    pqGuardarStaff(s,['nutricion']); pnCerrar(true); staffRenderList(); staffRenderContent(s); showToast('El socio ve de nuevo lo automático');
  },{label:'Volver al automático',danger:true});
}

// ── Lista de súper de la semana ──
function pnSuperLista(){
  const tot={}, add=(f,q)=>{ if(!(q>0)||!MENU_ALIM[f]||MENU_ALIM[f].u==='libre') return; tot[f]=(tot[f]||0)+q; };
  const addC=(id,q,extra)=>{ const p=id&&maPlat(id); if(p) p.c.forEach(([f],ci)=>add(f,+(q||[])[ci]||0)); comoArray(extra).forEach(x=>add(x.f,+x.q)); };
  PN_DIAS.forEach(([d])=>{ PN.comidas.forEach((m,i)=>{ const x=(PN.semana[d]||[])[i]; if(x) addC(x.id,x.q,x.extra); else addC(m.id,m.q,m.extra); }); });
  const fam={VER:'Verduras',FRU:'Frutas',CER:'Cereales y tortillas',LEG:'Leguminosas',AOA:'Carnes, huevo y queso',LEC:'Lácteos',GRA:'Grasas y semillas'};
  const grupos={}; Object.keys(tot).forEach(f=>{ const k=PN_FAMILIA[MENU_ALIM[f].g]||'GRA'; (grupos[k]=grupos[k]||[]).push(menuPorcion(f,tot[f])); });
  return Object.keys(fam).filter(k=>grupos[k]).map(k=>({t:fam[k], items:grupos[k]}));
}
function pnSuper(){
  const L=pnSuperLista();
  pnAux(`<div class="m-title" id="pnx-titulo" style="font-size:var(--fs-2xl)">Lista de súper · 7 días</div>
    <p class="pn-nota">Suma de las porciones de toda la semana. Ajusta a tu presentación (por kilo, paquete o pieza).</p>
    ${L.map(g=>`<h4 class="pn-h4">${esc(g.t)}</h4><ul class="pn-super">${g.items.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`).join('')||'<p class="pn-nota">Elige platillos para armar la lista.</p>'}`);
}

// ── PDF del plan ──
async function pnPDF(){
  if(!PN) return; const {s,M,comidas}=pnPlanDatos();
  if(!comidas.length){ showToast('Elige al menos un platillo'); return; }
  showToast('Preparando PDF…');
  try{ await cargarJsPDF(); }catch(e){ showToast('No se pudo cargar el generador de PDF. Revisa tu conexión.'); return; }
  const {jsPDF}=window.jspdf, doc=new jsPDF({unit:'mm',format:'letter'}), W=216, X=16, ancho=W-2*X;
  let y=18;
  const T=(t,sz,st,col)=>{ doc.setFont('helvetica',st||'normal'); doc.setFontSize(sz||10); doc.setTextColor(...(col||[30,30,30])); };
  const linea=(txt,sz,st,col,gap)=>{ T(txt,sz,st,col); const ls=doc.splitTextToSize(pdfTxt(txt),ancho); ls.forEach(l=>{ if(y>262){ doc.addPage(); y=18; } doc.text(l,X,y); y+=(sz||10)*0.45; }); y+=gap||1.5; };
  const nombreNutri=pqStaffNombre();
  T('',18,'bold',[20,60,40]); doc.text('Plan de alimentación',X,y); y+=8;
  linea(tc(s.nombre)+' · '+fmtFecha(fechaISO(new Date()))+' · elaborado por '+nombreNutri,10,'normal',[90,90,90],3);
  linea('Meta diaria: '+pnNum(M.kcal)+' kcal · Proteína '+M.prot+' g · Carbohidratos '+M.carbs+' g · Grasas '+M.grasas+' g · Agua '+PN.agua+' L',11,'bold',null,4);
  linea('Menú del día tipo',13,'bold',[20,60,40],2);
  comidas.forEach(m=>{
    const p=maPlat(m.id); if(!p) return; const r=maCalc(m.id,m.q);
    if(y>235){ doc.addPage(); y=18; }
    linea((m.hora?m.hora+'  ':'')+m.nombre+' · '+p.n,11,'bold',null,1);
    p.c.forEach(([f],ci)=>{ const q=+m.q[ci]||0; if(!q&&MENU_ALIM[f].u!=='libre') return; linea('•  '+menuPorcion(f,q),10,'normal',null,0); });
    linea('Equivalentes: '+menuEquivTxt({comps:p.c.map(([f],ci)=>({f,q:+m.q[ci]||0})).filter(x=>x.q>0)})+'  ·  '+pnNum(r.k)+' kcal · P '+pnNum(r.p)+' g · C '+pnNum(r.c)+' g · G '+pnNum(r.l)+' g',9,'normal',[90,90,90],0.5);
    if(p.prep) linea('Preparación: '+p.prep,9,'italic',[90,90,90],0.5);
    if(m.nota) linea('Recomendación: '+m.nota,9,'normal',[20,60,40],0.5);
    y+=2.5;
  });
  // Semana
  const conSemana=PN_DIAS.some(([d])=>(PN.semana[d]||[]).some(Boolean));
  if(conSemana){
    doc.addPage(); y=18; linea('Planeación semanal',13,'bold',[20,60,40],3);
    PN_DIAS.forEach(([d,lb])=>{ const t=pnTipoDia(s,d), f=pnFactorDia(PN.ajusteDia.on?PN.ajusteDia:null,t.t);
      linea(lb+' · '+(t.t==='descanso'?'Descanso':t.nombre+' ('+(t.t==='pesado'?'día pesado':t.t==='ligero'?'día ligero':'día medio')+')')+(f?' · carbohidrato '+(f>0?'+':'')+Math.round(f*100)+'%':''),11,'bold',null,0.5);
      PN.comidas.forEach((m,i)=>{ const x=(PN.semana[d]||[])[i], p=maPlat(x?x.id:m.id); if(p) linea('   '+m.nombre+': '+p.n,10,'normal',null,0); }); y+=2; });
  }
  if(PN.recs){ y+=2; linea('Recomendaciones generales',13,'bold',[20,60,40],2); linea(PN.recs,10,'normal',null,3); }
  const L=pnSuperLista();
  if(L.length){ if(y>200){ doc.addPage(); y=18; } linea('Lista de súper (7 días)',13,'bold',[20,60,40],2); L.forEach(g=>{ linea(g.t,10,'bold',null,0.5); g.items.forEach(it=>linea('•  '+it,9.5,'normal',null,0)); y+=1.5; }); }
  y+=3; linea('Sugerencia educativa elaborada con el Sistema Mexicano de Alimentos Equivalentes. No sustituye la consulta médica. Si tienes alguna condición médica, alergia o tomas medicamentos, coméntalo con tu nutriólogo.',8,'italic',[120,120,120],0);
  doc.save('plan-alimentacion-'+String(s.nombre||'socio').toLowerCase().replace(/[^a-z0-9]+/gi,'-')+'.pdf');
}

// ── Plantillas ──
function pnPlantillaGuardar(){
  if(!PN) return; const s=pnSocio();
  pnAux(`<div class="m-title" id="pnx-titulo" style="font-size:var(--fs-2xl)">Guardar como plantilla</div>
    <p class="pn-nota">Guarda la regla de cálculo (fórmula, factor, ajuste y macros), las porciones, el reparto, los platillos y las recomendaciones. Al usarla con otro socio, las metas se calculan con sus datos.</p>
    <label class="pn-rc"><span>Nombre</span><input class="sf-in" id="pn-tpl-n" maxlength="80" value="${esc(sc(s.objetivo||'Plan')+' '+pnNum(pnM().kcal)+' kcal, '+PN.comidas.length+' comidas')}"></label>
    <button type="button" class="sd-pri" style="width:100%;margin-top:12px" onclick="pnPlantillaConfirmar()">Guardar plantilla</button>`);
}
function pnPlantillaConfirmar(){
  if(!PN) return; const el=document.getElementById('pn-tpl-n'), nombre=limpiarTexto(el&&el.value||'').slice(0,80);
  if(!nombre){ showToast('Ponle un nombre a la plantilla'); return; }
  const {comidas,semana,var:vr}=pnPlanDatos(), C=PN.C, id=pnId();
  const t={nombre, autor:pqStaffNombre(), autorId:staffActivoEntId||'', fecha:fechaISO(new Date()),
    calc:{formula:C.formula, factor:C.factor, ajuste:+C.ajuste||0, modo:C.modo, pk:+C.pk||0, gk:+C.gk||0, pp:+C.pp||0, gp:+C.gp||0},
    porciones:Object.assign({},PN.porc), comidas, semana, var:vr, recs:PN.recs||''};
  NPL[id]=t; fbEncolar('/nutri/plantillas/'+id,'set',t); nrGuardarLocal();
  pnAuxCerrar(); showToast('Plantilla guardada. Úsala con otros socios desde el paso 1');
}
// Aplica una plantilla al socio actual: metas con SUS datos y la regla de la plantilla; porciones y platillos de la plantilla
function pnUsarPlantilla(id){
  const t=NPL[id]; if(!PN||!t) return;
  const C=PN.C, k=t.calc||{};
  Object.assign(C,{formula:k.formula||'auto', factor:k.factor!=null?k.factor:'auto', ajuste:+k.ajuste||0, modo:k.modo||'gkg', pk:+k.pk||1.8, gk:+k.gk||0.8, pp:+k.pp||25, gp:+k.gp||25, kcalManual:false});
  if(C.formula!=='auto'&&C.formula!=='kcal'&&!pnGEB(C.formula,C.datos,pnBase())) C.formula='auto';
  PN.porc=Object.assign({},t.porciones||{}); PN.porcManual=true;
  Object.keys(t.var||{}).forEach(v=>{ PN.var[v]=t.var[v]; pnRegistrarVar(v,t.var[v]); });
  PN.comidas=comoArray(t.comidas).map(m=>({nombre:m.nombre, hora:m.hora||'', eq:Object.assign({},m.eq||{}), id:m.id||null, q:comoArray(m.q).map(Number), extra:[], nota:m.nota||''}));
  if(!PN.comidas.length) PN.comidas=pnComidasVacias(4);
  PN.distManual=PN.comidas.some(m=>Object.keys(m.eq).length);
  PN.comidas.forEach(m=>{ if(!(m.id&&maPlat(m.id))){ m.id=null; m.q=[]; } });
  if(PN.distManual) PN.comidas.forEach(m=>pnAjustarAEq(m,m.eq)); else pnAplicarReparto();
  pnSyncPorc();
  PN.semana=JSON.parse(JSON.stringify(t.semana||{})); PN.recs=t.recs||PN.recs; PN.cambios=true;
  pnRender(); showToast('Plantilla aplicada con los datos de este socio. Revisa el semáforo de porciones');
}

// ═════════════ Recetas propias: editor ═════════════
let NRE=null;   // receta en edición {id, n, t, c, prep, foto, fotoCambio}
function nrPuedeEditar(r){ return staffRol==='coordinador' || (r && r.autorId && r.autorId===staffActivoEntId) || (!r); }
function nrEditor(id){
  const r=id&&NR[id];
  if(r&&!nrPuedeEditar(r)){ showToast('Solo quien la creó o el director pueden editarla'); return; }
  NRE={id:id||'', n:r?r.n:'', t:r?comoArray(r.t).slice():['com'], c:r?comoArray(r.c).map(x=>x.slice()):[], prep:r?r.prep||'':'', foto:id?NFOTO[id]:'', fotoCambio:false};
  if(id&&NFOTO[id]===undefined) nrBajarFoto(id);
  pnAsegurarModales(); const bx=document.querySelector('#modal-pn-aux .pn-aux'); if(bx) bx.classList.remove('pn-aux-prev'); nrRender(); document.getElementById('modal-pn-aux').classList.add('open');
}
function nrPaso(f){ const a=MENU_ALIM[f]; return (a.g==='LEG'||a.g==='LECD'||a.u==='taza')?0.5:1; }
function nrRango(f,q){ if(MENU_ALIM[f].u==='libre') return [0,0,0]; const st=nrPaso(f); return [q, q>=2*st?Math.max(st,Math.round(q/2/st)*st):q, Math.max(q,Math.round(q*2/st)*st)]; }
function nrRender(){
  if(!NRE) return; const tot={k:0,p:0,l:0,c:0};
  NRE.c.forEach(([f,q])=>{ const m=menuMacros(f,+q||0); tot.k+=m.k; tot.p+=m.p; tot.l+=m.l; tot.c+=m.c; });
  const fams={VER:'Verduras',FRU:'Frutas',CER:'Cereales',LEG:'Leguminosas',AOA:'Origen animal',LEC:'Lácteos',GRA:'Grasas'};
  const opts=Object.keys(fams).map(k=>`<optgroup label="${fams[k]}">${Object.keys(MENU_ALIM).filter(f=>PN_FAMILIA[MENU_ALIM[f].g]===k&&!NRE.c.some(c=>c[0]===f)).map(f=>`<option value="${f}">${esc(menuPorcion(f,1))}</option>`).join('')}</optgroup>`).join('')
    +(NRE.c.some(c=>c[0]==='salsa')?'':'<optgroup label="Libres"><option value="salsa">Salsa al gusto</option></optgroup>');
  const foto=NRE.foto;
  document.getElementById('pnx-cuerpo').innerHTML=`
    <div class="m-tag">Receta propia del gimnasio</div>
    <div class="m-title" id="pnx-titulo" style="font-size:var(--fs-2xl)">${NRE.id?'Editar receta':'Nueva receta'}</div>
    <label class="pn-rc"><span>Título de la receta</span><input class="sf-in" maxlength="80" value="${esc(NRE.n)}" placeholder="Ej. Yogur con moras y granola" onchange="NRE.n=limpiarTexto(this.value)"></label>
    <div class="pn-rc"><span>Tiempos de comida</span><div class="ch-row">${[['des','Desayuno'],['col','Colaciones'],['com','Comida'],['cen','Cena']].map(([t,lb])=>`<button type="button" class="ch${NRE.t.includes(t)?' on':''}" aria-pressed="${NRE.t.includes(t)}" onclick="nrTiempo('${t}')">${lb}</button>`).join('')}</div></div>
    <div class="pn-rc"><span>Ingredientes (porción base)</span>
      <ul class="ma-ing">${NRE.c.map(([f,q],i)=>{ const a=MENU_ALIM[f]; if(a.u==='libre') return `<li class="libre"><span>${esc(a.s)}</span><div class="ma-st"><button type="button" onclick="nrQuitar(${i})" aria-label="Quitar">✕</button></div></li>`;
        return `<li><span>${esc(menuPorcion(f,q))}</span><div class="ma-st"><button type="button" onclick="nrCant(${i},-1)" aria-label="Menos" ${q<=nrPaso(f)?'disabled':''}>−</button><button type="button" onclick="nrCant(${i},1)" aria-label="Más">+</button><button type="button" onclick="nrQuitar(${i})" aria-label="Quitar ${esc(a.s)}">✕</button></div></li>`; }).join('')}</ul>
      <select class="ti" onchange="if(this.value)nrAgregar(this.value)"><option value="">+ Agregar ingrediente…</option>${opts}</select>
    </div>
    <div class="mn-total ok"><span><b>${pnNum(tot.k)} kcal</b> · P ${pnNum(tot.p)} g · C ${pnNum(tot.c)} g · G ${pnNum(tot.l)} g${NRE.c.length?' · '+esc(menuEquivTxt({comps:NRE.c.map(([f,q])=>({f,q}))})):''}</span></div>
    <p class="pn-nota">Las porciones se escalan solas a la meta de cada comida del socio (de la mitad al doble de la porción base).</p>
    <label class="pn-rc"><span>Preparación</span><textarea class="sf-in pn-ta" rows="3" maxlength="600" placeholder="1. Mezcla los ingredientes…" onchange="NRE.prep=limpiarTexto(this.value)">${esc(NRE.prep)}</textarea></label>
    <div class="pn-rc"><span>Foto (opcional)</span><div class="nr-foto">${foto?`<img src="${foto}" alt="" width="160" height="100">`:`<span class="ma-ph">${ico('camera')}</span>`}
      <label class="sd-b">${ico('camera')}${foto?'Cambiar foto':'Agregar foto'}<input type="file" accept="image/*" hidden onchange="nrFoto(this)"></label>${foto?`<button type="button" class="ma-lnk dng" onclick="NRE.foto='';NRE.fotoCambio=true;nrRender()">Quitar</button>`:''}</div></div>
    <div class="pn-acc" style="margin-top:14px">
      ${NRE.id?`<button type="button" class="sd-b rt-dng" onclick="nrBorrar('${esc(NRE.id)}')">${ico('trash')}Borrar</button>`:''}
      <button type="button" class="sd-pri" onclick="nrGuardar()">Guardar receta</button></div>`;
}
function nrTiempo(t){ const i=NRE.t.indexOf(t); if(i>=0) NRE.t.splice(i,1); else NRE.t.push(t); nrRender(); }
function nrAgregar(f){ const q=MENU_ALIM[f].u==='libre'?0:1; NRE.c.push([f].concat(nrRango(f,q))); nrRender(); }
function nrQuitar(i){ NRE.c.splice(i,1); nrRender(); }
function nrCant(i,d){ const f=NRE.c[i][0], st=nrPaso(f), q=Math.max(st,Math.round((NRE.c[i][1]+d*st)*100)/100); NRE.c[i]=[f].concat(nrRango(f,q)); nrRender(); }
async function nrFoto(inp){
  const f=inp.files&&inp.files[0]; inp.value=''; if(!f) return;
  try{ let d=await aparComprimir(f,560); if(d.length>190000) d=await aparComprimir(f,400); if(d.length>190000){ showToast('La foto es muy pesada'); return; }
    NRE.foto=d; NRE.fotoCambio=true; nrRender(); }catch(e){ showToast('No se pudo usar esa imagen'); }
}
function nrGuardar(){
  if(!NRE) return;
  if(!NRE.n){ showToast('Ponle un título a la receta'); return; }
  if(!NRE.c.some(([f])=>MENU_ALIM[f].u!=='libre')){ showToast('Agrega al menos un ingrediente'); return; }
  if(!NRE.t.length){ showToast('Elige al menos un tiempo de comida'); return; }
  const id=NRE.id||pnId(), prev=NR[id]||{};
  const r={n:NRE.n, t:NRE.t.slice(), c:NRE.c.map(x=>x.map(v=>typeof v==='number'?Math.round(v*100)/100:v)), prep:NRE.prep||'', foto:NRE.fotoCambio?!!NRE.foto:!!prev.foto,
    autor:prev.autor||pqStaffNombre(), autorId:prev.autorId||staffActivoEntId||'', fecha:fechaISO(new Date())};
  NR[id]=r; fbEncolar('/nutri/recetas/'+id,'set',r);
  if(NRE.fotoCambio){ NFOTO[id]=NRE.foto||''; fbEncolar('/nutri/fotos/'+id,NRE.foto?'set':'remove',NRE.foto||undefined); }
  nrSincronizar(); nrGuardarLocal(); NRE=null; pnAuxCerrar();
  if(PN) pnRender(); if(document.getElementById('modal-nr')&&document.getElementById('modal-nr').classList.contains('open')) nrPanelRender();
  showToast('Receta guardada. Ya aparece en el buscador de platillos');
}
function nrBorrar(id){
  uiConfirm('¿Borrar esta receta? Los planes que ya la usan dejarán de mostrarla.',()=>{
    delete NR[id]; fbEncolar('/nutri/recetas/'+id,'remove'); fbEncolar('/nutri/fotos/'+id,'remove'); delete NFOTO[id];
    nrSincronizar(); nrGuardarLocal(); NRE=null; pnAuxCerrar(); if(PN) pnRender(); if(document.getElementById('modal-nr')) nrPanelRender();
    showToast('Receta borrada');
  },{label:'Borrar receta',danger:true});
}

// ═════════════ Panel "Nutrición" del staff: filosofía, recetas y plantillas ═════════════
let NRP={tab:'filo', draft:null};
function abrirNutricionStaff(tab){
  let m=document.getElementById('modal-nr');
  if(!m){ m=document.createElement('div'); m.className='modal'; m.id='modal-nr'; m.onclick=e=>{ if(e.target===m) m.classList.remove('open'); };
    m.innerHTML=`<div class="mbox pn-box" role="dialog" aria-modal="true" aria-labelledby="nr-titulo"><div class="mx" onclick="document.getElementById('modal-nr').classList.remove('open')" aria-label="Cerrar">✕</div><div id="nr-cuerpo"></div></div>`;
    document.body.appendChild(m); }
  pnAsegurarModales(); nrEscuchar();
  NRP={tab:tab||'filo', draft:null}; nrPanelRender(); m.classList.add('open');
}
function nrFiloActual(){
  const D=DB.entrenadores||{}, e=staffActivoEntId&&D[staffActivoEntId];
  const f=staffRol==='coordinador'?(DB.config&&DB.config.nutFilo):(e&&e.nutFilo);
  return JSON.parse(JSON.stringify(Object.assign({},PN_FILO_DEF,f||{},{ajuste:Object.assign({},PN_FILO_DEF.ajuste,(f&&f.ajuste)||{}), protKg:Object.assign({},PN_FILO_DEF.protKg,(f&&f.protKg)||{}), cargaDia:Object.assign({},PN_FILO_DEF.cargaDia,(f&&f.cargaDia)||{})})));
}
function nrPanelRender(){
  const c=document.getElementById('nr-cuerpo'); if(!c) return;
  const tabs=[['filo','Mi filosofía'],['recetas','Recetas propias'],['plantillas','Plantillas']];
  let body='';
  if(NRP.tab==='filo'){
    const f=NRP.draft||(NRP.draft=nrFiloActual()), dir=staffRol==='coordinador';
    body=`<p class="pn-nota">${dir?'Filosofía del gimnasio: se usa con los socios cuyo nutriólogo no tiene una propia.':'Tu filosofía: con ella se calcula de entrada (automático) el plan de tus socios. Cuando ajustas un plan a mano, manda lo tuyo.'} Las reglas de seguridad siguen igual: menores sin déficit y nada por debajo del basal ni de 1,200/1,500 kcal.</p>
      <section class="pn-card"><div class="pn-calc">
        <label><span>Fórmula preferida</span><select class="ti" onchange="NRP.draft.formula=this.value">${PN_FORMULAS.filter(x=>x[0]!=='kcal').map(([k,lb])=>`<option value="${k}" ${f.formula===k?'selected':''}>${lb}</option>`).join('')}</select></label>
        <label><span>Comidas al día</span><select class="ti" onchange="NRP.draft.comidas=+this.value">${[3,4,5,6].map(n=>`<option ${+f.comidas===n?'selected':''}>${n}</option>`).join('')}</select></label>
        <label><span>Grasa (% de las kcal)</span><div class="pn-in"><input inputmode="numeric" value="${f.grasaPct}" onchange="NRP.draft.grasaPct=Math.max(15,Math.min(40,+this.value||25))"><span>%</span></div></label>
      </div>
      <p class="pn-nota">Con las fórmulas de masa libre de grasa, si el socio no tiene InBody se usa la automática.</p></section>
      <section class="pn-card"><h3>Por objetivo</h3><table class="pn-mac"><thead><tr><th>Objetivo</th><th>Ajuste de kcal</th><th>Proteína</th></tr></thead><tbody>
        ${PN_OBJETIVOS.map(([k,lb])=>`<tr><th>${lb}</th><td><div class="pn-in"><input inputmode="decimal" value="${f.ajuste[k]}" aria-label="Ajuste ${lb}" onchange="NRP.draft.ajuste['${k}']=Math.max(-30,Math.min(25,parseFloat(this.value)||0))"><span>%</span></div></td>
          <td><div class="pn-in"><input inputmode="decimal" value="${f.protKg[k]}" aria-label="Proteína ${lb}" onchange="NRP.draft.protKg['${k}']=Math.max(0.8,Math.min(3.1,parseFloat(this.value)||1.6))"><span>g/kg</span></div></td></tr>`).join('')}
      </tbody></table><p class="pn-nota">Guía del gimnasio: masa +10 a 20 % y 1.6 a 2.2 g/kg; definición −20 a 25 % (máx. −500 kcal) y 2.0 a 2.4 g/kg; recomposición −10 a −15 % y 2.0 a 2.4 g/kg.</p></section>
      <section class="pn-card"><h3>Ajustar al entrenamiento del día</h3>
        <label class="pn-sw-row"><input type="checkbox" ${f.cargaDia.on?'checked':''} onchange="NRP.draft.cargaDia.on=this.checked;nrPanelRender()"><span>${f.cargaDia.on?'Activado':'Apagado'}: el carbohidrato del día cambia según lo que le toca entrenar. Proteína y grasa quedan igual.</span></label>
        ${f.cargaDia.on?`<div class="pn-calc" style="margin-top:10px">
          <label><span>Día pesado (pierna, cuerpo completo o carga alta)</span><div class="pn-in"><input inputmode="numeric" value="${f.cargaDia.pesado}" onchange="NRP.draft.cargaDia.pesado=Math.max(0,Math.min(40,parseFloat(this.value)||0))"><span>% más carbohidrato</span></div></label>
          <label><span>Día de descanso</span><div class="pn-in"><input inputmode="numeric" value="${f.cargaDia.descanso}" onchange="NRP.draft.cargaDia.descanso=Math.max(0,Math.min(40,parseFloat(this.value)||0))"><span>% menos carbohidrato</span></div></label>
        </div>`:''}
        <p class="pn-nota">Regla propuesta (configurable): ±15 a 20 % de carbohidrato. Lo que manda es el total de la semana; esto acomoda la energía hacia los días que más la necesitan. El día pesado el socio ve un recordatorio.</p></section>
      <div class="pn-acc"><button type="button" class="sd-b" onclick="nrFiloGuardar(true)">Restablecer</button><button type="button" class="sd-pri" onclick="nrFiloGuardar()">Guardar filosofía</button></div>`;
  } else if(NRP.tab==='recetas'){
    const ids=Object.keys(NR).filter(k=>NR[k]).sort((a,b)=>String(NR[a].n).localeCompare(String(NR[b].n)));
    body=`<div class="ma-tools"><button type="button" class="sd-pri" onclick="nrEditor()">${ico('plus')}Nueva receta</button></div>
      ${ids.length?`<div class="mq-lista">${ids.map(k=>{ const r=NR[k], fid=r.foto?'r-'+k:'';
        return `<button type="button" class="mq-it" onclick="nrEditor('${esc(k)}')">${fid?`<img src="${menuFotoSrc(fid)}" alt="" width="160" height="100" loading="lazy">`:`<span class="ma-ph">${ico('food')}</span>`}<b>${esc(r.n)}</b><span>${esc(r.autor||'')}</span></button>`; }).join('')}</div>`
        :'<p class="pn-nota">Todavía no hay recetas propias. Las que crees aparecen en el buscador de platillos de todos los planes, con sus porciones escaladas a cada socio.</p>'}`;
  } else {
    const ids=Object.keys(NPL).filter(k=>NPL[k]);
    body=ids.length?`<ul class="pn-tpls">${ids.map(k=>{ const t=NPL[k]; return `<li><div><b>${esc(t.nombre)}</b><small>${esc(t.autor||'')} · ${esc(t.fecha?fmtFecha(t.fecha):'')} · ${comoArray(t.comidas).length} comidas</small></div>
        ${staffRol==='coordinador'||t.autorId===staffActivoEntId?`<button type="button" class="ma-lnk dng" onclick="nrPlantillaBorrar('${esc(k)}')">${ico('trash')}Borrar</button>`:''}</li>`; }).join('')}</ul>`
      :'<p class="pn-nota">Guarda un plan como plantilla desde el paso 4 ("Guardar como plantilla") y úsala con otros socios desde el paso 1.</p>';
  }
  c.innerHTML=`<div class="m-tag">Nutrición</div><div class="m-title" id="nr-titulo">Herramientas del nutriólogo</div>
    <div class="pn-sub">${tabs.map(([k,lb])=>`<button type="button" class="${NRP.tab===k?'on':''}" onclick="NRP.tab='${k}';nrPanelRender()">${lb}</button>`).join('')}</div>${body}`;
}
function nrFiloGuardar(reset){
  const f=reset?null:NRP.draft;
  if(staffRol==='coordinador'){ DB.config=DB.config||{}; if(f) DB.config.nutFilo=f; else delete DB.config.nutFilo; fbEncolar('/config/nutFilo',f?'set':'remove',f||undefined); }
  else if(staffActivoEntId&&DB.entrenadores[staffActivoEntId]){ const e=DB.entrenadores[staffActivoEntId]; if(f) e.nutFilo=f; else delete e.nutFilo; fbEncolar('/entrenadores/'+staffActivoEntId+'/nutFilo',f?'set':'remove',f||undefined); }
  else { showToast('Entra con tu cuenta de nutriólogo para guardar tu filosofía'); return; }
  guardarLocal(); NRP.draft=null; nrPanelRender();
  showToast(reset?'Filosofía restablecida a la de la app':'Filosofía guardada. Los planes automáticos ya la usan');
}
function nrPlantillaBorrar(id){ uiConfirm('¿Borrar esta plantilla?',()=>{ delete NPL[id]; fbEncolar('/nutri/plantillas/'+id,'remove'); nrGuardarLocal(); nrPanelRender(); },{label:'Borrar',danger:true}); }

// ═════════════ Carga y caché local ═════════════
function nrGuardarLocal(){ try{ localStorage.setItem('nutri_recetas',JSON.stringify(NR)); localStorage.setItem('nutri_plantillas',JSON.stringify(NPL)); }catch(e){} }
(function(){ try{ NR=JSON.parse(localStorage.getItem('nutri_recetas'))||{}; NPL=JSON.parse(localStorage.getItem('nutri_plantillas'))||{}; }catch(e){ NR={}; NPL={}; } nrSincronizar(); })();
function nrEscuchar(){
  if(typeof fbDB==='undefined'||!fbDB||!fbListo) return;
  if(!nrRef){ nrRef=fbDB.ref('/nutri/recetas'); nrRef.on('value',sn=>{ NR=sn.val()||{}; nrSincronizar(); nrGuardarLocal(); },e=>{ console.warn('recetas',e&&e.code); nrRef=null; }); }
  const staffNutri=typeof fbEsStaff!=='undefined'&&fbEsStaff&&(staffRol==='coordinador'||(typeof esNutriologo==='function'&&esNutriologo()));
  if(staffNutri&&!nplRef){ nplRef=fbDB.ref('/nutri/plantillas'); nplRef.on('value',sn=>{ NPL=sn.val()||{}; nrGuardarLocal(); },e=>{ console.warn('plantillas',e&&e.code); nplRef=null; }); }
}

// ═════════════ Enganches ═════════════
(function(){
  const env=(fn,f,antes)=>{ if(typeof window[fn]!=='function') return; const o=window[fn];
    window[fn]=function(){ if(antes){ try{ antes.apply(this,arguments); }catch(e){ console.warn('pn',fn,e); } } const r=o.apply(this,arguments); if(!antes){ try{ f.apply(this,arguments); }catch(e){ console.warn('pn',fn,e); } } return r; }; };
  env('staffRenderList',()=>nrEscuchar());
  env('refreshDash',()=>nrEscuchar());
  env('actualizarBotonMiFilosofia',()=>{ const b=document.getElementById('btn-nutri'); if(b) b.style.display=(staffRol==='coordinador'||(typeof esNutriologo==='function'&&esNutriologo()))?'inline-block':'none'; });
  // Las variantes del plan deben existir antes de pintar el resumen del staff o el menú del socio
  env('maResumenStaffHTML',null,s=>pnRegistrarVariantes(s));
  env('menuPlanHTML',null,s=>pnRegistrarVariantes(s));
  // "Editar menú" de la ficha abre el plan completo en el paso 3 (el editor anterior no guarda semana ni variantes)
  if(typeof maAbrir==='function') window.maAbrir=maAbrir=function(code){ pnAbrir(code); if(PN){ PN.paso=3; pnRender(); } };
  // Ficha del socio: acceso al plan de alimentación arriba de la pestaña Nutrición
  if(typeof bloqueNutricionStaff==='function'){
    const o=bloqueNutricionStaff;
    window.bloqueNutricionStaff=bloqueNutricionStaff=function(s){
      const h=o.apply(this,arguments); if(!s||!nutPuedeEditar(s)) return h;
      const plan=s.nutricion&&s.nutricion.plan, hecho=plan&&plan.tipo==='nutri';
      return `<section class="pn-cta"><div><b>Plan de alimentación</b><span>${hecho?'Ajustado por '+esc(plan.por||'nutrición')+(plan.fecha?' · '+esc(fmtFecha(plan.fecha)):''):'Ahora ve el plan automático. Ábrelo para ajustar dietocálculo, porciones, comidas y semana.'}</span></div>
        <button type="button" class="sd-pri" onclick="pnAbrir('${esc(s.code)}')">${ico('leaf')}${hecho?'Editar plan':'Abrir plan'}</button></section>`+h;
    };
  }
  // App del socio: el día de la semana cambia el platillo de cada comida si el nutriólogo lo planeó
  if(typeof nxPlan==='function'){
    const o=nxPlan;
    window.nxPlan=nxPlan=function(s){
      const p=o.apply(this,arguments); if(!p) return p;
      pnRegistrarVariantes(s);
      const a=p.semana&&p.semana[PN_DIA_JS[new Date().getDay()]];
      let comidas=comoArray(p.comidas).map((m,i)=>a&&a[i]&&maPlat(a[i].id)?Object.assign({},m,{id:a[i].id,q:comoArray(a[i].q)}):m);
      // Día pesado o de descanso: las porciones de cereal y fruta de cada comida siguen al entrenamiento
      const C=PN_DIA_CTX&&PN_DIA_CTX.code===s.code?PN_DIA_CTX:null;
      if(C&&C.f) comidas=comidas.map(m=>{ const pl=maPlat(m.id); if(!pl||!m.eq||!Object.keys(m.eq).length) return m;
        const t={id:m.id, q:comoArray(m.q).slice(), extra:[], eq:{}}; pnAjustarAEq(t,pnEqDia(m.eq,C.f)); return Object.assign({},m,{q:t.q}); });
      if(!a&&!(C&&C.f)) return p;
      return Object.assign({},p,{comidas});
    };
  }
})();
