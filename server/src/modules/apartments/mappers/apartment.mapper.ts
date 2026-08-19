import { Injectable } from '@nestjs/common';
import { Apartment } from '@/modules/apartments/entities/apartment.entity';
import { ApartmentImage } from '@/modules/apartments/entities/apartment-image.entity';
import {
  ApartmentDetailDto,
  ApartmentImageDto,
  ApartmentSummaryDto,
} from '@/modules/apartments/dto/apartment-response.dto';

@Injectable()
export class ApartmentMapper {
  toSummary(apartment: Apartment): ApartmentSummaryDto {
    return {
      id: apartment.id,
      unitName: apartment.unitName,
      unitNumber: apartment.unitNumber,
      projectId: apartment.projectId,
      projectName: apartment.project?.name ?? '',
      price: apartment.price,
      bedrooms: apartment.bedrooms,
      bathrooms: apartment.bathrooms,
      areaSqm: apartment.areaSqm,
      coverImageUrl: this.coverImageUrl(apartment),
      createdAt: apartment.createdAt.toISOString(),
    };
  }

  toDetail(apartment: Apartment): ApartmentDetailDto {
    return {
      ...this.toSummary(apartment),
      description: apartment.description,
      updatedAt: apartment.updatedAt.toISOString(),
      images: this.sortedImages(apartment).map((image) => this.toImage(image)),
    };
  }

  toImage(image: ApartmentImage): ApartmentImageDto {
    return { id: image.id, url: image.url, sortOrder: image.sortOrder };
  }

  private sortedImages(apartment: Apartment): ApartmentImage[] {
    return [...(apartment.images ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }

  private coverImageUrl(apartment: Apartment): string | null {
    const [cover] = this.sortedImages(apartment);
    return cover ? cover.url : null;
  }
}
