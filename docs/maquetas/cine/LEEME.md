# Propuesta "Salvia + cine"

Maqueta de cómo se vería la app del socio con la energía del video de referencia (escena a pantalla completa, letra gigante detrás de la persona o la mascota y una animación de entrada distinta en cada pantalla). Conserva los colores del tema Salvia, el logo y las 5 pestañas. Todavía **no** cambia la app: es solo para verla y decidir.

- `index.html`: ábrelo en el navegador. Cada pantalla tiene el botón **Antes / Después** y el de repetir la animación. En el teléfono se ve a pantalla completa.
- `capturas/antes-despues.jpg`: las 4 pantallas de hoy contra la propuesta.
- `capturas/propuesta-animada.mp4`: video de 19 s con las animaciones.
- `img/*-recorte.webp`: las personas de `img/hero/` recortadas (el `.json` de al lado dice cómo se hicieron). Son las que van encima de las letras gigantes.
- `antes/`: capturas de la app actual (tema Salvia) con datos de ejemplo.

Datos de ejemplo: Carlos, su jaguar Kali, 860 pts antes de entrenar y 900 después (+30 por registrar la sesión y +10 por completarla, igual que en `js/54-tablero-reto.js`).

## Pantallas

| Pantalla | Qué cambia | Animación |
|---|---|---|
| Portada | La foto llena la pantalla y la socia queda encima de un "12" naranja gigante. Un solo botón fuerte. | La cámara se aleja y el 12 sube de borroso a nítido. |
| Inicio | "Hombro + trapecio" en letra gigante detrás del socio de la foto. El reto como 12 barras en sus 3 fases. | El título sale de abajo línea por línea; al deslizar se mueve más lento que la foto. |
| Sesión terminada | "+40" gigante con la mascota parada encima, sobre su luz. Se ve de dónde salen los puntos. | El número cuenta hacia arriba y la mascota aterriza con rebote. |
| Mascota | El nombre gigante detrás y la mascota como producto de vitrina; las etapas que faltan como siluetas. | La mascota aparece como silueta y se ilumina; al tocarla salta. |
