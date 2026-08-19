import { Apartment } from '@/modules/apartments/entities/apartment.entity';
import { ApartmentSortBy } from '@/modules/apartments/dto/query-apartments.dto';

export interface ApartmentFilter {
  page: number;
  limit: number;
  search?: string;
  projectId?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  sortBy: ApartmentSortBy;
  sortOrder: 'ASC' | 'DESC';
}

export abstract class ApartmentRepositoryPort {
  abstract findPaginated(
    filter: ApartmentFilter,
  ): Promise<[Apartment[], number]>;
  abstract findById(id: string): Promise<Apartment | null>;
}
