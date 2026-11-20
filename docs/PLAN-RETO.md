# Plan: Reto Fit CCA (12 semanas, unas 300 personas)

**Objetivo:** usar `app-fitness` como base para una app dedicada a un reto fitness de 3 meses, con gimnasio y clases. Cada socio tiene su entrenamiento, registra pesos y repeticiones como ya lo hace la app y ve la técnica de cada ejercicio. El director registra entrenadores que le ayudan con el seguimiento, y la recepción (front desk) inscribe, hace el check-in y agenda.

Maquetas de recepción: `docs/maquetas/frontdesk.html` (ábrelo en el navegador) y las capturas en `docs/maquetas/capturas/`.

---

## 1. Cómo se clona

1. Copiar los archivos de `app-fitness` (sin su historial de git) a `reto-fit-cca`, como primer commit.
2. Crear un **Firebase nuevo** (`reto-fit-cca`) para que los datos del reto no se mezclen con los de la app pública. Se sigue `docs/ALTA-GIMNASIO.md`.
3. Cambiar la marca en `js/config.js`, `manifest.json`, `icons/` y `sw.js` (`CACHE_VERSION = reto-fit-cca-v1`).
4. Publicar con GitHub Pages en su propio link.

## 2. Qué se queda, qué se apaga y qué se agrega

### Se queda (ya funciona en la app)
| Módulo | Para qué sirve en el reto |
|---|---|
| Rutinas y motor de rutinas (`08`, `14`, `42`) | Rutina de cada socio |
| Registro de sesión (`15`, `38`, `40`) | Pesos, repeticiones, series y sensación del esfuerzo |
| Progresión por bloques (`21`) | Se ajusta a las 3 fases del reto |
| Catálogo de ejercicios con fotos (`00`, `18`) | Base para la técnica |
| Mi cuerpo, medidas y composición (`11`, `13`, `04`) | Evaluaciones de las semanas 0, 6 y 12 |
| Panel del staff, ficha del socio, entrenadores (`17`, `19`, `25`) | Seguimiento por entrenador |
| QR del entrenador (`47`) | Se reutiliza para el QR del socio |
| Resumen y riesgo de abandono (`22`) | Tablero del director y de recepción |
| Nutrición (`03`, `48`–`50`) | **Opcional**, depende de lo que decidas |

### Se apaga o se simplifica
- **Mensualidad** (`02`): se cambia por la *inscripción al reto* (pagado, parcial o pendiente).
- **Cuentas públicas y código de entrenador** (`36`, `27`): en el reto la recepción da de alta al socio y le asigna entrenador. Ya no hay "Soy nuevo" abierto.
- **Rutina en casa** (`30`, `31`) y **deportes** (`12`): se ocultan.
- **Geocerca** (`06`): se cambia por el check-in con QR en recepción.
- **Play Store y privacidad pública**: no hacen falta para el reto (se queda la app instalable).

### Se agrega
1. **El reto como entidad:** fecha de inicio, 12 semanas, fases (1–4 adaptación, 5–8 fuerza e hipertrofia, 9–12 definición), día y semana actuales visibles en toda la app.
2. **Rol de recepción:** inscribe, hace el check-in, reserva clases y agenda evaluaciones. **No** edita rutinas. Requiere el rol `recepcion` en `firebase-rules.json` y probarlo con el emulador, como se probaron los 53 casos actuales.
3. **Inscripción guiada (5 pasos):** datos, salud y objetivo (reusa el cuestionario `07`), entrenador y horario con sugerencia automática por carga, pago y cita de evaluación inicial. Al final se manda el acceso al socio por WhatsApp.
4. **Asignación de entrenadores:** tope de socios por entrenador (por ejemplo, 300 socios entre 10 entrenadores son unos 30 cada uno), botón "Balancear" y reasignación en grupo.
5. **Check-in con QR:** el socio muestra su QR en la app y la recepción lo escanea con la cámara de la tableta o la computadora. También se puede buscar por nombre o teléfono. Se ve qué le toca hoy, sus avisos y su estado de pago.
6. **Clases:** horario semanal, cupo, reservación desde la app, lista de espera y pase de lista.
7. **Técnica de ejercicios:** en cada ejercicio, un video corto, 3 puntos clave y los errores comunes. El campo `video` se agrega al catálogo `KB_*`. Recomiendo **YouTube no listado**: no gasta el ancho de banda de GitHub Pages y carga bien en el celular.
8. **Evaluaciones de las semanas 0, 6 y 12:** agenda en bloques de 15 minutos con peso, % de grasa, masa muscular, medidas, pruebas físicas y 3 fotos privadas.
9. **Ranking y puntos:** por asistencia, entrenos registrados, clases, rachas, evaluaciones y mejora final. El director configura cuántos puntos vale cada cosa.
10. **Seguimiento del entrenador:** semáforo de sus socios (sin venir, sin registrar pesos, evaluación pendiente) y porcentaje de socios revisados por semana, que el director ve en la pantalla de Entrenadores.
11. **Exportar a Excel** y **reporte final del reto** (antes y después de cada socio y ganadores).

## 3. Escalar a 300 personas: decisiones técnicas
- **Firebase plan Blaze (pago por uso):** el plan gratuito (Spark) solo permite **100 conexiones simultáneas**. En las horas pico de un reto de 300 personas eso se puede rebasar. Con Blaze, a este volumen, el costo esperado es de pocos dólares al mes; conviene poner una alerta de presupuesto.
- **Fotos de progreso** en Firebase Storage, con reglas: solo el socio, su entrenador y el director.
- **Índices:** la lista del panel ya usa `/indice` (es ligera). Se agregan índices por `entrenadorId`, `horario` y `estadoReto`.
- **Sin conexión:** la bandeja de cambios pendientes que ya existe sigue sirviendo si falla el wifi del gimnasio.

## 4. Fases de trabajo
| Fase | Qué incluye | Resultado |
|---|---|---|
| 0 · Clonar y cambiar la marca | Copia, Firebase nuevo, config, íconos, quitar módulos que no se usan | App del reto funcionando con lo actual |
| 1 · Roles e inscripción | Rol `recepcion`, reglas probadas, inscripción en 5 pasos, asignación y balanceo | La recepción puede dar de alta |
| 2 · Check-in y clases | QR del socio, escáner, asistencia, horario, reservas, lista de espera | Día a día del gimnasio |
| 3 · Técnica | Campo de video, puntos clave y errores en la ficha del ejercicio | El socio ve cómo se hace cada ejercicio |
| 4 · Evaluaciones y ranking | Agenda, captura, fotos, puntos y tabla | Medición del reto |
| 5 · Piloto | 15–20 socios y 2 entrenadores, 1 semana; corregir | Listo para 300 |
| 6 · Lanzamiento | Inscripción masiva, capacitación de recepción y entrenadores | Arranca el reto |

## 5. Lo que necesito que decidas
1. **Fecha de inicio** del reto y si hay inscripción tardía.
2. **Cuántos entrenadores** y el tope de socios para cada uno.
3. **Pago:** ¿solo se registra en la app (pagado, parcial o pendiente) o se cobra en línea?
4. **Nutrición:** ¿entra en el reto o se queda fuera?
5. **Clases:** cuáles, con qué horarios y qué cupo.
6. **Ranking:** ¿público para todos, o cada quien ve solo su lugar?
7. **Videos de técnica:** ¿los grabas tú, o usamos videos de referencia mientras tanto?
8. **Premios / criterio del ganador:** ¿por puntos, por % de cambio corporal o por los dos?
