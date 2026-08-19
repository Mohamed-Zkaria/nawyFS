import { Injectable } from '@nestjs/common';
import { ProjectRepositoryPort } from '@/modules/projects/project.repository.port';
import { ProjectMapper } from '@/modules/projects/mappers/project.mapper';
import { ProjectSummaryDto } from '@/modules/projects/dto/project-summary.dto';

@Injectable()
export class ProjectsService {
  constructor(
    private readonly repo: ProjectRepositoryPort,
    private readonly mapper: ProjectMapper,
  ) {}

  async findAll(): Promise<ProjectSummaryDto[]> {
    const projects = await this.repo.findAll();
    return projects.map((project) => this.mapper.toSummary(project));
  }
}
