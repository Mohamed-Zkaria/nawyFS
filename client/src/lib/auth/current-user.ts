import 'server-only';
import { getSessionToken } from '@/lib/auth/session';
import { getCurrentUser as fetchCurrentUser, type AuthUser } from '@/lib/api/auth';

export type { AuthUser };

// Authorization is enforced server-side here — the real authority is the
// API's RolesGuard; this is what admin/layout.tsx gates rendering on
// (ImplementationPlan.md §9's "Proxy is for optimistic checks only" note
// doesn't even apply, since there's no client-side check at all here).
export async function getAuthenticatedUser(): Promise<AuthUser | null> {
  const token = await getSessionToken();
  if (!token) return null;

  try {
    return await fetchCurrentUser(token);
  } catch {
    return null;
  }
}
