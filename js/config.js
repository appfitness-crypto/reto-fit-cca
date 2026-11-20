/* ═══ CONFIGURACIÓN DE LA APP ═══
   Reto Fit CCA: reto de 12 semanas (gimnasio y clases). Nombre, marca, fechas del reto, Firebase e IA.
   Para cambiar el nombre: edita "Identidad" aquí y name/short_name en manifest.json.
   Se carga primero, antes que cualquier otro módulo.
   Guía paso a paso: docs/ALTA-GIMNASIO.md */
const GYM = {
  // ── Identidad ──
  nombre:      'Reto Fit CCA',               // nombre completo (inicio, PDF, avisos, IA)
  nombreCorto: 'Reto Fit',                      // nombre al instalar la app y textos cortos
  titulo:      'Reto Fit CCA',               // título de la pestaña del navegador
  descripcion: 'Tu entrenamiento del Reto Fit CCA: 12 semanas con tu entrenador',
  siglas:      'RF',      // insignia del PDF
  siglasCiudad:'CCA',     // texto pequeño bajo las siglas del PDF
  prefijoId:   'RF',      // los socios nuevos salen como #RF-AB12C
  pdf: { linea1:'RETO FIT', linea2:'CCA' },   // encabezado del PDF de la rutina

  // ── Color principal (opcional) ──
  // null = colores originales. Ejemplo: '#1E90FF'. Cambia botones, acentos y gráficas de los temas Día y Noche.
  colorPrincipal: null,
  colorBarra: null,     // opcional: color de la barra del navegador del celular (ej. '#0A0E13')

  // ── Ubicación de un gimnasio (opcional). null = la app no pide la ubicación ──
  // Ejemplo: { lat: 21.8818, lng: -102.2871, radioM: 200 }
  geofence: null,

  // ── Firebase de ESTE gimnasio (Configuración del proyecto → Tus apps → Configuración) ──
  // null = todavía sin base de datos: la app trabaja solo con datos locales del dispositivo.
  // Al crear el Firebase del reto, pega aquí su bloque firebaseConfig (ver docs/PLAN-RETO.md → Base de datos).
  firebase: null,

  // ── Link público de la app (QR y mensajes de invitación). Cambia si se publica en otro dominio ──
  urlApp: 'https://appfitness-crypto.github.io/reto-fit-cca/',

  // ── El reto ──
  reto: {
    nombre: 'Reto Fit CCA',
    inicio: '2027-01-11',   // lunes de arranque (AAAA-MM-DD). Ajusta a la fecha real.
    semanas: 12,
    // Solo estos 3 objetivos se evalúan en el reto (el registro no ofrece otros)
    objetivos: ['GANAR MÚSCULO','PERDER PESO','RECOMPOSICIÓN CORPORAL'],
    // Fases del reto por semana (la progresión por bloques de la app sigue funcionando dentro de cada fase)
    fases: [
      { desde:1, hasta:4,  nombre:'Adaptación' },
      { desde:5, hasta:8,  nombre:'Fuerza e hipertrofia' },
      { desde:9, hasta:12, nombre:'Definición y cierre' }
    ],
    evaluaciones: [0, 6, 12]  // semanas de evaluación (peso, % grasa, medidas, fotos)
  },

  // ── IA de rutinas (Cloudflare Worker). Vacío = plantillas locales ──
  aiEndpoint: '',

  // ── Aviso de privacidad (revísalo con tu asesor legal antes de publicar) ──
  privacidad: {
    responsable: '',    // tu nombre o razón social (vacío = el nombre de la app)
    domicilio: '',      // domicilio completo del responsable (recomendado)
    correo: '',         // correo para derechos ARCO (recomendado)
    telefono: '',
    version: '1.0',     // si cambias el texto, sube la versión: se les vuelve a pedir aceptar
    fecha: ''           // ej. 'octubre 2026'
  }
};

/* Aplica la marca a la página: título, descripción, color y textos con data-gym.
   Los textos de index.html llevan data-gym="nombre" | "corto" y las imágenes data-gym-alt. */
function aplicarMarca(){
  try{
    document.title = GYM.titulo;
    const setMeta=(sel,val)=>{ const m=document.querySelector(sel); if(m) m.setAttribute('content',val); };
    setMeta('meta[name="description"]', GYM.descripcion);
    setMeta('meta[name="apple-mobile-web-app-title"]', GYM.nombreCorto);
    document.querySelectorAll('[data-gym="nombre"]').forEach(e=>{ e.textContent=GYM.nombre; });
    document.querySelectorAll('[data-gym="corto"]').forEach(e=>{ e.textContent=GYM.nombreCorto; });
    document.querySelectorAll('[data-gym-alt]').forEach(e=>{ e.setAttribute('alt',GYM.nombreCorto); });
    document.querySelectorAll('[data-gym-label]').forEach(e=>{ e.setAttribute('aria-label',GYM.nombreCorto); });
  }catch(e){ console.warn('aplicarMarca',e); }
  aplicarColorMarca();
}
function aplicarColorMarca(){
  const c=GYM.colorPrincipal;
  if(!c || !/^#[0-9a-fA-F]{6}$/.test(c)) return;
  // Texto del botón: oscuro sobre colores claros, blanco sobre colores oscuros
  const r=parseInt(c.slice(1,3),16), g=parseInt(c.slice(3,5),16), b=parseInt(c.slice(5,7),16);
  const lum=(0.2126*r+0.7152*g+0.0722*b)/255;
  const btn = lum>0.55 ? '#0E1318' : '#FFFFFF';
  const m=(p,w)=>`color-mix(in srgb,${c} ${p}%,${w})`;
  const css=`
:root,html[data-theme="light"]{--lime:${m(85,'white')};--v:${m(62,'black')};--v2:${c};--btn-tx:${btn};
  --grad:linear-gradient(180deg,${m(88,'white')} 0%,${c} 100%);--grad-txt:linear-gradient(135deg,${m(62,'black')},${m(42,'black')});
  --glow:0 8px 20px -8px ${m(60,'transparent')};--gl2:${m(30,'transparent')};}
html[data-theme="dark"]{--lime:${c};--v:${c};--v2:${m(80,'black')};--btn-tx:${btn};
  --grad:linear-gradient(180deg,${m(90,'white')} 0%,${c} 100%);--grad-txt:linear-gradient(135deg,${c},${m(70,'black')});
  --glow:0 10px 26px -8px ${m(40,'transparent')};--gl2:${m(13,'transparent')};}`;
  const st=document.createElement('style'); st.id='gym-color'; st.textContent=css; document.head.appendChild(st);
  try{ const tc=document.querySelector('meta[name="theme-color"]'); if(tc && GYM.colorBarra) tc.setAttribute('content',GYM.colorBarra); }catch(e){}
}
// Título y meta ya en <head>; textos y color cuando exista el cuerpo
aplicarMarca();
document.addEventListener('DOMContentLoaded', aplicarMarca);
