import { Apartment } from '@/modules/apartments/entities/apartment.entity';
import { ApartmentImage } from '@/modules/apartments/entities/apartment-image.entity';
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

// Every field optional — PATCH semantics. A key simply absent from this
// object means "leave untouched"; the repository adapters filter out
// `undefined` before merging so an unset field can never clobber an
// existing column value.
export interface UpdateApartmentData {
  unitName?: string;
  unitNumber?: string;
  projectId?: string;
  description?: string | null;
  price?: string;
  bedrooms?: number;
  bathrooms?: number;
  areaSqm?: string;
}

export interface NewApartmentImageData {
  url: string;
  sortOrder: number;
}

export abstract class ApartmentRepositoryPort {
  abstract findPaginated(
    filter: ApartmentFilter,
  ): Promise<[Apartment[], number]>;
  abstract findById(id: string): Promise<Apartment | null>;
  abstract save(data: CreateApartmentData): Promise<Apartment>;
  abstract update(
    apartment: Apartment,
    data: UpdateApartmentData,
  ): Promise<Apartment>;
  abstract softRemove(apartment: Apartment): Promise<void>;
  abstract addImages(
    apartmentId: string,
    images: NewApartmentImageData[],
  ): Promise<ApartmentImage[]>;
  abstract findImage(
    apartmentId: string,
    imageId: string,
  ): Promise<ApartmentImage | null>;
  abstract removeImage(image: ApartmentImage): Promise<void>;
}
