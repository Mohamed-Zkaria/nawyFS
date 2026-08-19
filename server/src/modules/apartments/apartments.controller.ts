import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { ApartmentsService } from '@/modules/apartments/apartments.service';
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
import { PaginatedEnvelope } from '@/common/interfaces/pagination.interface';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { UserRole } from '@/modules/users/entities/user-role.enum';

// The 'auth' named throttler (a tighter bucket, see auth.module.ts) checks
// every route by default — this controller isn't what it's meant to guard.
@SkipThrottle({ auth: true })
@ApiTags('apartments')
@Controller('apartments')
export class ApartmentsController {
  constructor(private readonly apartmentsService: ApartmentsService) {}

  @Public()
  @Get()
  findAll(
    @Query() query: QueryApartmentsDto,
  ): Promise<PaginatedEnvelope<ApartmentSummaryDto>> {
    return this.apartmentsService.findPaginated(query);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string): Promise<ApartmentDetailDto> {
    return this.apartmentsService.findById(id);
  }

  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Post()
  create(@Body() dto: CreateApartmentDto): Promise<ApartmentDetailDto> {
    return this.apartmentsService.create(dto);
  }

  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApartmentDto,
  ): Promise<ApartmentDetailDto> {
    return this.apartmentsService.update(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.apartmentsService.remove(id);
  }

  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Post(':id/images')
  addImages(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AddApartmentImagesDto,
  ): Promise<ApartmentImageDto[]> {
    return this.apartmentsService.addImages(id, dto);
  }

  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Delete(':id/images/:imageId')
  @HttpCode(204)
  removeImage(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ): Promise<void> {
    return this.apartmentsService.removeImage(id, imageId);
  }
}
