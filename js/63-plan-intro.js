/* ═══ Reto Fit CCA: calendario del reto en Mi plan + introducción antes de entrenar ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global). Estilos en css/cine.css.
   · Mi plan: un solo calendario. Encabezado con la semana del reto, las fechas y el bloque del entrenador;
     las 3 fases; los 7 días marcados; y "Ver las 12 semanas" despliega el reto día por día.
   · Iniciar entrenamiento: primero una pantalla con la sesión de hoy (músculos, equipo, consejo, calentamiento,
     tips y orden de ejercicios) y una cuenta 3·2·1. Si la sesión ya estaba empezada, va directo a la serie. ═══ */

const RC_MESES=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
let rcAbierto=false;
function rcRango(){
  const a=inicioSemana(new Date()), b=new Date(a); b.setDate(a.getDate()+6);
  return a.getMonth()===b.getMonth()?`${a.getDate()} al ${b.getDate()} de ${RC_MESES[b.getMonth()]}`:`${a.getDate()} ${RC_MESES[a.getMonth()]} al ${b.getDate()} ${RC_MESES[b.getMonth()]}`;
}
function retoCalHTML(s,strip,b,semA){
  const e=typeof retoEstado==='function'?retoEstado():null, ev=calcEvolucion(s), meta=Math.max(1,s.dias||1);
  const n=(e&&e.semanas)||12;
  const tit=!e?`Semana ${semA} de ${b.semanas}`:e.estado==='antes'?(e.faltan===1?'El reto arranca mañana':`Arranca en ${e.faltan} días`):e.estado==='terminado'?'Reto terminado':`Semana ${e.semana} de ${n}`;
  const bloque=s.status==='activo'?`<button type="button" class="rc-bl" onclick="pqVerProgreso()">Bloque ${esc(b.n)} · semana ${semA} de ${b.semanas}${ico('chev')}</button>`:'';
  const fases=(GYM.reto&&GYM.reto.fases)||[];
  const faseHoy=e&&e.fase;
  const fasesHTML=fases.length?`<div class="rc-fases">${fases.map(f=>`<span class="${faseHoy&&faseHoy.nombre===f.nombre?'on':''}" style="flex:${(f.hasta-f.desde+1)||1}">${esc(f.nombre)}</span>`).join('')}</div>`:'';
  const evSem=e&&e.estado==='en curso'&&e.evalSem;
  return `<section class="rcal${rcAbierto?' abierto':''}${evSem?' eval':''}" aria-label="Calendario del reto">
    <div class="rc-h"><div><h2 class="rc-t">${esc(tit)}</h2><p class="rc-s">${rcRango()}${evSem?' · <b class="rc-ev">semana de evaluación</b>':''}</p></div>${bloque}</div>
    ${fasesHTML}
    <div class="en-strip rc-strip" role="group" aria-label="Días de esta semana">${strip}</div>
    ${e?`<div class="rc-doce" id="rc-doce"${rcAbierto?'':' hidden'}>${rcDoceHTML(s,e)}</div>`:''}
    <div class="rc-f"><span><b>${ev.estaSemana} de ${meta}</b> sesiones · racha ${ev.racha} ${ev.racha===1?'semana':'semanas'}</span>${e?`<button type="button" aria-expanded="${rcAbierto}" aria-controls="rc-doce" onclick="rcAlternar(this)">${rcAbierto?'Ver solo esta semana':'Ver las 12 semanas'}${ico('chev')}</button>`:''}</div>
  </section>`;
}
function rcDoceHTML(s,e){
  const n=e.semanas||12, ini=new Date(e.inicio), hoyIso=fechaISO(new Date());
  const hechos=new Set(sesValidas(s).map(x=>x.fecha));
  const evs=(GYM.reto.evaluaciones||[]).filter(x=>x>0);
  const dl=['L','M','X','J','V','S','D'];
  let h=`<div class="rc-row rc-cab"><span></span>${dl.map(d=>`<span>${d}</span>`).join('')}</div>`;
  let total=0;
  for(let w=1;w<=n;w++){
    const now=e.estado==='en curso'&&e.semana===w;
    h+=`<div class="rc-row${now?' now':''}${evs.includes(w)?' ev':''}"><span>Sem ${w}</span>`;
    for(let d=0;d<7;d++){
      const f=new Date(ini); f.setDate(ini.getDate()+(w-1)*7+d); const iso=fechaISO(f);
      const k=DIAS_ORDER[(f.getDay()+6)%7], r=s.rutina[k], rest=!r||!r.ejercicios||!r.ejercicios.length;
      const ok=hechos.has(iso); if(ok) total++;
      const c=ok?'ok':iso===hoyIso?'h':rest?'r':iso<hoyIso?'x':'f';
      h+=`<i class="${c}" title="${f.getDate()} ${RC_MESES[f.getMonth()]}${ok?' · entrenaste':rest?' · descanso':''}"></i>`;
    }
    h+='</div>';
  }
  const dia=e.estado==='en curso'?`Día ${e.dia} de ${e.totalDias}`:e.estado==='antes'?`Empieza el ${retoFechaTxt(e.inicio)}`:'Reto terminado';
  return `<p class="rc-dt">${dia} · ${total} ${total===1?'sesión':'sesiones'} en el reto</p>${h}
    <div class="rc-ley"><span><i class="ok"></i>Entrenaste</span><span><i class="h"></i>Hoy</span><span><i class="r"></i>Descanso</span><span><i class="ev"></i>Evaluación</span></div>`;
}
function rcAlternar(b){
  rcAbierto=!rcAbierto;
  const sec=b.closest('.rcal'), g=sec&&sec.querySelector('#rc-doce');
  if(g) g.hidden=!rcAbierto;
  sec&&sec.classList.toggle('abierto',rcAbierto);
  b.setAttribute('aria-expanded',rcAbierto);
  b.innerHTML=(rcAbierto?'Ver solo esta semana':'Ver las 12 semanas')+ico('chev');
}

/* ── Introducción a la sesión ── */
/* Lubricación articular: primer paso de todo calentamiento, de cabeza a pies, rápido y sin cansar. */
const INTRO_LUB=['Lubricación articular','1 min','Cuello · hombros · codos · muñecas · cadera · rodillas · tobillos — 5 círculos por lado'];
const INTRO_CAL_MIN={pierna:6,torso:6,cardio:5,general:6};
const INTRO_CAL={
  pierna:[['Caminadora o bici','3 min'],['Sentadilla sin peso','2 × 10'],['Zancadas alternas','1 × 8 por pierna']],
  torso:[['Remo o elíptica','3 min'],['Círculos de hombro','2 × 10'],['Lagartijas en pared','1 × 10']],
  cardio:[['Camina suave','3 min'],['Movilidad de tobillo y cadera','1 min']],
  general:[['Cardio suave','3 min'],['Movilidad de cadera y hombro','2 min']]
};
const INTRO_TIPS=['Trae agua y toalla.','Haz la primera serie de cada ejercicio un poco más ligera.','Anota tu peso al terminar cada serie: de ahí sale el de la próxima vez.'];
function introTipoCal(tipo){
  const t=slugImg(tipo);
  if(/pierna|gluteo|inferior|femoral|cuadri/.test(t)) return 'pierna';
  if(/cardio|hiit|resist|caminar|correr/.test(t)) return 'cardio';
  if(/torso|pecho|espalda|hombro|brazo|superior|biceps|triceps|empuje|jalon/.test(t)) return 'torso';
  return 'general';
}
function introConsejo(s,d){
  const ent=s.entrenadorId&&getEntrenador(s.entrenadorId);
  const conTip=(d.ejercicios||[]).find(e=>e.tip);
  const frase=conTip?String(conTip.tip).replace(/<[^>]*>/g,''):(ent&&ent.filosofia&&ent.filosofia.tagline)||'Técnica primero: mejor menos peso y bien hecho.';
  return {ent, txt:typeof sinEmoji==='function'?sinEmoji(frase):frase};
}
function introHTML(s,k){
  const d=s.rutina[k], ejs=d.ejercicios, e=typeof retoEstado==='function'?retoEstado():null;
  const series=ejs.reduce((a,x)=>a+(parseInt(x.series)||0),0);
  const grupos=[...new Set(ejs.map(x=>{ const g=slugImg(String(x.ms||'').split(/[·,]/)[0]), g1=g.split('-')[0]; return [g,g1,GRUPO_ALIAS[g],GRUPO_ALIAS[g1]].find(z=>z&&GRUPOS_IMG.has(z)); }).filter(Boolean))].slice(0,3);
  const zonas=[...new Set(ejs.map(x=>{ const kb=typeof kbBuscar==='function'&&kbBuscar(x.nm); return kb&&DD_ZONA[kb.z]; }).filter(Boolean))];
  const tc0=introTipoCal(d.tipo), cal=INTRO_CAL[tc0], c=introConsejo(s,d);
  const chip=e?(e.estado==='en curso'?`Semana ${e.semana}${e.fase?' · '+esc(e.fase.nombre):''}`:e.estado==='antes'?`El reto arranca en ${e.faltan} días`:''):'';
  const nomG=g=>({cuadriceps:'Cuádriceps',femorales:'Femorales',gluteo:'Glúteo',gemelos:'Pantorrilla',pecho:'Pecho',dorsal:'Dorsal',espalda:'Espalda',deltoides:'Hombro',biceps:'Bíceps',triceps:'Tríceps',trapecio:'Trapecio',abdomen:'Abdomen',core:'Core',oblicuos:'Oblicuos',erectores:'Lumbar',cardiovascular:'Cardio',recto:'Abdomen',manguito:'Manguito',braquial:'Braquial'}[g]||sc(g));
  return `<div class="si-in">
    <div class="si-hero">${pic(basesSesion(d.tipo),iconoTipo(d.tipo),'fill')}
      <div class="si-top"><button type="button" class="si-x" onclick="sesIntroCerrar()" aria-label="Volver">${ico('chevl')}</button>${chip?`<span>${chip}</span>`:''}</div>
      <div class="si-tx"><small>Hoy · ${esc(sc(DIAS_NAMES[HOY_KEY]).toLowerCase())} ${new Date().getDate()}</small>
        <h1 class="si-t">${esc(sc(d.tipo)).replace(/\s*\+\s*/,' <span>+</span> ')}</h1>
        <div class="si-n"><div><b>~${minutosDia(d,s)}</b><small>min</small></div><div><b>${ejs.length}</b><small>ejercicios</small></div>${series?`<div><b>${series}</b><small>series</small></div>`:''}</div></div>
    </div>
    <div class="si-b">
      <div class="si-coach"><span class="si-av">${c.ent?esc(iniciales(c.ent.nombre)):ico('star')}</span><p><b>${c.ent?'Consejo de '+esc(tc(c.ent.nombre).split(' ')[0]):'Consejo de hoy'}</b>${esc(c.txt)}</p></div>
      ${grupos.length?`<div class="si-sec"><h2>Trabajas</h2></div><div class="si-mus">${grupos.map(g=>`<div><img src="${imgSrc('grupos/'+g+'.webp')}" alt="" loading="lazy" decoding="async" onerror="this.remove()"><span>${esc(nomG(g))}</span></div>`).join('')}</div>`:''}
      ${zonas.length?`<div class="si-sec"><h2>Necesitas</h2></div><div class="si-eq">${zonas.map(z=>`<span>${esc(z)}</span>`).join('')}</div>`:''}
      <div class="si-sec"><h2>Calienta</h2><small>${INTRO_CAL_MIN[tc0]||6} min</small></div>
      <div class="si-cal">${[INTRO_LUB,...cal].map(([t,v,det])=>`<label><input type="checkbox"><span>${esc(t)}${det?`<em>${esc(det)}</em>`:''}</span><small>${esc(v)}</small></label>`).join('')}</div>
      <div class="si-sec"><h2>Antes de empezar</h2></div>
      <ul class="si-tips">${INTRO_TIPS.map(t=>`<li>${ico('check')}<span>${esc(t)}</span></li>`).join('')}</ul>
      <div class="si-sec"><h2>Tu orden</h2><small>toca para ver la técnica</small></div>
      <div class="si-lst">${ejs.map((x,j)=>`<button type="button" class="si-ej" onclick="verComoDia('${k}',${j})"><span class="si-num">${j+1}</span><span class="si-th">${pic(basesEjercicioMini(x),'dumbbell','thumb')}</span><span class="si-ej-t"><b>${esc(x.nm)}</b><small>${esc(rxTexto(x,s).sr)}</small></span></button>`).join('')}</div>
    </div>
    <div class="si-fade" aria-hidden="true"></div>
    <button type="button" class="si-go" onclick="sesIntroComenzar('${k}')"><span class="si-d">${ico('play')}</span>Comenzar<small>3 · 2 · 1</small></button>
  </div>`;
}
let _siK=null;
function sesIntroAbrir(k){
  const s=activeSocio; if(!s||!s.rutina[k]) return;
  _siK=k; sesIntroCerrar(true);
  const ov=document.createElement('div'); ov.id='ses-intro'; ov.className='si'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-label','Tu sesión de hoy');
  ov.innerHTML=introHTML(s,k);
  document.body.appendChild(ov); document.body.classList.add('si-abierta');
  requestAnimationFrame(()=>ov.classList.add('on'));
  document.addEventListener('keydown',sesIntroEsc);
  ov.querySelector('.si-go')?.focus({preventScroll:true});
}
function sesIntroEsc(e){ if(e.key==='Escape') sesIntroCerrar(); }
function sesIntroCerrar(silencio){
  document.removeEventListener('keydown',sesIntroEsc);
  document.getElementById('ses-intro')?.remove(); document.getElementById('ses-cuenta')?.remove();
  document.body.classList.remove('si-abierta');
}
let _siT=null;
function sesIntroComenzar(k){
  const s=activeSocio, d=s&&s.rutina[k]; if(!d) return;
  const e0=d.ejercicios[0];
  const cr=document.createElement('div'); cr.id='ses-cuenta'; cr.className='si-cr'; cr.setAttribute('role','status');
  cr.innerHTML=`<div class="si-ring"></div><div class="si-cn" id="si-cn">3</div>
    <div class="si-cr-t"><small>Primero</small><b>${esc(e0.nm)}</b><p>${esc(rxTexto(e0,s).sr)}</p></div>
    <button type="button" class="si-skip" onclick="sesIntroArrancar()">Saltar</button>`;
  document.body.appendChild(cr);
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let n=3; try{ vibrarToque&&vibrarToque(30); }catch(_){}
  clearInterval(_siT);
  _siT=setInterval(()=>{
    n--; const el=document.getElementById('si-cn'); if(!el){ clearInterval(_siT); return; }
    if(n<=0){ clearInterval(_siT); sesIntroArrancar(); return; }
    el.textContent=n; if(!reduce){ el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
    try{ vibrarToque&&vibrarToque(30); }catch(_){}
  },900);
}
function sesIntroArrancar(){
  clearInterval(_siT);
  const k=_siK; sesIntroCerrar();
  if(k) { _siDirecto=true; iniciarSesion(k); }
}
let _siDirecto=false;
if(typeof iniciarSesion==='function'){
  const _iniOrig=iniciarSesion;
  window.iniciarSesion=iniciarSesion=function(k){
    const enCurso=typeof sesionTemp!=='undefined'&&sesionTemp&&sesionTemp.diaKey===k&&Object.keys(sesionTemp.ej||{}).length;
    if(_siDirecto||enCurso){ _siDirecto=false; return _iniOrig.apply(this,arguments); }
    sesIntroAbrir(k);
  };
}
