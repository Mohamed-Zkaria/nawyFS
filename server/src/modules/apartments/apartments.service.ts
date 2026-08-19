import { Injectable } from '@nestjs/common';
import { ApartmentRepositoryPort } from '@/modules/apartments/apartment.repository.port';
import { ApartmentMapper } from '@/modules/apartments/mappers/apartment.mapper';
import { QueryApartmentsDto } from '@/modules/apartments/dto/query-apartments.dto';
import {
  ApartmentDetailDto,
  ApartmentSummaryDto,
} from '@/modules/apartments/dto/apartment-response.dto';
import { ApartmentNotFoundException } from '@/common/exceptions/domain.exceptions';
import {
  PaginatedEnvelope,
  buildPaginationMeta,
} from '@/common/interfaces/pagination.interface';

@Injectable()
export class ApartmentsService {
  constructor(
    private readonly repo: ApartmentRepositoryPort,
    private readonly mapper: ApartmentMapper,
  ) {}

  async findPaginated(
    query: QueryApartmentsDto,
  ): Promise<PaginatedEnvelope<ApartmentSummaryDto>> {
    const [items, total] = await this.repo.findPaginated({
      page: query.page,
      limit: query.limit,
      search: query.search,
      projectId: query.projectId,
      minPrice: query.minPrice,
      maxPrice: query.maxPrice,
      bedrooms: query.bedrooms,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    });

    return {
      data: items.map((item) => this.mapper.toSummary(item)),
      meta: buildPaginationMeta(query.page, query.limit, total),
    };
  }

  async findById(id: string): Promise<ApartmentDetailDto> {
    const apartment = await this.repo.findById(id);
    if (!apartment) throw new ApartmentNotFoundException(id);
    return this.mapper.toDetail(apartment);
  }
}
