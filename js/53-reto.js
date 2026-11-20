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
    izq=`<div class="rb-t">${nom}</div><div class="rb-s">Arranca el ${esc(retoFechaTxt(e.inicio))} · ${e.faltan===1?'mañana':'faltan '+e.faltan+' días'}</div>`;
  } else if(e.estado==='terminado'){
    izq=`<div class="rb-t">${nom} terminado</div><div class="rb-s">Revisa tu evaluación final con tu entrenador.</div>`;
  } else {
    izq=`<div class="rb-t">Semana ${e.semana} de ${e.semanas}</div>
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
