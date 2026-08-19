export class ApartmentImageDto {
  id!: string;
  url!: string;
  sortOrder!: number;
}

export class ApartmentSummaryDto {
  id!: string;
  unitName!: string;
  unitNumber!: string;
  projectId!: string;
  projectName!: string;
  price!: string;
  bedrooms!: number;
  bathrooms!: number;
  areaSqm!: string;
  coverImageUrl!: string | null;
  createdAt!: string;
}

export class ApartmentDetailDto extends ApartmentSummaryDto {
  description!: string | null;
  updatedAt!: string;
  images!: ApartmentImageDto[];
}
