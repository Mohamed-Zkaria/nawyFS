import 'server-only';
import { ApiError } from '@/lib/api/errors';
import type { PaginationMeta } from '@/lib/api/types';

// server-only guards this module from ever reaching a client bundle — it's
// the module that knows the internal Docker API URL, which must never be
// inlined into browser JS (see ImplementationPlan.md §10 — zero NEXT_PUBLIC_*).
const API_INTERNAL_URL =
  process.env.API_INTERNAL_URL ?? 'http://localhost:4000/api/v1';
const API_TIMEOUT_MS = Number(process.env.API_TIMEOUT_MS ?? 8000);

interface Envelope<T> {
  data: T;
  meta?: PaginationMeta;
}

interface ErrorEnvelope {
  statusCode: number;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<Envelope<T>> {
  const res = await fetch(`${API_INTERNAL_URL}${path}`, {
    ...init,
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
    headers: { 'content-type': 'application/json', ...init?.headers },
  });

  if (!res.ok) {
    let body: ErrorEnvelope | undefined;
    try {
      body = (await res.json()) as ErrorEnvelope;
    } catch {
      // Non-JSON error body — fall through to the generic message below.
    }
    throw new ApiError(
      res.status,
      body?.error.code ?? 'UNKNOWN_ERROR',
      body?.error.message ?? `Request failed with status ${res.status}`,
      body?.error.details,
      body?.error.requestId,
    );
  }

  return (await res.json()) as Envelope<T>;
}
