import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Project } from '@/modules/projects/entities/project.entity';
import { ProjectRepositoryPort } from '@/modules/projects/project.repository.port';
import { TypeOrmProjectRepository } from '@/modules/projects/repositories/typeorm-project.repository';
import { ProjectMapper } from '@/modules/projects/mappers/project.mapper';
import { ProjectsService } from '@/modules/projects/projects.service';
import { ProjectsController } from '@/modules/projects/projects.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Project])],
  controllers: [ProjectsController],
  providers: [
    ProjectsService,
    ProjectMapper,
    { provide: ProjectRepositoryPort, useClass: TypeOrmProjectRepository },
  ],
  exports: [ProjectRepositoryPort],
})
export class ProjectsModule {}
