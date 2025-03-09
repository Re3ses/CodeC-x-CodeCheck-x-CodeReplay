'use server';

import { setSecureCookie, SilentLogin } from '@/utilities/apiService';
import TimeToMS from '@/utilities/timeToMS';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { LoginShemaInferredType } from './interface/login';

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

export async function getSession() {
  const res = jwt.decode(cookies().get('refresh_token')?.value!);
  return res ? JSON.parse(JSON.stringify(res)) : null;
}

export async function getUser() {
  // bug at middleware
  await SilentLogin();
  const user = await getSession();
  const url = `${process.env.SERVER_URL}${process.env.API_PORT}/api/users/${user?.username}`;

  console.log("Fetching user data from:", url);

  const access_token = cookies().get('access_token')?.value; // token expires in vanilla server: just a hunch
  const headers = {
    Authorization: `Bearer ${access_token}`,
  };

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: headers,
    });
    const data = await res.json();

    // console.log('user data: ', data);

    return data;
  } catch (e) {
    throw new Error('Error getting user info');
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