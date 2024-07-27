import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { deleteCookies, getSession, getUser } from './lib/auth';
import { cookies } from 'next/headers';

// todo: check routes if user is authenticated and if user is mentor or learner. Route accordingly...
// todo: to do first todo, probably make another cookie that contains username and user type
export async function middleware(request: NextRequest) {
  let session;
  let user;

  if (
    request.nextUrl.pathname !== '/' &&
    request.nextUrl.pathname !== '/login'
  ) {
    session = await getSession();
    user = await getUser();
  }
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  if (request.nextUrl.pathname === '/login') {
    cookies().delete('access_token');
    await deleteCookies();
  }

  if (session) {
    if (
      request.nextUrl.pathname.startsWith('/pogi/secret/marco/handshake')
    ) {
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
  } else {
    return NextResponse.redirect(new URL('/', request.url));
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
