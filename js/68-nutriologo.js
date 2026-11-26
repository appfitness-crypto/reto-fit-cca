/* ═══ Reto Fit CCA: perfil de nutriólogo y "Registrar medidas" escaneando la hoja InBody ═══
   Módulo cargado por index.html en orden (script clásico: comparte el ámbito global). Estilos en css/cine.css.
   · Nutriólogo = staff con la función Nutrición (alta en Nuevo entrenador o nutriólogo). El director lo marca en
     /nutris/<uid> (lo hace la app sola al guardar su perfil) y con eso ve y mide a TODOS los socios.
     Si también da entrenamiento, conserva lo de entrenador.
   · Registrar medidas: foto de la hoja InBody → se lee en el celular (Tesseract, en vendor/tesseract; la primera vez
     descarga unos 12 MB) → se busca al socio por el nombre o el ID de la hoja → el nutriólogo revisa y guarda en
     /oficial/<socio>/med/<toma> (js/67-mediciones-oficiales.js). Nada se guarda sin confirmar.
   · Consejo para el gym: en el campo ID del InBody escribir el nombre completo o el ID de la app (ej. RF-UPUB2). ═══ */

// ── Director: marca /nutris según la función Nutrición ──
function nutriSincronizar(e){
  if(staffRol!=='coordinador' || !e || e.rol==='coordinador' || !fbListo || !fbDB) return;
  const uid=e.uid||e.id; if(!uid) return;
  const es=typeof entHace==='function' && entHace(e,'nutricion');
  fbEncolar('/nutris/'+uid, es?'set':'remove', es?true:undefined, {err:err=>console.warn('nutris',err&&err.code)});   // se sube aunque no haya señal ahora
}
(function(){
  if(typeof dbSaveEntrenador==='function'){
    const o=dbSaveEntrenador;
    window.dbSaveEntrenador=dbSaveEntrenador=function(id){ const r=o.apply(this,arguments); try{ nutriSincronizar(DB.entrenadores&&DB.entrenadores[id]); }catch(e){} return r; };
  }
  // Al entrar el director se ponen al día los que ya existían
  if(typeof entrarComoStaff==='function'){
    const o=entrarComoStaff;
    window.entrarComoStaff=entrarComoStaff=function(){ const r=o.apply(this,arguments); try{ if(staffRol==='coordinador') setTimeout(()=>Object.values(DB.entrenadores||{}).forEach(nutriSincronizar),2500); }catch(e){} return r; };
  }
})();
function esNutriologo(){ return (typeof fbNutri!=='undefined' && fbNutri) || (staffActivoEntId && typeof entHace==='function' && entHace(getEntrenador(staffActivoEntId),'nutricion')); }

// ═════════════ Lector de la hoja (Tesseract, cargado solo al usarlo) ═════════════
let ocrWorker=null, ocrCargando=null;
function ocrCargar(progreso){
  if(ocrWorker) return Promise.resolve(ocrWorker);
  if(ocrCargando) return ocrCargando;
  const base=new URL('vendor/tesseract/', location.href).href;
  ocrCargando=new Promise((res,rej)=>{
    const go=async()=>{
      try{
        ocrWorker=await Tesseract.createWorker('spa',1,{workerPath:base+'worker.min.js', corePath:base, langPath:base+'lang', gzip:true,
          logger:m=>{ if(progreso && m && m.status) progreso(m); }});
        res(ocrWorker);
      }catch(e){ ocrCargando=null; rej(e); }
    };
    if(window.Tesseract) return go();
    const sc=document.createElement('script'); sc.src=base+'tesseract.min.js'; sc.onload=go; sc.onerror=()=>{ ocrCargando=null; rej(new Error('No se pudo cargar el lector')); };
    document.head.appendChild(sc);
  });
  return ocrCargando;
}
// Foto → ancho de unos 2,400 px en escala de grises (sin forzar contraste: eso empeora la lectura)
function ocrPreparar(file){
  return new Promise((res,rej)=>{
    const url=URL.createObjectURL(file), im=new Image();
    im.onload=()=>{
      URL.revokeObjectURL(url);
      const k=Math.min(4, 2400/Math.max(im.width,1));
      const c=document.createElement('canvas'); c.width=Math.round(im.width*k); c.height=Math.round(im.height*k);
      const g=c.getContext('2d'); g.imageSmoothingEnabled=true; g.imageSmoothingQuality='high';
      g.filter='grayscale(1)'; g.drawImage(im,0,0,c.width,c.height);
      res(c);
    };
    im.onerror=()=>rej(new Error('No es una imagen'));
    im.src=url;
  });
}

// ═════════════ Leer los datos de la hoja InBody ═════════════
function ocrNum(t){ const m=String(t||'').replace(/(\d),(\d)/g,'$1.$2').match(/-?\d+(?:\.\d+)?/); return m?parseFloat(m[0]):null; }
function ocrSinRangos(t){ return String(t||'').replace(/\([^)]*\)?/g,' '); }
function ocrNorm(t){ return String(t||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase(); }
function ocrLeerHoja(texto){
  const L=String(texto||'').split(/\n+/).map(x=>x.trim()).filter(Boolean), N=L.map(ocrNorm);
  const out={campos:{}, nombre:'', edad:null, sexo:'', id:''};
  const valorTras=(re,{dec=false,rango=null,lineas=1}={})=>{
    for(let i=0;i<N.length;i++){
      const m=N[i].match(re); if(!m) continue;
      for(let j=0;j<lineas && i+j<L.length;j++){
        let resto=j===0?L[i].slice(m.index+m[0].length):L[i+j];
        resto=ocrSinRangos(resto).replace(/(\d),(\d)/g,'$1.$2');
        const ns=(resto.match(/\d+(?:\.\d+)?/g)||[]).map(parseFloat).filter(v=>(!dec||v%1!==0) && (!rango||(v>=rango[0]&&v<=rango[1])));
        if(ns.length) return ns[0];
      }
    }
    return null;
  };
  const C=out.campos;
  C.act=valorTras(/agua\s*corporal\s*total|agua\s*corporal/,{dec:true,rango:[10,90]});
  C.mg=valorTras(/masa\s*grasa\s*corporal|grasa\s*corporal/,{dec:true,rango:[2,90]});
  C.peso=valorTras(/suma\s*de\s*lo\s*anterior[^0-9]*peso|\bpeso\b/,{dec:true,rango:[25,250]});
  C.mme=valorTras(/\bmme\b|musculo\s*esquel/,{dec:true,rango:[8,70]});
  C.pgc=valorTras(/\bpgc\b|porcentaje\s*de\s*grasa/,{dec:true,rango:[3,70]});
  C.visc=valorTras(/grasa\s*visceral/,{rango:[1,30],lineas:3});
  C.rcc=valorTras(/ratio\s*cintura|cintura\s*-?\s*cadera/,{dec:true,rango:[0.5,1.4],lineas:4});
  const sc=String(texto).match(/(\d{2,3})\s*\/\s*100/) || String(texto).match(/\b(\d{2})\s+100\b/); if(sc && +sc[1]<=100 && +sc[1]>=20) C.score=+sc[1];
  // Verificaciones: el % de grasa debe cuadrar con masa grasa ÷ peso
  if(C.mg && C.peso){ const calc=Math.round(C.mg/C.peso*1000)/10; if(!C.pgc || Math.abs(C.pgc-calc)>2) C.pgc=calc; }
  if(C.mme && C.peso && C.mme>C.peso*0.7) delete C.mme;
  Object.keys(C).forEach(k=>{ if(C[k]==null) delete C[k]; });
  // Encabezado: ID (nombre) | Altura | Edad | Sexo — la línea de arriba que dice Mujer u Hombre
  for(let i=0;i<Math.min(N.length,8);i++){
    const sx=L[i].match(/\b(mujer|hombre|femenino|masculino|female|male)\b/i); if(!sx) continue;
    const nm=L[i].replace(/^[^A-Za-zÁÉÍÓÚÑÜáéíóúñü]+/,'').match(/^([A-Za-zÁÉÍÓÚÑÜáéíóúñü][A-Za-zÁÉÍÓÚÑÜáéíóúñü .'-]{1,40}?)\s*[|\]\[\d]/);
    if(nm) out.nombre=nm[1].trim();
    const ed=L[i].slice(0,sx.index).match(/(?:^|[^\d.])(\d{1,2})\s*[|\]\[]?\s*$/); if(ed && +ed[1]>=10) out.edad=+ed[1];
    out.sexo=/mujer|fem/i.test(sx[1])?'f':'m';
    break;
  }
  const id=String(texto).match(/\b([A-Z]{2}-[A-Z0-9]{4,6})\b/); if(id) out.id=id[1];
  return out;
}

// ── Buscar al socio por el nombre (o el ID) de la hoja ──
function ocrBigramas(t){ const s=' '+ocrNorm(t).replace(/[^a-z ]/g,'')+' ', b=[]; for(let i=0;i<s.length-1;i++) b.push(s.slice(i,i+2)); return b; }
function ocrParecido(a,b){ const A=ocrBigramas(a), B=ocrBigramas(b); if(!A.length||!B.length) return 0; const m={}; B.forEach(x=>m[x]=(m[x]||0)+1); let c=0; A.forEach(x=>{ if(m[x]){ c++; m[x]--; } }); return 2*c/(A.length+B.length); }
function ocrCandidatos(h){
  const lista=(typeof staffGetSocios==='function'?staffGetSocios():Object.values(DB.socios||{})).filter(Boolean);
  return lista.map(s=>{
    let p=h.nombre?ocrParecido(h.nombre,s.nombre):0;
    if(h.id && s.id && h.id===s.id) p=2;
    if(h.edad && +s.edad && Math.abs(+s.edad-h.edad)<=1) p+=0.15;
    if(h.sexo && typeof retoSexo==='function' && retoSexo(s)===h.sexo) p+=0.05;
    return {s,p};
  }).sort((a,b)=>b.p-a.p);
}

// ═════════════ Hoja "Registrar medidas" ═════════════
let rmEst=null;   // {foto, hoja, cands, code, toma}
function rmAbrir(){
  rmEst=null;
  let ov=document.getElementById('rm-ov'); if(ov) ov.remove();
  ov=document.createElement('div'); ov.id='rm-ov'; ov.className='chat-ov'; ov.setAttribute('role','dialog'); ov.setAttribute('aria-modal','true'); ov.setAttribute('aria-label','Registrar medidas');
  ov.innerHTML=`<div class="chat-hoja ofi-hoja"><div class="chat-h"><span class="ent-av chat-hav">${ico('camera')}</span><div class="chat-ht"><b>Registrar medidas</b><small>Foto de la hoja InBody</small></div><button type="button" class="chat-x" onclick="rmCerrar()" aria-label="Cerrar">${ico('x')}</button></div><div class="ofi-sc" id="rm-body"></div></div>`;
  ov.addEventListener('click',e=>{ if(e.target===ov) rmCerrar(); });
  document.body.appendChild(ov); requestAnimationFrame(()=>ov.classList.add('on'));
  rmInicio();
}
function rmCerrar(){ const ov=document.getElementById('rm-ov'); if(ov) ov.remove(); }
function rmInicio(){
  const b=document.getElementById('rm-body'); if(!b) return;
  b.innerHTML=`<div class="rm-ini">
    <label class="rm-cam">${ico('camera')}<b>Tomar foto de la hoja</b><span>Toda la hoja, derecha y con buena luz</span><input type="file" accept="image/*" capture="environment" hidden onchange="rmFoto(this)"></label>
    <label class="rm-alt">Elegir una foto de la galería<input type="file" accept="image/*" hidden onchange="rmFoto(this)"></label>
    <button type="button" class="rm-alt" onclick="rmManual()">Capturar a mano, sin foto</button>
    <p class="ofi-mu">La app lee la hoja en este celular, busca al socio por el nombre o el ID y te muestra los datos para revisarlos. Nada se guarda hasta que confirmes.<br><br><b>Consejo:</b> en el campo <b>ID</b> del InBody escribe el nombre completo del socio o su ID de la app (por ejemplo RF-UPUB2): así lo encuentra sin error.</p>
  </div>`;
}
async function rmFoto(inp){
  const f=inp.files&&inp.files[0]; inp.value=''; if(!f) return;
  const b=document.getElementById('rm-body'); if(!b) return;
  b.innerHTML=`<div class="rm-lee"><div class="rm-spin" aria-hidden="true"></div><b id="rm-st">Preparando la foto…</b><span id="rm-sub">La primera vez descarga el lector (unos 12 MB). Después es más rápido.</span><div class="rm-bar"><i id="rm-pg"></i></div></div>`;
  const st=(t,p)=>{ const a=document.getElementById('rm-st'), g=document.getElementById('rm-pg'); if(a&&t) a.textContent=t; if(g&&p!=null) g.style.width=Math.round(p*100)+'%'; };
  try{
    const canvas=await ocrPreparar(f);
    const w=await ocrCargar(m=>{ if(/load|initial/.test(m.status)) st('Descargando el lector…',m.progress||0); else if(/recogniz/.test(m.status)) st('Leyendo la hoja…',m.progress||0); });
    st('Leyendo la hoja…',0);
    const {data}=await w.recognize(canvas);
    const hoja=ocrLeerHoja(data.text);
    rmEst={hoja, cands:ocrCandidatos(hoja), foto:canvas.toDataURL('image/jpeg',0.5), texto:data.text};
    rmEst.code=(rmEst.cands[0]&&rmEst.cands[0].p>=0.45)?rmEst.cands[0].s.code:'';
    rmEst.toma=rmEst.code?rmTomaSig(rmEst.code):'ini';
    rmRevisar();
  }catch(e){
    console.warn('ocr',e);
    b.innerHTML=`<div class="rm-ini"><p class="ofi-mu">No se pudo leer la hoja${e&&e.message?' ('+esc(e.message)+')':''}. Revisa tu conexión la primera vez, o captura a mano.</p><button type="button" class="sd-pri" onclick="rmInicio()">Intentar de nuevo</button><button type="button" class="rm-alt" onclick="rmManual()">Capturar a mano</button></div>`;
  }
}
function rmTomaSig(code){ const m=(typeof ofiDe==='function'?ofiDe(code).med:null)||{}; return !m.ini?'ini':!m.mid?'mid':'fin'; }
function rmManual(){ rmEst={hoja:{campos:{},nombre:''}, cands:ocrCandidatos({}), code:'', toma:'ini', manual:true}; rmRevisar(); }
function rmRevisar(){
  const b=document.getElementById('rm-body'); if(!b||!rmEst) return;
  const h=rmEst.hoja, C=h.campos, s=rmEst.code?(getSocio(rmEst.code)||idxLite(rmEst.code)):null;
  const top=rmEst.cands.slice(0,4).filter(x=>x.p>0.2);
  const leidos=Object.keys(C).length;
  const campos=[['peso','Peso','kg'],['act','Agua corporal total','L'],['mme','Masa muscular esquelética','kg'],['mg','Masa grasa','kg'],['pgc','% de grasa','%'],['visc','Grasa visceral',''],['score','Puntuación InBody','/100'],['rcc','Ratio cintura-cadera','']];
  b.innerHTML=`
    ${rmEst.foto?`<details class="rm-foto"><summary>Ver la foto${h.nombre?' · leí: <b>'+esc(h.nombre)+'</b>'+(h.edad?' · '+h.edad+' años':''):''}</summary><img src="${rmEst.foto}" alt="Hoja InBody"></details>`:''}
    <section class="rm-sec"><h3>¿De quién es?</h3>
      ${s?`<div class="rm-quien on"><b>${esc(tc(s.nombre))}</b><small>${esc(s.id||'')}${s.edad?' · '+s.edad+' años':''}${typeof retoCategoria==='function'?' · '+esc(retoCategoriaNombre(retoCategoria(s))):''}</small><button type="button" class="rm-alt" onclick="rmEst.code='';rmRevisar()">Cambiar</button></div>`
        :`${top.length&&!rmEst.manual?'<p class="ofi-mu">Parecidos a lo que leí:</p>':''}<div class="rm-cands">${top.map(x=>`<button type="button" onclick="rmElegir('${esc(x.s.code)}')"><b>${esc(tc(x.s.nombre))}</b><small>${esc(x.s.id||'')}${x.s.edad?' · '+x.s.edad+' años':''}</small></button>`).join('')}</div>
         <input type="search" class="ti" placeholder="Buscar socio por nombre" oninput="rmBuscar(this.value)" aria-label="Buscar socio"><div class="rm-cands" id="rm-busq"></div>`}
    </section>
    ${s?`<section class="rm-sec"><h3>Medición</h3><div class="ofi-tomas" role="tablist">${Object.entries(OFI_TOMAS).map(([k,nm])=>{ const ya=((ofiDe(s.code).med)||{})[k]; return `<button type="button" role="tab" aria-selected="${k===rmEst.toma}" onclick="rmEst.toma='${k}';rmLeerForm();rmRevisar()">${nm}<small>${ya?'ya tiene · se reemplaza':'pendiente'}</small></button>`; }).join('')}</div></section>`:''}
    <section class="rm-sec"><h3>Datos${rmEst.manual?'':` <small>${leidos} leídos de 8 · revisa contra la hoja</small>`}</h3>
      <form class="ofi-f rm-f" novalidate onsubmit="event.preventDefault();rmGuardar()"><div class="ofi-g">${campos.map(([k,nm,u])=>`<label class="${C[k]==null&&!rmEst.manual?'falta':''}"><span>${nm}</span><div><input type="number" inputmode="decimal" step="any" min="0" name="${k}" value="${C[k]!=null?C[k]:''}">${u?`<em>${u}</em>`:''}</div></label>`).join('')}</div>
        ${s?`<label class="ofi-nota"><span>Somatotipo</span><select class="ti" name="somato"><option value="">${((ofiDe(s.code).med||{}).ini||{}).somato?'Igual que la inicial':'Sin definir'}</option>${Object.entries(OFI_SOMATO).map(([k,nm])=>`<option value="${k}">${nm}</option>`).join('')}</select></label>`:''}
        <p class="ofi-mu">Los pliegues y perímetros se agregan después en la ficha del socio → Mediciones oficiales.</p>
        <button type="submit" class="sd-pri ofi-save" ${s?'':'disabled'}>${s?'Guardar medición '+OFI_TOMAS[rmEst.toma].toLowerCase():'Elige primero al socio'}</button>
      </form>
    </section>`;
}
function rmLeerForm(){ const f=document.querySelector('.rm-f'); if(!f||!rmEst) return; ['peso','act','mme','mg','pgc','visc','score','rcc'].forEach(k=>{ const v=parseFloat(String(f.elements[k].value).replace(',','.')); if(v>=0&&isFinite(v)) rmEst.hoja.campos[k]=v; else delete rmEst.hoja.campos[k]; }); }
function rmElegir(code){ rmLeerForm(); rmEst.code=code; rmEst.toma=rmTomaSig(code); rmRevisar(); }
function rmBuscar(q){
  const el=document.getElementById('rm-busq'); if(!el) return;
  const n=ocrNorm(q).trim(); if(n.length<2){ el.innerHTML=''; return; }
  const l=(typeof staffGetSocios==='function'?staffGetSocios():[]).filter(s=>s&&(ocrNorm(s.nombre).includes(n)||ocrNorm(s.id).includes(n))).slice(0,8);
  el.innerHTML=l.map(s=>`<button type="button" onclick="rmElegir('${esc(s.code)}')"><b>${esc(tc(s.nombre))}</b><small>${esc(s.id||'')}</small></button>`).join('')||'<p class="ofi-mu">Nadie con ese nombre.</p>';
}
function rmGuardar(){
  if(!rmEst||!rmEst.code) return;
  rmLeerForm();
  const C=rmEst.hoja.campos, f=document.querySelector('.rm-f');
  if(!(C.peso>0)){ showToast('Falta el peso'); return; }
  if(C.pgc && (C.pgc<3||C.pgc>70)){ showToast('El % de grasa no parece correcto: revísalo'); return; }
  if(C.mme && C.mme>C.peso*0.7){ showToast('La masa muscular no puede ser casi todo el peso: revísala'); return; }
  const prev=((ofiDe(rmEst.code).med)||{})[rmEst.toma]||{};
  const t=Object.assign({},prev,C);   // conserva pliegues y perímetros si ya se habían capturado
  if(!t.mg && t.peso && t.pgc) t.mg=Math.round(t.peso*t.pgc)/100;
  const som=f&&f.elements.somato?f.elements.somato.value:''; if(som) t.somato=som;
  t.fecha=fechaISO(new Date()); t.por=fbUid||''; t.porNm=typeof ofiStaffNombre==='function'?ofiStaffNombre():'Nutrición'; t.ts=Date.now(); t.fuente=rmEst.manual?'manual':'foto';
  const o=OFI[rmEst.code]=OFI[rmEst.code]||{}; o.med=o.med||{}; o.med[rmEst.toma]=t;
  fbEncolar('/oficial/'+rmEst.code+'/med/'+rmEst.toma,'set',t);
  const s=getSocio(rmEst.code)||idxLite(rmEst.code);
  showToast('✓ '+OFI_TOMAS[rmEst.toma]+' de '+tc((s&&s.nombre)||'')+' guardada');
  const b=document.getElementById('rm-body');
  if(b) b.innerHTML=`<div class="rm-ini"><div class="rm-ok">${ico('check')}</div><b class="rm-okt">Guardado</b><p class="ofi-mu">${esc(tc((s&&s.nombre)||''))} · medición ${OFI_TOMAS[rmEst.toma].toLowerCase()}</p>
    <label class="rm-cam">${ico('camera')}<b>Escanear la siguiente hoja</b><input type="file" accept="image/*" capture="environment" hidden onchange="rmFoto(this)"></label>
    <button type="button" class="rm-alt" onclick="rmCerrar();ofiAbrir('${esc(rmEst.code)}')">Agregar pliegues y perímetros</button>
    <button type="button" class="rm-alt" onclick="rmCerrar()">Terminar</button></div>`;
  if(typeof staffRenderList==='function') staffRenderList();
}

// ── Botón en la lista del staff (nutriólogo y director) ──
(function(){
  if(typeof staffRenderList!=='function') return;
  const o=staffRenderList;
  window.staffRenderList=staffRenderList=function(){
    const r=o.apply(this,arguments);
    try{
      const head=document.querySelector('.staff-side .sl-head'); if(!head) return r;
      let b=document.getElementById('rm-btn');
      const ver=staffRol==='coordinador'||esNutriologo();
      if(!ver){ if(b) b.remove(); return r; }
      if(!b){ head.insertAdjacentHTML('beforeend',`<button type="button" class="rm-btn" id="rm-btn" onclick="rmAbrir()">${ico('camera')}<span>Registrar medidas</span><small>Foto de la hoja InBody</small></button>`); }
    }catch(e){ console.warn('nutriologo',e); }
    return r;
  };
})();
