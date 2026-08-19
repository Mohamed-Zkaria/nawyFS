import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ApartmentsService } from '@/modules/apartments/apartments.service';
import { QueryApartmentsDto } from '@/modules/apartments/dto/query-apartments.dto';
import { CreateApartmentDto } from '@/modules/apartments/dto/create-apartment.dto';
import {
  ApartmentDetailDto,
  ApartmentSummaryDto,
} from '@/modules/apartments/dto/apartment-response.dto';
import { PaginatedEnvelope } from '@/common/interfaces/pagination.interface';
import { Roles } from '@/modules/auth/decorators/roles.decorator';
import { UserRole } from '@/modules/users/entities/user-role.enum';

@ApiTags('apartments')
@Controller('apartments')
export class ApartmentsController {
  constructor(private readonly apartmentsService: ApartmentsService) {}

  @Get()
  findAll(
    @Query() query: QueryApartmentsDto,
  ): Promise<PaginatedEnvelope<ApartmentSummaryDto>> {
    return this.apartmentsService.findPaginated(query);
  }

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
}
