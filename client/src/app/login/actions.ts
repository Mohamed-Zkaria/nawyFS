'use server';

import { redirect } from 'next/navigation';
import { login } from '@/lib/api/auth';
import { setSessionCookie } from '@/lib/auth/session';
import { ApiError } from '@/lib/api/errors';

export interface LoginState {
  error?: string;
}

export async function loginAction(
  _prevState: LoginState,
  formData: FormData,
): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '');

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  try {
    const result = await login(email, password);
    if (result.user.role !== 'admin') {
      return { error: 'This account does not have admin access.' };
    }
    await setSessionCookie(result.accessToken, result.expiresIn);
  } catch (err) {
    return {
      error:
        err instanceof ApiError
          ? err.message
          : 'Something went wrong. Please try again.',
    };
  }

  // Outside the try/catch on purpose — redirect() throws internally, and
  // catching that here would swallow the redirect instead of performing it.
  redirect('/admin/apartments');
}
