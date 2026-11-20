# Reto Fit CCA

App del reto fitness de 12 semanas (gimnasio y clases) del CCA. Está hecha a partir de `app-fitness` y tiene la misma forma de trabajo:

1. El socio paga su inscripción **en caja**. Ahí le dan el **QR o el link** de la app.
2. El socio crea su cuenta con su correo y contesta la evaluación. Elige **uno de los 3 objetivos del reto**:
   - Incremento de masa muscular
   - Bajar porcentaje de grasa
   - Recomposición corporal
3. En el último paso escribe el código de su entrenador. Si entró con el link del entrenador (`?ent=ENT-XXXX`), el código ya viene escrito.
4. La app arma su rutina con la **filosofía de ese entrenador**. El socio registra sus pesos, repeticiones y series, y ve la técnica de cada ejercicio.
5. El entrenador ve a sus socios en su panel y **modifica sus ejercicios**. El director ve a todos, da de alta a los entrenadores y lleva el control del reto.

- Configuración del reto (nombre, fecha de inicio, semanas, fases, objetivos): `js/config.js` → `reto`.
- Plan y estado del proyecto: [`docs/PLAN-RETO.md`](docs/PLAN-RETO.md).
- Maquetas del panel de control: `docs/maquetas/`.
- Estructura del código: [`docs/ESTRUCTURA.md`](docs/ESTRUCTURA.md).

> **Base de datos:** proyecto de Firebase `reto-fit-cca` (configurado en `js/config.js`). Los pasos de la consola (reglas, autenticación y la cuenta del director) están en `docs/PLAN-RETO.md`, sección 3.
