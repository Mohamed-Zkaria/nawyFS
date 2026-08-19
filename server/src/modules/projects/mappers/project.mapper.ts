import { Injectable } from '@nestjs/common';
import { Project } from '@/modules/projects/entities/project.entity';
import { ProjectSummaryDto } from '@/modules/projects/dto/project-summary.dto';

@Injectable()
export class ProjectMapper {
  toSummary(project: Project): ProjectSummaryDto {
    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      city: project.city,
    };
  }
}
