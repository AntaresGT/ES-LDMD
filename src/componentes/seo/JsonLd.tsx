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
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(DATOS_ESTRUCTURADOS),
      }}
    />
  );
}
