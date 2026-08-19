import { Project } from '@/modules/projects/entities/project.entity';

export interface CreateProjectData {
  name: string;
  slug: string;
  city: string;
}

export abstract class ProjectRepositoryPort {
  abstract findAll(): Promise<Project[]>;
  abstract findById(id: string): Promise<Project | null>;
  abstract findByName(name: string): Promise<Project | null>;
  abstract save(data: CreateProjectData): Promise<Project>;
}
