import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { deleteCookies, getSession, getUser } from './lib/auth';

// Ensure environment variables are set
if (!process.env.SERVER_URL || !process.env.API_PORT) {
  throw new Error("Missing environment variables: SERVER_URL or API_PORT");
}

// async function testHealthEndpoint() {
//   try {
//     const response = await fetch(`${process.env.SERVER_URL}${process.env.API_PORT}/api/health`, {
//       method: 'GET',
//       headers: {
//         'Content-Type': 'application/json', // Important for some servers
//         // Any other necessary headers
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//     }

//     const data = await response.json();
//     console.log('Health check response:', data);
//   } catch (error) {
//     console.error('Health check error:', error);
//   }
// }

export async function middleware(request: NextRequest) {
  try {
    let session;
    let user;

    // Public paths that don't require authentication
    const publicPaths = ['/login', '/study-results'];
    const isPublicPath = publicPaths.some(path =>
      request.nextUrl.pathname === path || request.nextUrl.pathname.startsWith(`${path}/`)
    );

    // Skip authentication checks for public paths
    if (!isPublicPath && request.nextUrl.pathname !== '/') {
      session = await getSession();
      user = await getUser();

      // Redirect to login if no session and not on public path
      if (!session) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    }

    // Allow access to root path without redirection
    if (request.nextUrl.pathname === '/') {
      return NextResponse.next();
    }

    if (request.nextUrl.pathname === '/login') {
      // Only clear tokens when coming from another page, not when refreshing login
      const referer = request.headers.get('referer');
      if (referer && !referer.includes('/login')) {
        await deleteCookies();
      }
      return NextResponse.next();
    }

    // Role-based access checks (only run if we have a session)
    if (session) {
      // Easter egg
      if (request.nextUrl.pathname.startsWith('/pogi/secret/marco/handshake')) {
        return NextResponse.redirect(
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley'
        );
      }

      // Role protection for mentor routes
      if (request.nextUrl.pathname.startsWith('/mentor') && user.type !== 'Mentor') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }

      // Role protection for learner routes
      if (request.nextUrl.pathname.startsWith('/learner') && user.type !== 'Learner') {
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Middleware Error:", error);
    return NextResponse.next();
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