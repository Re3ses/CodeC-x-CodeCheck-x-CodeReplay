'use server';

import { setSecureCookie, SilentLogin } from '@/utilities/apiService';
import TimeToMS from '@/utilities/timeToMS';
import jwt, { JwtPayload } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginShemaInferredType } from './interface/login';
import { NextRequest } from 'next/server';

export async function refreshToken() {
  let refresh_token = cookies().get('refresh_token')?.value;

  const url = `${process.env.SERVER_URL}${process.env.AUTH_PORT}/auth/refresh/`;
  const payload = {
    token: refresh_token,
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error('Failed to refresh token');
    }

    const { access_token, refresh_token } = await res.json();

    setSecureCookie(
      'access_token',
      access_token,
      Date.now() + TimeToMS(0, 24, 0)
    );
    setSecureCookie(
      'refresh_token',
      refresh_token,
      Date.now() + TimeToMS(12, 0, 0)
    );

    return res.status;
  } catch (e) {
    console.error(e);
  }
}

export async function getSession(request: NextRequest): Promise<JwtPayload | null> {
  const refreshToken = request.cookies.get('refresh_token')?.value;
  if (!refreshToken) return null;

  try {
    const decoded = jwt.decode(refreshToken);
    if (typeof decoded === 'string') return null;
    return decoded as JwtPayload;
  } catch (error) {
    console.error('JWT Decode Error:', error);
    return null;
  }
}
export async function getUser(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.username) return null;

  const url = `${process.env.SERVER_URL}${process.env.API_PORT}/api/users/${session.username}`;
  const access_token = request.cookies.get('access_token')?.value;

  if (!access_token) return null;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Authorization: `Bearer ${access_token}` },
    });

    if (!res.ok) throw new Error('Failed to fetch user data');

    return await res.json();
  } catch (error) {
    console.error('Error getting user info:', error);
    return null;
  }
}

export async function login(payload: LoginShemaInferredType) {
  try {
    const url = `${process.env.SERVER_URL}${process.env.AUTH_PORT}/auth/login/`;

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error('Failed to login');
    }

    const { access_token, refresh_token } = await res.json();
    console.log(access_token);

    setSecureCookie(
      'access_token',
      access_token,
      Date.now() + TimeToMS(0, 24, 0)
    );
    setSecureCookie(
      'refresh_token',
      refresh_token,
      Date.now() + TimeToMS(12, 0, 0)
    );

    return res.status;
  } catch {
    throw new Error('Failed to get learner rooms');
  }
}

export async function refresh() { }

export async function logoutUser() {
  cookies().delete('access_token');
  cookies().delete('refresh_token');
  redirect('/login');
}

export async function deleteCookies() {
  cookies().delete('access_token');
  cookies().delete('refresh_token');
}
