export type ApartmentSortBy = 'createdAt' | 'price' | 'unitName';
export type ApartmentSortOrder = 'ASC' | 'DESC';

export interface ApartmentsSearchParams {
  page: number;
  limit: number;
  search?: string;
  projectId?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  sortBy: ApartmentSortBy;
  sortOrder: ApartmentSortOrder;
}

const SORT_BY_VALUES: readonly ApartmentSortBy[] = [
  'createdAt',
  'price',
  'unitName',
];
const SORT_ORDER_VALUES: readonly ApartmentSortOrder[] = ['ASC', 'DESC'];
const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 50;
const MAX_SEARCH_LENGTH = 100;

type RawSearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function parsePositiveInt(
  value: string | undefined,
  fallback: number,
  max?: number,
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
    return fallback;
  }
  return max !== undefined ? Math.min(parsed, max) : parsed;
}

function parseOptionalNonNegativeNumber(
  value: string | undefined,
): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function parseSortBy(value: string | undefined): ApartmentSortBy {
  return SORT_BY_VALUES.includes(value as ApartmentSortBy)
    ? (value as ApartmentSortBy)
    : 'createdAt';
}

function parseSortOrder(value: string | undefined): ApartmentSortOrder {
  return SORT_ORDER_VALUES.includes(value as ApartmentSortOrder)
    ? (value as ApartmentSortOrder)
    : 'DESC';
}

// Pure and side-effect free by design — the highest-value function to unit
// test per ImplementationPlan.md §12, once client tests land in Phase 6.
export function parseApartmentsSearchParams(
  raw: RawSearchParams,
): ApartmentsSearchParams {
  const trimmedSearch = firstValue(raw.search)?.trim();

  return {
    page: parsePositiveInt(firstValue(raw.page), 1),
    limit: parsePositiveInt(firstValue(raw.limit), DEFAULT_LIMIT, MAX_LIMIT),
    search: trimmedSearch
      ? trimmedSearch.slice(0, MAX_SEARCH_LENGTH)
      : undefined,
    projectId: firstValue(raw.projectId) || undefined,
    minPrice: parseOptionalNonNegativeNumber(firstValue(raw.minPrice)),
    maxPrice: parseOptionalNonNegativeNumber(firstValue(raw.maxPrice)),
    bedrooms: parseOptionalNonNegativeNumber(firstValue(raw.bedrooms)),
    sortBy: parseSortBy(firstValue(raw.sortBy)),
    sortOrder: parseSortOrder(firstValue(raw.sortOrder)),
  };
}

export function buildApartmentsHref(
  query: ApartmentsSearchParams,
  page: number,
): string {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  if (query.projectId) params.set('projectId', query.projectId);
  if (query.minPrice !== undefined) params.set('minPrice', String(query.minPrice));
  if (query.maxPrice !== undefined) params.set('maxPrice', String(query.maxPrice));
  if (query.bedrooms !== undefined) params.set('bedrooms', String(query.bedrooms));
  if (query.sortBy !== 'createdAt') params.set('sortBy', query.sortBy);
  if (query.sortOrder !== 'DESC') params.set('sortOrder', query.sortOrder);
  if (query.limit !== DEFAULT_LIMIT) params.set('limit', String(query.limit));
  params.set('page', String(page));
  return `/apartments?${params.toString()}`;
}
