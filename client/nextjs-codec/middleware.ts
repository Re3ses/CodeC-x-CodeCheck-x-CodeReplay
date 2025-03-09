import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getSession, getUser } from './lib/auth';

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
    user = await getUser();
  }

  // Prevent infinite redirect loop
  if (!session && request.nextUrl.pathname !== '/login') {
    console.log("No session found, redirecting to /login");
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (request.nextUrl.pathname === '/login') {
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('access_token', '', { expires: new Date(0) });
    response.cookies.set('refresh_token', '', { expires: new Date(0) });
    return response;
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
