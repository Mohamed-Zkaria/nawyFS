import 'server-only';
import { apiFetch } from '@/lib/api/http';

export interface AuthUser {
  sub: string;
  email: string;
  role: 'admin' | 'normal';
}

interface LoginResult {
  accessToken: string;
  expiresIn: number;
  user: { id: string; email: string; role: 'admin' | 'normal' };
}

export async function login(
  email: string,
  password: string,
): Promise<LoginResult> {
  const { data } = await apiFetch<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  return data;
}

// Round-trips through the API rather than decoding the JWT locally — the
// point is verifying the signature (and that the token hasn't expired or
// been tampered with), which only the API can actually do.
export async function getCurrentUser(token: string): Promise<AuthUser> {
  const { data } = await apiFetch<AuthUser>('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });
  return data;
}
