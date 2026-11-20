# Plan: Reto Fit CCA (12 semanas, unas 300 personas)

**Objetivo:** controlar un reto fitness de 3 meses en gimnasio y clases. El socio tiene su rutina, registra sus pesos, repeticiones y series como en la app original y ve la técnica de sus ejercicios. El director da de alta a los entrenadores que le ayudan con el seguimiento de los socios.

Maquetas del panel de control: `docs/maquetas/frontdesk.html` (ábrelo en el navegador) y las capturas en `docs/maquetas/capturas/`.

---

## 1. Cómo funciona la organización

| Quién | Qué hace | Dónde |
|---|---|---|
| **Caja** | Cobra la inscripción y le da al socio el **QR o el link** de la app | Fuera de la app |
| **Socio** | Crea su cuenta con su correo, contesta la evaluación, elige su objetivo y escribe el código de su entrenador. Después entrena, registra sus pesos y ve la técnica | App (celular) |
| **Entrenador** | Ve a sus socios, **modifica sus ejercicios**, revisa sus registros y les da seguimiento | Panel del staff |
| **Director (tú)** | Da de alta a los entrenadores, define su filosofía de entrenamiento, ve a todos los socios y lleva el control del reto | Panel del staff + panel de control |
| **Control / recepción** (opcional) | Check-in, clases, agenda de evaluaciones y socios que se atoran en el registro. **No inscribe ni cobra** | Panel de control |

### Registro del socio (igual que la app original)
1. Paga en caja → recibe el QR (cartel o impreso) o el link por WhatsApp.
2. Abre la app → **Soy nuevo** → correo y contraseña.
3. Evaluación (11 pasos) para perfilar al socio. En el paso 2 elige **uno de los 3 objetivos**:
   - **Incremento de masa muscular**
   - **Bajar porcentaje de grasa**
   - **Recomposición corporal**
4. Último paso: el código de su entrenador. Si entró con el link del entrenador (`…/?ent=ENT-XXXX`), el código ya viene escrito y se valida solo.
5. Acepta su plan → sale su rutina **con la filosofía de ese entrenador**.
6. El entrenador lo ve en su panel y ajusta sus ejercicios cuando quiera.

## 2. Hecho en esta etapa (sin base de datos)

- [x] App copiada desde `app-fitness` (sin el historial de git).
- [x] Marca: Reto Fit CCA en `js/config.js`, `manifest.json`, la barra del staff, la portada y el PDF (siglas RF / CCA, folios `#RF-…`).
- [x] **Solo 3 objetivos** en el registro y en el panel del staff (`GYM.reto.objetivos`). Se quitaron "Rendimiento deportivo" y "Lesión o dolor".
- [x] Si el socio marca una lesión, ya no se le ofrece un plan de rehabilitación: el plan de su objetivo cuida la zona lesionada.
- [x] La filosofía del entrenador pide solo 2 rutinas modelo (fuerza/hipertrofia y pérdida de grasa). Se quitó la de rendimiento.
- [x] **Fechas del reto** en `js/config.js` → `reto` (inicio, 12 semanas, 3 fases, evaluaciones en las semanas 0, 6 y 12). Nuevo módulo `js/53-reto.js`:
  - Portada: "El reto arranca en N días" / "Día X de 84 · Semana N de 12".
  - Inicio del socio: tarjeta con la semana, una barra de avance, la fase y el aviso de semana de evaluación.
  - Panel del staff: el mismo texto junto al nombre.
- [x] **Link con código del entrenador**: `?ent=ENT-XXXX` deja el código escrito en el último paso. El mensaje de "Mi código" del entrenador ya manda ese link.
- [x] QR nuevo (`img/qr/app.png`) que apunta a `https://appfitness-crypto.github.io/reto-fit-cca/` (se cambia en `GYM.urlApp` y regenerando el QR si se publica en otro dominio).
- [x] Los entrenadores ya no se registran solos desde la portada: el director los da de alta (Menú → Entrenadores → Nuevo). En la portada quedó "Soy entrenador del reto: entrar con mi cuenta".
- [x] **Separado del Firebase de la app original**: usa su propio proyecto `reto-fit-cca` (`js/config.js`, `.firebaserc` y el flujo de publicación).
- [x] La foto de la portada ya no dice "Fitness Pro" (provisional, hasta que subas fotos del CCA).

- [x] **🏆 Tablero del reto** en el panel del staff (`js/54-tablero-reto.js`). El director ve a todos y cada entrenador solo a sus socios:
  - indicadores: socios, quién entrenó en los últimos 7 días, sesiones de la semana y socios en riesgo (5 días o más sin entrenar);
  - gráfica de sesiones por día, socios por objetivo y seguimiento por entrenador;
  - **ranking por objetivo** (una tabla para cada uno de los 3). Puntos = constancia (sesiones, semanas con 3 o más sesiones, mediciones) + progreso según el objetivo (% de grasa estimado o cintura, peso, fuerza ganada y brazo). Se exporta a CSV;
  - los puntos se pueden ajustar en `js/config.js` → `reto.puntos` (por ejemplo `{ sesion: 40 }`).

**Para probarlo completo** faltan los pasos de la consola de la sección 3 (reglas, autenticación y tu cuenta de director).

## 3. Base de datos: conectar el Firebase `reto-fit-cca`

**Ya hecho en el código**
- [x] `js/config.js` → `firebase` con la configuración del proyecto `reto-fit-cca`.
- [x] `databaseURL` = `https://reto-fit-cca-default-rtdb.firebaseio.com` (confirmada).
- [x] Reglas (`firebase-rules.json`): ya nadie puede darse el rol de entrenador solo; **solo el director** crea entrenadores. Se probaron con el emulador de Firebase (10 de 10 casos):
  - un socio no puede ponerse rol de entrenador ni de director;
  - un entrenador no puede volverse director;
  - un socio no ve el expediente de otro;
  - un entrenador no ve a socios que no son suyos;
  - una sesión anónima no puede crear expedientes;
  - el director sí puede crear entrenadores y reservar su código;
  - el entrenador sí puede borrar su propia cuenta.
- [x] Los usuarios del staff que crea el director entran solo con su usuario (internamente `usuario@staff.retofitcca.app`).

**Pasos en la consola de Firebase (una sola vez)**
1. **Realtime Database → Crear base de datos** (si no existe): ubicación Estados Unidos, modo bloqueado.
2. **Realtime Database → Reglas**: pega todo `firebase-rules.json` → **Publicar**.
3. **Authentication → Comenzar → Método de acceso**: habilita **Correo electrónico/contraseña** y **Anónimo** (la sesión anónima sirve para validar el código del entrenador antes de que el socio tenga cuenta).
4. **Authentication → Configuración → Dominios autorizados**: agrega `appfitness-crypto.github.io` (o el dominio donde se publique la app).
5. **Tu cuenta de director**: Authentication → Usuarios → **Agregar usuario** con tu correo y una contraseña. Copia el **UID**. En Realtime Database → Datos agrega `roles` → `<tu UID>` = `coordinador`.
6. Entra a la app con **"Soy entrenador del reto: entrar con mi cuenta"** usando ese correo. Verás el panel del director.
7. En el panel: **🧬 Mi filosofía** (es el plan para los socios que entren sin código) y **➕ Nuevo entrenador** para cada entrenador. Cada uno recibe su código `ENT-XXXX` y, desde "Mi código", el link con su código ya puesto.
8. **Plan Blaze (pago por uso)**: el plan gratuito aguanta solo **100 conexiones simultáneas**; con 300 socios conviene cambiarlo antes del arranque y poner una alerta de presupuesto.

**Publicar la app**: GitHub → Settings → Pages → rama `main`, carpeta raíz. Queda en `https://appfitness-crypto.github.io/reto-fit-cca/`, que es a donde apunta el QR. Opcional: el flujo `.github/workflows/firebase-hosting.yml` publica en `https://reto-fit-cca.web.app` y sube las reglas solo; necesita el secreto `FIREBASE_SERVICE_ACCOUNT` (ver `docs/PLAY-STORE.md`).

**Datos nuevos para las siguientes etapas**
- `/reto/config`: fechas, fases y puntos (para cambiarlos sin publicar código).
- `/asistencia/<fecha>/<uid>`: check-in.
- `/clases`, `/reservas`: horario, cupo y lista de espera.
- `/evaluaciones/<uid>/<semana>`: peso, % de grasa, masa muscular, medidas, pruebas y fotos (en Storage, privadas).
- `/caja/<recibo>` (opcional): lista de pagos de caja para saber quién pagó y no se ha registrado.

## 4. Etapas después de la base de datos

| Etapa | Qué incluye |
|---|---|
| Panel de control | Las pantallas de las maquetas: tablero, registro y QR, socios, carga por entrenador, entrenadores |
| Check-in y clases | QR del socio en su app, escáner en la recepción, asistencia, reservas y pase de lista |
| Técnica de ejercicios | Video corto por ejercicio (recomiendo YouTube no listado), 3 puntos clave y errores comunes en la ficha del ejercicio |
| Evaluaciones y ranking | Agenda de las semanas 0, 6 y 12, captura, fotos y **un ranking por cada objetivo** (cada categoría tiene su ganador) |
| Piloto | 15–20 socios y 2 entrenadores durante 1 semana |
| Arranque | Carteles con el QR en caja, links de cada entrenador, capacitación |

## 5. Pendiente de decidir
1. **Fecha real de inicio** (hoy está puesta el lunes 11 de enero de 2027 en `js/config.js`).
2. Cuántos entrenadores y el tope de socios para cada uno.
3. ¿El socio que no tiene código de entrenador sigue tu filosofía (director), o se le asigna uno después?
4. ¿La nutrición entra en el reto? Hoy la pestaña sigue activa.
5. Clases: cuáles, con qué horarios y qué cupo.
6. Cómo se mide al ganador de cada objetivo (propuesta: bajar grasa → % de grasa perdido; masa muscular → kg de músculo ganados; recomposición → las dos cosas).
7. ¿Caja puede compartir su lista de pagos (Excel) para cruzarla con los registrados?
