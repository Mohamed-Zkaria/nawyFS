import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { ProjectsService } from '@/modules/projects/projects.service';
import { ProjectSummaryDto } from '@/modules/projects/dto/project-summary.dto';
import { Public } from '@/modules/auth/decorators/public.decorator';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Public()
  @Get()
  findAll(): Promise<ProjectSummaryDto[]> {
    return this.projectsService.findAll();
  }
}
