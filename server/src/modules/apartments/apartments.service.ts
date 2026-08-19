import { Injectable } from '@nestjs/common';
import { ApartmentRepositoryPort } from '@/modules/apartments/apartment.repository.port';
import { ProjectRepositoryPort } from '@/modules/projects/project.repository.port';
import { ApartmentMapper } from '@/modules/apartments/mappers/apartment.mapper';
import { QueryApartmentsDto } from '@/modules/apartments/dto/query-apartments.dto';
import {
  CreateApartmentDto,
  UpdateApartmentDto,
} from '@/modules/apartments/dto/create-apartment.dto';
import { AddApartmentImagesDto } from '@/modules/apartments/dto/add-apartment-images.dto';
import {
  ApartmentDetailDto,
  ApartmentImageDto,
  ApartmentSummaryDto,
} from '@/modules/apartments/dto/apartment-response.dto';
import {
  ApartmentImageNotFoundException,
  ApartmentNotFoundException,
  ProjectNotFoundException,
} from '@/common/exceptions/domain.exceptions';
import {
  PaginatedEnvelope,
  buildPaginationMeta,
} from '@/common/interfaces/pagination.interface';
import { slugify } from '@/common/utils/slugify';
import { Project } from '@/modules/projects/entities/project.entity';

@Injectable()
export class ApartmentsService {
  constructor(
    private readonly repo: ApartmentRepositoryPort,
    private readonly projectRepo: ProjectRepositoryPort,
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

  async create(dto: CreateApartmentDto): Promise<ApartmentDetailDto> {
    const project = dto.projectId
      ? await this.requireProject(dto.projectId)
      : await this.findOrCreateProject(dto.projectName!, dto.projectCity!);

    const created = await this.repo.save({
      unitName: dto.unitName,
      unitNumber: dto.unitNumber,
      projectId: project.id,
      description: dto.description ?? null,
      price: dto.price.toFixed(2),
      bedrooms: dto.bedrooms,
      bathrooms: dto.bathrooms,
      areaSqm: dto.areaSqm.toFixed(2),
    });

    const full = await this.repo.findById(created.id);
    return this.mapper.toDetail(full!);
  }

  async update(
    id: string,
    dto: UpdateApartmentDto,
  ): Promise<ApartmentDetailDto> {
    const apartment = await this.repo.findById(id);
    if (!apartment) throw new ApartmentNotFoundException(id);

    let projectId: string | undefined;
    if (dto.projectId) {
      await this.requireProject(dto.projectId);
      projectId = dto.projectId;
    } else if (dto.projectName) {
      const project = await this.findOrCreateProject(
        dto.projectName,
        dto.projectCity!,
      );
      projectId = project.id;
    }

    await this.repo.update(apartment, {
      unitName: dto.unitName,
      unitNumber: dto.unitNumber,
      projectId,
      description: dto.description,
      price: dto.price?.toFixed(2),
      bedrooms: dto.bedrooms,
      bathrooms: dto.bathrooms,
      areaSqm: dto.areaSqm?.toFixed(2),
    });

    const full = await this.repo.findById(id);
    return this.mapper.toDetail(full!);
  }

  async remove(id: string): Promise<void> {
    const apartment = await this.repo.findById(id);
    if (!apartment) throw new ApartmentNotFoundException(id);
    await this.repo.softRemove(apartment);
  }

  async addImages(
    id: string,
    dto: AddApartmentImagesDto,
  ): Promise<ApartmentImageDto[]> {
    const apartment = await this.repo.findById(id);
    if (!apartment) throw new ApartmentNotFoundException(id);

    const startOrder = apartment.images.length
      ? Math.max(...apartment.images.map((image) => image.sortOrder)) + 1
      : 0;

    const created = await this.repo.addImages(
      id,
      dto.urls.map((url, index) => ({ url, sortOrder: startOrder + index })),
    );

    return created.map((image) => this.mapper.toImage(image));
  }

  async removeImage(apartmentId: string, imageId: string): Promise<void> {
    const image = await this.repo.findImage(apartmentId, imageId);
    if (!image) throw new ApartmentImageNotFoundException(imageId);
    await this.repo.removeImage(image);
  }

  private async requireProject(id: string): Promise<Project> {
    const project = await this.projectRepo.findById(id);
    if (!project) throw new ProjectNotFoundException(id);
    return project;
  }

  private async findOrCreateProject(
    name: string,
    city: string,
  ): Promise<Project> {
    const existing = await this.projectRepo.findByName(name);
    if (existing) return existing;
    return this.projectRepo.save({ name, slug: slugify(name), city });
  }
}
