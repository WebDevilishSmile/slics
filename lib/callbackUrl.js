// The page a signed-out driver was headed for, carried through sign-in as
// `?callbackUrl=` (middleware.js sets it). Only a path on this site is
// accepted: anything else (another origin, `//host`, a backslash trick)
// falls back, so the parameter can't bounce someone off the site. `/` (the
// landing page) falls back too, and so does /sign-in itself, which redirects
// a signed-in member to this URL and would loop.
export function safeCallbackUrl(value, fallback = '/home') {
  const url = Array.isArray(value) ? value[0] : value;
  if (typeof url !== 'string' || !url.startsWith('/')) return fallback;
  if (url.startsWith('//') || url.includes('\\')) return fallback;
  if (url === '/' || url.startsWith('/?')) return fallback;
  if (/^\/sign-in(?:[/?#]|$)/.test(url)) return fallback;
  return url;
}
