const isDev = process.env.NODE_ENV !== 'production';
// Preview deployments carry the Vercel toolbar (vercel.live).
const isPreview = process.env.VERCEL_ENV === 'preview';

// Content-Security-Policy, step 1 of docs/SECURITY.md #12. Inline scripts are
// still allowed (Next's own, MUI's InitColorSchemeScript and the install-prompt
// stash in app/layout.jsx); step 2 moves them to nonces and drops
// 'unsafe-inline' from script-src. Anything new the browser has to load from
// another origin (an image host, a script, an embed) needs adding here, or it
// is blocked.
const csp = {
  'default-src': ["'self'"],
  'script-src': [
    "'self'",
    "'unsafe-inline'",
    // React's dev build evals; Vercel Analytics' dev script comes from here.
    ...(isDev ? ["'unsafe-eval'", 'https://va.vercel-scripts.com'] : []),
    ...(isPreview ? ['https://vercel.live'] : []),
  ],
  // Emotion (MUI) injects <style> tags at runtime.
  'style-src': ["'self'", "'unsafe-inline'", ...(isPreview ? ['https://vercel.live'] : [])],
  'img-src': [
    "'self'",
    // Registration avatars are data: SVGs (app/api/auth/register).
    'data:',
    'blob:',
    'https://lh3.googleusercontent.com',
    'https://yt3.ggpht.com',
    'https://*.public.blob.vercel-storage.com',
    ...(isPreview ? ['https://vercel.live', 'https://vercel.com'] : []),
  ],
  // next/font self-hosts Montserrat.
  'font-src': ["'self'", ...(isPreview ? ['https://vercel.live', 'https://assets.vercel.com'] : [])],
  'connect-src': [
    "'self'",
    // Hot reload's websocket.
    ...(isDev ? ['ws:', 'wss:'] : []),
    ...(isPreview ? ['https://vercel.live', 'wss://ws-us3.pusher.com'] : []),
  ],
  // public/sw.js, the push-only service worker (docs/PUSH-NOTIFICATIONS.md).
  'worker-src': ["'self'"],
  'frame-src': isPreview ? ['https://vercel.live'] : ["'none'"],
  'frame-ancestors': ["'none'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  // Google sign-in posts here first, then redirects to Google.
  'form-action': ["'self'", 'https://accounts.google.com'],
  // Not in dev: it would upgrade a phone testing over http on the LAN.
  ...(isDev ? {} : { 'upgrade-insecure-requests': [] }),
};

const contentSecurityPolicy = Object.entries(csp)
  .map(([directive, sources]) => [directive, ...sources].join(' '))
  .join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Location stays on for this site: "Use my location", pins and gym distance
  // (hooks/useGeolocation.js).
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), payment=(), usb=(), browsing-topics=()',
  },
  // Older browsers' version of frame-ancestors 'none': no site can frame the
  // app and clickjack a signed-in driver's buttons.
  { key: 'X-Frame-Options', value: 'DENY' },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  // No `X-Powered-By: Next.js` (docs/SECURITY.md #30).
  poweredByHeader: false,
  images: {
    remotePatterns: [
      new URL('https://lh3.googleusercontent.com/**'),
      new URL('https://yt3.ggpht.com/**'),
    ],
  },
  // Renamed routes, so a bookmarked old link still lands (the query string,
  // e.g. ?slic=, carries over).
  async redirects() {
    return [{ source: '/all', destination: '/hubs', permanent: true }];
  },
  // Security headers on every response (docs/SECURITY.md #12).
  async headers() {
    return [
      { source: '/(.*)', headers: securityHeaders },
      // The service worker is always re-checked, so a fix reaches every
      // device on its next visit instead of after a cache expires.
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }] },
    ];
  },
};

export default nextConfig;
