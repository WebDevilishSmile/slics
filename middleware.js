import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import client from './lib/db';

export async function middleware(req) {
  const token = await getToken({ req });
  const url = req.nextUrl.clone();

  // Not logged in → redirect to login
  if (!token) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // Connect to MongoDB
  const db = client.db();
  const user = await db.collection('users').findOne({ email: token.email });

  // User exists but doesn't have an active subscription or BMC membership → redirect
  if (!user || !user.bmcMember) {
    url.pathname = '/';
    return NextResponse.redirect(url);
  }

  // User is authenticated and has access
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/protected/:path*'],
};
