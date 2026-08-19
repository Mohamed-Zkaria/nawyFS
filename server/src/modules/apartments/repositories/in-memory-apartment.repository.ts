import { Apartment } from '@/modules/apartments/entities/apartment.entity';
import {
  ApartmentFilter,
  ApartmentRepositoryPort,
  CreateApartmentData,
} from '@/modules/apartments/apartment.repository.port';
import { ApartmentSortBy } from '@/modules/apartments/dto/query-apartments.dto';

// Test double proving ApartmentRepositoryPort's LSP contract: this and
// TypeOrmApartmentRepository are interchangeable behind the same port, so
// ApartmentsService can be unit-tested with zero database.
export class InMemoryApartmentRepository implements ApartmentRepositoryPort {
  private apartments: Apartment[] = [];

  seed(apartments: Apartment[]): void {
    this.apartments = apartments;
  }

  findPaginated(filter: ApartmentFilter): Promise<[Apartment[], number]> {
    let results = this.apartments.filter((a) => !a.deletedAt);

    if (filter.search) {
      const term = filter.search.toLowerCase();
      results = results.filter(
        (a) =>
          a.unitName.toLowerCase().includes(term) ||
          a.unitNumber.toLowerCase().includes(term) ||
          (a.project?.name.toLowerCase().includes(term) ?? false),
      );
    }
    if (filter.projectId) {
      results = results.filter((a) => a.projectId === filter.projectId);
    }
    if (filter.minPrice !== undefined) {
      const min = filter.minPrice;
      results = results.filter((a) => Number(a.price) >= min);
    }
    if (filter.maxPrice !== undefined) {
      const max = filter.maxPrice;
      results = results.filter((a) => Number(a.price) <= max);
    }
    if (filter.bedrooms !== undefined) {
      results = results.filter((a) => a.bedrooms === filter.bedrooms);
    }

    const sorted = [...results].sort((a, b) => {
      let cmp: number;
      if (filter.sortBy === ApartmentSortBy.PRICE) {
        cmp = Number(a.price) - Number(b.price);
      } else if (filter.sortBy === ApartmentSortBy.UNIT_NAME) {
        cmp = a.unitName.localeCompare(b.unitName);
      } else {
        cmp = a.createdAt.getTime() - b.createdAt.getTime();
      }
      if (cmp === 0) cmp = a.id.localeCompare(b.id);
      return filter.sortOrder === 'ASC' ? cmp : -cmp;
    });

    const total = sorted.length;
    const start = (filter.page - 1) * filter.limit;
    const page = sorted.slice(start, start + filter.limit);

    return Promise.resolve([page, total]);
  }

  findById(id: string): Promise<Apartment | null> {
    const found = this.apartments.find((a) => a.id === id && !a.deletedAt);
    return Promise.resolve(found ?? null);
  }

  save(data: CreateApartmentData): Promise<Apartment> {
    const apartment = new Apartment();
    Object.assign(apartment, data);
    apartment.id = `saved-${this.apartments.length + 1}`;
    apartment.createdAt = new Date();
    apartment.updatedAt = new Date();
    apartment.deletedAt = null;
    apartment.images = [];
    this.apartments.push(apartment);
    return Promise.resolve(apartment);
  }
}
