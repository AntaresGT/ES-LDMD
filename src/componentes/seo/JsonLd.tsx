/**
 * Inyecta datos estructurados JSON-LD (schema.org) para SEO.
 */
const DATOS_ESTRUCTURADOS = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'es-ldmd',
  url: 'https://es-ldmd.com',
  description:
    'Herramienta para crear diagramas de entidad relación usando un lenguaje de modelado en español.',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'Web',
  inLanguage: 'es',
  image: 'https://es-ldmd.com/imagen_seo.png',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
} as const;

export function JsonLd() {
  const html = JSON.stringify(DATOS_ESTRUCTURADOS).replace(/</g, '\\u003c');
  return (
    <script
      id="esldmd-jsonld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
