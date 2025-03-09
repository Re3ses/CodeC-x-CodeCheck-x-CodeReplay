import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { getSession, getUser } from './lib/auth';

export async function middleware(request: NextRequest) {
  let session = null;
  let user = null;

  if (
    request.nextUrl.pathname !== '/' &&
    request.nextUrl.pathname !== '/login'
  ) {
    session = await getSession(request);
    user = await getUser(request);
  }

  if (!session && request.nextUrl.pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (request.nextUrl.pathname === '/login') {
    const response = NextResponse.next();
    response.cookies.set('access_token', '', { maxAge: -1 });
    return response;
  }

  if (session && user) {
    if (request.nextUrl.pathname.startsWith('/pogi/secret/marco/handshake')) {
      return NextResponse.redirect(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ&ab_channel=RickAstley'
      );
    }

    if (request.nextUrl.pathname.startsWith('/mentor') && user.type !== 'Mentor') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    if (request.nextUrl.pathname.startsWith('/learner') && user.type !== 'Learner') {
      return NextResponse.redirect(new URL('/dashboard', request.url));
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
