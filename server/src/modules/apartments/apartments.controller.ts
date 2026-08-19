import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ApartmentsService } from '@/modules/apartments/apartments.service';
import { QueryApartmentsDto } from '@/modules/apartments/dto/query-apartments.dto';
import {
  ApartmentDetailDto,
  ApartmentSummaryDto,
} from '@/modules/apartments/dto/apartment-response.dto';
import { PaginatedEnvelope } from '@/common/interfaces/pagination.interface';

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
}
