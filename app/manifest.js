export default function manifest() {
  return {
    name: 'SLICs',
    short_name: 'SLICs',
    description: 'Look up SLIC addresses, phone numbers, and driver comments.',
    start_url: '/',
    display: 'standalone',
    background_color: '#edf3fc',
    theme_color: '#039be5',
    icons: [
      {
        src: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/android-chrome-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
