/* ═══ Reto Fit CCA: reglas del reto — categorías, constancia y candados contra trampas ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global). Estilos en css/cine.css.
   · Categorías: Varonil y Femenil (18 a 59), Juvenil varonil y femenil (14 a 17, siempre recomposición) y
     Adulto mayor varonil y femenil (60+). Salen solas de la edad y el sexo; el director puede corregirla.
   · Ubicación del gimnasio: el director la guarda desde el gym (Menú → Ubicación y reglas del reto).
     Con ella activa, una sesión suma para el reto solo si el celular la detectó dentro del gimnasio.
   · Una sesión suma si: no quedó incompleta, duró al menos RETO_MIN_MIN minutos (las registradas antes de
     esta versión no traen duración y sí cuentan) y, con la ubicación activa, se hizo en el gym.
     Solo cuenta una por día.
   · Constancia: sesiones que sumaron ÷ sesiones comprometidas (sus días por semana, mínimo 3), semana por semana.
     Ir más días de los comprometidos no da más del 100 % en esa semana.
   · Fuerza: la base es lo mejor de sus 2 primeras semanas (empezar "flojo" no ayuda); un salto de más de
     RETO_SALTO % contra su mejor marca anterior no cuenta y queda como alerta para el entrenador;
     el avance por ejercicio tiene tope (RETO_FZ_TOPE %).
   · Puntaje final (sobre 100): constancia 40 + resultado 40 (mediciones oficiales de nutrición) + jueces 20.
     Lo de nutrición y jueces se captura en la siguiente etapa; mientras, el tablero muestra la constancia. ═══ */

const RETO_MIN_MIN=20;        // minutos mínimos para que una sesión cuente
const RETO_SALTO=25;          // % de salto de peso que se considera sospechoso
const RETO_FZ_TOPE=40;        // % máximo de avance de fuerza por ejercicio
const RETO_PESOS={constancia:40, resultado:40, jueces:20};
const RETO_CATS={var:'Varonil', fem:'Femenil', juv_v:'Juvenil varonil', juv_f:'Juvenil femenil', am_v:'Adulto mayor varonil', am_f:'Adulto mayor femenil'};
const RETO_CATS_ORDEN=['var','fem','juv_v','juv_f','am_v','am_f'];

function retoEdades(){ const r=(typeof GYM!=='undefined'&&GYM.reto)||{}; return {juvMin:r.edadJuvenil||14, mayor:r.edadMayor||60}; }
function retoSexo(s){ const g=String((s&&s.genero)||'').toUpperCase(); return /FEM|MUJER/.test(g)?'f':/MASC|HOMBRE|VAR/.test(g)?'m':''; }
function retoCategoria(s){
  if(!s) return '';
  if(s.categoria && RETO_CATS[s.categoria]) return s.categoria;   // corregida por el director
  if(s._cat && RETO_CATS[s._cat]) return s._cat;                   // ficha ligera del índice
  const e=+s.edad, x=retoSexo(s), E=retoEdades(); if(!e || !x) return '';
  if(e<18) return x==='f'?'juv_f':'juv_v';
  if(e>=E.mayor) return x==='f'?'am_f':'am_v';
  return x==='f'?'fem':'var';
}
function retoCategoriaNombre(c){ return RETO_CATS[c]||'Sin categoría'; }
function retoEsJuvenil(s){ const c=retoCategoria(s); return c==='juv_v'||c==='juv_f'; }

// ── Ubicación del gimnasio ──
function retoGeo(){
  const g=(typeof DB!=='undefined'&&DB.config&&DB.config.geo)||(typeof GYM!=='undefined'&&GYM.geofence)||null;
  if(!g || !(+g.lat) || !(+g.lng) || g.off) return null;
  return {lat:+g.lat, lng:+g.lng, radio:+(g.radioM||g.radio)||150, desde:+g.desde||0};
}
// Mide dónde está el celular: 'gym', 'fuera', 'denegada' (sin permiso), 'sin-senal' o 'sin-config'
function retoGeoMedir(){
  return new Promise(res=>{
    const g=retoGeo();
    if(!g) return res({st:'sin-config'});
    if(!navigator.geolocation) return res({st:'sin-senal'});
    navigator.geolocation.getCurrentPosition(p=>{
      const d=haversine(p.coords.latitude,p.coords.longitude,g.lat,g.lng), acc=Math.round(p.coords.accuracy||0);
      res({st: d<=g.radio+Math.min(acc,80)?'gym':'fuera', d:Math.round(d), acc});
    }, err=>res({st: err&&err.code===1?'denegada':'sin-senal'}), {timeout:15000, maximumAge:60000, enableHighAccuracy:true});
  });
}

// ── ¿Qué sesiones suman para el reto? ──
function retoSesionCuenta(x){
  if(!x || !sesCuenta(x)) return false;
  if(x.min!=null && +x.min<RETO_MIN_MIN) return false;
  const g=retoGeo();
  if(g && (x.ts||0)>=g.desde){
    if(x.geo) return x.geo==='gym';
    if(x._lite) return x.g!==0;       // en la ficha ligera el índice ya trae si contó (g:0 = no)
    return false;                     // sin dato de ubicación después de activarla
  }
  return true;
}
// Motivo por el que una sesión no suma (para avisarle al socio y para las alertas del entrenador)
function retoSesionMotivo(x){
  if(!x || !sesCuenta(x)) return 'incompleta';
  if(x.min!=null && +x.min<RETO_MIN_MIN) return 'corta';
  const g=retoGeo();
  if(g && (x.ts||0)>=g.desde && x.geo!=='gym') return x.geo==='denegada'?'sin-permiso':x.geo==='fuera'?'fuera':'sin-ubicacion';
  return '';
}
function retoSesionesPuntuables(s, desdeTs){
  const todas=comoArray(s&&s.logs&&s.logs.sesiones).filter(x=>x && (x.ts||0)>=(desdeTs||0))
    .sort((a,b)=>(a.ts||0)-(b.ts||0));
  const dias=new Set(), out=[];
  todas.forEach(x=>{ if(!retoSesionCuenta(x)) return; const f=x.fecha||fechaISO(new Date(x.ts)); if(dias.has(f)) return; dias.add(f); out.push(x); });
  return out;
}
// Alertas para el entrenador y el director
function retoAlertas(s, desdeTs){
  const todas=comoArray(s&&s.logs&&s.logs.sesiones).filter(x=>x && (x.ts||0)>=(desdeTs||0));
  const porDia={}; todas.forEach(x=>{ if(sesCuenta(x)) porDia[x.fecha]=(porDia[x.fecha]||0)+1; });
  const n={fuera:0, corta:0, duplicada:Object.values(porDia).reduce((a,v)=>a+Math.max(0,v-1),0), saltos:[]};
  todas.forEach(x=>{ const m=retoSesionMotivo(x); if(m==='fuera'||m==='sin-permiso'||m==='sin-ubicacion') n.fuera++; else if(m==='corta') n.corta++; });
  return n;
}

// ── Constancia: lo cumplido contra lo comprometido, semana por semana ──
function retoCompromiso(s){ return Math.max(3, Math.min(7, +(s&&s.dias)||3)); }
function retoConstancia(s, desde, ses){
  const comp=retoCompromiso(s);
  let ini=desde&&desde.ts?desde.ts:0;
  if(!ini){ const f=s&&s.fechaRegistro?new Date(s.fechaRegistro+'T00:00:00').getTime():0; ini=f||((ses[0]&&ses[0].ts)||Date.now()); }
  const lunes0=inicioSemana(new Date(ini)).getTime(), lunesHoy=inicioSemana(new Date()).getTime();
  const semanas=Math.max(1, Math.round((lunesHoy-lunes0)/(7*86400000))+1);
  const porSem={}; ses.forEach(x=>{ const k=Math.floor((inicioSemana(new Date(x.ts)).getTime()-lunes0)/(7*86400000)); porSem[k]=(porSem[k]||0)+1; });
  // La semana en curso solo cuenta lo que lleva (no se le exige completa todavía)
  let hechas=0, debidas=0;
  for(let k=0;k<semanas;k++){
    const n=Math.min(porSem[k]||0, comp);
    if(k===semanas-1){ if(n>0){ hechas+=n; debidas+=Math.max(n, 0); } continue; }
    hechas+=n; debidas+=comp;
  }
  const pct=debidas?Math.round(hechas/debidas*1000)/10:0;
  return {comp, pct, hechas, debidas, semanas, pts:Math.round(pct*RETO_PESOS.constancia/100*10)/10};
}

// ── Fuerza sin trampas: base de 2 semanas, saltos sospechosos fuera y tope por ejercicio ──
function retoFuerza(ses){
  const porEj={};
  ses.forEach(x=>{ comoArray(x.detalle).forEach(e=>{
    if(!e || !e.n || !(+e.kg>0)) return;
    // Con repeticiones se usa la fuerza estimada (peso × reps), así 90 kg × 1 no vale más que 50 × 10
    let v=+e.kg; const sr=comoArray(e.sr).filter(p=>p&&+p[0]>0);
    if(sr.length) v=Math.max(...sr.map(p=>+p[0]*(1+Math.min(12,+p[1]||1)/30)));
    (porEj[e.n]=porEj[e.n]||[]).push({ts:x.ts, v, kg:+e.kg});
  }); });
  const cambios=[], saltos=[];
  Object.entries(porEj).forEach(([nm,l])=>{
    l.sort((a,b)=>a.ts-b.ts);
    if(l.length<2 || l[l.length-1].ts-l[0].ts<7*86400000) return;
    // Primero se quitan los saltos sospechosos; luego la base es lo mejor de sus 2 primeras semanas
    let mejor=0; const limpias=[];
    l.forEach(z=>{
      if(mejor && z.v>mejor*(1+RETO_SALTO/100)+2.5){ saltos.push({n:nm, de:Math.round(mejor), a:Math.round(z.v)}); return; }
      mejor=Math.max(mejor,z.v); limpias.push(z);
    });
    const t0=limpias[0].ts, base=Math.max(...limpias.filter(z=>z.ts-t0<14*86400000).map(z=>z.v));
    const desp=limpias.filter(z=>z.ts-t0>=14*86400000); if(!desp.length || !(base>0)) return;
    const ult=Math.max(...desp.slice(-3).map(z=>z.v));
    cambios.push(Math.max(-50, Math.min(RETO_FZ_TOPE, (ult-base)/base*100)));
  });
  return {pct: cambios.length?Math.round(cambios.reduce((a,b)=>a+b,0)/cambios.length*10)/10:null, saltos};
}

// ═════════════ Al registrar una sesión: duración y ubicación ═════════════
(function(){
  if(typeof renderSes==='function'){
    const o=renderSes;
    window.renderSes=renderSes=function(){
      const r=o.apply(this,arguments);
      try{
        if(typeof sesionTemp!=='undefined' && sesionTemp && !sesionTemp._geoPedida && retoGeo()){
          sesionTemp._geoPedida=true;
          retoGeoMedir().then(g=>{ if(sesionTemp && (sesionTemp.geo!=='gym')) sesionTemp.geo=g.st; });
        }
      }catch(e){}
      return r;
    };
  }
  if(typeof finalizarSesion==='function'){
    const o=finalizarSesion;
    window.finalizarSesion=finalizarSesion=function(){
      const st=(typeof sesionTemp!=='undefined'&&sesionTemp)?{t0:sesionTemp.t0, geo:sesionTemp.geo}:null;
      const s=typeof activeSocio!=='undefined'?activeSocio:null;
      const n0=s?comoArray(s.logs&&s.logs.sesiones).length:0;
      const r=o.apply(this,arguments);
      try{
        if(!s || !st) return r;
        const lista=comoArray(s.logs.sesiones); if(lista.length<=n0) return r;
        const reg=lista[lista.length-1];
        reg.min=Math.max(0,Math.round((Date.now()-(st.t0||Date.now()))/60000));
        if(retoGeo()){
          reg.geo=st.geo||'sin-ubicacion';
          dbSave(s.code);
          // Si al empezar no se pudo confirmar, se intenta otra vez al terminar
          if(reg.geo!=='gym') retoGeoMedir().then(g=>{
            if(g.st==='gym') reg.geo='gym'; else if(reg.geo==='sin-ubicacion') reg.geo=g.st;
            dbSave(s.code);
            if(reg.geo!=='gym' && typeof showToast==='function') setTimeout(()=>showToast(reg.geo==='denegada'
              ?'Tu sesión se guardó, pero no suma para el reto: activa la ubicación para que la app confirme que estás en el gym.'
              :'Tu sesión se guardó, pero no suma para el reto: no se detectó que estuvieras en el gimnasio.'),2600);
          });
        } else dbSave(s.code);
        if(reg.min<RETO_MIN_MIN && typeof showToast==='function') setTimeout(()=>showToast(`Sesión guardada. Para que sume en el reto debe durar al menos ${RETO_MIN_MIN} minutos.`),2600);
      }catch(e){ console.warn('reglas del reto',e); }
      return r;
    };
  }
})();

// ═════════════ Director: ubicación del gimnasio y reglas ═════════════
function retoReglasAbrir(){
  if(staffRol!=='coordinador'){ showToast('Solo el director configura el reto'); return; }
  let m=document.getElementById('modal-reglas'); if(!m){ m=document.createElement('div'); m.className='modal'; m.id='modal-reglas'; m.onclick=e=>{ if(e.target===m) m.classList.remove('open'); }; document.body.appendChild(m); }
  const g=retoGeo(), raw=(DB.config&&DB.config.geo)||{};
  const radio=+(raw.radioM||raw.radio)||150;
  m.innerHTML=`<div class="mbox rg-box" role="dialog" aria-modal="true" aria-labelledby="rg-t">
    <div class="rg-h"><h2 id="rg-t">Ubicación y reglas del reto</h2><button type="button" class="av3d-cerrar" onclick="document.getElementById('modal-reglas').classList.remove('open')" aria-label="Cerrar">✕</button></div>
    <section class="rg-sec">
      <h3>📍 Ubicación del gimnasio</h3>
      <p class="rg-p">Con la ubicación activa, una sesión suma para el reto solo si el celular del socio está dentro del gimnasio al empezar o al terminar. Guárdala <b>estando dentro del gym</b>.</p>
      <div class="rg-estado ${g?'on':''}">${g?`Activa · radio de ${g.radio} m · desde el ${esc(fechaISO(new Date(g.desde||Date.now())))}`:(raw.lat?'Guardada pero apagada':'Sin ubicación: las sesiones suman sin revisar dónde se hicieron')}</div>
      <label class="rg-lbl" for="rg-radio">Radio alrededor del punto</label>
      <select class="ti" id="rg-radio">${[100,150,200,300].map(v=>`<option value="${v}"${v===radio?' selected':''}>${v} m${v===150?' (recomendado)':''}</option>`).join('')}</select>
      <button type="button" class="sd-pri rg-btn" id="rg-aqui" onclick="retoGeoGuardarAqui()">📍 Usar mi ubicación actual</button>
      ${raw.lat?`<button type="button" class="sd-b rg-btn" onclick="retoGeoApagar(${raw.off?'false':'true'})">${raw.off?'Volver a activarla':'Apagar la revisión de ubicación'}</button>`:''}
      ${raw.lat?`<a class="rg-map" href="https://www.google.com/maps?q=${+raw.lat},${+raw.lng}" target="_blank" rel="noopener">Ver el punto guardado en el mapa</a>`:''}
    </section>
    <section class="rg-sec">
      <h3>Reglas que ya aplica la app</h3>
      <ul class="rg-ul">
        <li>Solo <b>1 sesión por día</b> suma para el reto.</li>
        <li>Debe durar <b>${RETO_MIN_MIN} minutos o más</b> y no quedar incompleta.</li>
        <li><b>Constancia</b> = sesiones que sumaron ÷ días comprometidos (mínimo 3 por semana). Ir de más no da más del 100 %.</li>
        <li><b>Fuerza:</b> la base es lo mejor de sus 2 primeras semanas; un salto de más del ${RETO_SALTO} % no cuenta y queda como alerta; tope de +${RETO_FZ_TOPE} % por ejercicio.</li>
        <li><b>Categorías:</b> Varonil y Femenil (18 a 59), Juvenil varonil y femenil (14 a 17, en recomposición) y Adulto mayor (60+).</li>
        <li><b>Puntaje final:</b> constancia ${RETO_PESOS.constancia} + resultado de nutrición ${RETO_PESOS.resultado} + jueces ${RETO_PESOS.jueces}.</li>
      </ul>
    </section>
  </div>`;
  m.classList.add('open');
}
async function retoGeoGuardarAqui(){
  const b=document.getElementById('rg-aqui'); if(!navigator.geolocation){ showToast('Este equipo no tiene ubicación'); return; }
  b.disabled=true; b.textContent='Buscando tu ubicación…';
  navigator.geolocation.getCurrentPosition(p=>{
    const acc=Math.round(p.coords.accuracy||0), radio=+document.getElementById('rg-radio').value||150;
    if(acc>120){ showToast(`La señal es poco precisa (±${acc} m). Acércate a una ventana o sal a la entrada y vuelve a intentarlo.`); b.disabled=false; b.textContent='📍 Usar mi ubicación actual'; return; }
    const prev=(DB.config&&DB.config.geo)||{};
    const geo={lat:Math.round(p.coords.latitude*1e6)/1e6, lng:Math.round(p.coords.longitude*1e6)/1e6, radioM:radio, desde:prev.lat&&!prev.off?(prev.desde||Date.now()):Date.now(), acc};
    DB.config=DB.config||{}; DB.config.geo=geo; guardarLocal();
    fbEncolar('/config/geo','set',geo);
    showToast(`✓ Ubicación del gym guardada (±${acc} m). Desde hoy las sesiones se revisan.`);
    retoReglasAbrir();
  }, err=>{ showToast(err&&err.code===1?'Permite la ubicación en tu navegador para guardarla':'No se pudo obtener la ubicación. Intenta de nuevo.'); b.disabled=false; b.textContent='📍 Usar mi ubicación actual'; },
  {timeout:20000, maximumAge:0, enableHighAccuracy:true});
}
function retoGeoApagar(apagar){
  const g=Object.assign({},(DB.config&&DB.config.geo)||{}); if(!g.lat) return;
  if(apagar) g.off=true; else { delete g.off; g.desde=Date.now(); }
  DB.config.geo=g; guardarLocal(); fbEncolar('/config/geo','set',g);
  showToast(apagar?'Revisión de ubicación apagada':'Revisión de ubicación activa desde hoy'); retoReglasAbrir();
}
// El director corrige la categoría desde la ficha
function retoCategoriaCambiar(code){
  const s=getSocio(code); if(!s) return;
  uiOpciones('Categoría del reto de '+tc(s.nombre)+'. Normalmente sale sola de su edad y sexo.',
    [{value:'',label:'Automática',sub:retoCategoriaNombre(retoCategoria(Object.assign({},s,{categoria:''})))}].concat(RETO_CATS_ORDEN.map(c=>({value:c,label:RETO_CATS[c],sel:s.categoria===c}))),
    v=>{ if(v) s.categoria=v; else delete s.categoria; pqGuardarStaff(s,['categoria']); staffRenderContent(s); showToast('✓ Categoría: '+retoCategoriaNombre(retoCategoria(s))); });
}

// ═════════════ Registro: edad mínima 14 y juveniles en recomposición ═════════════
(function(){
  if(typeof qNext!=='function') return;
  const o=qNext;
  window.qNext=qNext=function(step){
    if(step===5){
      const e=parseInt((document.getElementById('qr-edad')||{}).value)||0;
      if(e && e<14){ showToast('El reto es a partir de los 14 años.'); return; }
      if(e && e<18 && qAnswers.objetivo!=='RECOMPOSICIÓN CORPORAL'){
        qAnswers.objetivo='RECOMPOSICIÓN CORPORAL';
        showToast('Para menores de 18 el reto es de recomposición: mejorar músculo y grasa sin dietas extremas.');
      }
    }
    return o.apply(this,arguments);
  };
})();

// ═════════════ Enganches: menú del director y ficha ═════════════
(function(){
  if(typeof staffRenderList==='function'){
    const o=staffRenderList;
    window.staffRenderList=staffRenderList=function(){ const r=o.apply(this,arguments); try{ const b=document.getElementById('btn-reglas'); if(b) b.style.display=staffRol==='coordinador'?'':'none'; }catch(e){} return r; };
  }
  if(typeof staffRenderContent==='function'){
    const o=staffRenderContent;
    window.staffRenderContent=staffRenderContent=function(s){
      const r=o.apply(this,arguments);
      try{
        const head=document.querySelector('#staff-content .fx-head .fx-id'); if(!head||!s||head.querySelector('.fx-cat')) return r;
        const c=retoCategoria(s), dir=staffRol==='coordinador';
        head.insertAdjacentHTML('beforeend',`<${dir?'button type="button" onclick="retoCategoriaCambiar(\''+esc(s.code)+'\')"':'span'} class="fx-cat">${esc(retoCategoriaNombre(c))}${s.categoria?' · fijada':''}</${dir?'button':'span'}>`);
      }catch(e){}
      return r;
    };
  }
})();
