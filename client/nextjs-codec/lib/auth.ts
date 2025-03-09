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
  try {
    await SilentLogin();
    const userSession = await getSession();

    if (!userSession?.username) {
      console.error("No username found in session");
      throw new Error('Invalid session data');
    }

    const baseUrl = process.env.SERVER_URL || '';
    const apiPort = process.env.API_PORT || '';
    const url = `${baseUrl}${apiPort}/api/users/${userSession.username}`;

    console.log("Fetching user data from:", url);

    const access_token = cookies().get('access_token')?.value;
    if (!access_token) {
      console.error("No access token available");
      throw new Error('Missing access token');
    }

    const headers = {
      Authorization: `Bearer ${access_token}`,
    };

    const res = await fetch(url, {
      method: 'GET',
      headers: headers,
      cache: 'no-store' // Prevent caching issues
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`API error (${res.status}):`, errorText);
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    console.log("User data fetched successfully");
    return data;
  } catch (e) {
    console.error("Detailed user fetch error:", e);
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
