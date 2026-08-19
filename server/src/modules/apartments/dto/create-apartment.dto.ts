import { PartialType } from '@nestjs/swagger';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateApartmentDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  unitName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  @Matches(/^[A-Za-z0-9\-/ ]+$/)
  unitNumber!: string;

  // Exactly one of projectId / projectName is expected. projectId
  // references an existing project; projectName (+ projectCity) creates one
  // on the fly if no project with that name exists yet.
  @ValidateIf((dto: CreateApartmentDto) => !dto.projectName)
  @IsUUID()
  projectId?: string;

  @ValidateIf((dto: CreateApartmentDto) => !dto.projectId)
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  projectName?: string;

  @ValidateIf((dto: CreateApartmentDto) => !!dto.projectName)
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  projectCity?: string;

  @IsOptional()
  @IsString()
  @MaxLength(4000)
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  @IsInt()
  @Min(0)
  @Max(20)
  bedrooms!: number;

  @IsInt()
  @Min(0)
  bathrooms!: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  areaSqm!: number;
}

// PartialType adds @IsOptional() to every inherited property, so a PATCH
// payload touching only one field validates correctly — and, crucially,
// so does omitting both projectId and projectName (the @ValidateIf pair
// above only ever runs when the value is actually present).
export class UpdateApartmentDto extends PartialType(CreateApartmentDto) {}
