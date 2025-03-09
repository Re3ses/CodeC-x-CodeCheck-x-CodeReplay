import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { deleteCookies, getSession, getUser } from './lib/auth';

// Ensure environment variables are set
if (!process.env.SERVER_URL || !process.env.API_PORT) {
  throw new Error("❌ Missing environment variables: SERVER_URL or API_PORT");
}

export async function middleware(request: NextRequest) {
  let session;
  let user;

  // For debugging only - remove in production
  console.log('Environment check:', {
    serverUrl: process.env.SERVER_URL,
    apiPort: process.env.API_PORT
  });

  if (
    request.nextUrl.pathname !== '/' &&
    request.nextUrl.pathname !== '/login'
  ) {
    session = await getSession();
    console.log("Session in middleware.ts:", session);
    user = await getUser();
  }


  // DEBUG LOGS
  const accessToken = request.cookies.get('access_token')?.value;
  const refreshToken = request.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    throw new Error("No refresh token found in middleware.ts .");
  }
  if (!accessToken) {
    throw new Error("No refresh token found in middleware.ts .");
  }

  if (accessToken && refreshToken) {
    console.log("Access token found in middleware.ts: ", accessToken);
    console.log("Refresh token found in middleware.ts: ", refreshToken);
  }

  // END DEBUG LOGS

  // Prevent infinite redirect loop
  if (!session && request.nextUrl.pathname !== '/login') {
    console.log("No session found, redirecting to /login", session);
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (request.nextUrl.pathname === '/login') {
    // Only clear tokens when coming from another page, not when refreshing login
    const referer = request.headers.get('referer');
    if (referer && !referer.includes('/login')) {
      await deleteCookies();
    }
    // Always allow access to login page without further checks
    return NextResponse.next();
  }


  if (session) {
    if (request.nextUrl.pathname.startsWith('/pogi/secret/marco/handshake')) {
      return NextResponse.redirect(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley'
      );
    }

    if (request.nextUrl.pathname.startsWith('/mentor')) {
      if (user.type !== 'Mentor') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    if (request.nextUrl.pathname.startsWith('/learner')) {
      if (user.type !== 'Learner') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/',
    '/mentor/:path*',
    '/learner/:path*',
    '/pogi/:path*',
    '/dashboard/:path*',
  ],
};
