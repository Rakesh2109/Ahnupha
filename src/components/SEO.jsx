import { Helmet } from 'react-helmet';
import { getSiteUrl, DEFAULT_OG_IMAGE, SITE_NAME, BUSINESS } from '@/lib/siteConfig';

/**
 * Per-route SEO: title, description, canonical, Open Graph, Twitter, optional JSON-LD.
 * @param {string} title - Page title ( "| Ahnupha" appended if not already branded)
 * @param {string} description - Meta description (~150–160 chars ideal)
 * @param {string} path - Path only, e.g. "/about" (canonical = site + path)
 * @param {string} [image] - Absolute URL for og:image
 * @param {string} [type] - og:type, default "website"
 * @param {boolean} [noindex] - true for login, checkout, dashboard
 * @param {object|object[]} [jsonLd] - schema.org object or array for @graph
 */
export default function SEO({
  title,
  description,
  path = '/',
  image,
  type = 'website',
  noindex = false,
  jsonLd,
}) {
  const base = getSiteUrl();
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const canonical = `${base}${normalizedPath === '//' ? '/' : normalizedPath}`.replace(
    /([^:]\/)\/+/g,
    '$1'
  );
  const ogImage = image && /^https?:\/\//i.test(image) ? image : image ? `${base}${image.startsWith('/') ? '' : '/'}${image}` : DEFAULT_OG_IMAGE;
  const fullTitle =
    title.toLowerCase().includes('ahnupha') || title.includes('|')
      ? title
      : `${title} | ${SITE_NAME}`;

  const robots = noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

  const structured =
    jsonLd != null
      ? Array.isArray(jsonLd)
        ? { '@context': 'https://schema.org', '@graph': jsonLd }
        : jsonLd['@context']
          ? jsonLd
          : { '@context': 'https://schema.org', ...jsonLd }
      : null;

  return (
    <Helmet>
      <html lang="en" />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta name="robots" content={robots} />
      <meta name="googlebot" content={robots} />

      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:alt" content={fullTitle} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {structured && (
        <script type="application/ld+json">{JSON.stringify(structured)}</script>
      )}
    </Helmet>
  );
}

/** Shared JSON-LD for homepage: WebSite + LocalBusiness (food retail). */
export function getHomeJsonLd() {
  const url = getSiteUrl();
  return [
    {
      '@type': 'WebSite',
      '@id': `${url}/#website`,
      url: `${url}/`,
      name: SITE_NAME,
      description:
        'Handcrafted personalised chocolates and homemade snacks. Pan India delivery. Free delivery in Suryapet 508213.',
      publisher: { '@id': `${url}/#business` },
      inLanguage: 'en-IN',
    },
    {
      '@type': 'LocalBusiness',
      '@id': `${url}/#business`,
      name: BUSINESS.name,
      url: `${url}/`,
      image: DEFAULT_OG_IMAGE,
      telephone: BUSINESS.phone,
      email: BUSINESS.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: BUSINESS.streetAddress,
        addressLocality: BUSINESS.addressLocality,
        addressRegion: BUSINESS.addressRegion,
        postalCode: BUSINESS.postalCode,
        addressCountry: BUSINESS.addressCountry,
      },
      priceRange: '₹₹',
    },
  ];
}
