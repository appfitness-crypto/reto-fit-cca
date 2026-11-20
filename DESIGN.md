---
name: Reto Fit CCA
description: La app del socio leída como la tarjeta de score del club; 12 semanas anotadas como 12 hoyos contra par.
colors:
  shell: "#0A3576"
  shell-2: "#0E4294"
  shell-tx: "#FFFFFF"
  shell-mu: "#B9CDEE"
  fair: "#1E7A3C"
  fair-deep: "#18692F"
  lime: "#A6E241"
  lime-bg: "#EAF6D4"
  lime-ink: "#2D5A0C"
  ground: "#E9F0EC"
  card: "#FFFFFF"
  set-active: "#F4F8FD"
  ink: "#0E1B2C"
  ink-2: "#46566B"
  rule: "#D2DCE5"
  rule-2: "#E6ECF1"
  amber: "#9A5B00"
  amber-bg: "#FFF0D6"
  amber-ink: "#5C3700"
  red: "#C02A36"
  stage: "#0A0D13"
typography:
  display:
    fontFamily: "'Barlow Condensed', 'Barlow', system-ui, sans-serif"
    fontSize: "44px"
    fontWeight: 700
    lineHeight: 0.95
    letterSpacing: "-0.01em"
    fontFeature: "\"tnum\""
  headline:
    fontFamily: "'Barlow Condensed', 'Barlow', system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "-0.005em"
    fontFeature: "\"tnum\""
  numeral:
    fontFamily: "'Barlow Condensed', 'Barlow', system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 700
    lineHeight: 1
    fontFeature: "\"tnum\""
  title:
    fontFamily: "'Barlow Condensed', 'Barlow', system-ui, sans-serif"
    fontSize: "19px"
    fontWeight: 700
    lineHeight: 1.2
    fontFeature: "\"tnum\""
  score-cell:
    fontFamily: "'Barlow Condensed', 'Barlow', system-ui, sans-serif"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1
    fontFeature: "\"tnum\""
  body:
    fontFamily: "'Barlow', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "\"tnum\""
  body-strong:
    fontFamily: "'Barlow', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "15px"
    fontWeight: 600
    lineHeight: 1.4
    fontFeature: "\"tnum\""
  meta:
    fontFamily: "'Barlow', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.4
    fontFeature: "\"tnum\""
  label:
    fontFamily: "'Barlow', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.3
    fontFeature: "\"tnum\""
  button:
    fontFamily: "'Barlow', system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "18px"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.01em"
rounded:
  cell: "6px"
  sm: "10px"
  md: "12px"
  lg: "14px"
  xl: "16px"
  card: "18px"
  pill: "99px"
spacing:
  xs: "4px"
  sm: "6px"
  md: "10px"
  lg: "14px"
  xl: "20px"
components:
  button-primary:
    backgroundColor: "{colors.fair}"
    textColor: "{colors.card}"
    typography: "{typography.button}"
    rounded: "{rounded.xl}"
    height: "58px"
    width: "100%"
  button-primary-hover:
    backgroundColor: "{colors.fair-deep}"
  button-club:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.card}"
    typography: "{typography.button}"
    rounded: "{rounded.xl}"
    height: "58px"
    width: "100%"
  icon-button:
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    size: "42px"
  icon-button-hover:
    backgroundColor: "{colors.rule-2}"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "14px 16px"
  shell-band:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.shell-tx}"
    typography: "{typography.display}"
    padding: "0 20px 42px"
  score-current:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.card}"
    typography: "{typography.score-cell}"
    rounded: "{rounded.cell}"
  pill:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"
  pill-link:
    backgroundColor: "{colors.card}"
    textColor: "{colors.shell-2}"
    rounded: "{rounded.pill}"
    padding: "5px 10px"
  tag:
    backgroundColor: "{colors.lime-bg}"
    textColor: "{colors.lime-ink}"
    rounded: "{rounded.pill}"
    padding: "4px 10px"
  goal-chip:
    backgroundColor: "{colors.lime}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    padding: "5px 12px"
  notice:
    backgroundColor: "{colors.amber-bg}"
    textColor: "{colors.amber-ink}"
    rounded: "{rounded.lg}"
    padding: "12px 14px"
  stepper:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.numeral}"
    rounded: "{rounded.lg}"
    height: "64px"
  set-row-done:
    backgroundColor: "{colors.lime-bg}"
    textColor: "{colors.ink}"
    height: "50px"
  set-row-active:
    backgroundColor: "{colors.set-active}"
    padding: "14px 12px 16px"
  set-check-done:
    backgroundColor: "{colors.fair}"
    textColor: "{colors.card}"
    rounded: "{rounded.sm}"
    size: "34px"
  rest-timer:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.card}"
    typography: "{typography.numeral}"
    rounded: "{rounded.xl}"
    padding: "12px 14px"
  tab-bar:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink-2}"
    padding: "6px 6px 22px"
  tab-active:
    textColor: "{colors.shell}"
  media-stage:
    backgroundColor: "{colors.stage}"
    textColor: "{colors.card}"
    height: "380px"
---

# Design System: Reto Fit CCA

## Overview

**Creative North Star: "La tarjeta de score del club"**

El reto se lee como la tarjeta que se llena en el campo de golf del club: doce semanas son doce hoyos, y las sesiones de cada semana se anotan contra la meta igual que los golpes contra el par. Todo lo demás se ordena alrededor de esa tarjeta: una banda azul del club arriba con el logo y la semana actual, cartulina blanca sobre un fondo frío con tinte de pasto, reglas finas azul grisáceo como las de una tarjeta impresa, y números condensados que se leen a la distancia del brazo.

Es un mundo claro, de luz de día y de club, pensado para usarse entre series con una mano y en un gimnasio iluminado. La densidad es media: tarjetas apiladas con 14 px de margen lateral, una sola acción principal grande a la altura del pulgar, y el estado del reto (semana, fase, día) siempre visible. El color de señal es escaso y con significado fijo: verde fairway para lo cumplido y para avanzar, ámbar para lo pendiente, rojo solo para dolor o riesgo.

Este mundo reemplaza deliberadamente el aspecto anterior de la app (fondo casi negro con acento lima neón y anillos de progreso). La lima sobrevive, pero como el color del logo y como marca de subrayado, no como neón sobre negro.

**Key Characteristics:**
- Banda azul del club (`shell`) como encabezado de identidad, con la tarjeta de score montada encima (traslape de 30 px).
- Marcas de score de golf: círculo verde = semana cumplida, cuadro ámbar = semana con faltas, columna azul rellena = semana actual, triángulo ámbar = evaluación.
- Cartulina blanca sobre fondo `ground`, sombras ambientales suaves teñidas de azul marino.
- Barlow Condensed 700 para todos los números y encabezados; Barlow para texto; cifras tabulares en todo el documento.
- Iconos de trazo SVG de 22 px, trazo 2, extremos redondeados.

## Colors

Paleta de club de golf en día claro: azul profundo del logo, verde fairway, lima del logo, tinta marina y señales cálidas usadas con disciplina.

### Primary
- **Azul Club Profundo** (`shell`): la banda de encabezado, la columna de la semana actual en la tarjeta, el temporizador de descanso, los números de pasos de técnica, el avatar del entrenador, el botón "volver" y la pestaña activa. Es la voz de identidad; nunca es el fondo de página.
- **Azul Club Medio** (`shell-2`): enlaces y acciones secundarias de texto ("Ver técnica", "y 3 ejercicios más"), la línea de gráficas, la regla gruesa bajo las fases de la tarjeta, el borde superior de la serie activa, el anillo de foco y el círculo de avatar dentro de la banda.
- **Azul Niebla** (`shell-mu`): texto secundario únicamente sobre la banda azul.

### Secondary
- **Verde Fairway** (`fair`): meta cumplida y acción principal. Botón "Empezar sesión" / "Guardar serie", círculo de semana cumplida, series terminadas, palomita de serie, deltas de progreso favorables, puntos por ganar. **Verde Fairway Profundo** (`fair-deep`) es solo su estado hover.

### Tertiary
- **Lima del Logo** (`lime`): resalte, nunca texto sobre blanco. Nombre de la fase sobre la banda azul, subrayado de la pestaña activa (18×3 px), barra de avance del descanso, chip del objetivo (con tinta `ink` encima), punto de "hoy" en la gráfica y la selección de texto.
- **Lima Pálida** (`lime-bg`) con **Tinta Lima** (`lime-ink`): fondo de series terminadas y de etiquetas de músculo.

### Neutral
- **Pasto Frío** (`ground`): fondo de página de las pantallas con banda.
- **Cartulina** (`card`): tarjetas, barra superior de sesión, barra de pestañas, pie de acción fija y la pantalla de técnica.
- **Tinta Marina** (`ink`): texto principal. **Tinta Pizarra** (`ink-2`): texto secundario, encabezados de columna, unidades.
- **Regla de Tarjeta** (`rule`): bordes estructurales (borde superior de pestañas y pie, anillos de stepper y pill). **Regla Fina** (`rule-2`): divisores dentro de tarjetas, celdas de la tarjeta de score, pista de barras de avance.
- **Celda Activa** (`set-active`): fondo de la serie que se está registrando.
- **Escenario** (`stage`): fondo negro exclusivo del video/foto de técnica y de las miniaturas de ejercicio.

### Señales
- **Ámbar** (`amber`, sobre `amber-bg`, texto `amber-ink`): pendiente o atención. Evaluación próxima (triángulo en la tarjeta, aviso, línea punteada en la gráfica) y semana con faltas (cuadro).
- **Rojo** (`red`): solo dolor o riesgo; hoy aparece únicamente en los iconos de "Errores comunes".

### Named Rules
**The Signal Discipline Rule.** Verde = cumplido o avanzar. Ámbar = pendiente o falta. Rojo = dolor o riesgo. Ningún color de señal se usa como decoración ni cambia de significado entre pantallas.

**The Shell Band Rule.** El azul del club carga la identidad (banda, semana actual, temporizador, pasos, avatar). Nunca se usa como fondo de página; la página es `ground` o `card`.

**The Lime Highlight Rule.** La lima es resalte: va sobre azul, como relleno bajo tinta oscura, o como barra fina. Nunca como color de texto sobre blanco o `ground`.

## Typography

**Display Font:** Barlow Condensed 600/700 (con Barlow, system-ui)
**Body Font:** Barlow 400/500/600/700 (con system-ui, -apple-system, Segoe UI)

Ambas autoalojadas en `css/fuentes/barlow.css`.

**Character:** Una grotesca de señalización deportiva: la condensada pone los números grandes y compactos como en un marcador; la regular mantiene el texto amable y legible en español.

### Hierarchy
- **Display** (Condensed 700, 44 px, 0.95, -0.01em): "Semana 5" en la banda; el "de 12" baja a 26 px 600 en `shell-mu`. El lugar en el reto (12º) es la variante máxima: 56 px, 0.9, en `shell`.
- **Headline** (Condensed 700, 30–34 px, 1): título de pantalla o de ejercicio ("Hoy: pierna y glúteo", "Sentadilla búlgara", "Mi progreso").
- **Numeral** (Condensed 700, 30 px, 1): valores de los steppers y reloj de descanso; 26 px para totales de puntos y datos.
- **Title** (Condensed 700, 19–20 px): títulos de tarjeta ("Tu tarjeta", "Peso por semana"), subtítulos de técnica, marca "Reto Fit CCA", números de serie y deltas.
- **Score cell** (Condensed 600, 16 px): cifras de la tarjeta de score.
- **Body** (Barlow 400, 15 px, 1.4): texto corrido y filas; **Body strong** (600) para nombres de ejercicio y datos clave dentro de una frase.
- **Meta** (Barlow 400, 13–14 px, `ink-2`): subtítulos, prescripción (4 × 10 · 16 kg), notas.
- **Label** (Barlow 600, 12 px, `ink-2`): encabezados de columna, rótulos de fila ("Meta", "Tú"), unidades bajo un número (11 px). Pestañas: 11.5 px 600.
- **Button** (Barlow 700, 18 px, 0.01em): botón principal.

### Named Rules
**The Tabular Figures Rule.** `font-variant-numeric: tabular-nums` está en el `body`; todo número se alinea en columna, sin excepción.

**The Condensed Numbers Rule.** Todo número que el socio lee de lejos (semana, kg, reps, reloj, lugar, puntos, deltas) va en Barlow Condensed 700. Barlow regular solo para números dentro de una frase.

## Layout

Diseñado para teléfono a 390 px de ancho. Estructura vertical: banda o barra superior fija, contenido con scroll, y una barra inferior fija (pestañas en Inicio y Progreso; pie con un solo botón principal en Sesión y Técnica).

- **Márgenes:** las tarjetas van a 14 px del borde; el texto suelto (títulos, avisos, pistas) a 20 px. La tarjeta de score se monta sobre la banda con margen superior de -30 px.
- **Ritmo:** pasos de 4 / 6 / 10 / 14 / 20 px. Separación entre tarjetas 14 px; padding interno de tarjeta 12–16 px; gap de filas 10–12 px.
- **Filas táctiles:** mínimo 50 px por fila de serie, 64 px para steppers, 58 px para el botón principal, 42–44 px para botones de icono y del temporizador.
- **Tarjeta de score:** tabla de ancho fijo con columna de rótulo de 38 px y 12 columnas iguales; las fases se agrupan con una regla de 2 px en `shell-2`.
- **Barra de pestañas:** 5 columnas iguales (Inicio, Rutina, Progreso, Nutrición, Perfil), padding inferior de 22 px para el área segura.

## Elevation & Depth

Híbrido suave: las tarjetas blancas se levantan del fondo `ground` con una sombra ambiental de dos capas teñida de azul marino; los controles dentro de tarjetas usan anillos internos (inset) en lugar de sombra. La única superficie oscura es el escenario de técnica.

### Shadow Vocabulary
- **Tarjeta** (`box-shadow: 0 1px 2px rgba(14,27,44,.06), 0 8px 20px -12px rgba(14,27,44,.22)`): toda tarjeta sobre `ground`.
- **Botón principal** (`box-shadow: 0 1px 1px rgba(14,27,44,.12), 0 10px 22px -10px rgba(30,122,60,.65)`): resplandor verde bajo el CTA; la variante azul usa `0 10px 22px -10px rgba(10,53,118,.6)`.
- **Anillo de control** (`box-shadow: inset 0 0 0 1.5px #D2DCE5`): steppers; 1 px en pills; 2 px en la casilla de serie pendiente.
- **Serie activa** (`box-shadow: inset 0 2px 0 #0E4294`): borde superior azul que marca la fila en edición.

### Named Rules
**The Soft Lift Rule.** Las sombras son ambientales, difusas y teñidas de marino o del color del botón. Nunca sombras duras desplazadas ni bordes gruesos negros.

## Shapes

Esquinas generosas y amables, como cartulina recortada: 18 px en tarjetas, 16 px en el botón principal y el temporizador, 14 px en steppers y avisos, 12 px en botones de icono, 10 px en casillas, miniaturas y pestañas, 6 px en la columna de semana actual (redondeada solo arriba y abajo de la columna). Pills y etiquetas son totalmente redondeadas. Avatares y números de paso son círculos. Las marcas de score son geométricas: círculo de radio 10.5 en caja de 24, cuadro de 20 con radio 2.

## Components

### Buttons
- **Shape:** esquinas suaves (16 px), ancho completo, 58 px de alto, icono de flecha o palomita a la derecha.
- **Primary:** verde fairway con texto blanco, Barlow 700 18 px; una sola por pantalla, siempre a la altura del pulgar.
- **Hover / Active:** hover a `fair-deep` (solo con puntero); al presionar escala a 0.98 en 160 ms con la curva de salida del sistema.
- **Club (azul):** misma forma en `shell`, para regresar a un flujo ("Volver a mi sesión").
- **Botón de icono:** 42 px, radio 12, icono de 22 px; hover `rule-2`. Sobre el escenario: blanco sobre `rgba(255,255,255,.1)`.

### Chips
- **Pill de prescripción:** cartulina con anillo de 1 px `rule`, 13 px 600 ("4 series", "descanso 90 s").
- **Pill enlace:** texto `shell-2` con anillo de 1.5 px al 40 %, icono de 16 px ("Ver técnica").
- **Etiqueta de músculo:** `lime-bg` con `lime-ink`.
- **Chip de objetivo:** `lime` sólido con tinta `ink`, sobre la banda azul.

### Cards / Containers
- **Corner Style:** 18 px.
- **Background:** `card` sobre `ground`.
- **Shadow Strategy:** sombra Tarjeta (ver Elevation & Depth).
- **Border:** ninguno; divisores internos de 1 px `rule-2`.
- **Internal Padding:** 12–16 px; listas con filas de 10–11 px de padding vertical.

### Inputs / Fields
- **Stepper:** el control de captura. Cartulina, radio 14, anillo de 1.5 px `rule`, 64 px de alto, botones de 48 px a cada lado con iconos menos/más en `shell`, valor al centro en Numeral 30 px con la unidad debajo en 11 px. Al presionar un botón, fondo `rule-2`.
- **Casilla de serie:** 34 px, radio 10, anillo de 2 px `rule`; al completar, relleno `fair` con palomita blanca de trazo 3.
- **Foco:** contorno de 3 px `shell-2` con 2 px de separación en todo elemento enfocable.

### Navigation
- **Barra de pestañas:** cartulina con borde superior `rule`; icono de 22 px sobre rótulo 11.5 px 600. Activa: color `shell`, trazo de icono 2.4 y una barra lima de 18×3 px bajo el rótulo.
- **Barra superior de sesión:** cartulina, botón de cerrar a la izquierda, título 16 px 700 con subtítulo meta; debajo, segmentos de avance (uno por ejercicio, 5 px de alto, `fair` completos, `rule-2` pendientes, mitad y mitad para el actual).

### Tarjeta de score (firma)
La pieza que define el mundo. Tabla de tres filas bajo el título "Tu tarjeta": fases agrupadas, número de semana, fila "Meta" en `ink-2` y fila "Tú" con las marcas de golf. La semana actual es una columna rellena de `shell` con cifras blancas; las semanas futuras muestran un punto tenue. Leyenda debajo con las tres marcas y el total a la derecha. Al abrir, la columna actual se rellena (500 ms, retraso 150 ms) y cada marca se traza en 700 ms con 70 ms de escalonamiento; todo detrás de `prefers-reduced-motion: no-preference`. La misma gramática se reutiliza en Progreso a nivel de fase (Fase 1 / 2 / 3 / Total).

### Banda del club
Encabezado `shell` con estado del sistema, logo del club (34 px, radio 9) + "Reto Fit CCA" + avatar del socio (36 px, círculo `shell-2` con anillo blanco al 25 %), la semana en Display y la línea de fase con el nombre en lima. Variante corta (padding inferior 20 px) con un Headline y el chip de objetivo.

### Registro de series
Tarjeta con encabezado de columnas (Serie / Anterior / Kg / Reps / casilla), filas de 50 px; filas terminadas en `lime-bg` con número en `fair` y reps cumplidas circuladas; la serie activa se expande con fondo `set-active`, borde superior azul y dos steppers.

### Temporizador de descanso
Barra `shell` de radio 16 con el reloj en Numeral, rótulo en `shell-mu`, botones translúcidos (blanco al 12 %, 44 px) para "+15 s" y "Saltar", y una barra lima de 3 px al pie que avanza con el tiempo.

### Escenario de técnica
Bloque `stage` de 380 px con el video centrado, botón de volver translúcido arriba a la izquierda y control "Ver movimiento" abajo a la derecha (pill `rgba(7,20,42,.72)` con icono de reproducir en lima). Debajo, en cartulina: pasos numerados con círculos `shell` de 28 px y errores con una X en `red`.

### Aviso
Bloque `amber-bg` de radio 14 con icono ámbar y texto `amber-ink`; solo para algo pendiente con fecha (evaluaciones).

## Do's and Don'ts

### Do:
- **Do** anota el estado de cada semana o fase con las marcas de golf: círculo `fair` = cumplida, cuadro `amber` = faltó, columna `shell` rellena = actual, triángulo `amber` = evaluación.
- **Do** mantén una sola acción principal por pantalla: botón verde de 58 px a ancho completo, a la altura del pulgar o en el pie fijo.
- **Do** pon todo número legible de lejos en Barlow Condensed 700 con cifras tabulares.
- **Do** monta las tarjetas blancas (radio 18) sobre `ground` con la sombra ambiental teñida de marino, a 14 px del borde.
- **Do** usa la lima solo sobre azul, como relleno bajo tinta `ink` o como barra fina.
- **Do** marca los datos estimados o de ejemplo con texto explícito ("estimada", "Datos de ejemplo").
- **Do** usa iconos SVG de trazo (22 px, trazo 2, extremos redondeados) que heredan `currentColor`.
- **Do** condiciona toda animación de entrada a `prefers-reduced-motion: no-preference`.

### Don't:
- **Don't** uses un fondo de página oscuro ni acentos neón; la única superficie negra es el escenario de video/foto de técnica (`stage`).
- **Don't** representes el avance con anillos o arcos de porcentaje; el avance se anota con marcas de golf, segmentos o barras rectas.
- **Don't** uses ámbar o rojo como decoración; ámbar es pendiente o falta, rojo es dolor o riesgo.
- **Don't** pongas texto lima sobre blanco o sobre `ground`.
- **Don't** muestres nombres ni lugares de otros socios en ninguna pieza del sistema; la tarjeta y el lugar son solo del socio.
- **Don't** uses sombras duras desplazadas ni bordes negros gruesos en tarjetas o botones.
