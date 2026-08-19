import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProjectsService } from '@/modules/projects/projects.service';
import { ProjectSummaryDto } from '@/modules/projects/dto/project-summary.dto';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get()
  findAll(): Promise<ProjectSummaryDto[]> {
    return this.projectsService.findAll();
  }
}
