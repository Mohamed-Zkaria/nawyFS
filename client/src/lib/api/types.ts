export interface ApartmentImage {
  id: string;
  url: string;
  sortOrder: number;
}

export interface ApartmentSummary {
  id: string;
  unitName: string;
  unitNumber: string;
  projectId: string;
  projectName: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: string;
  coverImageUrl: string | null;
  createdAt: string;
}

export interface ApartmentDetail extends ApartmentSummary {
  description: string | null;
  updatedAt: string;
  images: ApartmentImage[];
}

export interface ProjectSummary {
  id: string;
  name: string;
  slug: string;
  city: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}
