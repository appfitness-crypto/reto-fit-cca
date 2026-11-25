// Video promocional vertical (1080×1920, 30 cuadros por segundo) de Reto Fit CCA.
// Está hecho de 6 escenas. Cada escena es un componente y se coloca en la
// línea de tiempo con <Sequence from={...} durationInFrames={...}>.
import React from 'react';
import {
	AbsoluteFill,
	Img,
	Sequence,
	interpolate,
	spring,
	staticFile,
	useCurrentFrame,
	useVideoConfig,
	Easing,
} from 'remotion';
import {C, DISPLAY, BODY} from './marca';
import puntos from './puntos-marca.json';

// ---------- Línea de tiempo (en cuadros; 30 cuadros = 1 segundo) ----------
const ESCENAS = [
	{id: 'intro', dur: 105},
	{id: 'calendario', dur: 135},
	{id: 'rutina', dur: 165},
	{id: 'objetivos', dur: 125},
	{id: 'progreso', dur: 135},
	{id: 'cierre', dur: 120},
] as const;
export const DURACION_TOTAL = ESCENAS.reduce((s, e) => s + e.dur, 0);

// ---------- Ayudantes de animación ----------
const clamp = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'} as const;
const salida = Easing.bezier(0.22, 1, 0.36, 1); // arranca rápido y frena suave

/** Valor de 0 a 1 con efecto resorte, empezando en el cuadro `delay`. */
const useEntrada = (delay = 0, damping = 18) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return spring({frame: frame - delay, fps, config: {damping, mass: 0.8}});
};

/** Envuelve una escena: aparece y desaparece con un fundido corto. */
const Escena: React.FC<{dur: number; fondo: string; children: React.ReactNode}> = ({dur, fondo, children}) => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [0, 8, dur - 8, dur], [0, 1, 1, 0], clamp);
	return <AbsoluteFill style={{background: fondo, opacity}}>{children}</AbsoluteFill>;
};

/** Texto que sube desde abajo y aparece. */
const Sube: React.FC<{delay?: number; dist?: number; style?: React.CSSProperties; children: React.ReactNode}> = ({
	delay = 0,
	dist = 60,
	style,
	children,
}) => {
	const p = useEntrada(delay, 20);
	return (
		<div style={{transform: `translateY(${(1 - p) * dist}px)`, opacity: Math.min(1, p * 1.4), ...style}}>{children}</div>
	);
};

const Etiqueta: React.FC<{children: React.ReactNode; color?: string; fondo?: string}> = ({children, color = C.limeInk, fondo = C.limeBg}) => (
	<span
		style={{
			fontFamily: BODY,
			fontWeight: 600,
			fontSize: 30,
			letterSpacing: '0.08em',
			textTransform: 'uppercase',
			color,
			background: fondo,
			padding: '10px 22px',
			borderRadius: 999,
		}}
	>
		{children}
	</span>
);

const Titular: React.FC<{children: React.ReactNode; color?: string; size?: number}> = ({children, color = C.ink, size = 120}) => (
	<div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: size, lineHeight: 0.92, color, letterSpacing: '-0.01em', textTransform: 'uppercase'}}>
		{children}
	</div>
);

const DatosEjemplo: React.FC<{oscuro?: boolean}> = ({oscuro}) => (
	<div style={{position: 'absolute', bottom: 60, left: 0, right: 0, textAlign: 'center', fontFamily: BODY, fontSize: 26, color: oscuro ? C.shellMu : C.ink2, opacity: 0.8}}>
		Datos de ejemplo
	</div>
);

// ---------- Marca de puntos animada ----------
type Punto = [number, number, number, string, number];
const MarcaPuntos: React.FC<{size: number; delay?: number}> = ({size, delay = 0}) => {
	const frame = useCurrentFrame();
	const {fps} = useVideoConfig();
	return (
		<svg viewBox="-6.396 -7.200 12.792 14.400" width={size} height={size * (14.4 / 12.792)}>
			{(puntos as Punto[]).map(([cx, cy, r, fill], i) => {
				const grande = r > 0.2;
				// Los puntos de color entran de abajo hacia arriba, como una flecha que sube.
				const orden = grande ? (7 - cy) * 2.2 : (Math.abs(cx) + Math.abs(cy)) * 1.2;
				const p = spring({frame: frame - delay - orden, fps, config: {damping: 11, mass: 0.6}});
				return (
					<circle
						key={i}
						cx={cx}
						cy={cy + (1 - p) * (grande ? 0.8 : 0)}
						r={r * p}
						fill={fill === '#2B333C' ? '#33404F' : fill}
						opacity={grande ? 1 : 0.9}
					/>
				);
			})}
		</svg>
	);
};

// ======================= ESCENA 1: Intro =======================
const Intro: React.FC<{dur: number}> = ({dur}) => {
	const frame = useCurrentFrame();
	const zoom = interpolate(frame, [0, dur], [1, 1.08], clamp);
	const linea = interpolate(frame, [48, 72], [0, 1], {...clamp, easing: salida});
	return (
		<Escena dur={dur} fondo={`radial-gradient(ellipse at 50% 38%, #12305C 0%, ${C.stage} 62%)`}>
			<AbsoluteFill style={{alignItems: 'center', justifyContent: 'center', transform: `scale(${zoom})`}}>
				<MarcaPuntos size={560} delay={4} />
				<div style={{height: 50}} />
				<Sube delay={36}>
					<Titular color={C.blanco} size={150}>
						Reto Fit <span style={{color: C.lime}}>CCA</span>
					</Titular>
				</Sube>
				<div style={{width: 520 * linea, height: 8, background: C.lime, borderRadius: 4, marginTop: 26}} />
				<Sube delay={58}>
					<div style={{fontFamily: BODY, fontSize: 44, color: C.shellMu, marginTop: 30}}>Tu reto de 12 semanas en el club</div>
				</Sube>
			</AbsoluteFill>
		</Escena>
	);
};

// ======================= ESCENA 2: 12 semanas, 3 fases =======================
const FASES = [
	{nombre: 'Adaptación', semanas: [1, 2, 3, 4], color: C.shellMu},
	{nombre: 'Fuerza e hipertrofia', semanas: [5, 6, 7, 8], color: '#7FC7A0'},
	{nombre: 'Definición y cierre', semanas: [9, 10, 11, 12], color: C.lime},
];
const Calendario: React.FC<{dur: number}> = ({dur}) => {
	const frame = useCurrentFrame();
	const conteo = Math.round(interpolate(frame, [6, 50], [1, 12], {...clamp, easing: salida}));
	return (
		<Escena dur={dur} fondo={C.shell}>
			<AbsoluteFill style={{padding: '190px 90px', flexDirection: 'column'}}>
				<Sube>
					<Etiqueta color={C.shell} fondo={C.lime}>El reto</Etiqueta>
				</Sube>
				<div style={{display: 'flex', alignItems: 'baseline', gap: 28, marginTop: 40}}>
					<div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 330, lineHeight: 0.85, color: C.lime, fontVariantNumeric: 'tabular-nums', width: 380}}>
						{conteo}
					</div>
					<Sube delay={10}>
						<Titular color={C.blanco} size={130}>
							semanas
						</Titular>
					</Sube>
				</div>
				<Sube delay={22}>
					<Titular color={C.shellMu} size={96}>
						3 fases
					</Titular>
				</Sube>

				<div style={{marginTop: 90, display: 'flex', flexDirection: 'column', gap: 46}}>
					{FASES.map((fase, fi) => (
						<div key={fase.nombre}>
							<Sube delay={34 + fi * 14} dist={30}>
								<div style={{fontFamily: BODY, fontWeight: 600, fontSize: 38, color: C.blanco, marginBottom: 16}}>
									{fase.nombre} <span style={{color: C.shellMu, fontWeight: 400}}>· sem {fase.semanas[0]}–{fase.semanas[3]}</span>
								</div>
							</Sube>
							<div style={{display: 'flex', gap: 18}}>
								{fase.semanas.map((s, si) => (
									<Celda key={s} semana={s} color={fase.color} delay={40 + fi * 14 + si * 4} eval={s === 6 || s === 12} />
								))}
							</div>
						</div>
					))}
				</div>
				<Sube delay={96} dist={30}>
					<div style={{fontFamily: BODY, fontSize: 36, color: C.shellMu, marginTop: 56}}>
						<span style={{display: 'inline-block', width: 22, height: 22, borderRadius: 11, border: `4px solid ${C.blanco}`, marginRight: 14, verticalAlign: -2}} />
						Evaluaciones en las semanas 0, 6 y 12
					</div>
				</Sube>
			</AbsoluteFill>
		</Escena>
	);
};
const Celda: React.FC<{semana: number; color: string; delay: number; eval: boolean}> = ({semana, color, delay, eval: esEval}) => {
	const p = useEntrada(delay, 12);
	return (
		<div
			style={{
				width: 210,
				height: 120,
				borderRadius: 22,
				background: color,
				transform: `scale(${p})`,
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontFamily: DISPLAY,
				fontWeight: 700,
				fontSize: 64,
				color: C.shell,
				outline: esEval ? `6px solid ${C.blanco}` : 'none',
				outlineOffset: 6,
			}}
		>
			{semana}
		</div>
	);
};

// ======================= ESCENA 3: La rutina en el celular =======================
const SERIES = [
	{reps: 12, kg: 12},
	{reps: 10, kg: 14},
	{reps: 8, kg: 16},
];
const Rutina: React.FC<{dur: number}> = ({dur}) => {
	const frame = useCurrentFrame();
	const tel = useEntrada(14, 16);
	const foto = interpolate(frame, [0, dur], [1.05, 1.18], clamp);
	return (
		<Escena dur={dur} fondo={C.ground}>
			<AbsoluteFill style={{padding: '150px 90px 0', flexDirection: 'column'}}>
				<Sube>
					<Etiqueta>Tu rutina</Etiqueta>
				</Sube>
				<Sube delay={6} style={{marginTop: 30}}>
					<Titular size={104}>
						La arma <span style={{color: C.fair}}>tu entrenador</span>
					</Titular>
				</Sube>
			</AbsoluteFill>

			{/* Celular */}
			<div
				style={{
					position: 'absolute',
					left: 150,
					top: 560,
					width: 780,
					height: 1500,
					borderRadius: 90,
					background: C.ink,
					padding: 22,
					transform: `translateY(${(1 - tel) * 900}px) rotate(${(1 - tel) * 6}deg)`,
					boxShadow: '0 60px 120px rgba(10,53,118,0.35)',
				}}
			>
				<div style={{width: '100%', height: '100%', borderRadius: 70, overflow: 'hidden', background: C.ground, position: 'relative'}}>
					{/* Barra superior: semana y fase siempre visibles */}
					<div style={{background: C.shell, padding: '70px 48px 34px', color: C.blanco}}>
						<div style={{fontFamily: BODY, fontSize: 28, color: C.shellMu}}>Semana 5 · Fuerza e hipertrofia</div>
						<div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 60, marginTop: 6}}>Día 2 · Brazo</div>
					</div>
					<div style={{height: 380, overflow: 'hidden', background: '#05070B'}}>
						<Img src={staticFile('curl-de-biceps.webp')} style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: '50% 22%', transform: `scale(${foto})`}} />
					</div>
					<div style={{padding: '30px 40px'}}>
						<div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 56, color: C.ink}}>Curl de bíceps</div>
						<div style={{fontFamily: BODY, fontSize: 28, color: C.ink2, marginBottom: 22}}>3 series · descanso 60 s</div>
						{SERIES.map((s, i) => (
							<FilaSerie key={i} n={i + 1} reps={s.reps} kg={s.kg} hecho={40 + i * 26} />
						))}
					</div>
				</div>
			</div>
			<DatosEjemplo />
		</Escena>
	);
};
const FilaSerie: React.FC<{n: number; reps: number; kg: number; hecho: number}> = ({n, reps, kg, hecho}) => {
	const frame = useCurrentFrame();
	const p = useEntrada(hecho, 12);
	const activa = frame >= hecho - 26 && frame < hecho;
	return (
		<div
			style={{
				display: 'flex',
				alignItems: 'center',
				gap: 22,
				padding: '20px 24px',
				marginBottom: 14,
				borderRadius: 24,
				background: p > 0.5 ? C.limeBg : activa ? '#F4F8FD' : C.blanco,
				border: `3px solid ${activa ? C.shell2 : C.rule}`,
				fontFamily: DISPLAY,
				fontWeight: 700,
				fontSize: 44,
				color: C.ink,
				fontVariantNumeric: 'tabular-nums',
			}}
		>
			<span style={{color: C.ink2, width: 120, fontFamily: BODY, fontWeight: 600, fontSize: 28}}>Serie {n}</span>
			<span style={{flex: 1}}>{reps} reps</span>
			<span style={{flex: 1}}>{Math.round(kg * Math.min(1, p))} kg</span>
			<div style={{width: 64, height: 64, borderRadius: 32, background: p > 0.05 ? C.fair : C.rule, transform: `scale(${0.6 + 0.4 * p})`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
				<svg width="36" height="36" viewBox="0 0 24 24">
					<path d="M4 12.5l5 5L20 6.5" fill="none" stroke={C.blanco} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="24" strokeDashoffset={24 * (1 - p)} />
				</svg>
			</div>
		</div>
	);
};

// ======================= ESCENA 4: Tres objetivos =======================
const OBJETIVOS = ['Incremento de masa muscular', 'Bajar porcentaje de grasa', 'Recomposición corporal'];
const Objetivos: React.FC<{dur: number}> = ({dur}) => {
	const frame = useCurrentFrame();
	const masc = useEntrada(58, 10);
	const flota = Math.sin(frame / 9) * 10;
	return (
		<Escena dur={dur} fondo={`linear-gradient(170deg, ${C.shell2} 0%, ${C.shell} 70%)`}>
			<AbsoluteFill style={{padding: '190px 90px', flexDirection: 'column'}}>
				<Sube>
					<Etiqueta color={C.shell} fondo={C.lime}>Elige uno</Etiqueta>
				</Sube>
				<Sube delay={6} style={{marginTop: 30}}>
					<Titular color={C.blanco} size={112}>
						Compites solo con tu <span style={{color: C.lime}}>mismo objetivo</span>
					</Titular>
				</Sube>
				<div style={{marginTop: 80, display: 'flex', flexDirection: 'column', gap: 30}}>
					{OBJETIVOS.map((o, i) => (
						<TarjetaObjetivo key={o} n={i + 1} texto={o} delay={20 + i * 10} />
					))}
				</div>
			</AbsoluteFill>
			<Img
				src={staticFile('jaguar-3.webp')}
				style={{position: 'absolute', right: 40, bottom: 70, width: 460, transform: `translateY(${(1 - masc) * 500 + flota}px) rotate(${(1 - masc) * -20}deg)`}}
			/>
		</Escena>
	);
};
const TarjetaObjetivo: React.FC<{n: number; texto: string; delay: number}> = ({n, texto, delay}) => {
	const p = useEntrada(delay, 16);
	return (
		<div
			style={{
				transform: `translateX(${(1 - p) * 1100}px)`,
				background: C.blanco,
				borderRadius: 30,
				display: 'flex',
				alignItems: 'center',
				overflow: 'hidden',
				boxShadow: '0 20px 50px rgba(0,0,0,0.25)',
			}}
		>
			<div style={{width: 130, alignSelf: 'stretch', background: C.lime, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: DISPLAY, fontWeight: 700, fontSize: 80, color: C.shell}}>
				{n}
			</div>
			<div style={{padding: '40px 40px', fontFamily: DISPLAY, fontWeight: 700, fontSize: 58, color: C.ink, lineHeight: 1}}>{texto}</div>
		</div>
	);
};

// ======================= ESCENA 5: Progreso =======================
// % de grasa de ejemplo por semana (0 a 12).
const GRASA = [28, 27.6, 27.1, 26.8, 26.2, 25.9, 25.3, 24.8, 24.4, 23.8, 23.3, 22.7, 22.2];
const Progreso: React.FC<{dur: number}> = ({dur}) => {
	const frame = useCurrentFrame();
	const traza = interpolate(frame, [18, 78], [0, 1], {...clamp, easing: Easing.inOut(Easing.cubic)});
	const W = 820;
	const H = 420;
	const x = (i: number) => (i / 12) * W;
	const y = (v: number) => ((28.5 - v) / 7) * H;
	const d = GRASA.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ');
	const idx = traza * 12;
	const actual = GRASA[Math.floor(idx)] + (GRASA[Math.min(12, Math.ceil(idx))] - GRASA[Math.floor(idx)]) * (idx % 1);
	const cambio = (actual - GRASA[0]).toFixed(1);
	const medalla = useEntrada(84, 9);
	const lugar = useEntrada(96, 16);
	return (
		<Escena dur={dur} fondo={C.ground}>
			<AbsoluteFill style={{padding: '150px 90px', flexDirection: 'column'}}>
				<Sube>
					<Etiqueta>Tu progreso</Etiqueta>
				</Sube>
				<Sube delay={6} style={{marginTop: 30}}>
					<Titular size={112}>
						Mira tu <span style={{color: C.fair}}>cambio</span> semana a semana
					</Titular>
				</Sube>
				<Sube delay={12} style={{marginTop: 60}}>
					<div style={{background: C.blanco, borderRadius: 40, padding: '44px 50px', border: `3px solid ${C.rule}`}}>
						<div style={{fontFamily: BODY, fontWeight: 600, fontSize: 32, color: C.ink2}}>% de grasa estimado</div>
						<div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 150, color: C.fair, lineHeight: 1, fontVariantNumeric: 'tabular-nums'}}>{cambio}%</div>
						<svg width={W} height={H + 40} style={{overflow: 'visible', marginTop: 20}}>
							{[0, 6, 12].map((s) => (
								<g key={s}>
									<line x1={x(s)} x2={x(s)} y1={0} y2={H} stroke={C.rule} strokeWidth={3} strokeDasharray="8 10" />
									<text x={x(s)} y={H + 40} textAnchor="middle" fontFamily={BODY} fontSize={28} fill={C.ink2}>
										Sem {s}
									</text>
								</g>
							))}
							<path d={d} fill="none" stroke={C.fair} strokeWidth={12} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - traza} />
							<circle cx={x(idx)} cy={y(actual)} r={22} fill={C.lime} stroke={C.fair} strokeWidth={8} />
						</svg>
					</div>
				</Sube>
				<div style={{display: 'flex', alignItems: 'center', gap: 40, marginTop: 50}}>
					<Img src={staticFile('nivel-5.webp')} style={{width: 280, transform: `scale(${medalla}) rotate(${(1 - medalla) * -90}deg)`}} />
					<div style={{transform: `translateX(${(1 - lugar) * 400}px)`, opacity: lugar}}>
						<div style={{fontFamily: BODY, fontWeight: 600, fontSize: 34, color: C.ink2}}>Tu lugar en tu objetivo</div>
						<div style={{fontFamily: DISPLAY, fontWeight: 700, fontSize: 150, color: C.shell, lineHeight: 0.95}}>#4</div>
					</div>
				</div>
			</AbsoluteFill>
			<DatosEjemplo />
		</Escena>
	);
};

// ======================= ESCENA 6: Cierre =======================
const Cierre: React.FC<{dur: number}> = ({dur}) => {
	const frame = useCurrentFrame();
	const zoom = interpolate(frame, [0, dur], [1.15, 1.0], clamp);
	const boton = useEntrada(42, 10);
	const pulso = 1 + Math.max(0, Math.sin((frame - 60) / 6)) * 0.03 * (frame > 60 ? 1 : 0);
	return (
		<Escena dur={dur} fondo={C.stage}>
			<Img src={staticFile('bienvenida.webp')} style={{position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${zoom})`}} />
			<AbsoluteFill style={{background: `linear-gradient(180deg, rgba(10,53,118,0.15) 0%, rgba(10,53,118,0.55) 45%, ${C.shell} 78%)`}} />
			<AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center', padding: '0 80px 200px', textAlign: 'center'}}>
				<Sube delay={6}>
					<MarcaPuntos size={230} delay={6} />
				</Sube>
				<Sube delay={16} style={{marginTop: 30}}>
					<Titular color={C.blanco} size={150}>
						Reto Fit <span style={{color: C.lime}}>CCA</span>
					</Titular>
				</Sube>
				<Sube delay={26}>
					<div style={{fontFamily: BODY, fontSize: 46, color: C.blanco, marginTop: 22, lineHeight: 1.3}}>
						12 semanas para tu mejor versión
					</div>
				</Sube>
				<div
					style={{
						marginTop: 60,
						background: C.lime,
						color: C.shell,
						fontFamily: DISPLAY,
						fontWeight: 700,
						fontSize: 64,
						padding: '30px 70px',
						borderRadius: 999,
						transform: `scale(${boton * pulso})`,
						textTransform: 'uppercase',
					}}
				>
					Inscríbete en la caja del club
				</div>
			</AbsoluteFill>
		</Escena>
	);
};

// ======================= Video completo =======================
const COMPONENTES: Record<(typeof ESCENAS)[number]['id'], React.FC<{dur: number}>> = {
	intro: Intro,
	calendario: Calendario,
	rutina: Rutina,
	objetivos: Objetivos,
	progreso: Progreso,
	cierre: Cierre,
};

export const RetoFitPromo: React.FC = () => {
	let inicio = 0;
	return (
		<AbsoluteFill style={{background: C.stage}}>
			{ESCENAS.map((e) => {
				const Comp = COMPONENTES[e.id];
				const from = inicio;
				inicio += e.dur;
				return (
					<Sequence key={e.id} from={from} durationInFrames={e.dur} name={e.id}>
						<Comp dur={e.dur} />
					</Sequence>
				);
			})}
		</AbsoluteFill>
	);
};
