// middleware.js
import { authConfig } from './auth.config';
import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';

// Create the 'auth' helper specifically for the middleware using authConfig
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const url = req.nextUrl.clone();
  const isLoggedIn = !!req.auth;

  // Define paths that require BMC membership
  const requiresBMCMembership = url.pathname.startsWith('/history');

  // --- MODIFICATION STARTS HERE ---

  // List of public paths (accessible to anyone, logged in or not)
  // Legal pages stay public: the footer links to them before sign-in, and the
  // Google OAuth consent screen needs a reachable privacy policy URL.
  const publicPaths = ['/', '/signin', '/privacy', '/terms'];

  // 1. Handle unauthenticated users
  if (!isLoggedIn) {
    // If the user is not logged in AND trying to access a path that is NOT public,
    // then redirect to sign-in.
    if (!publicPaths.includes(url.pathname)) {
      const signInUrl = new URL('/signin', url.origin);
      signInUrl.searchParams.set('callbackUrl', url.pathname);
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
    // Note: This redirect is to the *root* page ('/'), which we just made public.
    // So, if a non-BMC member tries to access /dashboard, they'll be sent to /.
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // console.log('Middleware: Request allowed to proceed.');
  return NextResponse.next();
});

export const config = {
  matcher: [
    // The matcher broadly includes many paths.
    // The logic inside the middleware will handle specific redirect rules.
    '/dashboard/:path*',
    '/protected/:path*',
    '/home/:path*',
    '/home',
    '/all/:path*',
    '/', // Explicitly include the root path in the matcher if you want middleware to run on it.
    // This is often good practice to ensure the `isLoggedIn` check always runs.
    '/((?!_next/static|_next/image|favicon.ico|api|auth|.*\\..*).*)',
  ],
};
