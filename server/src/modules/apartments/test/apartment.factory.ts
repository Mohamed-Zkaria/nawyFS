import { Apartment } from '@/modules/apartments/entities/apartment.entity';
import { Project } from '@/modules/projects/entities/project.entity';

let counter = 0;

// Deterministic incrementing counter, not @faker-js/faker — see
// project.factory.ts for the rationale.
export function createApartment(
  project: Project,
  overrides: Partial<Apartment> = {},
): Apartment {
  counter += 1;
  const apartment = new Apartment();
  apartment.id = `10000000-0000-4000-8000-${counter.toString().padStart(12, '0')}`;
  apartment.unitName = `Unit ${counter}`;
  apartment.unitNumber = `A-${counter}`;
  apartment.projectId = project.id;
  apartment.project = project;
  apartment.description = null;
  apartment.price = '1000000.00';
  apartment.bedrooms = 2;
  apartment.bathrooms = 1;
  apartment.areaSqm = '90.00';
  apartment.createdAt = new Date('2026-01-01T00:00:00Z');
  apartment.updatedAt = new Date('2026-01-01T00:00:00Z');
  apartment.deletedAt = null;
  apartment.images = [];
  return Object.assign(apartment, overrides);
}

export function resetApartmentFactory(): void {
  counter = 0;
}
