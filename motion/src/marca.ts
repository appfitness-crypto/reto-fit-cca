// Colores y fuentes de Reto Fit CCA (copiados de DESIGN.md de la app).
import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';

export const C = {
	shell: '#0A3576',
	shell2: '#0E4294',
	shellMu: '#B9CDEE',
	fair: '#1E7A3C',
	lime: '#A6E241',
	limeBg: '#EAF6D4',
	limeInk: '#2D5A0C',
	ground: '#E9F0EC',
	ink: '#0E1B2C',
	ink2: '#46566B',
	rule: '#D2DCE5',
	stage: '#0A0D13',
	amber: '#9A5B00',
	amberBg: '#FFF0D6',
	blanco: '#FFFFFF',
};

export const DISPLAY = "'Barlow Condensed', sans-serif";
export const BODY = "'Barlow', sans-serif";

// Carga las fuentes de la app antes de dibujar el primer cuadro.
loadFont({family: 'Barlow Condensed', url: staticFile('fuentes/BarlowCondensed-700-latin.woff2'), weight: '700'});
loadFont({family: 'Barlow', url: staticFile('fuentes/Barlow-400-latin.woff2'), weight: '400'});
loadFont({family: 'Barlow', url: staticFile('fuentes/Barlow-600-latin.woff2'), weight: '600'});
