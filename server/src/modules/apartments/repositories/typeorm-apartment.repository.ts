import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Apartment } from '@/modules/apartments/entities/apartment.entity';
import { ApartmentImage } from '@/modules/apartments/entities/apartment-image.entity';
import {
  ApartmentFilter,
  ApartmentRepositoryPort,
  CreateApartmentData,
  NewApartmentImageData,
  UpdateApartmentData,
} from '@/modules/apartments/apartment.repository.port';
import { ApartmentSortBy } from '@/modules/apartments/dto/query-apartments.dto';
import { escapeLike } from '@/common/utils/escape-like';
import { withoutUndefined } from '@/common/utils/without-undefined';

const SORT_COLUMN: Record<ApartmentSortBy, string> = {
  [ApartmentSortBy.CREATED_AT]: 'apartment.createdAt',
  [ApartmentSortBy.PRICE]: 'apartment.price',
  [ApartmentSortBy.UNIT_NAME]: 'apartment.unitName',
};

@Injectable()
export class TypeOrmApartmentRepository implements ApartmentRepositoryPort {
  constructor(
    @InjectRepository(Apartment)
    private readonly repo: Repository<Apartment>,
    @InjectRepository(ApartmentImage)
    private readonly imageRepo: Repository<ApartmentImage>,
  ) {}

  async findPaginated(filter: ApartmentFilter): Promise<[Apartment[], number]> {
    const qb = this.repo
      .createQueryBuilder('apartment')
      .leftJoinAndSelect('apartment.project', 'project')
      .leftJoinAndSelect('apartment.images', 'images');

    if (filter.search) {
      const escaped = escapeLike(filter.search);
      qb.andWhere(
        '(apartment.unitName ILIKE :search OR apartment.unitNumber ILIKE :search OR project.name ILIKE :search)',
        { search: `%${escaped}%` },
      );
    }

    if (filter.projectId) {
      qb.andWhere('apartment.projectId = :projectId', {
        projectId: filter.projectId,
      });
    }

    if (filter.minPrice !== undefined) {
      qb.andWhere('apartment.price >= :minPrice', {
        minPrice: filter.minPrice,
      });
    }

    if (filter.maxPrice !== undefined) {
      qb.andWhere('apartment.price <= :maxPrice', {
        maxPrice: filter.maxPrice,
      });
    }

    if (filter.bedrooms !== undefined) {
      qb.andWhere('apartment.bedrooms = :bedrooms', {
        bedrooms: filter.bedrooms,
      });
    }

    qb.orderBy(SORT_COLUMN[filter.sortBy], filter.sortOrder).addOrderBy(
      'apartment.id',
      filter.sortOrder,
    );

    qb.skip((filter.page - 1) * filter.limit).take(filter.limit);

    return qb.getManyAndCount();
  }

  findById(id: string): Promise<Apartment | null> {
    return this.repo.findOne({
      where: { id },
      relations: ['project', 'images'],
    });
  }

  save(data: CreateApartmentData): Promise<Apartment> {
    return this.repo.save(this.repo.create(data));
  }

  update(apartment: Apartment, data: UpdateApartmentData): Promise<Apartment> {
    Object.assign(apartment, withoutUndefined(data));
    return this.repo.save(apartment);
  }

  async softRemove(apartment: Apartment): Promise<void> {
    await this.repo.softRemove(apartment);
  }

  addImages(
    apartmentId: string,
    images: NewApartmentImageData[],
  ): Promise<ApartmentImage[]> {
    const entities = images.map((image) =>
      this.imageRepo.create({ apartmentId, ...image }),
    );
    return this.imageRepo.save(entities);
  }

  findImage(
    apartmentId: string,
    imageId: string,
  ): Promise<ApartmentImage | null> {
    return this.imageRepo.findOne({ where: { id: imageId, apartmentId } });
  }

  async removeImage(image: ApartmentImage): Promise<void> {
    await this.imageRepo.remove(image);
  }
}
