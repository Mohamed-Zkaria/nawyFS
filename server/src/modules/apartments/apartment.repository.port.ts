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

export interface CreateApartmentData {
  unitName: string;
  unitNumber: string;
  projectId: string;
  description: string | null;
  price: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: string;
}

export abstract class ApartmentRepositoryPort {
  abstract findPaginated(
    filter: ApartmentFilter,
  ): Promise<[Apartment[], number]>;
  abstract findById(id: string): Promise<Apartment | null>;
  abstract save(data: CreateApartmentData): Promise<Apartment>;
}
