// Served at /robots.txt, built once as a static file. Crawlers asked for it
// on every visit, and without it each ask rendered the 404 page in a function.
// The public pages are the ones the middleware lets through signed out;
// everything else redirects to sign-in, so it's left out.
export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/'],
    },
  };
}
