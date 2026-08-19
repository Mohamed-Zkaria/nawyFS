import { Project } from '@/modules/projects/entities/project.entity';

export abstract class ProjectRepositoryPort {
  abstract findAll(): Promise<Project[]>;
}
