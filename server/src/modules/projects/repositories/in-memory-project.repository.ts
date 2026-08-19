import { Project } from '@/modules/projects/entities/project.entity';
import {
  CreateProjectData,
  ProjectRepositoryPort,
} from '@/modules/projects/project.repository.port';

export class InMemoryProjectRepository implements ProjectRepositoryPort {
  private projects: Project[] = [];

  seed(projects: Project[]): void {
    this.projects = projects;
  }

  findAll(): Promise<Project[]> {
    return Promise.resolve(
      [...this.projects].sort((a, b) => a.name.localeCompare(b.name)),
    );
  }

  findById(id: string): Promise<Project | null> {
    return Promise.resolve(this.projects.find((p) => p.id === id) ?? null);
  }

  findByName(name: string): Promise<Project | null> {
    return Promise.resolve(this.projects.find((p) => p.name === name) ?? null);
  }

  save(data: CreateProjectData): Promise<Project> {
    const project = new Project();
    Object.assign(project, data);
    project.id = `project-${this.projects.length + 1}`;
    project.createdAt = new Date();
    project.updatedAt = new Date();
    project.apartments = [];
    this.projects.push(project);
    return Promise.resolve(project);
  }
}
