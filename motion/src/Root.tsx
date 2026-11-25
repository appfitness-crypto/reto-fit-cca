// Lista de videos del proyecto. Cada <Composition> es un video que puedes
// abrir en el estudio (npm run dev) o exportar (npm run render).
import {Composition} from 'remotion';
import {RetoFitPromo, DURACION_TOTAL} from './RetoFitPromo';

export const RemotionRoot: React.FC = () => (
	<Composition
		id="RetoFitPromo"
		component={RetoFitPromo}
		durationInFrames={DURACION_TOTAL}
		fps={30}
		width={1080}
		height={1920}
	/>
);
