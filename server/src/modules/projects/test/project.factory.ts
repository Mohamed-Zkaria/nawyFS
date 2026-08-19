import { Project } from '@/modules/projects/entities/project.entity';

let counter = 0;

// Deterministic incrementing counter, not @faker-js/faker — random data
// means flaky assertions and unreproducible failures (ImplementationPlan.md §12).
export function createProject(overrides: Partial<Project> = {}): Project {
  counter += 1;
  const project = new Project();
  project.id = `00000000-0000-4000-8000-${counter.toString().padStart(12, '0')}`;
  project.name = `Test Project ${counter}`;
  project.slug = `test-project-${counter}`;
  project.city = 'Cairo';
  project.createdAt = new Date('2026-01-01T00:00:00Z');
  project.updatedAt = new Date('2026-01-01T00:00:00Z');
  project.apartments = [];
  return Object.assign(project, overrides);
}

export function resetProjectFactory(): void {
  counter = 0;
}
