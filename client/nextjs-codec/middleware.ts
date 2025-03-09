import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { deleteCookies, getSession, getUser } from './lib/auth';

// Ensure environment variables are set
if (!process.env.SERVER_URL || !process.env.API_PORT) {
  throw new Error("Missing environment variables: SERVER_URL or API_PORT");
}

async function testHealthEndpoint() {
  try {
    const response = await fetch(`${process.env.SERVER_URL}${process.env.API_PORT}/api/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json', // Important for some servers
        // Any other necessary headers
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('Health check response:', data);
  } catch (error) {
    console.error('Health check error:', error);
  }
}

export async function middleware(request: NextRequest) {
  await testHealthEndpoint();
  try {

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
  } catch (error) {
    console.error("Middleware Error:", error); // Log the error
    // return NextResponse.json({ error: "Middleware failed" }, { status: 500 }); // Return a 500 response
  }
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
