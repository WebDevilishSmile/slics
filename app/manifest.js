import { statusBarColors } from '@/theme';

// Served at /manifest.webmanifest and linked from <head> by Next. Colors match
// the light scheme: the header (statusBarColors, UI-SUGGESTIONS.md #35) and
// background.default in theme.js. A manifest has one theme_color, so
// dark mode comes from the page's <meta name="theme-color"> once it loads.
// Icons are generated from public/slics-icon.svg by `npm run icons:generate`
// (scripts/generateIcons.mjs).
export default function manifest() {
  return {
    id: '/',
    name: 'SLICs',
    short_name: 'SLICs',
    description: 'Look up SLIC addresses, phone numbers, and driver comments.',
    // The installed app opens on the lookup page, not the sign-in landing.
    // Signed-out users are bounced to '/' by the page itself.
    start_url: '/home',
    scope: '/',
    display: 'standalone',
    background_color: '#edf3fc',
    theme_color: statusBarColors.light,
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      // Full-bleed squares for launchers that apply their own circle/squircle
      // mask; the glyph sits inside the 80% safe zone. The rounded icons
      // above would show their transparent corners under a mask.
      {
        src: '/maskable-icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/maskable-icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
