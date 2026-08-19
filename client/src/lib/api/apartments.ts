import 'server-only';
import { apiFetch } from '@/lib/api/http';
import type { ApartmentDetail, ApartmentSummary, PaginatedResult } from '@/lib/api/types';
import type { ApartmentsSearchParams } from '@/lib/utils/search-params';

export async function getApartments(
  query: ApartmentsSearchParams,
): Promise<PaginatedResult<ApartmentSummary>> {
  const params = new URLSearchParams();
  params.set('page', String(query.page));
  params.set('limit', String(query.limit));
  if (query.search) params.set('search', query.search);
  if (query.projectId) params.set('projectId', query.projectId);
  if (query.minPrice !== undefined) params.set('minPrice', String(query.minPrice));
  if (query.maxPrice !== undefined) params.set('maxPrice', String(query.maxPrice));
  if (query.bedrooms !== undefined) params.set('bedrooms', String(query.bedrooms));
  params.set('sortBy', query.sortBy);
  params.set('sortOrder', query.sortOrder);

  const { data, meta } = await apiFetch<ApartmentSummary[]>(
    `/apartments?${params.toString()}`,
  );

  return { data, meta: meta! };
}

export async function getApartmentById(id: string): Promise<ApartmentDetail> {
  const { data } = await apiFetch<ApartmentDetail>(`/apartments/${id}`);
  return data;
}
