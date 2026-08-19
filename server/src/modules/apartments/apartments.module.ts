import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Apartment } from '@/modules/apartments/entities/apartment.entity';
import { ApartmentRepositoryPort } from '@/modules/apartments/apartment.repository.port';
import { TypeOrmApartmentRepository } from '@/modules/apartments/repositories/typeorm-apartment.repository';
import { ApartmentMapper } from '@/modules/apartments/mappers/apartment.mapper';
import { ApartmentsService } from '@/modules/apartments/apartments.service';
import { ApartmentsController } from '@/modules/apartments/apartments.controller';
import { ProjectsModule } from '@/modules/projects/projects.module';

@Module({
  imports: [TypeOrmModule.forFeature([Apartment]), ProjectsModule],
  controllers: [ApartmentsController],
  providers: [
    ApartmentsService,
    ApartmentMapper,
    {
      provide: ApartmentRepositoryPort,
      useClass: TypeOrmApartmentRepository,
    },
  ],
})
export class ApartmentsModule {}
