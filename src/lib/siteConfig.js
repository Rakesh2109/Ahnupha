/**
 * Production: set VITE_SITE_URL=https://yourdomain.com in .env.production
 * so Open Graph, canonical URLs, and sitemap match your live domain.
 */
export function getSiteUrl() {
  const env = import.meta.env.VITE_SITE_URL;
  if (env && String(env).trim()) {
    return String(env).trim().replace(/\/$/, '');
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/$/, '');
  }
  return 'https://ahnupha.com';
}

/** Default share image (stable CDN URL works for Facebook/WhatsApp previews). */
export const DEFAULT_OG_IMAGE =
  'https://live.staticflickr.com/65535/55069718467_166f15ce71_b.jpg';

export const SITE_NAME = 'Ahnupha';
export const BUSINESS = {
  name: 'Ahnupha',
  phone: '+919515404195',
  email: 'info@ahnupha.com',
  streetAddress: '1-6-141/43/A2/C, Sri Ram Nagar, Near New Vision School',
  addressLocality: 'Suryapet',
  addressRegion: 'Telangana',
  postalCode: '508213',
  addressCountry: 'IN',
};
