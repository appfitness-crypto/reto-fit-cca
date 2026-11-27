/* ═══ Reto Fit CCA: patrocinadores en 12 lugares, mapa del director y conteo de vistas ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global). Estilos en css/cine.css.
   Amplía js/60-patrocinadores.js sin cambiar cómo se guardan (/config/patrocinadores/<id>):
   · p.lugares[k] = true para cada lugar donde sale. Los lugares EXCLUSIVOS solo los tiene un patrocinador a la vez:
     al dárselo a uno se le quita al que lo tenía. Los COMPARTIDOS muestran a todos los activados.
   · p.semanas = {1:true, 5:true…}: semanas del reto en las que patrocina el festejo de "Semana cumplida" (una marca por semana).
   · Un lugar sin patrocinador no se muestra: la pantalla del socio se ve normal.
   · Conteo: cada socio guarda en su expediente s.patStats[id] = {v, t, l:{lugar:vistas}} (una vista por lugar al día;
     un toque cada vez que abre la promoción). El director suma todos los expedientes en el panel. ═══ */

const PAT_MAPA=[
  {z:'Antes de entrar', k:'portada', nm:'Portada · Presentado por', tipo:'co', d:'Arriba a la derecha en la pantalla de bienvenida. Rota si hay más de uno.'},
  {z:'Inicio', k:'barra', nm:'Barra del reto', tipo:'ex', d:'“Presenta” junto a la semana del reto, arriba de la tarjeta de Inicio.'},
  {z:'Inicio', k:'inicio', nm:'Aliados del reto', tipo:'co', d:'Tarjetas al final de Inicio con su promoción.'},
  {z:'Inicio', k:'semana', nm:'Semana cumplida', tipo:'sem', d:'Festejo al completar las sesiones de la semana, con su promoción. Una marca por semana.'},
  {z:'Inicio', k:'aviso', nm:'Aviso del mes', tipo:'ex', d:'Una tarjeta con su promoción en Inicio; el socio la puede ocultar y vuelve el mes siguiente.'},
  {z:'Inicio', k:'eval', nm:'Evaluaciones', tipo:'ex', d:'“Presentada por…” en el aviso de evaluación (semanas 0, 6 y 12).'},
  {z:'Entrenamiento', k:'descanso', nm:'Descanso entre series', tipo:'ex', d:'Una línea bajo el cronómetro: “Hidrátate · marca”. Nunca mientras registra series.'},
  {z:'Entrenamiento', k:'fin', nm:'Premio al terminar la sesión', tipo:'co', d:'Código del día al terminar una sesión que cuenta. Rota entre los activados.'},
  {z:'Nutrición', k:'hidratacion', nm:'Hidratación oficial', tipo:'ex', d:'Junto al agua del día: “Tu agua de hoy, con marca”.'},
  {z:'Nutrición', k:'suple', nm:'Suplementación oficial', tipo:'ex', d:'Debajo del resumen de Nutrición, con su promoción.'},
  {z:'Perfil', k:'mascota', nm:'Compañero patrocinado', tipo:'ex', d:'En la pantalla de la mascota: “Equipado por marca”.'},
  {z:'Perfil', k:'muro', nm:'Gracias a… (Perfil)', tipo:'co', d:'Muro con los logos y promociones al final del Perfil.'}
];
const PAT_EX=new Set(PAT_MAPA.filter(x=>x.tipo==='ex').map(x=>x.k));
// Los botones de "Dónde sale" del alta y de cada publicado ya recorren PAT_LUGARES: se agregan los lugares nuevos
PAT_MAPA.forEach(x=>{ if(x.tipo!=='sem' && !PAT_LUGARES[x.k]) PAT_LUGARES[x.k]=x.nm.replace(/ ·.*$/,'').replace(/ \(.*\)$/,''); });

function patUno(k){ return patEn(k)[0]||null; }
function patSemana(n){ const hoy=fechaISO(new Date()); return patTodos().find(p=>patVigente(p,hoy) && p.semanas && p.semanas[n])||null; }
function patMini(p,cls){ return `<span class="pat-mini ${cls||''}">${p.logo?`<img src="${esc(p.logo)}" alt="" decoding="async">`:`<i aria-hidden="true">${esc(String(p.nombre).trim().charAt(0).toUpperCase())}</i>`}</span>`; }

// ═════════════ Conteo de vistas y toques (en el expediente de cada socio) ═════════════
let patStatsT=0;
function patContable(){ const s=activeSocio; return s && s.code && !(typeof vistaSocioActiva==='function' && vistaSocioActiva()) ? s : null; }
function patVisto(id,lugar){
  const s=patContable(); if(!s||!id) return;
  const k='pv_'+s.code+'_'+fechaISO(new Date())+'_'+id+'_'+lugar;
  try{ if(localStorage.getItem(k)) return; localStorage.setItem(k,'1'); }catch(e){ return; }
  const st=s.patStats=Object.assign({},s.patStats), x=st[id]=Object.assign({v:0,t:0,l:{}},st[id]);
  x.v=(x.v||0)+1; x.l=Object.assign({},x.l); x.l[lugar]=(x.l[lugar]||0)+1;
  patStatsGuardar(s);
}
function patToque(id){
  const s=patContable(); if(!s||!id) return;
  const st=s.patStats=Object.assign({},s.patStats), x=st[id]=Object.assign({v:0,t:0,l:{}},st[id]);
  x.t=(x.t||0)+1; patStatsGuardar(s);
}
function patStatsGuardar(s){ clearTimeout(patStatsT); patStatsT=setTimeout(()=>{ try{ dbSave(s.code); }catch(e){} },4000); }
function patVistosEn(raiz,lugar){ (raiz?raiz.querySelectorAll('[data-pat]'):[]).forEach(el=>patVisto(el.dataset.pat,lugar)); }
// Suma de todos los expedientes (solo el director los ve todos)
function patResultados(){
  const R={};
  Object.values(DB.socios||{}).forEach(s=>{ const st=s&&s.patStats; if(!st) return;
    Object.entries(st).forEach(([id,x])=>{ const r=R[id]=R[id]||{v:0,t:0,per:0,l:{}}; r.v+=+x.v||0; r.t+=+x.t||0; if(+x.v>0) r.per++;
      Object.entries(x.l||{}).forEach(([k,n])=>{ r.l[k]=(r.l[k]||0)+(+n||0); }); }); });
  return R;
}

// Toques: abrir la promoción (banner) o el enlace
if(typeof patVer==='function'){
  const _pv=patVer;
  window.patVer=patVer=function(lugar,i){ try{ const p=patEn(lugar)[Math.max(0,i||0)]; if(p) patToque(p.id); }catch(e){} return _pv.apply(this,arguments); };
}
if(typeof patAbrir==='function'){
  const _pa=patAbrir;
  window.patAbrir=patAbrir=function(id){ patToque(id); return _pa.apply(this,arguments); };
}
// Vistas de los lugares que ya existían
if(typeof patInicioHTML==='function'){
  const _pi=patInicioHTML;
  window.patInicioHTML=patInicioHTML=function(){ const h=_pi.apply(this,arguments); if(h) setTimeout(()=>patEn('inicio').forEach(p=>patVisto(p.id,'inicio')),300); return h; };
}
if(typeof patFinHTML==='function'){
  const _pf=patFinHTML;
  window.patFinHTML=patFinHTML=function(s){ const h=_pf.apply(this,arguments); const m=h&&/aria-label="Premio de ([^"]+)"/.exec(h);
    if(m){ const p=patEn('fin').find(x=>esc(x.nombre)===m[1]); if(p) setTimeout(()=>patVisto(p.id,'fin'),300); } return h; };
}

// ═════════════ Lugares nuevos en la app del socio ═════════════
// Barra del reto: "Presenta" junto a la semana
if(typeof retoBarraHTML==='function'){
  const _rb=retoBarraHTML;
  window.retoBarraHTML=retoBarraHTML=function(cls){
    const h=_rb.apply(this,arguments), p=/ih-reto/.test(cls||'')?patUno('barra'):null;
    if(!h||!p) return h;
    setTimeout(()=>patVisto(p.id,'barra'),300);
    const line=`<button type="button" class="pat-barra" data-pat="${esc(p.id)}" onclick="patVer('barra',0)" aria-label="El reto lo presenta ${esc(p.nombre)}. Toca para ver su promoción.">${patMini(p)}<span>Presenta <b>${esc(p.nombre)}</b></span></button>`;
    return h.replace(/<\/(\w+)>\s*$/,line+'</$1>');
  };
}
// Evaluaciones: "Presentada por"
if(typeof evalCardSocio==='function'){
  const _ec=evalCardSocio;
  window.evalCardSocio=evalCardSocio=function(s){
    const h=_ec.apply(this,arguments), p=h?patUno('eval'):null; if(!p) return h;
    setTimeout(()=>patVisto(p.id,'eval'),300);
    return h.replace('<div class="ev-mini-m">',`<div class="pat-por">${patMini(p,'xs')}Presentada por <b>${esc(p.nombre)}</b></div><div class="ev-mini-m">`);
  };
}
// Descanso entre series: una línea bajo el cronómetro
if(typeof descansoIniciar==='function'){
  const _di=descansoIniciar;
  window.descansoIniciar=descansoIniciar=function(){
    const r=_di.apply(this,arguments);
    try{ const p=patUno('descanso'), box=document.querySelector('#en-desc .en-desc-in');
      if(p&&box&&!box.querySelector('.pat-desc')){ box.insertAdjacentHTML('beforeend',`<div class="pat-desc" data-pat="${esc(p.id)}">${ico('drop')}<span>Hidrátate · <b>${esc(p.nombre)}</b></span>${patMini(p,'xs')}</div>`); patVisto(p.id,'descanso'); } }catch(e){}
    return r;
  };
}
// Nutrición: hidratación y suplementación oficiales, debajo del resumen
if(typeof renderNutricionTab==='function'){
  const _rn=renderNutricionTab;
  window.renderNutricionTab=renderNutricionTab=function(){
    const r=_rn.apply(this,arguments);
    try{ const sec=document.getElementById('dsec-nutricion'), res=sec&&sec.querySelector('.nx-res'); if(!res) return r;
      const h=patUno('hidratacion'), su=patUno('suple'); let html='';
      if(h) html+=`<button type="button" class="pat-of" data-pat="${esc(h.id)}" onclick="patVer('hidratacion',0)">${patMini(h)}<span><small>Hidratación oficial del reto</small><b>Tu agua de hoy, con ${esc(h.nombre)}</b></span>${ico('chev')}</button>`;
      if(su) html+=`<button type="button" class="pat-of" data-pat="${esc(su.id)}" onclick="patVer('suple',0)">${patMini(su)}<span><small>Suplementación oficial del reto</small><b>${esc(su.promo||su.nombre)}</b></span>${ico('chev')}</button>`;
      if(html){ res.insertAdjacentHTML('afterend',`<div class="pat-ofs">${html}</div>`); if(h) patVisto(h.id,'hidratacion'); if(su) patVisto(su.id,'suple'); }
    }catch(e){ console.warn('pat nutrición',e); }
    return r;
  };
}
// Mascota: "Equipado por"
if(typeof mascotaAbrir==='function'){
  const _ma=mascotaAbrir;
  window.mascotaAbrir=mascotaAbrir=function(){
    const r=_ma.apply(this,arguments);
    try{ const p=patUno('mascota'), m=document.querySelector('#ms-w .ms-meta');
      if(p&&m){ m.insertAdjacentHTML('afterend',`<button type="button" class="pat-por pat-ms" data-pat="${esc(p.id)}" onclick="patVer('mascota',0)">${patMini(p,'xs')}Equipado por <b>${esc(p.nombre)}</b></button>`); patVisto(p.id,'mascota'); } }catch(e){}
    return r;
  };
}
// Perfil: muro "Este reto es posible gracias a"
if(typeof renderPerfilTab==='function'){
  const _rp=renderPerfilTab;
  window.renderPerfilTab=renderPerfilTab=function(){
    const r=_rp.apply(this,arguments);
    try{ const L=patEn('muro'), sec=document.getElementById('dsec-perfil'); if(!L.length||!sec) return r;
      const ancla=sec.querySelector('.pf-salir')||sec.querySelector('.pf-del');
      const html=`<section class="pat-muro" aria-label="Patrocinadores del reto"><h3>Este reto es posible gracias a</h3><div class="pat-muro-g">${L.map(p=>`<button type="button" data-pat="${esc(p.id)}" onclick="patVer('muro',${patEn('muro').indexOf(p)})">${patMini(p,'lg')}<b>${esc(p.nombre)}</b>${p.promo?`<small>${esc(p.promo)}</small>`:''}</button>`).join('')}</div></section>`;
      if(ancla) ancla.insertAdjacentHTML('beforebegin',html); else sec.insertAdjacentHTML('beforeend',html);
      L.forEach(p=>patVisto(p.id,'muro'));
    }catch(e){ console.warn('pat muro',e); }
    return r;
  };
}
// Inicio: aviso del mes y festejo de semana cumplida
function patAvisoKey(){ const s=activeSocio; return 'pat_av_'+(s&&s.code||'')+'_'+fechaISO(new Date()).slice(0,7); }
function patAvisoOcultar(){ try{ localStorage.setItem(patAvisoKey(),'1'); }catch(e){} document.getElementById('pat-aviso')?.remove(); }
function patAvisoPintar(){
  document.getElementById('pat-aviso')?.remove();
  const ini=document.getElementById('dsec-inicio'), box=ini&&(ini.querySelector('.ih-sem')||ini.querySelector('.ci-scene'));
  const p=patUno('aviso'); if(!box||!p||!activeSocio) return;
  try{ if(localStorage.getItem(patAvisoKey())) return; }catch(e){}
  box.insertAdjacentHTML('afterend',`<div class="pat-aviso" id="pat-aviso" data-pat="${esc(p.id)}">
    <button type="button" class="pat-aviso-b" onclick="patVer('aviso',0)">${patMini(p)}<span><small>Promoción del mes · ${esc(p.nombre)}</small><b>${esc(p.promo||p.nombre)}</b>${p.detalle?`<em>${esc(p.detalle)}</em>`:''}</span></button>
    <button type="button" class="pat-aviso-x" onclick="patAvisoOcultar()" aria-label="Ocultar hasta el próximo mes">${ico('x')}</button></div>`);
  patVisto(p.id,'aviso');
}
function patSemanaKey(n){ const s=activeSocio; return 'pat_sem_'+(s&&s.code||'')+'_'+n; }
function patSemanaRevisar(){
  const s=activeSocio, e=typeof retoEstado==='function'?retoEstado():null;
  if(!s||!e||e.estado!=='en curso'||typeof calcEvolucion!=='function') return;
  if(!document.getElementById('dsec-inicio')?.classList.contains('on')) return;
  const ev=calcEvolucion(s), meta=Math.max(1,s.dias||1); if(ev.estaSemana<meta) return;
  const p=patSemana(e.semana); if(!p) return;
  try{ if(localStorage.getItem(patSemanaKey(e.semana))) return; localStorage.setItem(patSemanaKey(e.semana),'1'); }catch(err){ return; }
  patVisto(p.id,'semana');
  let ov=document.getElementById('pat-sem'); if(ov) ov.remove();
  ov=document.createElement('div'); ov.id='pat-sem'; ov.className='av-ov pat-sem'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-labelledby','pat-sem-t');
  ov.innerHTML=`<div class="av-sheet pat-sem-in"><span class="av-grab" aria-hidden="true"></span>
    <span class="pat-sem-k">Semana ${e.semana} de ${e.semanas}</span>
    <h2 id="pat-sem-t">¡Semana cumplida!</h2>
    <p class="pat-sem-p">${ev.estaSemana} de ${meta} sesiones${ev.racha>1?` · ${ev.racha} semanas de racha`:''}.</p>
    ${patMini(p,'xl')}
    <p class="pat-sem-p">Tu festejo de esta semana es cortesía de <b>${esc(p.nombre)}</b></p>
    ${p.promo?`<p class="pat-sem-promo">${esc(p.promo)}</p>`:''}
    <div class="pat-cod pat-sem-cod"><b class="num">${patCodigo(s)}</b><span>Muestra esta pantalla<br>${p.detalle?esc(p.detalle):'Válido esta semana'}</span></div>
    ${patUrl(p)?`<button type="button" class="pat-cta" onclick="patAbrir('${esc(p.id)}')">${ico(patEsWa(p)?'chat':'arrow')}${patEsWa(p)?'Escribir':'Ver más'}</button>`:''}
    <button type="button" class="sd-pri pat-sem-ok" onclick="document.getElementById('pat-sem').remove()">Seguir</button></div>`;
  ov.addEventListener('click',ev2=>{ if(ev2.target===ov) ov.remove(); });
  document.body.appendChild(ov); requestAnimationFrame(()=>ov.classList.add('on'));
}
if(typeof refreshDash==='function'){
  const _rd=refreshDash;
  window.refreshDash=refreshDash=function(){
    const r=_rd.apply(this,arguments);
    try{ patAvisoPintar(); }catch(e){ console.warn('pat aviso',e); }
    try{ patVistosEn(document.querySelector('#dsec-inicio .ev-card'),'eval'); }catch(e){}
    setTimeout(()=>{ try{ patSemanaRevisar(); }catch(e){ console.warn('pat semana',e); } },900);
    return r;
  };
}

// ═════════════ Director: exclusivos únicos, mapa de lugares, edición y resultados ═════════════
// Guardar sin repintar (para quitar un exclusivo al que lo tenía)
function patGuardarSilencio(id,p){
  if(!DB.config) DB.config={}; if(!DB.config.patrocinadores) DB.config.patrocinadores={};
  DB.config.patrocinadores[id]=p; guardarLocal();
  fbEncolar('/config/patrocinadores/'+id,'set',p);
  fbEncolar('/patrocinadores/'+id,'set',p,{err:()=>{}});
}
// Al guardar uno, quita sus lugares exclusivos y sus semanas a los demás
if(typeof patGuardar==='function'){
  const _pg=patGuardar;
  window.patGuardar=patGuardar=function(id,p,msg){
    if(p){
      const ex=Object.keys(p.lugares||{}).filter(k=>p.lugares[k]&&PAT_EX.has(k)), sem=Object.keys(p.semanas||{}).filter(w=>p.semanas[w]);
      if(ex.length||sem.length) patTodos().forEach(o=>{ if(o.id===id) return; let cambio=false; const c=Object.assign({},o); delete c.id;
        c.lugares=Object.assign({},c.lugares); ex.forEach(k=>{ if(c.lugares[k]){ c.lugares[k]=false; cambio=true; } });
        if(c.semanas){ c.semanas=Object.assign({},c.semanas); sem.forEach(w=>{ if(c.semanas[w]){ delete c.semanas[w]; cambio=true; } }); }
        if(cambio) patGuardarSilencio(o.id,c); });
    }
    return _pg.apply(this,arguments);
  };
}
// Mapa: asignar un exclusivo (o nadie), activar/desactivar en un compartido, y rotar la marca de una semana
function patMapEx(k,id){
  const actual=patTodos().filter(p=>p.lugares&&p.lugares[k]);
  if(!id){ actual.forEach(p=>{ const c=patCopia(p.id); c.lugares=Object.assign({},c.lugares,{[k]:false}); patGuardar(p.id,c,'Lugar libre: ya no se muestra'); }); return; }
  const c=patCopia(id); if(!c) return; c.lugares=Object.assign({},c.lugares,{[k]:true}); patGuardar(id,c,'Listo: '+c.nombre+' en '+(PAT_MAPA.find(x=>x.k===k)||{}).nm);
}
function patMapSem(w){
  const act=patTodos().filter(p=>p.activo!==false).sort((a,b)=>String(a.creado||'').localeCompare(String(b.creado||'')));
  const cur=act.findIndex(p=>p.semanas&&p.semanas[w]), sig=act[cur+1]||null;
  if(cur>=0){ const c=patCopia(act[cur].id); c.semanas=Object.assign({},c.semanas); delete c.semanas[w]; if(!sig){ patGuardar(act[cur].id,c,'Semana '+w+' sin patrocinador'); return; } patGuardarSilencio(act[cur].id,c); }
  const n=sig||act[0]; if(!n) return; const c=patCopia(n.id); c.semanas=Object.assign({},c.semanas,{[w]:true}); patGuardar(n.id,c,'Semana '+w+': '+c.nombre);
}
function patMapaHTML(){
  const act=patTodos().filter(p=>p.activo!==false).sort((a,b)=>String(a.creado||'').localeCompare(String(b.creado||'')));
  let z='', h='';
  PAT_MAPA.forEach(L=>{
    if(L.z!==z){ z=L.z; h+=`<div class="pm-z">${esc(z)}</div>`; }
    let ctl='', con=false;
    if(L.tipo==='ex'){ const cur=act.find(p=>p.lugares&&p.lugares[L.k]); con=!!cur;
      ctl=`<select class="av-in pm-sel" aria-label="Patrocinador de ${esc(L.nm)}" onchange="patMapEx('${L.k}',this.value)"><option value="">Nadie · no se muestra</option>${act.map(p=>`<option value="${esc(p.id)}"${cur&&cur.id===p.id?' selected':''}>${esc(p.nombre)}</option>`).join('')}</select>`; }
    else if(L.tipo==='co'){ con=act.some(p=>p.lugares&&p.lugares[L.k]);
      ctl=`<div class="pm-co">${act.map(p=>{ const on=!!(p.lugares&&p.lugares[L.k]); return `<button type="button" class="tr-tab${on?' on':''}" aria-pressed="${on}" onclick="patLugar('${esc(p.id)}','${L.k}')">${esc(p.nombre)}</button>`; }).join('')||'<span class="tr-mu">Da de alta un patrocinador primero.</span>'}</div>`; }
    else { con=act.some(p=>p.semanas&&Object.values(p.semanas).some(Boolean));
      const sem=+((GYM.reto&&GYM.reto.semanas)||12);
      ctl=`<div class="pm-sem">${Array.from({length:sem},(_,i)=>{ const w=i+1, p=act.find(x=>x.semanas&&x.semanas[w]); return `<button type="button" class="${p?'on':''}" onclick="patMapSem(${w})" aria-label="Semana ${w}: ${p?esc(p.nombre):'sin patrocinador'}" title="${p?esc(p.nombre):'Sin patrocinador'}">${w}${p?`<small>${esc(String(p.nombre).slice(0,6))}</small>`:''}</button>`; }).join('')}</div>
        <p class="tr-mu pm-nota">Toca una semana para pasar al siguiente patrocinador; después del último queda vacía.</p>`; }
    h+=`<div class="pm-l${con?'':' vacio'}"><div class="pm-t"><b>${esc(L.nm)}</b><span class="pm-tipo">${L.tipo==='ex'?'Exclusivo':L.tipo==='co'?'Compartido':'Por semana'}</span><p>${esc(L.d)}</p></div>${ctl}</div>`;
  });
  return `<div class="tr-card pm-card"><h3 class="tr-h3">Dónde sale cada uno</h3>
    <p class="tr-mu">Los <b>exclusivos</b> son de un solo patrocinador; los <b>compartidos</b> muestran a todos los que actives. Un lugar sin patrocinador no se muestra. Los cambios se ven al momento en la app.</p>${h}</div>`;
}
function patResultadosHTML(){
  const R=patResultados(), L=patTodos(); if(!L.length) return '';
  const rows=L.map(p=>({p,r:R[p.id]||{v:0,t:0,per:0,l:{}}})).sort((a,b)=>b.r.v-a.r.v), mx=Math.max(1,...rows.map(x=>x.r.v));
  const nm=k=>(PAT_MAPA.find(x=>x.k===k)||{}).nm||k;
  return `<div class="tr-card pm-card"><h3 class="tr-h3">Resultados para el patrocinador</h3>
    <p class="tr-mu">Vistas: veces que un socio vio su marca (una por lugar al día). Personas: socios distintos que la vieron. Toques: veces que abrieron su promoción.</p>
    <div class="pm-res"><div class="pm-rr h"><span>Patrocinador</span><span>Vistas</span><span>Personas</span><span>Toques</span></div>
    ${rows.map(({p,r})=>{ const top=Object.entries(r.l).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,n])=>nm(k)+' '+n.toLocaleString('es-MX')).join(' · ');
      return `<div class="pm-rr"><span>${patMini(p,'xs')}<span><b>${esc(p.nombre)}</b><i class="pm-bar"><i style="width:${(r.v/mx*100).toFixed(1)}%"></i></i>${top?`<small>${esc(top)}</small>`:''}</span></span><b>${r.v.toLocaleString('es-MX')}</b><b>${r.per.toLocaleString('es-MX')}</b><b>${r.t.toLocaleString('es-MX')}</b></div>`; }).join('')}</div>
    <button type="button" class="tb-btn" onclick="patReporteCopiar()">${ico('file')}Copiar reporte</button></div>`;
}
function patReporteCopiar(){
  const R=patResultados(), nm=k=>(PAT_MAPA.find(x=>x.k===k)||{}).nm||k;
  const txt=['Reporte de patrocinio · '+((GYM.reto&&GYM.reto.nombre)||'Reto Fit CCA'),'']
    .concat(patTodos().map(p=>{ const r=R[p.id]||{v:0,t:0,per:0,l:{}}; return `${p.nombre}: ${r.v.toLocaleString('es-MX')} vistas de ${r.per.toLocaleString('es-MX')} socios, ${r.t.toLocaleString('es-MX')} toques a su promoción`+(Object.keys(r.l).length?'\n  '+Object.entries(r.l).sort((a,b)=>b[1]-a[1]).map(([k,n])=>nm(k)+': '+n.toLocaleString('es-MX')).join(' · '):''); })).join('\n');
  (navigator.clipboard?navigator.clipboard.writeText(txt):Promise.reject()).then(()=>showToast('Reporte copiado: pégalo en WhatsApp o en un correo'),()=>{ if(typeof uiAlerta==='function') uiAlerta(txt); else showToast('No se pudo copiar'); });
}
// Editar un publicado: llena el formulario de arriba y "Publicar" guarda los cambios
let patEditId=null;
function patEditar(id){
  const p=patCopia(id); if(!p) return;
  patEditId=id; patDraft={logo:p.logo||'', img:p.img||'', lugares:Object.assign({},p.lugares)};
  abrirPatrocinadores();
  const f=(k,v)=>{ const e=document.getElementById(k); if(e) e.value=v||''; };
  f('pat-nombre',p.nombre); f('pat-promo',p.promo); f('pat-detalle',p.detalle); f('pat-enlace',p.enlace); f('pat-desde',p.desde); f('pat-hasta',p.hasta);
  document.querySelector('.pat-form')?.scrollIntoView({behavior:'smooth',block:'start'});
}
if(typeof patPublicar==='function'){
  const _pp=patPublicar;
  window.patPublicar=patPublicar=function(){
    if(!patEditId) return _pp.apply(this,arguments);
    const v=id=>(document.getElementById(id)?.value||'').trim(), err=document.getElementById('pat-err');
    const nombre=v('pat-nombre'), enlace=v('pat-enlace'), desde=v('pat-desde'), hasta=v('pat-hasta');
    if(!nombre){ err.textContent='Escribe el nombre del patrocinador.'; return; }
    if(desde&&hasta&&hasta<desde){ err.textContent='La fecha final no puede ser antes de la inicial.'; return; }
    if(enlace&&!patUrl({enlace})){ err.textContent='Escribe un WhatsApp de 10 dígitos o una página (ej. www.ejemplo.mx).'; return; }
    const id=patEditId, p=Object.assign(patCopia(id)||{},{nombre,promo:v('pat-promo'),detalle:v('pat-detalle'),enlace,desde:desde||fechaISO(new Date()),hasta:hasta||'',logo:patDraft.logo||'',img:patDraft.img||'',lugares:Object.assign({},patDraft.lugares)});
    patEditId=null; patDraft={logo:'', img:'', lugares:{portada:true, inicio:true, fin:false}};
    patGuardar(id,p,'✓ Cambios guardados');
  };
}
function patEditarCancelar(){ patEditId=null; patDraft={logo:'', img:'', lugares:{portada:true, inicio:true, fin:false}}; abrirPatrocinadores(); }
// El panel: mapa arriba, resultados abajo, botón Editar en cada publicado; mientras se edita, el formulario lo indica
if(typeof abrirPatrocinadores==='function'){
  const _ap=abrirPatrocinadores;
  window.abrirPatrocinadores=abrirPatrocinadores=function(){
    const r=_ap.apply(this,arguments);
    try{
      const c=document.querySelector('#staff-content .tr-wrap'); if(!c) return r;
      const forma=c.querySelector('.pat-form'), lista=forma&&forma.nextElementSibling;
      if(forma) forma.insertAdjacentHTML('beforebegin',patMapaHTML());
      if(lista) lista.insertAdjacentHTML('afterend',patResultadosHTML());
      c.querySelectorAll('.pat-acc').forEach(acc=>{ const b=acc.querySelector('[onclick^="patPausar"]'); const id=b&&/patPausar\('([^']+)'\)/.exec(b.getAttribute('onclick')); if(id) acc.insertAdjacentHTML('afterbegin',`<button type="button" class="tb-btn" onclick="patEditar('${esc(id[1])}')">${ico('pencil')}Editar</button>`); });
      if(patEditId&&forma){ const p=patCopia(patEditId); const h=forma.querySelector('.tr-h3'); if(h) h.textContent='Editar · '+(p?p.nombre:''); const pub=forma.querySelector('.av-pub'); if(pub){ pub.innerHTML=ico('check')+'Guardar cambios'; pub.insertAdjacentHTML('afterend','<button type="button" class="tb-btn" onclick="patEditarCancelar()">Cancelar</button>'); } }
      // Un publicado sin ningún lugar ni semana: avisar que no se ve
      patTodos().forEach(p=>{ const algo=Object.values(p.lugares||{}).some(Boolean)||Object.values(p.semanas||{}).some(Boolean);
        if(!algo){ const row=[...c.querySelectorAll('.pat-row')].find(rw=>rw.querySelector('.av-row-t b')?.textContent===p.nombre); const t=row&&row.querySelector('.tr-tag'); if(t){ t.textContent='Sin lugar: no se ve'; t.className='tr-tag'; } } });
    }catch(e){ console.warn('pat mapa',e); }
    return r;
  };
}
// Al publicar uno nuevo ya no es obligatorio elegir lugar desde el alta (se puede acomodar en el mapa después)

// ═════════════ Inicio: los Aliados en un carrusel pequeño dentro de la tarjeta (entre la barra del reto y el título) ═════════════
// Antes eran tarjetas grandes al final de Inicio. Avanza solo (se detiene al tocarlo); con "reducir movimiento" queda quieto y se desliza a mano.
if(typeof patInicioHTML==='function'){ window.patInicioHTML=patInicioHTML=function(){ return ''; }; }
function patCarMini(){
  const sc=document.getElementById('ci-scene'); if(!sc) return;
  sc.querySelector('.pat-cm')?.remove(); sc.classList.remove('con-cm');
  const L=patEn('inicio'); if(!L.length) return;
  const item=(p,i,dup)=>`<button type="button" class="pat-cm-i" data-pat="${esc(p.id)}" onclick="patVer('inicio',${i})"${dup?' aria-hidden="true" tabindex="-1"':` aria-label="${esc(p.nombre)}${p.promo?': '+esc(p.promo):''}. Toca para ver la promoción."`}>${(p.logo||p.img)?`<img src="${esc(p.logo||p.img)}" alt="" decoding="async">`:`<i>${esc(String(p.nombre).trim().charAt(0).toUpperCase())}</i>`}</button>`;
  const mueve=L.length>3 && !(matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  const fila=L.map((p,i)=>item(p,i)).join('')+(mueve?L.map((p,i)=>item(p,i,true)).join(''):'');
  const bar=sc.querySelector('.ih-reto');
  sc.insertAdjacentHTML('beforeend',`<div class="pat-cm${mueve?' mueve':''}" aria-label="Aliados del reto"><span class="pat-cm-k">Aliados del reto</span><div class="pat-cm-v"><div class="pat-cm-f" style="--n:${L.length}">${fila}</div></div></div>`);
  const cm=sc.querySelector('.pat-cm');
  const ubicar=()=>{ const top=bar?bar.offsetTop+bar.offsetHeight+10:14; cm.style.top=top+'px'; sc.style.setProperty('--cm',(cm.offsetHeight+12)+'px'); };
  ubicar(); sc.classList.add('con-cm'); setTimeout(ubicar,400);
  if(mueve){ const f=cm.querySelector('.pat-cm-f'); ['pointerdown','touchstart'].forEach(ev=>cm.addEventListener(ev,()=>{ f.classList.add('pausa'); clearTimeout(cm._t); cm._t=setTimeout(()=>f.classList.remove('pausa'),6000); },{passive:true})); }
  L.forEach(p=>patVisto(p.id,'inicio'));
}
if(typeof refreshDash==='function'){
  const _rd2=refreshDash;
  window.refreshDash=refreshDash=function(){ const r=_rd2.apply(this,arguments); try{ patCarMini(); }catch(e){ console.warn('pat carrusel',e); } return r; };
}
