// middleware.js
import { authConfig } from './auth.config';
import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { safeCallbackUrl } from './lib/callbackUrl';

// Create the 'auth' helper specifically for the middleware using authConfig
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const url = req.nextUrl.clone();
  // Same rule as getSession() in lib/authz.js: a session only counts if it
  // names a user (docs/SECURITY.md #4).
  const isLoggedIn = !!req.auth?.user?.id;

  // Sign-in is /sign-in. Old links and bookmarks to /signin (this middleware
  // used to send signed-out drivers there) go to it with their callbackUrl,
  // and so does `/?callbackUrl=`: sign-in was on `/` until 2026-10-12, and a
  // page opened before then still comes back there.
  if (
    url.pathname === '/signin' ||
    (url.pathname === '/' && url.searchParams.has('callbackUrl'))
  ) {
    const next = safeCallbackUrl(url.searchParams.get('callbackUrl'), null);
    const signInUrl = new URL('/sign-in', url.origin);
    if (next) signInUrl.searchParams.set('callbackUrl', next);
    return NextResponse.redirect(signInUrl);
  }

  // Define paths that require BMC membership
  const requiresBMCMembership = url.pathname.startsWith('/history');

  // --- MODIFICATION STARTS HERE ---

  // List of public paths (accessible to anyone, logged in or not)
  // `/` is the landing page, which Google's OAuth branding review reads, and
  // /sign-in is sign-in. Legal pages stay public: the footer links to them
  // before sign-in, and the Google OAuth consent screen needs a reachable
  // privacy policy URL. /help too: its sign-in guide is for drivers who aren't
  // signed in yet. And /reset-password, opened from a reset link by someone
  // who can't sign in (docs/PASSWORD-RESET.md). /opengraph-image is the link
  // preview picture (app/opengraph-image.jsx), fetched by crawlers. /about
  // (since 2026-10-22): the signed-out menu links to it, and it shows only who
  // made the app and two cached totals (lookups and tips, lib/impact.js).
  const publicPaths = [
    '/',
    '/sign-in',
    '/privacy',
    '/terms',
    '/help',
    '/about',
    '/reset-password',
    '/confirm-email',
    '/opengraph-image',
  ];

  // 1. Handle unauthenticated users
  if (!isLoggedIn) {
    // If the user is not logged in AND trying to access a path that is NOT public,
    // then redirect to sign-in.
    if (!publicPaths.includes(url.pathname)) {
      // Sign-in is /sign-in (auth.config.js `pages.signIn`). The page they
      // wanted, query included, rides along so they land there afterwards.
      const signInUrl = new URL('/sign-in', url.origin);
      signInUrl.searchParams.set('callbackUrl', `${url.pathname}${url.search}`);
      // console.log(
      //   'Middleware: User not logged in and accessing protected path, redirecting to sign-in.'
      // );
      return NextResponse.redirect(signInUrl);
    }
    // If the path IS public (e.g., '/'), and user is not logged in, just continue.
  }

  // --- MODIFICATION ENDS HERE ---

  // 2. Handle non-BMC members trying to access BMC-protected content
  // This check ONLY applies if the user IS logged in.
  const isBMCMember = req.auth?.user?.bmcMember;

  if (isLoggedIn && requiresBMCMembership && !isBMCMember) {
    // console.log(
    //   'Middleware: User is logged in but not a BMC member, redirecting to home.'
    // );
    // /sign-in shows a signed-in non-member the membership prompt.
    url.pathname = '/sign-in';
    url.search = '';
    return NextResponse.redirect(url);
  }

  // console.log('Middleware: Request allowed to proceed.');
  return NextResponse.next();
});

// The middleware is the sign-in redirect, not the boundary: it skips /api and
// any path with a dot, and the published bypasses (docs/SECURITY.md #3) skip
// it too. Every page and API route checks the session itself
// (lib/authz.js, #7).
export const config = {
  matcher: [
    // The matcher broadly includes many paths.
    // The logic inside the middleware will handle specific redirect rules.
    '/home/:path*',
    '/home',
    '/hubs/:path*',
    '/', // Explicitly include the root path in the matcher if you want middleware to run on it.
    // This is often good practice to ensure the `isLoggedIn` check always runs.
    '/((?!_next/static|_next/image|favicon.ico|api|auth|.*\\..*).*)',
  ],
};
