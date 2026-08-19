import 'server-only';
import { cookies } from 'next/headers';

// httpOnly cookie, not localStorage — XSS-resistant, and lets
// admin/layout.tsx read the token server-side (ImplementationPlan.md §7).
export const SESSION_COOKIE_NAME = process.env.SESSION_COOKIE_NAME || 'nawy_session';
const SESSION_COOKIE_SECURE = process.env.SESSION_COOKIE_SECURE === 'true';

export async function getSessionToken(): Promise<string | undefined> {
  const store = await cookies();
  return store.get(SESSION_COOKIE_NAME)?.value;
}

export async function setSessionCookie(
  token: string,
  maxAgeSeconds: number,
): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: SESSION_COOKIE_SECURE,
    path: '/',
    maxAge: maxAgeSeconds,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE_NAME);
}
