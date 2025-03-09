import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { deleteCookies, getSession, getUser } from './lib/auth';
import { cookies } from 'next/headers';

export async function middleware(request: NextRequest) {
  // Handle root path - simple redirect to login
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // For debugging only - remove in production
  console.log('Environment check:', {
    serverUrl: process.env.SERVER_URL,
    apiPort: process.env.API_PORT
  });

  // Special handling for login page to prevent redirect loops
  if (request.nextUrl.pathname === '/login') {
    // Only clear tokens when coming from another page, not when refreshing login
    const referer = request.headers.get('referer');
    if (referer && !referer.includes('/login')) {
      cookies().delete('access_token');
      await deleteCookies();
    }
    // Always allow access to login page without further checks
    return NextResponse.next();
  }

  // For all protected routes (anything not / or /login)
  try {
    const session = await getSession();
    if (!session) {
      // No valid session, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Session exists, try to get user data
    try {
      const user = await getUser();

      // Easter egg route
      if (request.nextUrl.pathname.startsWith('/pogi/secret/marco/handshake')) {
        return NextResponse.redirect(
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley'
        );
      }

      // Role-based access control
      if (request.nextUrl.pathname.startsWith('/mentor') && user.type !== 'Mentor') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      if (request.nextUrl.pathname.startsWith('/learner') && user.type !== 'Learner') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // User is authenticated and authorized for this route
      return NextResponse.next();
    } catch (error) {
      console.error('Error fetching user data:', error);
      // Problem with user data, redirect to login
      return NextResponse.redirect(new URL('/login', request.url));
    }
  } catch (error) {
    console.error('Session verification error:', error);
    // Problem with session, redirect to login
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/mentor/:path*',
    '/learner/:path*',
    '/pogi/:path*',
    '/dashboard/:path*',
  ],
};