/* ═══ nutrición del socio ═══
   Fitness System Pro · módulo cargado por index.html en orden (script clásico: comparte el ámbito global).
   Pestaña Nutrición de la app del socio: la comida que sigue en grande, un resumen compacto (lo que llevas, agua y
   cómo se calculó), el menú del día en tarjetas con foto y la ficha de cada comida en una ventana de vidrio.
   Los ajustes (comidas, hora de entreno, filtros) van en una hoja aparte.
   El menú sale de js/48 (automático) o de js/49 (armado por el entrenador, definitivo). ═══ */

let NX_ABIERTA=null;    // índice de la comida desplegada; null = la próxima según la hora, -1 = ninguna
let NX_HOJA=false;      // hoja "Ajustar mi menú" abierta

function nxNum(x){ return Math.round(x).toLocaleString('es-MX'); }
function nxMin(h){ const m=/^(\d{1,2}):(\d{2})/.exec(h||''); return m?(+m[1])*60+(+m[2]):null; }
function nxHora12(h){ const t=nxMin(h); if(t==null) return ''; let H=Math.floor(t/60); const M=t%60, ap=H<12?'am':'pm'; H=H%12||12; return H+':'+String(M).padStart(2,'0')+' '+ap; }
function nxPlan(s){ const p=s.nutricion&&s.nutricion.plan; return p&&comoArray(p.comidas).length?p:null; }
// Comidas del día con lo necesario para pintarlas, del menú armado por el entrenador o del automático
function nxComidas(s,nut){
  const plan=nxPlan(s);
  if(plan){
    return {plan, items:comoArray(plan.comidas).slice().sort((a,b)=>(nxMin(a.hora)??9999)-(nxMin(b.hora)??9999)).map(m=>{
      const p=maPlat(m.id); if(!p) return null; const r=maCalc(m.id,m.q), q=comoArray(m.q);
      return {nombre:m.nombre, hora:m.hora, p, k:r.k, P:r.p, C:r.c, G:r.l, nota:m.nota||'', rol:'',
        comps:p.c.map(([f],ci)=>({f,q:+q[ci]||0})).filter(x=>x.q>0||MENU_ALIM[x.f].u==='libre')};
    }).filter(Boolean)};
  }
  const n=[3,4,5,6].includes(+s.comidasPorDia)?+s.comidasPorDia:4;
  const dia=generarMenuDia(s,nut,n);
  return {plan:null, n, items:dia.comidas.map(m=>m.r?{nombre:m.nombre, hora:MA_HORAS[m.nombre]||'', p:m.r.platillo, k:m.r.k, P:m.r.p, C:m.r.c, G:m.r.l, comps:m.r.comps, rol:m.rol, opciones:m.opciones}:{nombre:m.nombre, hora:MA_HORAS[m.nombre]||'', p:null, rol:m.rol})};
}
// Tarjeta de una comida: foto grande a la izquierda (abre la ficha de vidrio) y palomita a la derecha.
// op=true solo en la vista previa del staff (js/70): sin ficha ni palomita, con porciones visibles debajo.
function nxFilaHTML(m,i,op,sig,menor,conOtra){
  const hora=esc(nxHora12(m.hora));
  if(!m.p) return `<li class="nx-m nx-card nx-sin"><span class="nx-cf"><span class="nx-ph">${ico('food')}</span></span>
    <div class="nx-cb"><div class="nx-ct"><span class="nx-kk">${esc(m.nombre)} · <b>${hora}</b></span><h4>Sin platillo con tus filtros</h4><p>Toca "Ajustar" y quita algún filtro.</p></div></div></li>`;
  const fid=menuFotoId(m.p.id), rol=m.rol==='pre'?'Antes de entrenar':m.rol==='post'?'Después de entrenar':'';
  const hecha=!op&&nxHechas().includes(m.nombre), abre=op?'':` onclick="nxFicha(${i})"`, tag=op?'div':'button';
  return `<li class="nx-m nx-card${sig?' sig':''}${hecha?' hecha':''}">
    <${tag} ${op?'':'type="button" '}class="nx-cf"${abre}${op?'':` aria-label="Ver receta de ${esc(m.p.n)}"`}>
      ${fid?`<img src="${menuFotoSrc(fid)}" alt="" width="240" height="280" loading="lazy" decoding="async">`:`<span class="nx-ph">${ico('food')}</span>`}
      ${op?'':`<span class="nx-rec">${ico('chev')}Receta</span>`}</${tag}>
    <div class="nx-cb">
      <${tag} ${op?'':'type="button" tabindex="-1" '}class="nx-ct"${abre}><span class="nx-kk">${esc(m.nombre)} · <b>${hora}</b></span>
        <h4>${esc(m.p.n)}</h4><p>${menor?'':nxNum(m.k)+' kcal · '+nxNum(m.P)+' g proteína'}${rol?`<em>${rol}</em>`:''}</p></${tag}>
      ${op?'':`<button type="button" class="nx-chk" aria-pressed="${hecha}" aria-label="${hecha?'Ya la comí: '+esc(m.nombre):'Marcar '+esc(m.nombre)+' como comida'}" onclick="nxMarcar('${esc(m.nombre)}')">${ico('check')}</button>`}
    </div>
    ${op?`<div class="nx-m-b">
      <ul class="nx-ing">${m.comps.map(x=>`<li>${esc(menuPorcion(x.f,x.q))}</li>`).join('')}</ul>
      ${m.p.prep?`<p class="nx-prep">${esc(m.p.prep)}</p>`:''}
      ${m.nota?`<p class="nx-nota">${ico('info')}<span>${esc(m.nota)}</span></p>`:''}
      ${menor?'':`<div class="nx-m-f"><span>C ${nxNum(m.C)} g · G ${nxNum(m.G)} g</span></div>`}
    </div>`:''}
  </li>`;
}
let NX_CALC=false;      // panel "Cómo se calculó" abierto
function nutTabHTML(s){
  const nut=nutricionFinal(s), base=calcNutricion(s), edad=parseInt(s.edad)||0, menor=edad>0&&edad<18, nino=edad>0&&edad<12;
  const o=s.nutricion||{}, legado=comoArray(o.menu), plan=nxPlan(s), conMenu=!nino&&!(!plan&&legado.length);
  const d=conMenu?nxComidas(s,nut):null, items=d?d.items:[];
  const mins=new Date().getHours()*60+new Date().getMinutes();
  const quien=plan&&plan.tipo!=='nutri'?'entrenador':'nutriólogo';

  // ── Lo que toca ahora, en grande ──
  let ahora='';
  if(conMenu&&!menor){
    let k=items.findIndex(m=>m.p&&!nxHechas().includes(m.nombre)&&(nxMin(m.hora)??0)>=mins-60); if(k<0) k=items.findIndex(m=>m.p&&!nxHechas().includes(m.nombre));
    const m=items[k];
    if(m&&m.p){
      const fid=menuFotoId(m.p.id), hm=nxMin(m.hora)??0, ya=mins>=hm-30, paso=mins>hm+90, et=paso?'Pendiente':ya?'Ahora':'Siguiente';
      ahora=`<button type="button" class="nx-ahora" onclick="nxFicha(${k})" aria-label="${et}: ${esc(m.p.n)}, ${esc(nxHora12(m.hora))}. Toca para ver porciones.">
        ${fid?`<img src="${menuFotoSrc(fid)}" alt="" decoding="async">`:''}
        <span class="nx-ahora-tag">${ico('clock')}${et} · ${esc(nxHora12(m.hora))}</span>
        <span class="nx-ahora-t"><small>${esc(m.nombre)}</small><b>${esc(m.p.n)}</b><em>${nxNum(m.k)} kcal · ${nxNum(m.P)} g proteína · toca para ver porciones</em></span></button>`;
    }
  }

  // ── Resumen compacto: lo que llevas hoy, agua y el cálculo plegable ──
  const track=conMenu&&!menor&&items.some(m=>m.p);
  const hech=track?items.filter(m=>m.p&&nxHechas().includes(m.nombre)):[];
  const t=hech.reduce((a,m)=>({k:a.k+(m.k||0),p:a.p+(m.P||0),c:a.c+(m.C||0),g:a.g+(m.G||0)}),{k:0,p:0,c:0,g:0});
  const pc=(v,mx)=>Math.max(0,Math.min(100,v/(mx||1)*100)).toFixed(1);
  const col=(lb,v,mx)=>`<div><span>${lb}</span><b>${track?nxNum(v)+' <small>/ '+nxNum(mx)+' g</small>':nxNum(mx)+' <small>g</small>'}</b>${track?`<i class="nx-mb"><i style="width:${pc(v,mx)}%"></i></i>`:''}</div>`;
  const aguaMeta=+nut.agua||0, aguaMl=nxAgua();
  const agua=`<div class="nx-agua2"><span>Agua<button type="button" class="nx-ag-b" onclick="nxAguaSumar(-250)" aria-label="Quitar un vaso de agua"${aguaMl?'':' hidden'}>${ico('minus')}</button><button type="button" class="nx-ag-b mas" onclick="nxAguaSumar(250)" aria-label="Agregar un vaso de agua de 250 ml">${ico('plus')}</button></span>
    <b>${nxLitros(aguaMl)} <small>/ ${esc(aguaMeta)} L</small></b><i class="nx-mb"><i style="width:${pc(aguaMl/1000,aguaMeta)}%"></i></i></div>`;

  const suma=items.reduce((a,m)=>a+(m.k||0),0), dev=nut.kcal?(suma-nut.kcal)/nut.kcal:0, ok=Math.abs(dev)<=MENU_TOL_DIA;
  const dK=nut.kcal-base.kcal, aj=base.kcal-base.tdee;
  const paso=(n,tit,sub,val,cls)=>`<li${cls?` class="${cls}"`:''}><i>${n}</i><span><b>${tit}</b>${sub}</span><strong>${val}</strong></li>`;
  const calc=`<div class="nx-calc${NX_CALC?' open':''}" id="nx-calc"><div>
    ${!items.some(m=>m.p)?'':menor?`<p class="nx-tot">${ico('info')}<span>Eres menor de edad: tu menú cubre lo que gastas, sin dietas para bajar de peso.</span></p>`
      :`<p class="nx-tot ${ok?'ok':'warn'}">${ico(ok?'check':'warn')}<span>Tu menú suma <b>${nxNum(suma)} kcal</b>${ok?', dentro de tu meta.':' ('+(dev>0?'+':'')+Math.round(dev*100)+'% de tu meta).'}</span></p>`}
    <ol class="nx-pasos">
      ${paso(1,'Metabolismo basal',esc(base.bmrMetodo)+' · '+esc(base.pesoBase)+' kg',nxNum(base.bmr))}
      ${paso(2,'× Actividad '+esc(base.factor),esc(base.factorTxt||((s.dias||'')+' días por semana')),nxNum(base.tdee))}
      ${paso(3,esc(base.ajusteTxt),'Ajuste por tu objetivo',(aj>0?'+':aj<0?'−':'')+nxNum(Math.abs(aj)))}
      ${dK?paso('±',nut.manual?'Ajuste de tu '+quien:'Ajuste por el entrenamiento de hoy',nut.manual?esc(o.por||'Tu '+quien):'Más o menos carbohidrato según lo que entrenas',(dK>0?'+':'−')+nxNum(Math.abs(dK))):''}
      ${paso('=','Tu meta diaria','kcal por día',nxNum(nut.kcal),'res')}
    </ol>
    <h6>Cómo se reparten</h6>
    <ul class="nx-rep">
      <li><b>Proteína ${nut.prot} g</b>${nut.manual?'':` · ${esc(base.protKg)} g por kg de ${base.pesoRef&&base.pesoRef<base.pesoBase-0.5?'tu peso de referencia ('+esc(base.pesoRef)+' kg)':'tu peso ('+esc(base.pesoBase)+' kg)'}.`}</li>
      <li><b>Grasas ${nut.grasas} g</b>${nut.manual?'':' · 25 % de tus calorías (mínimo 0.8 g por kg).'}</li>
      <li><b>Carbos ${nut.carbs} g</b>${nut.manual?'':' · las calorías que quedan.'}</li>
      <li><b>Agua ${esc(nut.agua)} L</b> · 35 ml por kg de tu peso, más 0.5 L por cada sesión de entrenamiento. Toca <b>+</b> en Agua para sumar un vaso de 250 ml.</li>
    </ul>
    <p>Calculado con tu peso actual, <b>${esc(base.pesoBase)} kg</b>. Se actualiza solo al registrar tu peso en Progreso.</p>
    <p>${esc(base.nota)}</p>
    <p class="nx-legal">Sugerencia educativa con equivalentes del Sistema Mexicano de Alimentos Equivalentes. Si tienes diabetes, enfermedad renal, embarazo, alergias o alguna condición médica, revisa tu alimentación con tu médico o nutriólogo.</p>
  </div></div>`;
  const res=`<section class="nx-res" aria-label="Resumen del día">
    <div class="nx-res-h">${menor?'<b class="sm">Tu energía del día</b>':track?`<b>${nxNum(t.k)}</b><span>de ${nxNum(nut.kcal)} kcal</span>`:`<b>${nxNum(nut.kcal)}</b><span>kcal al día</span>`}
      <button type="button" class="nx-calc-b" aria-expanded="${NX_CALC}" aria-controls="nx-calc" onclick="nxCalc()">${ico('info')}Cálculo${ico('chev')}</button></div>
    ${track?`<i class="nx-res-bar" aria-hidden="true"><i style="width:${pc(t.k,nut.kcal)}%"></i></i>`:''}
    <div class="nx-res-mac${menor?' solo':''}">${menor?'':col('Proteína',t.p,nut.prot)+col('Carbos',t.c,nut.carbs)+col('Grasas',t.g,nut.grasas)}${agua}</div>
    ${calc}
  </section>
  ${nut.manual&&o.nota?`<div class="nx-coach">${ico('star')}<p><b>Tu ${quien}:</b> ${esc(o.nota)}</p></div>`:''}`;

  // ── Tu día ──
  let dia;
  if(nino){
    dia=`<section class="nx-dia"><p class="nx-vacio">A tu edad, lo que comes lo decide tu familia con tu pediatra. Pide en recepción la guía del Plato del Bien Comer para tus papás.</p></section>`;
  } else if(!conMenu){
    dia=`<section class="nx-dia"><div class="nx-dia-h"><div><h2>Tu menú</h2><p>Escrito por ${esc(o.por||'tu entrenador')}</p></div></div>
      <ul class="nx-leg">${legado.map(m=>`<li><b>${esc(m.nombre)}</b><span>${esc(m.detalle)}</span></li>`).join('')}</ul></section>`;
  } else {
    let sig=items.findIndex(m=>m.p&&(nxMin(m.hora)??0)>=mins-60); if(sig<0) sig=items.findIndex(m=>m.p);
    const horaTxt={manana:'entrenas en la mañana',mediodia:'entrenas a mediodía',tarde:'entrenas en la tarde'}[s.horaEntreno]||'';
    dia=`<section class="nx-dia">
      <div class="nx-dia-h"><div><h2>Tu día</h2><p>${d.plan?'Armado por '+esc(d.plan.por||'tu entrenador'):d.n+' comidas'+(horaTxt?' · '+horaTxt:'')}</p></div>
        ${d.plan?'':`<button type="button" class="nx-aj" onclick="nxAjustes(true)">${ico('settings')}Ajustar</button>`}</div>
      <ol class="nx-lista">${items.map((m,i)=>nxFilaHTML(m,i,false,i===sig,menor,!d.plan)).join('')}</ol>
    </section>`;
  }
  return ahora+res+dia;
}
function nxCalc(){
  NX_CALC=!NX_CALC;
  const p=document.getElementById('nx-calc'), b=document.querySelector('#dsec-nutricion .nx-calc-b');
  if(p) p.classList.toggle('open',NX_CALC); if(b) b.setAttribute('aria-expanded',NX_CALC);
}
// Agua del día (se guarda en este celular, como las comidas marcadas)
function nxAguaKey(){ const s=activeSocio; return 'nx_agua_'+(s&&s.code||'')+'_'+fechaISO(new Date()); }
function nxAgua(){ try{ return Math.max(0,+localStorage.getItem(nxAguaKey())||0); }catch(e){ return 0; } }
function nxLitros(ml){ return String(+(ml/1000).toFixed(2)); }
function nxAguaSumar(ml){
  const v=Math.max(0,Math.min(8000,nxAgua()+ml));
  try{ localStorage.setItem(nxAguaKey(),String(v)); }catch(e){}
  if(ml>0){ try{ vibrarToque&&vibrarToque(10); }catch(e){} }
  const y=window.scrollY; renderNutricionTab(); window.scrollTo(0,y);
}

// ── Ficha de una comida en una ventana de vidrio (vive en <body>, encima de la barra de abajo) ──
let NX_FICHA=-1;
function nxFicha(i){ NX_FICHA=i; const s=activeSocio; if(s) nxFichaMontar(s); }
function nxFichaCerrar(){
  NX_FICHA=-1; document.removeEventListener('keydown',nxFichaTecla);
  const w=document.getElementById('nx-ficha'), f=w&&w.querySelector('.nf');
  document.documentElement.classList.remove('nf-lock');
  if(!f){ return; }
  f.classList.remove('open'); setTimeout(()=>{ if(NX_FICHA<0) w.innerHTML=''; },320);
}
function nxFichaTecla(e){ if(e.key==='Escape'&&!document.querySelector('#nxc-hoja .modal')) nxFichaCerrar(); }
function nxFichaHecha(nombre){ NX_FICHA=-1; document.documentElement.classList.remove('nf-lock'); document.removeEventListener('keydown',nxFichaTecla); const w=document.getElementById('nx-ficha'); if(w) w.innerHTML=''; nxMarcar(nombre); }
function nxFichaMontar(s){
  let w=document.getElementById('nx-ficha'); if(!w){ w=document.createElement('div'); w.id='nx-ficha'; document.body.appendChild(w); }
  if(NX_FICHA<0){ return; }
  const nut=nutricionFinal(s), d=nxComidas(s,nut), m=d.items[NX_FICHA];
  if(!m||!m.p){ NX_FICHA=-1; w.innerHTML=''; document.documentElement.classList.remove('nf-lock'); return; }
  const edad=parseInt(s.edad)||0, menor=edad>0&&edad<18, ya=!!w.querySelector('.nf.open');
  const fid=menuFotoId(m.p.id), src=fid?menuFotoSrc(fid):'', hecha=nxHechas().includes(m.nombre);
  const rol=m.rol==='pre'?'Antes de entrenar':m.rol==='post'?'Después de entrenar':'';
  const swap=typeof nxcAbrir==='function', otra=!d.plan&&m.opciones>1;
  const grupo=(a,q)=>{ if(a.u==='libre') return 'Libre'; const e=SMAE_EQ[a.g], lb=e&&e.lb?(q>1?e.lb[1]:e.lb[0]):''; return (lb?lb.charAt(0).toUpperCase()+lb.slice(1)+' · ':'')+menuFrac(q)+' eq.'; };
  const ing=m.comps.map((x,ci)=>{ const a=MENU_ALIM[x.f]; if(!a) return ''; const txt=esc(menuPorcion(x.f,x.q)), cam=x.orig&&x.orig!==x.f;
    return `<li class="nf-pane${cam?' cambiado':''}"><div><b>${txt}</b><small>${esc(grupo(a,x.q))}${cam?' · cambiado hoy':''}</small></div>
      ${swap&&a.u!=='libre'?`<button type="button" class="nf-swap" onclick="nxcAbrir(${NX_FICHA},${ci})" aria-label="Cambiar ${txt} por un equivalente">${ico('shuffle')}Cambiar</button>`:''}</li>`; }).join('');
  const tiles=menor?'':[[nxNum(m.k),'kcal'],[nxNum(m.P)+' g','proteína'],[nxNum(m.C)+' g','carbohid.'],[nxNum(m.G)+' g','grasa']].map(([b,l])=>`<div class="nf-pane"><b>${b}</b><span>${l}</span></div>`).join('');
  w.innerHTML=`<div class="nf${ya?' open':''}" role="dialog" aria-modal="true" aria-labelledby="nf-t">
    <div class="nf-veil" onclick="nxFichaCerrar()">${src?`<img src="${src}" alt="">`:''}<i></i></div>
    <div class="nf-glass">
      <div class="nf-scroll">
        <div class="nf-img">${src?`<img src="${src}" alt="${esc(m.p.n)}" decoding="async">`:`<span class="nx-ph">${ico('food')}</span>`}
          <button type="button" class="nf-x" onclick="nxFichaCerrar()" aria-label="Cerrar">${ico('close')}</button></div>
        <div class="nf-in">
          <span class="nf-k">${esc(m.nombre)} · ${esc(nxHora12(m.hora))}${rol?' · '+rol:''}</span>
          <h2 id="nf-t">${esc(m.p.n)}</h2>
          ${menor?'':`<p class="nf-share"><span>${Math.round(m.k/(nut.kcal||1)*100)} % de tu día · ${Math.round(m.P/(nut.prot||1)*100)} % de tu proteína</span></p>`}
          ${tiles?`<div class="nf-tiles">${tiles}</div>`:''}
          <h5>Ingredientes</h5>
          <ul class="nf-ing">${ing}</ul>
          ${swap?`<div class="nf-eq nf-pane"><b>¿Qué es 1 eq.?</b> Una porción que aporta lo mismo que cualquier otra de su grupo; por eso puedes cambiarla sin mover tus números.
            <ul><li>Origen animal · 7 g prot.</li><li>Cereales · 15 g carbos</li><li>Frutas · 15 g carbos</li><li>Verduras · 4 g carbos</li><li>Leguminosas · 8 g prot.</li><li>Grasas · 5 g grasa</li></ul></div>`:''}
          ${m.p.prep?`<h5>Preparación</h5><p class="nf-prep nf-pane">${esc(m.p.prep)}</p>`:''}
          ${m.nota?`<p class="nf-nota nf-pane">${ico('info')}<span>${esc(m.nota)}</span></p>`:''}
        </div>
      </div>
      <div class="nf-foot${otra?'':' uno'}">
        ${otra?`<button type="button" class="nf-b2" onclick="nutMenuOtra('${esc(m.nombre)}')">${ico('refresh')}Otra opción</button>`:''}
        <button type="button" class="nf-b1${hecha?' undo':''}" onclick="nxFichaHecha('${esc(m.nombre)}')">${hecha?'Quitar hecha':'Marcar hecha'}</button>
      </div>
    </div>
  </div>`;
  document.documentElement.classList.add('nf-lock');
  document.removeEventListener('keydown',nxFichaTecla); document.addEventListener('keydown',nxFichaTecla);
  if(!ya) requestAnimationFrame(()=>requestAnimationFrame(()=>{ const f=w.querySelector('.nf'); if(f){ f.classList.add('open'); const x=f.querySelector('.nf-x'); if(x) x.focus({preventScroll:true}); } }));
}
// Comidas marcadas hoy (se guardan en este celular)
function nxHechasKey(){ const s=activeSocio; return 'nx_hechas_'+(s&&s.code||'')+'_'+fechaISO(new Date()); }
function nxHechas(){ try{ return JSON.parse(localStorage.getItem(nxHechasKey()))||[]; }catch(e){ return []; } }
function nxMarcar(nombre){
  const h=nxHechas(), i=h.indexOf(nombre); if(i<0) h.push(nombre); else h.splice(i,1);
  try{ localStorage.setItem(nxHechasKey(),JSON.stringify(h)); }catch(e){}
  if(i<0){ try{ vibrarToque&&vibrarToque(12); }catch(e){} }
  const y=window.scrollY; renderNutricionTab(); window.scrollTo(0,y);
}
function nxIrA(i){ NX_ABIERTA=i; renderNutricionTab(); setTimeout(()=>{ const el=document.querySelectorAll('#dsec-nutricion .nx-m')[i]; if(el) el.scrollIntoView({behavior:'smooth',block:'start'}); },60); }
// Hoja "Ajustar mi menú": vive en <body> para que ningún contenedor de la pestaña recorte el modal
function nxHojaMontar(s){
  nxFichaMontar(s);
  let w=document.getElementById('nx-hoja'); if(!w){ w=document.createElement('div'); w.id='nx-hoja'; document.body.appendChild(w); }
  if(nxPlan(s)||comoArray(s.nutricion&&s.nutricion.menu).length){ w.innerHTML=''; return; }
  const n=[3,4,5,6].includes(+s.comidasPorDia)?+s.comidasPorDia:4, hora=s.horaEntreno||'', pref=s.nutPrefs||{};
  const ch=(on,lb,fn)=>`<button type="button" class="ch${on?' on':''}" aria-pressed="${on}" onclick="${fn}">${lb}</button>`;
  w.innerHTML=`<div class="modal${NX_HOJA?' open':''}" onclick="if(event.target===this)nxAjustes(false)">
    <div class="mbox" role="dialog" aria-modal="true" aria-labelledby="nx-hoja-t"><div class="mx" onclick="nxAjustes(false)" aria-label="Cerrar">✕</div>
      <div class="m-title" id="nx-hoja-t" style="font-size:var(--fs-3xl)">Ajustar mi menú</div>
      <div class="nx-g"><div class="nx-gl">Comidas al día</div><div class="ch-row">${[3,4,5,6].map(k=>ch(k===n,k,`nxSet('comidasPorDia',${k})`)).join('')}</div></div>
      <div class="nx-g"><div class="nx-gl">¿A qué hora entrenas?</div><div class="ch-row">${MENU_HORAS.map(([v,lb])=>ch(hora===v,lb,`nxSet('horaEntreno','${v}')`)).join('')}</div></div>
      <div class="nx-g"><div class="nx-gl">Lo que no comes</div><div class="ch-row">${MENU_PREFS.map(([k,lb])=>ch(!!pref[k],lb,`nutPref('${k}')`)).join('')}</div></div>
      <button type="button" class="sd-pri nx-listo" onclick="nxAjustes(false)">Listo</button>
    </div></div>`;
}
function nxAbrir(i){
  const ab=document.querySelector('#dsec-nutricion .nx-m.op'), lista=[...document.querySelectorAll('#dsec-nutricion .nx-m')];
  NX_ABIERTA=(ab&&lista.indexOf(ab)===i)?-1:i; renderNutricionTab();
}
function nxAjustes(v){ NX_HOJA=v; const s=activeSocio; if(s) nxHojaMontar(s); }
function nxSet(k,v){ const s=activeSocio; if(!s) return; s[k]=v; NX_ABIERTA=null; dbSave(s.code); renderNutricionTab(); }
