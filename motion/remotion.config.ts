import {Config} from '@remotion/cli/config';
// En esta máquina en la nube usamos el navegador que ya viene instalado.
if (process.env.REMOTION_BROWSER) Config.setBrowserExecutable(process.env.REMOTION_BROWSER);
