/* ═══ Reto Fit CCA: mediciones oficiales (nutrición) y calificación de jueces ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global). Estilos en css/cine.css.
   · Firebase: /oficial/<socio> = { med:{ini,mid,fin}, jueces:{<staff>:{p,n,nm,ts}} }
     Solo el staff escribe (reglas en firebase-rules.json); el socio solo lee las suyas. Así nadie se mide solo.
   · Cada toma: datos de la hoja InBody (peso, agua, MME, masa grasa, % de grasa, grasa visceral, puntuación,
     ratio cintura-cadera), 4 pliegues (tríceps, subescapular, supraespinal, abdominal), perímetros y somatotipo.
   · Resultado (40 pts): lo que logró ÷ lo esperado para su perfil (sexo, edad, nivel, somatotipo).
       Aumento muscular  → kg de masa muscular esquelética ganados.
       Pérdida de grasa  → % de su masa grasa inicial que perdió.
       Definición / juvenil → promedio de los dos.
     40 pts = 150 % de lo esperado; 100 % de lo esperado ≈ 26.7 pts. La tabla de lo esperado la ajusta nutrición
     (Menú → Ubicación y reglas del reto → Resultado esperado).
   · Jueces (20 pts): cada juez califica de 0 a 20 (fotos, postura, técnica); cuenta el promedio. ═══ */

let OFI={};                 // /oficial ya cargado
let ofiRef=null, ofiClave='';
const OFI_TOMAS={ini:'Inicial', mid:'Intermedia', fin:'Final'};
const OFI_SOMATO={endo:'Endomorfo', meso:'Mesomorfo', ecto:'Ectomorfo', endomeso:'Endo-mesomorfo', ectomeso:'Ecto-mesomorfo'};
const OFI_CAMPOS=[
  ['InBody',[['peso','Peso','kg'],['act','Agua corporal total','L'],['mme','Masa muscular esquelética (MME)','kg'],['mg','Masa grasa','kg'],['pgc','% de grasa (PGC)','%'],['visc','Nivel de grasa visceral',''],['score','Puntuación InBody','/100'],['rcc','Ratio cintura-cadera','']]],
  ['Pliegues',[['tri','Tríceps','mm'],['sub','Subescapular','mm'],['supra','Supraespinal','mm'],['abd','Abdominal','mm']]],
  ['Perímetros',[['cint','Cintura','cm'],['cad','Cadera','cm'],['brazo','Brazo contraído','cm']]]
];

// Lo esperado en 12 semanas (lo ajusta nutrición). Músculo: kg de MME en hombre; grasa: % de su masa grasa inicial.
const OFI_ESP_DEF={
  musculo:{PRINCIPIANTE:2.0, INTERMEDIO:1.2, AVANZADO:0.6},
  grasa:{PRINCIPIANTE:18, INTERMEDIO:14, AVANZADO:10},
  mujerMusculo:0.6, mujerGrasa:0.9,
  edad40:0.85, edad60:0.65, juvenil:1.1,
  somMusculo:{endo:1.0, meso:1.25, ecto:0.7, endomeso:1.1, ectomeso:0.95},
  somGrasa:{endo:0.85, meso:1.0, ecto:1.2, endomeso:0.9, ectomeso:1.1}
};
function ofiEsp(){ const c=(DB.config&&DB.config.esperado)||{}; const d=JSON.parse(JSON.stringify(OFI_ESP_DEF)); Object.keys(c).forEach(k=>{ d[k]=typeof c[k]==='object'&&c[k]?Object.assign(d[k]||{},c[k]):c[k]; }); return d; }

// ── Cargar ──
function ofiEscuchar(){
  if(!fbListo || !fbDB) return;
  let clave='', ref=null;
  if(typeof fbEsStaff!=='undefined' && fbEsStaff && typeof staffRol!=='undefined' && (staffRol==='coordinador'||staffActivoEntId)){ clave='staff'; ref=fbDB.ref('/oficial'); }
  else if(typeof activeSocio!=='undefined' && activeSocio && activeSocio.code){ clave='s:'+activeSocio.code; ref=fbDB.ref('/oficial/'+activeSocio.code); }
  if(clave===ofiClave) return;
  if(ofiRef){ try{ ofiRef.off(); }catch(e){} }
  ofiClave=clave; ofiRef=ref; OFI={};
  if(!ref) return;
  ref.on('value', sn=>{
    const v=sn.val()||{};
    OFI = clave==='staff' ? v : {[activeSocio.code]:v};
    if(document.getElementById('ofi-ov')) ofiPintar();
    ofiFichaPintar();
  }, e=>{ console.warn('oficial',e&&e.code); ofiClave=''; });
}
function ofiDe(code){ return OFI[code]||{}; }
// Última medición InBody con masa libre de grasa (para el metabolismo basal: js/03-nutricion-motor.js)
function nutInbody(s){
  const m=(s&&OFI[s.code]&&OFI[s.code].med)||{}, t=m.fin||m.mid||m.ini; if(!t || !(+t.peso>0)) return null;
  const mg=+t.mg>0?+t.mg:(+t.pgc>0?+t.peso*+t.pgc/100:null); if(mg==null) return null;
  return {mlg:Math.round((+t.peso-mg)*10)/10, peso:+t.peso, fecha:t.fecha?fmtFecha(t.fecha):''};
}

// ── Resultado y jueces ──
function ofiNivel(s){ const n=String(s&&s.nivel||'').toUpperCase(); return /AVAN/.test(n)?'AVANZADO':/INTER/.test(n)?'INTERMEDIO':'PRINCIPIANTE'; }
function ofiEsperado(s, som){
  const E=ofiEsp(), niv=ofiNivel(s), mujer=typeof retoSexo==='function'&&retoSexo(s)==='f', edad=+s.edad||30;
  let fm=1, fg=1;
  if(mujer){ fm*=E.mujerMusculo; fg*=E.mujerGrasa; }
  if(edad>=60){ fm*=E.edad60; fg*=E.edad60; } else if(edad>=40){ fm*=E.edad40; fg*=E.edad40; }
  if(edad<18){ fm*=E.juvenil; }
  if(som){ fm*=(E.somMusculo[som]||1); fg*=(E.somGrasa[som]||1); }
  return {musculo:Math.round((E.musculo[niv]||1)*fm*100)/100, grasa:Math.round((E.grasa[niv]||10)*fg*10)/10, niv};
}
function ofiResultado(s){
  const o=ofiDe(s.code), m=o.med||{}, a=m.ini, b=m.fin||m.mid;
  if(!a || !b) return null;
  const som=(m.ini&&m.ini.somato)||(m.mid&&m.mid.somato)||(m.fin&&m.fin.somato)||'';
  const esp=ofiEsperado(s, som);
  const mg=x=>+x.mg>0?+x.mg:(+x.peso>0&&+x.pgc>0?+x.peso*+x.pgc/100:null);
  const dM=(+b.mme>0&&+a.mme>0)?Math.round((+b.mme-+a.mme)*10)/10:null;
  const g0=mg(a), g1=mg(b);
  const dG=(g0&&g1)?Math.round((g0-g1)/g0*1000)/10:null;   // % de su grasa inicial que perdió
  const rM=dM!=null?Math.max(0,dM)/Math.max(0.1,esp.musculo):null;
  const rG=dG!=null?Math.max(0,dG)/Math.max(0.5,esp.grasa):null;
  const juv=typeof retoEsJuvenil==='function'&&retoEsJuvenil(s);
  let ratio=null;
  if(s.objetivo==='GANAR MÚSCULO' && !juv) ratio=rM;
  else if(s.objetivo==='PERDER PESO' && !juv) ratio=rG;
  else ratio=(rM!=null&&rG!=null)?(rM+rG)/2:(rM!=null?rM:rG);
  if(ratio==null) return null;
  const pct=Math.round(Math.min(1.5,ratio)*1000)/10;
  return {dM, dG, esp, som, pct, pts:Math.round(Math.min(1.5,ratio)/1.5*40*10)/10, final:!!m.fin};
}
function ofiJueces(s){
  const j=ofiDe(s.code).jueces||{}, l=Object.values(j).filter(x=>x&&x.p!=null);
  if(!l.length) return null;
  return {n:l.length, pts:Math.round(l.reduce((a,x)=>a+Math.max(0,Math.min(20,+x.p)),0)/l.length*10)/10, lista:l};
}
function ofiPts(s){ const r=ofiResultado(s), j=ofiJueces(s); return {res:r?r.pts:0, jue:j?j.pts:0, r, j}; }

// ═════════════ Hoja para el staff ═════════════
let ofiCode=null, ofiToma='ini';
function ofiAbrir(code){
  ofiCode=code;
  const m=ofiDe(code).med||{}; ofiToma=m.fin?'fin':m.mid?'fin':m.ini?'mid':'ini';
  let ov=document.getElementById('ofi-ov'); if(ov) ov.remove();
  ov=document.createElement('div'); ov.id='ofi-ov'; ov.className='chat-ov'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-label','Mediciones oficiales');
  ov.innerHTML=`<div class="chat-hoja ofi-hoja"><div id="ofi-body"></div></div>`;
  ov.addEventListener('click',e=>{ if(e.target===ov) ofiCerrar(); });
  document.body.appendChild(ov); requestAnimationFrame(()=>ov.classList.add('on'));
  ofiPintar();
}
function ofiCerrar(){ const ov=document.getElementById('ofi-ov'); if(ov) ov.remove(); }
function ofiNum(v){ return v==null||v===''?'':String(v); }
function ofiPintar(){
  const b=document.getElementById('ofi-body'); if(!b) return;
  const s=getSocio(ofiCode)||(typeof idxLite==='function'?idxLite(ofiCode):null); if(!s){ ofiCerrar(); return; }
  const o=ofiDe(ofiCode), m=o.med||{}, t=m[ofiToma]||{}, P=ofiPts(s), yo=fbUid||'staff', mio=(o.jueces||{})[yo]||{};
  const cat=typeof retoCategoria==='function'?retoCategoriaNombre(retoCategoria(s)):'';
  const somIni=(m.ini&&m.ini.somato)||'';
  const esp=ofiEsperado(s, somIni);
  b.innerHTML=`
    <div class="chat-h"><span class="ent-av chat-hav">${esc(typeof entIniciales==='function'?entIniciales(s.nombre):'')}</span>
      <div class="chat-ht"><b>${esc(tc(s.nombre))}</b><small>${esc(cat)} · ${esc((TR_OBJ_CORTO&&TR_OBJ_CORTO[s.objetivo])||sc(s.objetivo))} · ${esc(sc(ofiNivel(s)))}</small></div>
      <button type="button" class="chat-x" onclick="ofiCerrar()" aria-label="Cerrar">${ico('x')}</button></div>
    <div class="ofi-sc">
      <div class="ofi-tomas" role="tablist">${Object.entries(OFI_TOMAS).map(([k,nm])=>`<button type="button" role="tab" aria-selected="${k===ofiToma}" onclick="ofiToma='${k}';ofiPintar()">${nm}${m[k]?' ✓':''}<small>${m[k]&&m[k].fecha?esc(fmtFecha(m[k].fecha)):'pendiente'}</small></button>`).join('')}</div>
      <form class="ofi-f" novalidate onsubmit="event.preventDefault();ofiGuardar()">
        ${OFI_CAMPOS.map(([g,cs])=>`<fieldset><legend>${g}${g==='Pliegues'?' <small>suma: <b id="ofi-suma">'+(['tri','sub','supra','abd'].reduce((a,k)=>a+(+t[k]||0),0)||'—')+'</b> mm</small>':''}</legend>
          <div class="ofi-g">${cs.map(([k,nm,u])=>`<label><span>${nm}</span><div><input type="number" inputmode="decimal" step="any" min="0" name="${k}" value="${esc(ofiNum(t[k]))}" ${g==='Pliegues'?'oninput="ofiSuma()"':''}>${u?`<em>${u}</em>`:''}</div></label>`).join('')}</div></fieldset>`).join('')}
        <fieldset><legend>Somatotipo</legend>
          <select class="ti" name="somato"><option value="">Sin definir</option>${Object.entries(OFI_SOMATO).map(([k,nm])=>`<option value="${k}"${(t.somato||(ofiToma!=='ini'?somIni:''))===k?' selected':''}>${nm}</option>`).join('')}</select>
          <p class="ofi-mu">Con él se ajusta lo esperado: a un ectomorfo se le espera ganar menos músculo y a un mesomorfo más.</p></fieldset>
        <label class="ofi-nota"><span>Notas</span><textarea name="nota" rows="2" maxlength="300">${esc(t.nota||'')}</textarea></label>
        <button type="submit" class="sd-pri ofi-save">Guardar medición ${OFI_TOMAS[ofiToma].toLowerCase()}</button>
        ${t.por?`<p class="ofi-mu">Última captura: ${esc(t.porNm||'staff')} · ${esc(fmtFecha(t.fecha||''))}</p>`:''}
      </form>

      <section class="ofi-res">
        <h3>Resultado (40 pts)</h3>
        <p class="ofi-mu">Esperado en 12 semanas para su perfil${somIni?' ('+esc(OFI_SOMATO[somIni])+')':''}: <b>+${esp.musculo} kg</b> de masa muscular y <b>−${esp.grasa} %</b> de su masa grasa.</p>
        ${P.r?`<div class="ofi-kpis"><div><b>${P.r.dM!=null?(P.r.dM>0?'+':'')+P.r.dM+' kg':'—'}</b><small>masa muscular</small></div><div><b>${P.r.dG!=null?(P.r.dG>0?'−':'+')+Math.abs(P.r.dG)+' %':'—'}</b><small>de su grasa</small></div><div><b>${P.r.pct} %</b><small>de lo esperado</small></div><div class="on"><b>${P.r.pts}</b><small>de 40${P.r.final?'':' · provisional'}</small></div></div>`
          :'<p class="ofi-mu">Se calcula cuando tenga la medición inicial y la intermedia o la final.</p>'}
      </section>

      <section class="ofi-res">
        <h3>Jueces (20 pts)</h3>
        <p class="ofi-mu">Cada juez califica de 0 a 20: cambio en fotos, postura, técnica y compromiso. Cuenta el promedio${P.j?` (${P.j.n} juez${P.j.n===1?'':'es'}: <b>${P.j.pts}</b>)`:''}.</p>
        <div class="ofi-juez"><input type="number" id="ofi-jp" min="0" max="20" step="0.5" inputmode="decimal" value="${esc(ofiNum(mio.p))}" placeholder="0 a 20" aria-label="Tu calificación de 0 a 20">
          <input type="text" id="ofi-jn" maxlength="140" value="${esc(mio.n||'')}" placeholder="Comentario (opcional)" aria-label="Comentario">
          <button type="button" class="sd-pri" onclick="ofiJuezGuardar()">Calificar</button></div>
        ${P.j?`<ul class="ofi-jl">${P.j.lista.map(x=>`<li><b>${esc(x.nm||'Juez')}</b> ${esc(String(x.p))}/20${x.n?' · '+esc(x.n):''}</li>`).join('')}</ul>`:''}
      </section>
    </div>`;
}
function ofiSuma(){ const f=document.querySelector('.ofi-f'); if(!f) return; const v=['tri','sub','supra','abd'].reduce((a,k)=>a+(+f.elements[k].value||0),0); const el=document.getElementById('ofi-suma'); if(el) el.textContent=v?Math.round(v*10)/10:'—'; }
function ofiStaffNombre(){ const e=staffActivoEntId&&getEntrenador(staffActivoEntId); return (e&&e.nombre)||(staffRol==='coordinador'?'Director':'Staff'); }
function ofiGuardar(){
  const f=document.querySelector('.ofi-f'); if(!f||!ofiCode) return;
  const t={};
  OFI_CAMPOS.forEach(([,cs])=>cs.forEach(([k])=>{ const v=parseFloat(String(f.elements[k].value).replace(',','.')); if(v>=0 && isFinite(v)) t[k]=Math.round(v*100)/100; }));
  if(!t.mg && t.peso && t.pgc) t.mg=Math.round(t.peso*t.pgc)/100;
  const som=f.elements.somato.value; if(som) t.somato=som;
  const nota=String(f.elements.nota.value||'').trim().slice(0,300); if(nota) t.nota=nota;
  if(!(t.peso>0)){ showToast('Escribe al menos el peso'); return; }
  if(t.pgc && (t.pgc<3||t.pgc>70)){ showToast('El % de grasa no parece correcto'); return; }
  if(t.mme && t.peso && t.mme>t.peso*0.7){ showToast('La masa muscular no puede ser casi todo el peso: revisa el dato'); return; }
  t.fecha=fechaISO(new Date()); t.por=fbUid||''; t.porNm=ofiStaffNombre(); t.ts=Date.now();
  const o=OFI[ofiCode]=OFI[ofiCode]||{}; o.med=o.med||{}; o.med[ofiToma]=t;
  fbEncolar('/oficial/'+ofiCode+'/med/'+ofiToma,'set',t);
  showToast('✓ Medición '+OFI_TOMAS[ofiToma].toLowerCase()+' guardada');
  if(ofiToma==='ini') ofiToma='mid';
  ofiPintar(); ofiFichaPintar();
}
function ofiJuezGuardar(){
  const p=parseFloat(String(document.getElementById('ofi-jp').value).replace(',','.'));
  if(!(p>=0 && p<=20)){ showToast('La calificación va de 0 a 20'); return; }
  const n=String(document.getElementById('ofi-jn').value||'').trim().slice(0,140);
  const yo=fbUid||'staff', x={p:Math.round(p*2)/2, nm:ofiStaffNombre(), ts:Date.now()}; if(n) x.n=n;
  const o=OFI[ofiCode]=OFI[ofiCode]||{}; o.jueces=o.jueces||{}; o.jueces[yo]=x;
  fbEncolar('/oficial/'+ofiCode+'/jueces/'+yo,'set',x);
  showToast('✓ Calificación guardada'); ofiPintar();
}

// ═════════════ Director: tabla de lo esperado ═════════════
function ofiEsperadoAbrir(){
  if(staffRol!=='coordinador'){ showToast('Solo el director ajusta la tabla'); return; }
  const E=ofiEsp();
  let m=document.getElementById('modal-esperado'); if(!m){ m=document.createElement('div'); m.className='modal'; m.id='modal-esperado'; m.onclick=e=>{ if(e.target===m) m.classList.remove('open'); }; document.body.appendChild(m); }
  const n=(k,v,st)=>`<input type="number" step="${st||0.05}" min="0" data-k="${k}" value="${v}">`;
  m.innerHTML=`<div class="mbox rg-box" role="dialog" aria-modal="true">
    <div class="rg-h"><h2>Resultado esperado en 12 semanas</h2><button type="button" class="av3d-cerrar" onclick="document.getElementById('modal-esperado').classList.remove('open')" aria-label="Cerrar">✕</button></div>
    <p class="rg-p">Lo llena nutrición. Cada socio se compara contra lo esperado para su perfil, no contra los demás: 100 % de lo esperado ≈ 27 de 40 puntos; 150 % o más = 40.</p>
    <table class="ofi-tb"><tr><th></th><th>Músculo<br><small>kg de MME (hombre)</small></th><th>Grasa<br><small>% de su masa grasa</small></th></tr>
      ${['PRINCIPIANTE','INTERMEDIO','AVANZADO'].map(k=>`<tr><td>${sc(k)}</td><td>${n('musculo.'+k,E.musculo[k],0.1)}</td><td>${n('grasa.'+k,E.grasa[k],0.5)}</td></tr>`).join('')}</table>
    <h3 class="ofi-h3">Ajustes (multiplican lo de arriba)</h3>
    <table class="ofi-tb"><tr><th></th><th>Músculo</th><th>Grasa</th></tr>
      <tr><td>Mujer</td><td>${n('mujerMusculo',E.mujerMusculo)}</td><td>${n('mujerGrasa',E.mujerGrasa)}</td></tr>
      ${Object.entries(OFI_SOMATO).map(([k,nm])=>`<tr><td>${nm}</td><td>${n('somMusculo.'+k,E.somMusculo[k])}</td><td>${n('somGrasa.'+k,E.somGrasa[k])}</td></tr>`).join('')}
      <tr><td>40 a 59 años</td><td colspan="2">${n('edad40',E.edad40)}</td></tr>
      <tr><td>60 años o más</td><td colspan="2">${n('edad60',E.edad60)}</td></tr>
      <tr><td>Juvenil (músculo)</td><td colspan="2">${n('juvenil',E.juvenil)}</td></tr></table>
    <div style="display:flex;gap:8px;margin-top:14px"><button type="button" class="sd-b" style="flex:1" onclick="ofiEsperadoReset()">Valores sugeridos</button><button type="button" class="sd-pri" style="flex:1" onclick="ofiEsperadoGuardar()">Guardar</button></div>
  </div>`;
  m.classList.add('open');
}
function ofiEsperadoGuardar(){
  const E={};
  document.querySelectorAll('#modal-esperado input[data-k]').forEach(i=>{ const v=parseFloat(i.value); if(!(v>=0)) return; const [a,b]=i.dataset.k.split('.'); if(b){ E[a]=E[a]||{}; E[a][b]=v; } else E[a]=v; });
  DB.config=DB.config||{}; DB.config.esperado=E; guardarLocal(); fbEncolar('/config/esperado','set',E);
  document.getElementById('modal-esperado').classList.remove('open'); showToast('✓ Tabla guardada');
}
function ofiEsperadoReset(){ if(DB.config) delete DB.config.esperado; guardarLocal(); fbEncolar('/config/esperado','remove',null); ofiEsperadoAbrir(); showToast('Valores sugeridos de vuelta'); }

// ═════════════ Socio: sus mediciones (solo lectura) ═════════════
function ofiSocioHTML(s){
  const m=(ofiDe(s.code).med)||{}; if(!m.ini) return '';
  const fila=(k)=>{ const t=m[k]; if(!t) return `<div class="ofi-sm-r off"><b>${OFI_TOMAS[k]}</b><span>Pendiente</span></div>`;
    return `<div class="ofi-sm-r"><b>${OFI_TOMAS[k]}</b><span>${esc(fmtFecha(t.fecha))}</span><span>${t.peso?t.peso+' kg':''}${t.pgc?' · '+t.pgc+' % grasa':''}${t.mme?' · '+t.mme+' kg músculo':''}</span></div>`; };
  return `<section class="ofi-sm"><h3>Mis mediciones oficiales</h3><p>Las toma el equipo de nutrición con InBody. Con ellas se calcula tu resultado en el reto.</p>${Object.keys(OFI_TOMAS).map(fila).join('')}</section>`;
}

// ═════════════ Ficha del socio (staff y director): resumen de sus mediciones oficiales ═════════════
// Tabla Inicial / Intermedia / Final con el cambio, arriba del Resumen. Se repinta sola cuando llega /oficial.
const OFI_FICHA=[['peso','Peso','kg',0],['mme','Masa muscular','kg',1],['mg','Masa grasa','kg',-1],['pgc','% de grasa','%',-1],['visc','Grasa visceral','',-1],['cint','Cintura','cm',-1],['cad','Cadera','cm',-1],['brazo','Brazo','cm',1]];
function ofiFichaHTML(s){
  const m=(ofiDe(s.code).med)||{}, ks=Object.keys(OFI_TOMAS), n=ks.filter(k=>m[k]).length;
  const btn=`<button type="button" class="sd-b ofi-fx-b" onclick="ofiAbrir('${esc(s.code)}')">${n?'Ver o capturar':'Capturar la inicial'}</button>`;
  if(!n) return `<section class="fx-sec ofi-fx"><h3>Mediciones oficiales <small>0 de 3</small></h3><div class="fx-panel"><p class="ofi-mu">Todavía no tiene la medición inicial con InBody. Con ella se calcula su resultado en el reto (40 pts).</p>${btn}</div></section>`;
  const ult=m.fin||m.mid, P=ofiPts(s);
  const filas=OFI_FICHA.filter(([k])=>ks.some(t=>m[t]&&m[t][k]!=null)).map(([k,nm,u,bueno])=>{
    const a=m.ini&&m.ini[k], b=ult&&ult[k];
    let d='—', cls='';
    if(a!=null && b!=null){ const x=Math.round((b-a)*10)/10; d=(x>0?'+':'')+x+(u?' '+u:''); if(x&&bueno) cls=(x*bueno>0)?'ok':'bad'; }
    return `<tr><th>${nm}</th>${ks.map(t=>`<td>${m[t]&&m[t][k]!=null?esc(String(m[t][k]))+(u?' <small>'+u+'</small>':''):'—'}</td>`).join('')}<td class="${cls}">${d}</td></tr>`;
  }).join('');
  return `<section class="fx-sec ofi-fx"><h3>Mediciones oficiales <small>${n} de 3${P.r?' · resultado '+P.r.pts+'/40':''}</small></h3><div class="fx-panel">
    <div class="tr-scroll"><table class="ofi-fx-t"><tr><th></th>${ks.map(t=>`<th>${OFI_TOMAS[t]}<small>${m[t]&&m[t].fecha?esc(fmtFecha(m[t].fecha)):'pendiente'}</small></th>`).join('')}<th>Cambio</th></tr>${filas}</table></div>
    ${btn}</div></section>`;
}
function ofiFichaPintar(s){
  const pane=document.getElementById('sdp-evolucion'); if(!pane) return;
  s=s||(typeof staffActivoId!=='undefined'&&staffActivoId&&(getSocio(staffActivoId)||(typeof idxLite==='function'?idxLite(staffActivoId):null))); if(!s) return;
  const h=ofiFichaHTML(s), ya=pane.querySelector('.ofi-fx');
  if(ya) ya.outerHTML=h; else pane.insertAdjacentHTML('afterbegin',h);
}

// ═════════════ Enganches ═════════════
(function(){
  const env=(fn,f)=>{ if(typeof window[fn]!=='function') return; const o=window[fn]; window[fn]=function(){ const r=o.apply(this,arguments); try{ f.apply(this,arguments); }catch(e){ console.warn('oficial',fn,e); } return r; }; };
  env('staffRenderList',()=>ofiEscuchar());
  env('refreshDash',()=>ofiEscuchar());
  env('staffRenderContent',s=>{
    const head=document.querySelector('#staff-content .fx-head'); if(!head||!s||head.querySelector('.fx-ofi')) return;
    const m=(ofiDe(s.code).med)||{}, n=Object.keys(m).length;
    head.insertAdjacentHTML('beforeend',`<button type="button" class="fx-chat fx-ofi" onclick="ofiAbrir('${esc(s.code)}')">${ico('clipboard')}<span>Mediciones oficiales</span><i class="ofi-n">${n}/3</i></button>`);
    ofiFichaPintar(s);
  });
  env('renderPerfilTab',()=>{
    const s=activeSocio, sec=document.getElementById('dsec-perfil'); if(!s||!sec||sec.querySelector('.ofi-sm')) return;
    const h=ofiSocioHTML(s); if(!h) return;
    const pfl=sec.querySelector('.pfl'); if(pfl) pfl.insertAdjacentHTML('afterend',h);
  });
  env('retoReglasAbrir',()=>{
    const box=document.querySelector('#modal-reglas .rg-box'); if(!box || box.querySelector('.rg-esp')) return;
    box.insertAdjacentHTML('beforeend',`<section class="rg-sec rg-esp"><h3>📏 Resultado esperado (nutrición)</h3><p class="rg-p">Cuánto se espera que gane de músculo o pierda de grasa cada perfil en 12 semanas. Con esto el resultado es justo entre principiantes y avanzados, hombres y mujeres, y somatotipos.</p><button type="button" class="sd-b rg-btn" onclick="ofiEsperadoAbrir()">Ajustar la tabla</button></section>`);
  });
})();
// El puntaje del reto en el tablero toma el resultado y los jueces de aquí
if(typeof trPuntajeReto==='function'){
  window.trPuntajeReto=trPuntajeReto=function(r){ const p=ofiPts(r.s); r.resPts=p.res; r.juecesPts=p.jue; return Math.round(((r.constPts||0)+p.res+p.jue)*10)/10; };
}
