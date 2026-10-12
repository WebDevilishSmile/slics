import { SITE_URL } from '@/constants';

// The origin for a link the app hands out: a reset link in an email or in an
// admin's dialog. In production it's always SITE_URL, never the request's
// Host, which a client can influence, so an emailed link can't be made to
// point somewhere else. Elsewhere (a preview, `next dev`) it's the request's
// own origin, so the link opens where it was made.
export function siteOrigin(request) {
  return process.env.VERCEL_ENV === 'production' ? SITE_URL : request.nextUrl.origin;
}
