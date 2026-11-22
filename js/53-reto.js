/* ═══ Reto Fit CCA: fechas del reto y link de invitación del entrenador ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global).
   · retoEstado(): día, semana y fase del reto según GYM.reto (js/config.js).
   · Muestra el avance del reto en la portada, en el inicio del socio y en el panel del staff.
   · Link con código: si la app se abre como ...?ent=ENT-XXXX (link que manda el entrenador desde "Mi código"),
     el código se escribe y se valida solo en el último paso del registro (js/27-seleccion-entrenador.js). ═══ */

const RETO_LS_ENT='retofit_ent_link';

function retoFechaLocal(iso){ const [y,m,d]=String(iso||'').split('-').map(Number); return (y&&m&&d)?new Date(y,m-1,d):null; }

function retoEstado(hoy){
  const R=GYM.reto; if(!R) return null;
  const ini=retoFechaLocal(R.inicio); if(!ini) return null;
  const semanas=R.semanas||12, totalDias=semanas*7;
  const h=hoy?new Date(hoy):new Date(); h.setHours(0,0,0,0);
  const dif=Math.round((h-ini)/86400000);
  if(dif<0) return {estado:'antes', faltan:-dif, semanas, totalDias, inicio:ini};
  if(dif>=totalDias) return {estado:'terminado', semanas, totalDias, inicio:ini};
  const dia=dif+1, semana=Math.floor(dif/7)+1;
  const fase=(R.fases||[]).find(f=>semana>=f.desde && semana<=f.hasta)||null;
  const evalSem=(R.evaluaciones||[]).find(e=>e===semana || (e===0 && semana===1))!==undefined;
  return {estado:'en curso', dia, semana, semanas, totalDias, fase, evalSem, pct:Math.round(dia/totalDias*100), inicio:ini};
}

function retoFechaTxt(d){
  try{ return d.toLocaleDateString('es-MX',{day:'numeric',month:'long'}); }catch(e){ return d.toISOString().slice(0,10); }
}

// Texto corto: "Día 33 de 84 · Semana 5" / "Arranca en 12 días" / "Reto terminado"
function retoTextoCorto(){
  const e=retoEstado(); if(!e) return '';
  if(e.estado==='antes') return e.faltan===1?'El reto arranca mañana':'El reto arranca en '+e.faltan+' días';
  if(e.estado==='terminado') return 'Reto terminado';
  return 'Día '+e.dia+' de '+e.totalDias+' · Semana '+e.semana+' de '+e.semanas;
}

function retoBannerHTML(){
  const e=retoEstado(); if(!e) return '';
  const nom=esc(GYM.reto.nombre||GYM.nombre);
  const pts=(typeof socioPuntosBannerHTML==='function' && typeof activeSocio!=='undefined' && activeSocio)?socioPuntosBannerHTML():'';
  let izq;
  if(e.estado==='antes'){
    let dia=''; try{ dia=e.inicio.toLocaleDateString('es-MX',{weekday:'long'}); dia=dia.charAt(0).toUpperCase()+dia.slice(1)+' '; }catch(_){}
    izq=`<div class="rb-k">${nom} arranca en</div><div class="rb-big">${e.faltan}<span>${e.faltan===1?'día':'días'}</span></div><div class="rb-s">${esc(dia)}${esc(retoFechaTxt(e.inicio))} · ${e.semanas} semanas</div>`;
  } else if(e.estado==='terminado'){
    izq=`<div class="rb-t">${nom} terminado</div><div class="rb-s">Revisa tu evaluación final con tu entrenador.</div>`;
  } else {
    izq=`<div class="rb-k">${nom} · día ${e.dia} de ${e.totalDias}</div><div class="rb-big">Semana ${e.semana}<span>de ${e.semanas}</span></div>
    <div class="rb-bar"><i style="width:${e.pct}%"></i></div>
    <div class="rb-s">Día ${e.dia}/${e.totalDias}${e.fase?' · '+esc(e.fase.nombre):''}${e.evalSem?' · semana de evaluación':''}</div>`;
  }
  const masc=(typeof mascotaMiniHTML==='function' && typeof activeSocio!=='undefined' && activeSocio)?mascotaMiniHTML(activeSocio):'';
  return `<div class="reto-banner${pts||masc?' con-pts':''}">${masc}<div class="rb-izq">${izq}</div>${pts}</div>`;
}

function retoPintar(){
  const txt=retoTextoCorto();
  const f=document.getElementById('inicio-fecha'); if(f && txt) f.textContent=txt;
  const b=document.getElementById('reto-banner-socio'); if(b){ b.innerHTML=retoBannerHTML(); if(typeof socioPuntosAnimar==='function') socioPuntosAnimar(); }
  const c=document.getElementById('reto-chip-staff'); if(c){ c.textContent=txt; c.style.display=txt?'':'none'; }
}

// ── Link de invitación con código del entrenador ──
function retoLeerLinkEnt(){
  try{
    const p=new URLSearchParams(location.search);
    const c=p.get('ent');
    if(c){
      sessionStorage.setItem(RETO_LS_ENT, c.toUpperCase().trim());
      // Quita el parámetro de la barra para que un recargo no lo vuelva a procesar
      p.delete('ent'); const q=p.toString();
      history.replaceState(null,'',location.pathname+(q?'?'+q:'')+location.hash);
    }
  }catch(e){}
}
function retoCodigoLink(){ try{ return sessionStorage.getItem(RETO_LS_ENT)||''; }catch(e){ return ''; } }

// Al llegar al último paso del registro, si vino con link, deja el código escrito y lo valida
if(typeof renderTrainerPicker==='function'){
  const _rtpOrig=renderTrainerPicker;
  let _rtpAplicado=false;
  renderTrainerPicker=function(){
    const cod=retoCodigoLink();
    if(cod && !_rtpAplicado && !qtModo){
      _rtpAplicado=true;
      qtModo='con';
      const inp=document.getElementById('qt-codigo'); if(inp) inp.value=cod;
      _rtpOrig();
      if(typeof qtValidarCodigo==='function') qtValidarCodigo();
      return;
    }
    return _rtpOrig();
  };
}

retoLeerLinkEnt();
document.addEventListener('DOMContentLoaded', ()=>{ retoPintar(); });
// Cambia de día si la app queda abierta (revisa cada hora)
setInterval(retoPintar, 3600*1000);

// Barra del reto: una rayita por semana (hechas, la actual en naranja y las de evaluación con borde)
function retoBarraHTML(cls){
  const e=retoEstado(); if(!e) return '';
  const n=e.semanas||12, ev=(GYM.reto.evaluaciones||[]).filter(x=>x>0);
  let izq, der;
  if(e.estado==='antes'){
    izq=e.faltan===1?'El reto arranca mañana':`Arranca en ${e.faltan} días`;
    der=retoFechaTxt(e.inicio)+' · '+n+' semanas';
  } else if(e.estado==='terminado'){ izq='Reto terminado'; der=n+' semanas cumplidas'; }
  else {
    izq=`Semana ${e.semana} de ${n}`;
    const prox=ev.find(x=>x>=e.semana);
    der=prox===e.semana?'Evaluación esta semana':prox===e.semana+1?'Evaluación la próxima semana':(e.fase?e.fase.nombre||e.fase.nm||'':'');
  }
  const sem=e.estado==='en curso'?e.semana:e.estado==='terminado'?n+1:0;
  const rayas=Array.from({length:n},(_,i)=>{ const w=i+1; return `<i class="${w<sem?'ok':w===sem?'now':''}${ev.includes(w)?' ev':''}"></i>`; }).join('');
  return `<div class="rb12 ${cls||''}" aria-label="${esc(izq)}. ${esc(der)}"><div class="rb12-l"><b>${esc(izq)}</b><span>${esc(der)}</span></div><div class="rb12-w" style="grid-template-columns:repeat(${n},1fr)" aria-hidden="true">${rayas}</div></div>`;
}
