#!/usr/bin/env node
/* Lista de imágenes de ejercicios que faltan.
   Uso:  node herramientas/lista-imagenes.js   → escribe docs/IMAGENES-PENDIENTES.md
   Revisa todos los nombres de ejercicio que la app puede mostrar (catálogo del gimnasio, rutinas en casa,
   deportes y rehabilitación, rutinas de respaldo, movilidad y calentamiento), les aplica el mismo nombre de
   archivo que usa la app (slugImg + EJ_ALIAS de js/08-rutinas-ia-fallback.js) y deja solo los que aún no
   tienen foto en img/ejercicios/. Vuelve a correrlo después de subir fotos para ver lo que queda. */
const fs=require('fs'), path=require('path'), vm=require('vm');
const R=path.join(__dirname,'..'), js=f=>fs.readFileSync(path.join(R,'js',f),'utf8');

const slugImg=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
const f08=js('08-rutinas-ia-fallback.js');
const aliasTxt=f08.slice(f08.indexOf('const EJ_ALIAS={'), f08.indexOf('\n};', f08.indexOf('const EJ_ALIAS={')));
const ALIAS=Object.fromEntries([...aliasTxt.matchAll(/'([a-z0-9-]+)'\s*:\s*'([a-z0-9-]+)'/g)].map(m=>[m[1],m[2]]));
const slugEj=nm=>{ const n=slugImg(nm); return ALIAS[n]||n; };
const IMGS=new Set(fs.readdirSync(path.join(R,'img/ejercicios')).filter(f=>/\.(webp|jpg|png)$/.test(f)).map(f=>f.replace(/\.(webp|jpg|png)$/,'')));

// Catálogo del gimnasio
const ctx={}; vm.createContext(ctx);
vm.runInContext(js('00-conocimiento.js')+';this.E=KB_EJERCICIOS;this.Z=KB_ZONAS;this.M=KB_MOVILIDAD;',ctx);

// Datos para el prompt en inglés de los ejercicios nuevos del catálogo: [ejercicio, posición clave, músculos principales, secundarios, equipo]
const EN={
  salto_cajon:['box jump','landing softly on top of a knee-high plyo box in a quarter squat, arms forward','quadriceps and glutes','calves and hamstrings','a black plyometric box'],
  zancada_salto:['jumping lunge','mid-air switching legs between two lunge positions, arms swinging','quadriceps and glutes','calves and core','none (bodyweight)'],
  salto_horizontal:['standing broad jump','in flight, body extended forward after take-off, arms reaching forward','glutes and quadriceps','hamstrings and calves','none (bodyweight)'],
  saltos_pantorrilla:['pogo jumps','small vertical hop on the balls of the feet, knees almost straight','calves','tibialis and quadriceps','none (bodyweight)'],
  saltos_patinador:['skater jumps','landing on one leg in a side bound, the other leg crossed behind, torso leaning forward','gluteus medius and quadriceps','calves and core','none (bodyweight)'],
  escalera_agilidad:['agility ladder drill','quick feet stepping inside the squares of a flat agility ladder on the floor, on the balls of the feet','calves and quadriceps','hip flexors and core','a flat black agility ladder on the floor'],
  balon_slam:['medicine ball slam','the ball just leaving the hands at hip height on its way to the floor, hips hinged, arms extended down','core and lats','shoulders and glutes','a black slam ball'],
  wall_ball:['wall ball shot','rising from the squat and releasing the medicine ball upward toward a wall target','quadriceps and glutes','shoulders and core','a black medicine ball and a plain wall'],
  balon_rotacional:['rotational medicine ball throw against a wall','side-on to the wall, hips rotated, ball released from the back hip with long arms','obliques and core','glutes and shoulders','a black medicine ball and a plain wall'],
  balon_pecho:['medicine ball chest pass against a wall','arms fully extended forward right after releasing the ball from the chest','chest and triceps','front shoulders and core','a black medicine ball and a plain wall'],
  cargada:['barbell power clean','catch position: barbell racked on the front of the shoulders, elbows high, knees slightly bent','glutes and hamstrings','trapezius, quadriceps and shoulders','an Olympic barbell with black bumper plates'],
  jalon_alto:['barbell high pull','end of the pull, bar at chest height, elbows high and wide, on the toes','trapezius','glutes, rear delts and shoulders','an Olympic barbell with black bumper plates'],
  arranque_mancuerna:['single-arm dumbbell snatch','finish: dumbbell locked out overhead with a straight arm, standing tall','glutes and shoulders','hamstrings, trapezius and core','one hexagonal dumbbell'],
  thruster:['dumbbell thruster','dumbbells being pressed overhead as the legs finish extending out of the squat','quadriceps and glutes','shoulders and triceps','two hexagonal dumbbells'],
  kb_cargada:['kettlebell clean','kettlebell in the rack position against the forearm and chest, elbow tucked','glutes and hamstrings','forearm, shoulder and core','one kettlebell'],
  kb_press:['single-arm kettlebell overhead press','kettlebell pressed overhead with the arm straight, the other hand on the hip','shoulders','triceps and core','one kettlebell'],
  levantada_turca:['Turkish get-up','half-kneeling stage, kettlebell held overhead with a vertical straight arm, eyes on the bell','core and shoulders','glutes and obliques','one kettlebell'],
  kb_molino:['kettlebell windmill','hips pushed to the side, torso hinged down with the free hand sliding down the leg, kettlebell overhead','obliques','shoulders and hamstrings','one kettlebell'],
  pm_hex:['trap bar deadlift','lockout: standing tall inside the hexagonal bar, glutes squeezed','glutes and quadriceps','hamstrings and lower back','a black hexagonal trap bar with plates'],
  zancada_caminando:['walking lunge with dumbbells','bottom of a forward lunge, back knee near the floor, dumbbells at the sides','quadriceps and glutes','hamstrings and core','two hexagonal dumbbells'],
  sentadilla_cosaca:['Cossack squat','deep side squat over one bent leg, the other leg straight with toes up','adductors and glutes','quadriceps','none (bodyweight)'],
  step_up_lateral:['lateral step-up','standing on the box with one leg, side-on, the other foot just leaving the floor','gluteus medius and quadriceps','hamstrings','a black plyo box'],
  hip_thrust_smith:['Smith machine hip thrust','top position, hips extended, upper back on a bench, bar across the hips','glutes','hamstrings','a Smith machine and a flat bench'],
  curl_fem_pie:['standing leg curl machine','one heel curled up toward the glute, hips against the pad','hamstrings','calves','a standing leg curl machine'],
  aduccion_maquina:['seated hip adduction machine','legs squeezed together against the pads','adductors (inner thighs)','glutes','a hip adduction machine'],
  aduccion_polea:['standing cable hip adduction','working leg crossing in front of the standing leg, ankle strap on','adductors (inner thighs)','core','a low cable pulley with an ankle strap'],
  copenhague:['Copenhagen side plank','side plank with the top leg resting on a bench and the bottom leg lifted, hips high','adductors and obliques','glutes and shoulders','a flat bench'],
  tibial:['tibialis raise','back against a wall, heels forward, toes lifted as high as possible','tibialis anterior (front of the shin)','none','a plain wall'],
  remo_pendlay:['Pendlay row','torso parallel to the floor, barbell pulled to the lower chest','mid back and lats','rear delts and biceps','an Olympic barbell with black bumper plates'],
  remo_meadows:['Meadows row','staggered stance beside a landmine barbell, elbow pulled high behind the torso','lats and mid back','biceps and rear delts','a barbell anchored in a landmine'],
  press_incl_smith:['incline Smith machine bench press','bar lowered to the upper chest, elbows at 45 degrees','upper chest','front shoulders and triceps','a Smith machine and an incline bench'],
  press_cubano:['Cuban press','elbows at shoulder height and forearms rotated up, light dumbbells pointing to the ceiling','rotator cuff','rear delts and trapezius','two light hexagonal dumbbells'],
  elevacion_y:['incline bench Y raise','chest on an incline bench, arms raised in a Y shape with thumbs up','lower trapezius','rear delts','two light dumbbells and an incline bench'],
  encog_barra:['barbell shrug','top position, shoulders lifted toward the ears, arms straight','trapezius','forearms','an Olympic barbell with plates'],
  curl_inverso:['reverse EZ-bar curl','EZ bar curled to mid height with an overhand grip, elbows at the sides','brachioradialis and forearms','biceps','an EZ curl bar'],
  curl_muneca:['seated barbell wrist curl','forearms resting on the thighs, palms up, wrists curled up','forearm flexors','none','a short barbell'],
  ext_muneca:['dumbbell wrist extension','forearm resting on the thigh, palm down, back of the hand lifted','forearm extensors','none','one light dumbbell'],
  colgado_barra:['dead hang','hanging from a pull-up bar with straight arms and active shoulders','grip and lats','shoulders','a pull-up bar'],
  crunch_inverso:['reverse crunch','lying on the back, hips curled up off the floor with knees toward the chest','lower abs','hip flexors','none (floor)'],
  caminata_oso:['bear crawl','on hands and feet with knees one hand above the floor, opposite hand and foot moving forward','core','shoulders and quadriceps','none (floor)'],
  equilibrio_pie:['single-leg balance','standing tall on one leg, the other knee lifted to hip height, arms relaxed','ankle stabilizers and gluteus medius','core','none'],
  sentarse_pararse:['sit-to-stand from a chair','rising from a chair, hips just off the seat, arms crossed on the chest','quadriceps and glutes','core','a simple black chair'],
};

const filas=new Map();   // slug → fila
function agrega(nm,o){
  if(!nm||nm.length<4) return;
  const s=slugEj(nm); if(IMGS.has(s)) return;
  const f=filas.get(s);
  if(f){ f.origen.add(o.origen); if(!f.ms&&o.ms) f.ms=o.ms; if(!f.tip&&o.tip) f.tip=o.tip;
    if(slugImg(f.nm)!==s && slugImg(nm)===s){ f.nm=nm; if(o.en) f.en=o.en; if(o.grupo==='nuevo') f.grupo='nuevo'; }   // el nombre debe dar el archivo
    return; }
  filas.set(s,{nm,slug:s,ms:o.ms||'',eq:o.eq||'',tip:o.tip||'',origen:new Set([o.origen]),grupo:o.grupo,en:o.en});
}
const campo=(t,k)=>{ const m=t.match(new RegExp("\\b"+k+"\\s*:\\s*'([^']*)'")); return m?m[1]:''; };

// 1) Nuevos del catálogo del gimnasio (tienen datos en inglés)
ctx.E.forEach(e=>{ if(EN[e.id]) agrega(e.nm,{origen:'Catálogo del gimnasio',grupo:'nuevo',ms:e.ms,eq:ctx.Z[e.z]||e.z,tip:e.tip,en:EN[e.id]}); });
// …y cualquier otro del catálogo que se quede sin foto
ctx.E.forEach(e=>agrega(e.nm,{origen:'Catálogo del gimnasio',grupo:'nuevo',ms:e.ms,eq:ctx.Z[e.z]||e.z,tip:e.tip}));
// 2) Rutinas en casa
const EQ_CASA={silla:'silla',escalon:'escalón o cajón',toalla:'toalla',mochila:'mochila con peso',mancuernas:'mancuernas',ligas:'liga',kettlebell:'kettlebell',barra:'barra de dominadas',trx:'TRX',cuerda:'cuerda',fitball:'fitball'};
for(const m of js('30-casa-catalogo.js').matchAll(/^H\('[^']+','([^']+)','([^']*)','[^']*','[^']*',\[([^\]]*)\],'([^']*)'/gm))
  agrega(m[1],{origen:'Rutinas en casa',grupo:'casa',ms:m[2],eq:m[3].replace(/'/g,'').split(',').filter(Boolean).map(x=>EQ_CASA[x.trim()]||x.trim()).join(', ')||'peso corporal',tip:m[4]});
// 3) Deportes y rehabilitación (solo ejercicios: los títulos de lesión usan "nombre")
for(const m of js('12-deportes-club.js').matchAll(/\{nm:'([^']+)'([^}]*)\}/g))
  agrega(m[1],{origen:'Deportes y rehabilitación',grupo:'deporte',ms:campo(m[2],'ms'),tip:campo(m[2],'tip')});
// 4) Rutinas de respaldo y demo
for(const m of f08.matchAll(/\{nombre:'([^']+)'([^}]*)\}/g)) agrega(m[1],{origen:'Rutinas de respaldo',grupo:'respaldo',ms:campo(m[2],'musculo'),tip:campo(m[2],'tip')});
for(const m of f08.matchAll(/\{nm:'([^']+)',\s*ms:'([^']*)',\s*tip:'([^']*)'/g)) agrega(m[1],{origen:'Rutinas de respaldo',grupo:'respaldo',ms:m[2],tip:m[3]});
for(const m of js('05-seed-demo.js').matchAll(/\{nm:'([^']+)'([^}]*)\}/g)) agrega(m[1],{origen:'Socios de prueba',grupo:'respaldo',ms:campo(m[2],'ms'),tip:campo(m[2],'tip')});
// 5) Movilidad y calentamiento
ctx.M.forEach(r=>(r.pasos||[]).forEach(p=>agrega(p.nm,{origen:'Movilidad y estiramiento',grupo:'movilidad',tip:p.como})));
for(const f of ['63-plan-intro.js','78-calentamiento-coach.js']) for(const m of js(f).matchAll(/\['([A-ZÁÉÍÓÚ][^']+)','([^']*\d[^']*)'/g)) agrega(m[1],{origen:'Calentamiento',grupo:'movilidad'});
for(const m of js('78-calentamiento-coach.js').matchAll(/\{t:'([^']+)',v:'[^']*',det:'([^']*)'/g)) agrega(m[1],{origen:'Calentamiento',grupo:'movilidad',tip:m[2]});

// Si ningún nombre da exactamente el archivo (solo llegó por equivalencia), se usa el del archivo
for(const f of filas.values()) if(slugImg(f.nm)!==f.slug){ const n=f.slug.replace(/-/g,' '); f.nm=n[0].toUpperCase()+n.slice(1); }
// Nombres genéricos o títulos que no son un ejercicio dibujable
const OMITIR=/^(tu clase|nivel|elige tu companero|descanso activo|dia de tu disciplina|fuerza (tren|total)|potencia y agilidad|resistencia metabolica|core y movilidad|circuito integral|retorno gradual|carga progresiva en press|movilidad activa completa|fortalecimiento de (hombros|brazos|tren)|ejercicio de reaccion|cardiorondas|baile|movilidad articular dinamica|movilidad de cadera y hombro|movilidad y estiramiento|split activo|split progresivo)/;
const omitidos=[];
for(const [s,f] of filas){ const k=slugImg(f.nm).replace(/-/g,' '); if(f.nm===f.nm.toUpperCase()||OMITIR.test(k)||/\b[A-Z][a-z]+ [A-Z]\.$/.test(f.nm)){ omitidos.push(f.nm); filas.delete(s); } }

// ── Markdown ──
const GRUPOS=[['nuevo','1. Nuevos del catálogo del gimnasio','Se agregaron al catálogo con esta lista. El generador ya puede elegirlos (respetando nivel, lesiones y la filosofía del entrenador), así que son los primeros en hacer. Cada uno trae los datos en inglés para la plantilla.'],
  ['casa','2. Rutinas en casa','Ya salen en las rutinas en casa; hoy muestran la foto del grupo muscular.'],
  ['deporte','3. Deportes y rehabilitación','Ya salen en los planes de deporte y en los ejercicios de recuperación por lesión.'],
  ['movilidad','4. Movilidad, estiramiento y calentamiento','Pasos de las rutinas de movilidad y del calentamiento.'],
  ['respaldo','5. Rutinas de respaldo','Se usan cuando la rutina se arma sin conexión o para adultos mayores y lesiones.']];
const esc=t=>String(t||'').replace(/\|/g,'/').replace(/\s+/g,' ').trim();
const total=filas.size;
let md=`# Imágenes de ejercicios pendientes

Generado con \`node herramientas/lista-imagenes.js\`. Vuelve a correrlo después de subir fotos: la lista se recalcula con lo que ya está en \`img/ejercicios/\`.

**Faltan ${total} imágenes.** El estilo y las plantillas de los prompts están en [IMAGENES-EJERCICIOS.md](IMAGENES-EJERCICIOS.md) (sección 3: siempre adjunta la sentadilla goblet como referencia).

**Cómo nombrarlas:** guarda cada imagen con el texto de la columna **Nombre** tal cual (por ejemplo \`Salto al cajón.png\`) y corre \`python3 herramientas/preparar-imagenes.py CARPETA\`. El script la deja como el archivo de la columna **Archivo**.

**Para los grupos 2 a 5** usa la plantilla de la sección 3 poniendo el nombre en español y la indicación; por ejemplo: *New exercise: "Sentadilla cosaca", shown at the bottom position. Main working muscles glowing lime: aductores y glúteo.*

| Grupo | Imágenes |
|---|---|
${GRUPOS.map(([g,t])=>`| ${t.replace(/^\d\. /,'')} | ${[...filas.values()].filter(f=>f.grupo===g).length} |`).join('\n')}
| **Total** | **${total}** |
`;
for(const [g,t,d] of GRUPOS){
  const L=[...filas.values()].filter(f=>f.grupo===g).sort((a,b)=>a.nm.localeCompare(b.nm,'es'));
  if(!L.length) continue;
  md+=`\n## ${t} (${L.length})\n\n${d}\n\n`;
  if(g==='nuevo'){
    md+=`| Nombre | Archivo | Ejercicio (inglés) | Posición clave | Músculo principal (lima) | Secundarios (35 %) | Equipo |\n|---|---|---|---|---|---|---|\n`;
    md+=L.map(f=>{ const e=f.en||['','','','','']; return `| ${esc(f.nm)} | \`${f.slug}.webp\` | ${esc(e[0])} | ${esc(e[1])} | ${esc(e[2])} | ${esc(e[3])} | ${esc(e[4])} |`; }).join('\n')+'\n';
  } else {
    md+=`| Nombre | Archivo | Músculos | Equipo | Indicación | Dónde sale |\n|---|---|---|---|---|---|\n`;
    md+=L.map(f=>`| ${esc(f.nm)} | \`${f.slug}.webp\` | ${esc(f.ms)} | ${esc(f.eq)} | ${esc(f.tip)} | ${[...f.origen].join(', ')} |`).join('\n')+'\n';
  }
}
md+=`\n## No necesitan imagen propia\n\nTítulos, categorías o indicaciones generales que no son un ejercicio que se pueda dibujar (${omitidos.length}): ${omitidos.sort((a,b)=>a.localeCompare(b,'es')).map(esc).join(' · ')}.\n`;
md+=`\nLos nombres que son el mismo movimiento que una foto ya hecha (por ejemplo "Zancada búlgara" → sentadilla búlgara) ya usan esa foto: están en \`EJ_ALIAS\`, en \`js/08-rutinas-ia-fallback.js\`.\n`;
fs.writeFileSync(path.join(R,'docs/IMAGENES-PENDIENTES.md'),md);
console.log('Faltan',total,'imágenes →',GRUPOS.map(([g])=>g+':'+[...filas.values()].filter(f=>f.grupo===g).length).join(' '),'· omitidos',omitidos.length);
