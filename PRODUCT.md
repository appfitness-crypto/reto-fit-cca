# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users
- **Socio del reto (primary):** adult member of the club enrolled in the 12-week Reto Fit CCA (~300 people). Uses the app on their phone, mostly inside the gym between sets and in classes, sometimes at home to check progress. Jobs: know what to train today, log weights / reps / sets for each exercise, see how each exercise is done, and see their own progress and their place in the reto.
- **Entrenador:** staff trainer who follows their assigned socios and edits their exercises from the staff panel.
- **Director (coordinador):** the club's head trainer; registers trainers, sets the training philosophy, and controls the reto from the staff panel and the reto dashboard.

## Product Purpose
Run a 3-month fitness challenge in the club's gym and classes. Each socio gets a routine built with their trainer's philosophy, logs every session, sees technique, and is measured on one of three objectives. Success: socios keep training and logging for 12 weeks and show measurable change in their objective.

## Positioning
The routine comes from the socio's own club trainer (the trainer's philosophy shapes it, and the trainer edits it), and the reto is judged per objective, so a socio competes only with people chasing the same goal.

## Operating Context
- Payment happens at the club's cashier; the socio receives a QR or a link (the trainer's link pre-fills their code) and self-registers with email.
- Registration evaluation (11 steps) profiles the socio and asks for exactly one of three objectives: **Incremento de masa muscular**, **Bajar porcentaje de grasa**, **Recomposición corporal**.
- Reto calendar: 12 weeks, 3 phases (Adaptación 1–4, Fuerza e hipertrofia 5–8, Definición y cierre 9–12), evaluations at weeks 0, 6 and 12.
- Data: Firebase project `reto-fit-cca`; offline queue for weak gym wifi.

## Capabilities and Constraints
- Existing app (PWA, plain HTML/CSS/JS, scripts loaded in numeric order) copied from app-fitness: routine by day, session logging with per-set weight/reps, progression blocks, exercise catalog with photos, body measurements (Mi cuerpo), nutrition tab, PDF of the routine.
- Socio tabs today: Inicio, Rutina, Progreso, Nutrición, Perfil.
- Ranking: the socio sees **only their own place and points** within their objective, never other socios' names. Trainers and director see the full ranking.
- Body-fat % is an estimate (US Navy formula from waist, neck, hip, height), not a clinical measurement.
- Technique video per exercise is planned (unlisted YouTube recommended); today exercises have photos.
- Open: whether nutrition stays in the reto; real reto start date (placeholder 2027-01-11).

## Brand Commitments
- Name shown as **Reto Fit CCA** (just "CCA", no long club name).
- Club logo: a rounded "C" mark, lime-green upper stroke flowing into a deep blue lower stroke, on a green-to-blue gradient tile. Source file supplied by the user (uploads/logo.png). The club's colors are green and blue from this logo. Original logo (Campestre Aguascalientes, high resolution) in `icons/marca/logo-campestre-original.jpg`: the mark is a rounded "C" whose upper loop is olive green `#628B2F` and lower stroke petrol blue `#145678`; the wordmark is gray `#76777B`.
- Voice: Spanish (México), informal "tú", short and direct.

## Evidence on Hand
- Club logo (raster, 256 px) from the user.
- Exercise photos in `img/ejercicios/`; body illustrations in `img/cuerpo/`.
- No real socio data, testimonials or results yet: previews must use labeled sample data.

## Product Principles
1. Between sets, one thumb: the next action is always the largest thing on screen.
2. The reto is the frame: week, phase and days left are always visible to the socio.
3. Progress is personal: show the socio's own change and place, never expose other socios.
4. The trainer stays present: the routine reads as their trainer's plan, not a generic app plan.

## Accessibility & Inclusion
Used in bright gyms and with sweaty hands: high contrast, large touch targets, legible numbers at arm's length.
