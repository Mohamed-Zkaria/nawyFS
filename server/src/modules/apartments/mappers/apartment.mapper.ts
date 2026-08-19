import { Injectable } from '@nestjs/common';
import { AppConfigService } from '@/config/app-config.service';
import { Apartment } from '@/modules/apartments/entities/apartment.entity';
import { ApartmentImage } from '@/modules/apartments/entities/apartment-image.entity';
import {
  ApartmentDetailDto,
  ApartmentSummaryDto,
} from '@/modules/apartments/dto/apartment-response.dto';

@Injectable()
export class ApartmentMapper {
  constructor(private readonly cfg: AppConfigService) {}

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
      images: this.sortedImages(apartment).map((image) => ({
        id: image.id,
        url: this.imageUrl(image.storageKey),
        sortOrder: image.sortOrder,
      })),
    };
  }

  private sortedImages(apartment: Apartment): ApartmentImage[] {
    return [...(apartment.images ?? [])].sort(
      (a, b) => a.sortOrder - b.sortOrder,
    );
  }

  private coverImageUrl(apartment: Apartment): string | null {
    const [cover] = this.sortedImages(apartment);
    return cover ? this.imageUrl(cover.storageKey) : null;
  }

  // Relative, host-agnostic path composed from config — never an absolute
  // URL, so the same DB dump works in dev, docker, and any future deploy.
  private imageUrl(storageKey: string): string {
    return `${this.cfg.uploads.publicPath}/${storageKey}`;
  }
}
