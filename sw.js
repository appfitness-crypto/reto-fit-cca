/* ════════════════════════════════════════════════════════
   FITNESS SYSTEM PRO — Service Worker (modo sin conexión)
   → La app (HTML): red primero con límite de 4 s; si no hay
     internet o la señal es muy lenta, abre la copia guardada.
   → Fotos, íconos, Firebase SDK, PDF y tipografías: se
     guardan al instalar y se sirven desde el dispositivo
     (se actualizan en segundo plano cuando hay internet).
   → Los datos de Firebase NUNCA pasan por aquí (van directo).
   → Al desplegar cambios, sube CACHE_VERSION.
   ════════════════════════════════════════════════════════ */
const CACHE_VERSION = 'retofit-cca-v92';
const PRECACHE_LOCAL = [
  './',
  './index.html',
  './css/estilos.css',
  './css/tema-salvia.css',
  './css/tema-claro.css',
  './css/cine.css',
  './css/cuestionario.css',
  './css/escritorio.css',
  './css/plan-nutri.css',
  './css/nutricion-socio.css',
  './js/config.js',
  './js/00-conocimiento.js',
  './js/01-datos-firebase.js',
  './js/02-mensualidad.js',
  './js/03-nutricion-motor.js',
  './js/04-estadisticas.js',
  './js/05-seed-demo.js',
  './js/06-geofence-sesion-login.js',
  './js/07-quiz.js',
  './js/08-rutinas-ia-fallback.js',
  './js/09-pdf-rutina.js',
  './js/10-tema-fondo.js',
  './js/11-composicion-rehab.js',
  './js/12-deportes-club.js',
  './js/13-mi-cuerpo.js',
  './js/14-motor-rutinas.js',
  './js/15-registro-sesion.js',
  './js/16-socios-admin.js',
  './js/17-panel-staff.js',
  './js/18-editor-ejercicios.js',
  './js/19-ficha-socio-estado.js',
  './js/20-dialogos.js',
  './js/21-progresion.js',
  './js/30-casa-catalogo.js',
  './js/31-casa-motor.js',
  './js/32-filosofia-modelos.js',
  './js/33-teclado-botones.js',
  './js/34-apariencia.js',
  './js/35-indice-socios.js',
  './js/36-cuentas.js',
  './js/37-iconos.js',
  './js/38-entreno.js',
  './js/39-metodologia.js',
  './js/40-autorregulacion.js',
  './js/41-evaluacion-cuidado.js',
  './js/42-rutina-unica.js',
  './js/43-mover-sesion.js',
  './js/44-instalar-app.js',
  './js/45-vista-socio.js',
  './js/46-registro-objetivo.js',
  './js/47-qr-entrenador.js',
  './js/48-menu-sugerido.js',
  './js/49-menu-staff.js',
  './js/50-nutricion-socio.js',
  './js/51-carga-dia.js',
  './js/52-navegacion.js',
  './js/53-reto.js',
  './js/54-tablero-reto.js',
  './js/55-socio-reto.js',
  './js/56-demo-reto.js',
  './js/57-avisos.js',
  './js/58-mascotas.js',
  './js/59-cine.js',
  './js/60-patrocinadores.js',
  './js/61-reparto.js',
  './js/62-perfil-credencial.js',
  './js/63-plan-intro.js',
  './js/64-mensajes.js',
  './js/65-recorrido.js',
  './js/66-reglas-reto.js',
  './js/67-mediciones-oficiales.js',
  './js/68-nutriologo.js',
  './js/69-ficha-orden.js',
  './js/70-plan-nutriologo.js',
  './js/71-permisos-staff.js',
  './js/72-clases-recuestionario.js',
  './js/73-actividad-medida.js',
  './js/74-clases-vista.js',
  './img/qr/app.png',
  './js/22-resumen-coordinacion.js',
  './js/23-conocimiento-staff.js',
  './js/24-filosofia-entrenador.js',
  './js/25-entrenadores-admin.js',
  './js/26-nutricion-staff.js',
  './js/27-seleccion-entrenador.js',
  './js/28-pwa.js',
  './js/29-privacidad.js',
  './js/99-arranque.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/logo-inicio.webp',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './img/grupos/abdomen.webp',
  './img/grupos/biceps.webp',
  './img/grupos/braquial.webp',
  './img/grupos/cardiovascular.webp',
  './img/grupos/core.webp',
  './img/grupos/cuadriceps.webp',
  './img/grupos/deltoides.webp',
  './img/grupos/dorsal.webp',
  './img/grupos/erectores.webp',
  './img/grupos/espalda.webp',
  './img/grupos/femorales.webp',
  './img/grupos/gemelos.webp',
  './img/grupos/gluteo.webp',
  './img/grupos/manguito.webp',
  './img/grupos/oblicuos.webp',
  './img/grupos/pecho.webp',
  './img/grupos/recto.webp',
  './img/grupos/trapecio.webp',
  './img/grupos/triceps.webp',
  './img/hero/bienvenida.webp',
  './img/hero/bienvenida-recorte.webp',
  './img/hero/inicio.webp',
  './img/hero/inicio-recorte.webp',
  './img/medallas/nivel-1.webp',
  './img/medallas/nivel-2.webp',
  './img/medallas/nivel-3.webp',
  './img/medallas/nivel-4.webp',
  './img/medallas/nivel-5.webp',
  './img/sesiones/accesorios.webp',
  './img/sesiones/cardio.webp',
  './img/sesiones/cardiovascular.webp',
  './img/sesiones/descanso.webp',
  './img/sesiones/espalda.webp',
  './img/sesiones/full.webp',
  './img/sesiones/general.webp',
  './img/sesiones/hombro.webp',
  './img/sesiones/movilidad.webp',
  './img/sesiones/pecho.webp',
  './img/sesiones/pierna.webp',
  './img/sesiones/torso.webp',
  './img/cuerpo/frente.webp',
  './img/cuerpo/espalda.webp',
  './img/cuerpo/lado.webp',
  './img/cuerpo/mujer-frente.webp',
  './img/cuerpo/mujer-espalda.webp',
  './img/cuerpo/mujer-lado.webp',
  './vendor/jspdf/jspdf.umd.min.js',
];
const PRECACHE_CDN = [
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/10.12.0/firebase-auth-compat.js',
  'https://fonts.googleapis.com/css2?family=Kanit:ital,wght@0,600;0,700;0,800;1,700;1,800&family=Figtree:wght@400;500;600;700;800&display=swap',
];
// Solo estos dominios externos se guardan (librerías y tipografías). Firebase Database queda fuera.
const CDN_HOSTS = ['www.gstatic.com','cdnjs.cloudflare.com','fonts.googleapis.com','fonts.gstatic.com'];

/* Instalar: la app (HTML, css y js) tiene que bajar COMPLETA; si falta un archivo, la instalación falla, la versión
   anterior sigue funcionando con su copia y el navegador lo reintenta después. Antes se activaba a medias y, con la
   señal lenta, la app abría sin estilos ni código. Fotos, íconos y librerías externas: si alguna falla, no importa.

   Solo se baja lo que CAMBIÓ: antes cada versión nueva volvía a descargar los ~4.5 MB completos en cada celular
   (con 700 socios, unos 3 GB por publicación). Ahora, por cada archivo que ya estaba guardado, se le pregunta al
   servidor con su huella (ETag / Last-Modified); si contesta 304 "sin cambios" (unos cientos de bytes), se reutiliza
   la copia del celular. Lo guardado al usarse (fotos de ejercicios, menús, mascotas, lector InBody, tipografías)
   pasa tal cual a la versión nueva en lugar de borrarse y volver a bajarse. */
const ESENCIAL = (u) => u === './' || /\.(html|css|js)$/.test(u);
const ALCANCE = new URL(self.registration.scope).pathname;
// Código de la app (index, js/ y css/ de la raíz): nunca se arrastra de otra versión, siempre sale de la lista de arriba
function esCodigoApp(url){
  const u = new URL(url, self.location.href);
  if (u.origin !== self.location.origin) return false;
  const rel = u.pathname.indexOf(ALCANCE) === 0 ? u.pathname.slice(ALCANCE.length) : u.pathname.replace(/^\//, '');
  return rel === '' || /\.html$/.test(rel) || /^(js|css)\/[^\/]+\.(js|css)$/.test(rel);
}
async function cachesViejas(){
  return (await caches.keys()).filter((k) => k !== CACHE_VERSION && k.indexOf('retofit-') === 0).reverse();   // la más nueva primero
}
async function buscarVieja(viejas, url){
  for (const n of viejas){ const r = await (await caches.open(n)).match(url); if (r) return r; }
  return null;
}
// Archivo propio: con copia anterior, petición condicional (304 = se reutiliza); sin copia, descarga normal
async function bajarPropio(c, url, vieja, opcional){
  const et = vieja && vieja.headers.get('ETag'), lm = vieja && vieja.headers.get('Last-Modified');
  if (!et && !lm) return c.add(new Request(url, { cache: 'reload' }));
  const h = {}; if (et) h['If-None-Match'] = et; if (lm) h['If-Modified-Since'] = lm;
  let res;
  try { res = await fetch(url, { headers: h, cache: 'no-store' }); }
  catch (err) { if (opcional) return c.put(url, vieja); throw err; }   // sin señal: una foto se queda con la copia anterior
  if (res.status === 304) return c.put(url, vieja);
  if (res.ok) return c.put(url, res);
  throw new Error(url + ' ' + res.status);
}
// Librerías externas (URLs con versión fija): si ya estaban guardadas, no se vuelven a pedir
async function bajarCdn(c, url, vieja){
  if (vieja) return c.put(url, vieja);
  return c.add(new Request(url, { mode: 'cors', credentials: 'omit' }));
}
// Lo que se guardó al usarse (no está en las listas) pasa a la versión nueva; el paso 3 de abajo lo refresca al usarlo
async function pasarGuardados(c, viejas){
  const ya = new Set((await c.keys()).map((r) => r.url));
  for (const n of viejas){
    const vc = await caches.open(n);
    for (const req of await vc.keys()){
      if (ya.has(req.url) || esCodigoApp(req.url)) continue;
      const r = await vc.match(req);
      if (r){ await c.put(req, r); ya.add(req.url); }
    }
  }
}
self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(CACHE_VERSION);
    const viejas = await cachesViejas();
    const propio = (opcional) => async (u) => bajarPropio(c, u, await buscarVieja(viejas, u), opcional);
    const cdn = async (u) => bajarCdn(c, u, await buscarVieja(viejas, u));
    await Promise.all([
      Promise.all(PRECACHE_LOCAL.filter(ESENCIAL).map(propio(false))),
      Promise.allSettled([
        ...PRECACHE_LOCAL.filter((u) => !ESENCIAL(u)).map(propio(true)),
        ...PRECACHE_CDN.map(cdn),
      ]),
    ]);
    try { await pasarGuardados(c, viejas); } catch (err) {}   // si falla, solo se vuelven a bajar al usarse
    await self.skipWaiting();
  })());
});

/* Activar: borrar cachés de versiones anteriores y tomar control */
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION && k.indexOf('retofit-') === 0).map((k) => caches.delete(k)))   // solo cachés del reto: la app original comparte el dominio
    ).then(() => self.clients.claim())
  );
});

// De dónde salió el HTML de cada pestaña ('red' o 'cache'): sus js/css salen del mismo lado, para no mezclar versiones
const origenPagina = new Map();
function marcarPagina(e, origen){ if(e.resultingClientId){ origenPagina.set(e.resultingClientId, origen); if(origenPagina.size>20) origenPagina.delete(origenPagina.keys().next().value); } }

function guardable(res){ return res && (res.status === 200) && (res.type === 'basic' || res.type === 'cors'); }
function guardar(req, res){ if(guardable(res)){ const copy = res.clone(); caches.open(CACHE_VERSION).then((c) => c.put(req, copy)); } return res; }

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const propio = url.origin === self.location.origin;
  const cdn = CDN_HOSTS.includes(url.hostname);
  if (!propio && !cdn) return;             // Firebase Database, IA, etc.: directo a la red
  if (/\.(mp4|webm)$/i.test(url.pathname)) return;   // videos: piden por partes (206), van directo a la red

  // 1) La app: red primero (máx. 4 s), si no, la copia guardada
  if (req.mode === 'navigate') {
    e.respondWith(new Promise((resolve) => {
      let listo = false;
      // La copia de la app vive en './'. Otra página (privacidad.html, eliminar-cuenta.html) se guarda con su propio
      // nombre: antes pisaba './' y, sin internet, la app abría esa página en lugar del inicio.
      const esApp = esCodigoApp(req.url) && !/\.html$/.test(new URL(req.url).pathname.replace(/index\.html$/, ''));
      const llave = esApp ? './' : req;
      const usarCache = () => (esApp ? Promise.resolve(null) : caches.match(req))
        .then((r) => r || caches.match('./')).then((r) => r || caches.match('./index.html')).then((r) => r || Response.error());
      const timer = setTimeout(() => {
        usarCache().then((r) => { if (!listo && r.type !== 'error') { listo = true; marcarPagina(e, 'cache'); resolve(r); } });
      }, 4000);
      fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE_VERSION).then((c) => c.put(llave, copy)); }
        if (!listo) { listo = true; clearTimeout(timer); marcarPagina(e, 'red'); resolve(res); }
      }).catch(() => {
        clearTimeout(timer);
        usarCache().then((r) => { if (!listo) { listo = true; marcarPagina(e, 'cache'); resolve(r); } });
      });
    }));
    return;
  }

  // 2) El código de la app (js/ y css/): sale del mismo lado que el HTML de esa pestaña (red o copia guardada),
  //    así nunca se mezcla un index.html nuevo con módulos viejos. Si no se sabe (el SW se reinició): red primero
  //    (máx. 4 s) y si no hay internet, la copia guardada.
  if (propio && /\.(js|css)$/.test(url.pathname)) {
    const origen = origenPagina.get(e.clientId);
    // Página abierta desde la copia guardada: sus módulos también (misma versión)
    if (origen === 'cache') {
      e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => guardar(req, res))));
      return;
    }
    // Página que llegó de la red: sus módulos también de la red, aunque tarden (la copia solo si no hay internet)
    if (origen === 'red') {
      e.respondWith(fetch(req).then((res) => guardar(req, res)).catch(() => caches.match(req).then((r) => r || Response.error())));
      return;
    }
    e.respondWith(new Promise((resolve) => {
      let listo = false;
      const timer = setTimeout(() => {
        caches.match(req).then((r) => { if (r && !listo) { listo = true; resolve(r); } });
      }, 4000);
      fetch(req).then((res) => {
        guardar(req, res);
        if (!listo) { listo = true; clearTimeout(timer); resolve(res); }
      }).catch(() => {
        clearTimeout(timer);
        caches.match(req).then((r) => { if (!listo) { listo = true; resolve(r || Response.error()); } });
      });
    }));
    return;
  }

  // 3) Todo lo demás (fotos, íconos, librerías, tipografías):
  //    desde el dispositivo al instante y se actualiza en segundo plano
  e.respondWith(
    caches.match(req).then((cached) => {
      const red = fetch(req).then((res) => guardar(req, res)).catch(() => cached || Response.error());
      if (cached) { e.waitUntil(red.catch(() => {})); return cached; }
      return red;
    })
  );
});
