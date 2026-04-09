/**
 * Valores compartidos para AdSense (evita imports circulares entre loader y unidades).
 */
export const ADSENSE_CLIENT_ID = 'ca-pub-7793838991292720';

/** id del <script> inyectado por CargarScriptAdSense */
export const ADSENSE_SCRIPT_ELEMENT_ID = 'esldmd-adsbygoogle-js';

/** Se dispara cuando adsbygoogle.js terminó de cargar (antes del push en cada <ins>). */
export const ADSENSE_READY_EVENT = 'esldmd-adsbygoogle-ready';
