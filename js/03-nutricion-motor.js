/* ═══ nutricion motor ═══
   Fitness System Pro · módulo cargado por index.html en orden (script clásico: comparte el ámbito global).
   No cambia la lógica: es el mismo código que antes vivía dentro de index.html. ═══ */
// ═════════════════════════════════════════
// MOTOR DE NUTRICIÓN — fórmulas verificadas
// BMR: Mifflin-St Jeor (1990)
// ═════════════════════════════════════════
// Actividad del día fuera del gym (pregunta del cuestionario). Factor base sin contar el entrenamiento.
const ACTIVIDAD_TRABAJO={
  sentado:{lbl:'Sentado la mayor parte del día', sub:'Oficina, escuela, manejar', f:1.2},
  depie:{lbl:'De pie o caminando', sub:'Comercio, docencia, mesero, enfermería', f:1.375},
  fisico:{lbl:'Trabajo físico', sub:'Cargar, construcción, campo, almacén', f:1.55},
};
// Composición corporal estimada: IMC y, si hay cintura, % de grasa con la fórmula RFM (Relative Fat Mass):
// RFM = 64 − 20 × estatura / cintura (+12 en mujeres). Con eso se distingue un IMC alto por músculo de uno por grasa.
// Una cintura que no cuadra con la estatura y el peso (error de captura) no se usa para el cálculo
function cinturaValida(c,est,imc){
  c=+c||0; est=+est||0; if(!(c>=50 && c<=180) || !est) return 0;
  const r=c/est;
  if(r<0.38 || r>0.95) return 0;
  if((imc||0)>=35 && r<0.45) return 0;
  if((imc||0)<30 && r>0.68) return 0;   // p. ej. 126 cm de cintura con IMC 26: casi seguro un error de captura
  return c;
}
function composicionCorporal(s,peso){
  const est=+s.estatura||0, m=est/100, imc=m?peso/(m*m):0;
  const g=(s.genero||'').toUpperCase(), mujer=g.includes('MUJER')||g.includes('FEMENINO');
  const cin=cinturaValida(s.cintura,est,imc)||0;
  const grasa=(cin && est) ? Math.max(5,Math.min(60,64-20*est/cin+(mujer?12:0))) : null;
  const grasaAlta=grasa!=null ? grasa>=(mujer?35:28) : (imc>=30 && !/AVAN/i.test(s.nivel||''));
  const muscular=grasa!=null ? (imc>=27 && grasa<(mujer?28:20)) : (imc>=27 && /AVAN/i.test(s.nivel||''));
  // Peso de referencia para proteína y grasas: masa magra si se conoce; con IMC ≥ 30 sin cintura, peso ajustado
  // (peso ideal de Devine + 40 % del exceso), para no recetar 190 g de proteína a quien pesa 95 kg por grasa.
  const pulg=est/2.54, ideal=Math.max(40,(mujer?45.5:50)+2.3*Math.max(0,pulg-60));
  const ref = grasa!=null ? peso*(1-grasa/100)/(mujer?0.75:0.82)   // masa magra llevada a un "peso sano" equivalente
            : (imc>=30 && !muscular) ? ideal+0.4*(peso-ideal) : peso;
  return {imc:Math.round(imc*10)/10, grasa:grasa!=null?Math.round(grasa):null, grasaAlta, muscular, pesoRef:Math.round(Math.min(peso,ref)*10)/10, mujer};
}
// Recalibración: tendencia del peso (mínimos cuadrados) de las últimas 6 semanas.
// Necesita 3 pesajes o más que abarquen 14 días o más, y el último de hace 14 días o menos.
const RECAL_DIAS=42, RECAL_MIN_PESAJES=3, RECAL_MIN_DIAS=14, RECAL_TOPE=0.15, RECAL_PESO=0.5;   // reglas de diseño: revisar con nutrición
function nutRecalibrar(s, kcalPlan, tdeeEst){
  const hoy=Date.now(), dia=86400000;
  const pts=[];
  comoArray(s&&s.logs&&s.logs.pesoCorporal).forEach(p=>{ const t=new Date(String(p.fecha)+'T12:00:00').getTime(); if(+p.kg>0 && t && hoy-t<=RECAL_DIAS*dia) pts.push([t,+p.kg]); });
  // Las mediciones oficiales (InBody) también cuentan
  try{ const m=(typeof OFI!=='undefined'&&OFI[s.code]&&OFI[s.code].med)||{}; Object.values(m).forEach(x=>{ const t=x&&x.fecha?new Date(x.fecha+'T12:00:00').getTime():0; if(x&&+x.peso>0&&t&&hoy-t<=RECAL_DIAS*dia) pts.push([t,+x.peso]); }); }catch(e){}
  if(pts.length<RECAL_MIN_PESAJES) return null;
  pts.sort((a,b)=>a[0]-b[0]);
  const t0=pts[0][0], tN=pts[pts.length-1][0];
  if(tN-t0<RECAL_MIN_DIAS*dia || hoy-tN>14*dia) return null;
  // pendiente en kg por semana
  const xs=pts.map(p=>(p[0]-t0)/(7*dia)), ys=pts.map(p=>p[1]), n=xs.length, mx=xs.reduce((a,b)=>a+b,0)/n, my=ys.reduce((a,b)=>a+b,0)/n;
  let num=0, den=0; xs.forEach((x,i)=>{ num+=(x-mx)*(ys[i]-my); den+=(x-mx)*(x-mx); });
  if(!den) return null;
  const pendiente=Math.round(num/den*100)/100;
  const tdeeReal=kcalPlan - pendiente*7700/7;
  const corr=Math.max(-RECAL_TOPE*tdeeEst, Math.min(RECAL_TOPE*tdeeEst, (tdeeReal-tdeeEst)*RECAL_PESO));
  if(Math.abs(corr)<40) return null;   // diferencia chica: no vale la pena mover el plan
  return {tdee:Math.round(tdeeEst+corr), corr:Math.round(corr), pendiente, semanas:Math.round((tN-t0)/(7*dia)*10)/10, pesajes:n, esperado:Math.round((kcalPlan-tdeeEst)*7/7700*100)/100};
}
function calcNutricion(s){
  const peso = +pesoActual(s) || 70;
  const faltan = [!(+s.edad>0)&&'edad', !(+s.estatura>0)&&'estatura', !(+pesoActual(s)>0)&&'peso'].filter(Boolean);
  const est = +s.estatura || 170, edad = +s.edad || 30;
  // BMR Mifflin-St Jeor
  const bmrH = 10*peso + 6.25*est - 5*edad + 5;
  const bmrM = 10*peso + 6.25*est - 5*edad - 161;
  // Género: acepta datos históricos (Hombre/Mujer) y las etiquetas actuales (Masculino/Femenino)
  const g=(s.genero||'').toUpperCase();
  const esHombre = g.includes('HOMBRE')||g.includes('MASCULINO');
  const esMujer = g.includes('MUJER')||g.includes('FEMENINO');
  const comp = composicionCorporal(s,peso);
  // ── 1. Metabolismo basal (no depende del objetivo) ──
  // Con medición oficial InBody (masa libre de grasa medida) → Cunningham: 500 + 22 × MLG.
  // Sin ella → Mifflin-St Jeor. El % de grasa estimado con la cintura NO cambia el basal: es una estimación
  // y un error de captura en la cintura lo movía cientos de kcal (antes se usaba Katch-McArdle con ese dato).
  const ib = typeof nutInbody==='function' ? nutInbody(s) : null;
  let bmr, bmrMetodo;
  if(ib && ib.mlg>20){ bmr=Math.round(500+22*ib.mlg); bmrMetodo='Cunningham con InBody ('+ib.mlg+' kg de masa libre de grasa, '+ib.fecha+')'; }
  else { bmr=Math.round(esHombre ? bmrH : esMujer ? bmrM : (bmrH+bmrM)/2); bmrMetodo='Mifflin-St Jeor'+(esHombre||esMujer?'':' (promedio: falta el sexo)'); }

  // Factor de actividad: actividad del trabajo (base) + cada día de entrenamiento.
  // Socios registrados antes de esta pregunta conservan la tabla anterior (solo días de entrenamiento).
  const factores = {2:1.375, 3:1.45, 4:1.55, 5:1.65, 6:1.725, 7:1.76};
  const act = ACTIVIDAD_TRABAJO[s.actividad];
  const factor = act ? Math.min(1.9, Math.round((act.f + 0.05*(parseInt(s.dias)||4))*1000)/1000) : (factores[s.dias] || 1.55);
  const factorTxt = act ? act.lbl.toLowerCase()+' + '+(parseInt(s.dias)||4)+' días de entrenamiento' : (parseInt(s.dias)||4)+' días de entrenamiento';
  // ── 2. Gasto energético total (basal × actividad), como rango de ±10 % ──
  let tdee = Math.round(bmr * factor);

  // Ajuste calórico según objetivo (función del gasto total: se usa antes y después de recalibrar con el peso)
  const ajustar=(tdee)=>{
    let kcal, ajusteTxt, protKg, nota;
    switch(s.objetivo){
      case 'PERDER PESO':
        kcal = Math.round(Math.max(tdee * 0.82, tdee - 500)); // déficit ~18 %, máximo 500 kcal/día
        if(kcal < bmr) kcal = bmr;      // nunca por debajo del basal
        ajusteTxt = tdee*0.18>500 ? 'Déficit moderado (−500 kcal del gasto total)' : 'Déficit moderado (−18% del gasto total)';
        protKg = 2.0;
        nota = 'Comes un poco menos de lo que gastas, sin restricción extrema. Proteína alta (2.0 g/kg) para preservar masa muscular. Sentirás más hambre: contrólala con volumen de verduras y proteína en cada comida.';
        break;
      case 'RECOMPOSICIÓN CORPORAL':
        kcal = Math.round(tdee * 0.93); // ligeramente por debajo del mantenimiento
        if(kcal < bmr) kcal = bmr;
        ajusteTxt = 'Recomposición (−7% del gasto total)';
        protKg = 2.2;
        nota = 'Comes un poco por debajo de tu gasto con proteína alta (2.2 g/kg) para bajar grasa mientras construyes músculo. Tu peso cambia despacio: mide tu avance con tu cintura, tu fuerza y cómo te queda la ropa.';
        break;
      case 'GANAR MÚSCULO':
        if(comp.grasaAlta){   // IMC alto por grasa: recomposición (ganar músculo y bajar grasa a la vez), sin superávit
          kcal = Math.round(tdee * 0.95);
          ajusteTxt = 'Recomposición (−5% del gasto total)';
          protKg = 2.0;
          nota = 'Con tu composición actual conviene ganar músculo mientras bajas grasa (recomposición): calorías un poco por debajo de tu gasto y proteína alta. Tu peso puede bajar despacio mientras tu fuerza sube; eso es progreso.';
          break;
        }
        kcal = Math.round(tdee * (comp.muscular ? 1.05 : 1.10)); // superávit ~10% (5% si ya es musculoso: gana más lento y con menos grasa)
        ajusteTxt = comp.muscular ? 'Superávit ligero (+5% del gasto total)' : 'Superávit ligero (+10% del gasto total)';
        protKg = 1.8;
        nota = 'Superávit controlado para construir músculo minimizando grasa. Prioriza carbohidratos alrededor del entrenamiento (antes y después). Creatina monohidratada 3–5 g/día es el suplemento con más evidencia.';
        break;
      case 'FUERZA PURA':
        kcal = Math.round(tdee * 1.05);
        ajusteTxt = 'Superávit mínimo (+5% del gasto total)';
        protKg = 1.8;
        nota = 'Mantenimiento ligeramente positivo: la fuerza requiere recuperación completa. Carbohidratos suficientes para rendir en series pesadas. Duerme 7–9 horas: ahí se consolida la fuerza.';
        break;
      default: // RESISTENCIA
        kcal = tdee;
        ajusteTxt = 'Mantenimiento (gasto total)';
        protKg = 1.6;
        nota = 'Calorías de mantenimiento con carbohidratos como combustible principal. Hidratación antes, durante y después de sesiones largas. Repón electrolitos si sudas más de 60 min.';
    }
    return {kcal, ajusteTxt, protKg, nota};
  };
  // ── 2b. Recalibración con su peso real ──
  // Si come lo que marca su plan, su peso dice cuánto gasta de verdad: gasto ≈ kcal del plan − Δpeso(kg/sem) × 7,700 / 7.
  // Solo se corrige la mitad de la diferencia (el peso diario es ruidoso) y como máximo ±15 % del gasto estimado.
  const tdeeEst = tdee;
  const ov=s.nutricion&&s.nutricion.override&&(!s.nutricion.baseObj||s.nutricion.baseObj===s.objetivo)?+s.nutricion.kcal:0;
  const recal = nutRecalibrar(s, ov>0?ov:ajustar(tdeeEst).kcal, tdeeEst);   // lo que se supone que comió: su plan (o el ajuste del staff)
  if(recal) tdee = recal.tdee;
  let {kcal, ajusteTxt, protKg, nota} = ajustar(tdee);
  if(recal) nota += ' Tu gasto se ajustó con tu peso de las últimas semanas ('+(recal.pendiente>0?'+':'')+recal.pendiente+' kg por semana).';

  // Seguridad: menores de 18 sin déficit, y nadie por debajo de un mínimo absoluto (salvo que su gasto total sea menor)
  const menor = (parseInt(edad)||0) > 0 && parseInt(edad) < 18;
  if(menor && kcal < tdee){
    kcal = tdee;
    ajusteTxt = 'Mantenimiento (menor de edad, sin déficit)';
    nota += ' Eres menor de edad: tu plan no reduce calorías. Si quieres cambiar tu peso, hazlo con tu médico o nutriólogo.';
  }
  if(menor) nota = nota.replace(/ ?Creatina[^.]*\./,'') + ' Los suplementos no se recomiendan a menores de edad.';
  const piso = Math.min(tdee, esMujer ? 1200 : esHombre ? 1500 : 1350);
  if(kcal < piso){
    kcal = piso;
    ajusteTxt = kcal>=tdee ? 'Mantenimiento (gasto total)' : 'Déficit limitado por seguridad (mínimo '+piso+' kcal)';
    nota += ' Tus calorías no bajan de '+piso+' kcal al día: menos que eso solo debe hacerse con supervisión médica.';
  }

  // Macros (sobre el peso de referencia: con obesidad no se calculan sobre el peso total)
  const pRef = comp.pesoRef || peso;
  const prot = Math.round(protKg * pRef);                       // g proteína
  const grasas = Math.round(Math.max(0.8*pRef, (kcal*0.25)/9)); // ≥0.8 g/kg, ~25% kcal
  const kcalRestantes = kcal - prot*4 - grasas*9;
  const carbs = Math.max(0, Math.round(kcalRestantes/4));       // resto en carbohidratos
  const agua = Math.round(peso * 35 / 100) / 10;                 // litros (35 ml/kg)

  if(pRef<peso-0.5) nota += ' Proteína y grasas calculadas sobre '+pRef+' kg (peso de referencia por tu composición corporal), no sobre tu peso total.';
  if(comp.imc>=30 && comp.grasa==null) nota += ' Agrega tu medida de cintura en tu perfil para afinar este cálculo.';
  if(faltan.length) nota += ' Falta tu '+faltan.join(' y ')+' en tu perfil: este cálculo es aproximado hasta que lo completes.';
  // ── 3. Ajuste por objetivo: lo único que cambia al pasar de ganar músculo a perder grasa ──
  const tdeeRango = [Math.round(tdee*0.9), Math.round(tdee*1.1)];
  const ajustePct = tdee ? Math.round((kcal/tdee-1)*1000)/10 : 0;
  const objetivoAplicado = (s.objetivo==='GANAR MÚSCULO' && comp.grasaAlta) ? 'RECOMPOSICIÓN CORPORAL' : s.objetivo;
  return { bmr, bmrMetodo, factor, factorTxt, tdee, tdeeEst, recal, tdeeRango, ajustePct, objetivoAplicado, kcal, prot, protKg, grasas, carbs, agua, ajusteTxt, nota, pesoBase: peso, imc:comp.imc, grasaPct:comp.grasa, pesoRef:pRef, dias:parseInt(s.dias)||null };
}
// Reparto de kcal por número de comidas (regla de diseño de docs/NUTRICION-DEPORTIVA.md; respeta la comida fuerte de 14 a 17 h)
const MEAL_TEMPLATES={
  3:[{nombre:'Desayuno',pct:30,tag:'media'},{nombre:'Comida',pct:40,tag:'fuerte'},{nombre:'Cena',pct:30,tag:'media'}],
  4:[{nombre:'Desayuno',pct:25,tag:'media'},{nombre:'Comida',pct:35,tag:'fuerte'},{nombre:'Colación PM',pct:15,tag:'ligera'},{nombre:'Cena',pct:25,tag:'media'}],
  5:[{nombre:'Desayuno',pct:25,tag:'media'},{nombre:'Colación AM',pct:10,tag:'ligera'},{nombre:'Comida',pct:30,tag:'fuerte'},{nombre:'Colación PM',pct:10,tag:'ligera'},{nombre:'Cena',pct:25,tag:'media'}],
  6:[{nombre:'Desayuno',pct:20,tag:'media'},{nombre:'Colación AM',pct:10,tag:'ligera'},{nombre:'Comida',pct:30,tag:'fuerte'},{nombre:'Colación PM',pct:10,tag:'ligera'},{nombre:'Cena',pct:20,tag:'media'},{nombre:'Colación noche',pct:10,tag:'ligera'}]
};
const TAG_INFO={fuerte:{lbl:'Comida fuerte',v:0.30},media:{lbl:'Comida media',v:0.30},ligera:{lbl:'Colación',v:0}};
// Reparto muy general del plato por comida: reserva un espacio fijo de verduras (comidas fuertes/medias)
// y divide el resto entre proteína/carbohidratos/grasas en la misma proporción que tus macros del día.
function nutPlato(pP,cP,gP,verdurasPct){
  const rem=100-verdurasPct;
  let prot=Math.round(rem*pP/100), carb=Math.round(rem*cP/100);
  let grasa=100-verdurasPct-prot-carb;
  if(grasa<0){ carb=Math.max(0,carb+grasa); grasa=0; }
  return {verduras:verdurasPct, prot, carb, grasa};
}
function nutRepartoComidas(n,kcal,pP,cP,gP){
  const plant=MEAL_TEMPLATES[n]||MEAL_TEMPLATES[4];
  return plant.map(m=>{
    const info=TAG_INFO[m.tag];
    return Object.assign({kcal:Math.round(kcal*m.pct/100)}, m, info.v?{plato:nutPlato(pP,cP,gP,info.v*100)}:{});
  });
}
// Nutrición final: la calculada, o la que ajustó el nutriólogo/entrenador si personalizó al socio
function nutricionFinal(s){
  const base=calcNutricion(s), o=s.nutricion;
  if(!o || !o.override) return Object.assign({},base,{manual:false});
  const n=v=>(v===0||v==='0')?0:(+v||null);   // un 0 capturado a propósito se respeta
  // El ajuste del staff guarda contra qué se hizo (objetivo, peso, gasto). Si cambió el objetivo, ese ajuste ya no aplica;
  // si cambió el peso o la frecuencia, se escala: kcal con el gasto total, proteína y grasa con el peso, carbohidrato el resto.
  if(o.baseObj && o.baseObj!==s.objetivo) return Object.assign({},base,{manual:false, overrideViejo:true});
  let kcal=n(o.kcal)??base.kcal, prot=n(o.prot)??base.prot, grasas=n(o.grasas)??base.grasas, carbs=n(o.carbs)??base.carbs, adaptado=false;
  if(o.baseTdee && o.basePeso){
    const fT=base.tdee/o.baseTdee, fP=base.pesoBase/o.basePeso;
    if(Math.abs(fT-1)>0.02 || Math.abs(fP-1)>0.02){
      kcal=Math.round(kcal*fT); prot=Math.round(prot*fP); grasas=Math.round(grasas*fP);
      carbs=Math.max(0,Math.round((kcal-prot*4-grasas*9)/4)); adaptado=true;
    }
  }
  return Object.assign({},base,{ kcal, prot, carbs, grasas, agua:n(o.agua)??base.agua, manual:true, adaptado });
}
