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
- [x] **Desconectado del Firebase de la app original** (`firebase: null`, `.firebaserc` y el flujo de publicación apuntan a `reto-fit-cca`), para no mezclar datos con tu app pública.
- [x] La foto de la portada ya no dice "Fitness Pro" (provisional, hasta que subas fotos del CCA).

**Qué falta para probarlo completo:** sin base de datos no se pueden crear cuentas ni validar códigos. La evaluación, los objetivos y el link con código ya se ven funcionando.

## 3. Siguiente etapa: base de datos

1. Crear el proyecto de Firebase **`reto-fit-cca`** (Realtime Database + Authentication con correo y anónimo). Guía: `docs/ALTA-GIMNASIO.md`, partes A y C.
2. Pegar su `firebaseConfig` en `js/config.js` → `firebase`.
3. Hacerte director: crea tu cuenta y en `roles/<tu UID>` pon `coordinador`.
4. **Plan Blaze (pago por uso):** el plan gratuito solo aguanta **100 conexiones simultáneas** y en las horas pico de 300 socios se puede rebasar. A este volumen el costo esperado es de pocos dólares al mes; pon una alerta de presupuesto.
5. **Reglas:** hoy cualquier cuenta puede darse el rol `entrenador` sola (así funciona la app pública). Para el reto conviene que **solo el director** cree entrenadores: hay que cambiar `roles` en `firebase-rules.json` y volver a probarlo con el emulador.
6. Datos nuevos que se agregan:
   - `/reto/config`: fechas, fases y puntos (para cambiarlos sin publicar código).
   - `/asistencia/<fecha>/<uid>`: check-in.
   - `/clases`, `/reservas`: horario, cupo y lista de espera.
   - `/evaluaciones/<uid>/<semana>`: peso, % de grasa, masa muscular, medidas, pruebas y fotos (en Storage, privadas).
   - `/caja/<recibo>` (opcional): lista de pagos de caja para cruzarla con los registrados y saber quién pagó y no se ha registrado.

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
