import { DataSource } from 'typeorm';
import { Project } from '@/modules/projects/entities/project.entity';
import { Apartment } from '@/modules/apartments/entities/apartment.entity';

// Deterministic seed data — no @faker-js/faker. Random data means flaky
// assertions and unreproducible failures (ImplementationPlan.md §12).
interface ProjectSeed {
  name: string;
  slug: string;
  city: string;
  unitCount: number;
}

const PROJECTS: ProjectSeed[] = [
  {
    name: 'Sunset Residences',
    slug: 'sunset-residences',
    city: 'Cairo',
    unitCount: 8,
  },
  {
    name: 'Marina Heights',
    slug: 'marina-heights',
    city: 'Alexandria',
    unitCount: 8,
  },
  { name: 'Palm Gardens', slug: 'palm-gardens', city: 'Cairo', unitCount: 7 },
  {
    name: 'Nile View Towers',
    slug: 'nile-view-towers',
    city: 'Cairo',
    unitCount: 8,
  },
  {
    name: 'Golden Sands',
    slug: 'golden-sands',
    city: 'Hurghada',
    unitCount: 7,
  },
  { name: 'Emerald Park', slug: 'emerald-park', city: 'Giza', unitCount: 8 },
  { name: 'Skyline Court', slug: 'skyline-court', city: 'Cairo', unitCount: 7 },
  {
    name: 'Oasis Villas',
    slug: 'oasis-villas',
    city: 'Sheikh Zayed',
    unitCount: 8,
  },
];

const FLOOR_LETTERS = ['A', 'B', 'C', 'D'];

interface ApartmentSeedData {
  unitName: string;
  unitNumber: string;
  description: string;
  price: string;
  bedrooms: number;
  bathrooms: number;
  areaSqm: string;
}

function buildApartments(
  projectName: string,
  unitCount: number,
): ApartmentSeedData[] {
  const apartments: ApartmentSeedData[] = [];

  for (let i = 0; i < unitCount; i++) {
    const floor = Math.floor(i / FLOOR_LETTERS.length) + 1;
    const letter = FLOOR_LETTERS[i % FLOOR_LETTERS.length];
    const unitNumber = `${letter}-${floor}`;
    const bedrooms = 1 + (i % 4);
    const bathrooms = 1 + (i % 3);
    const areaSqm = 55 + i * 12;
    const price = 900000 + bedrooms * 300000 + i * 25000;

    apartments.push({
      unitName: `${projectName} - ${unitNumber}`,
      unitNumber,
      description: `A ${bedrooms}-bedroom unit in ${projectName}, floor ${floor}.`,
      price: price.toFixed(2),
      bedrooms,
      bathrooms,
      areaSqm: areaSqm.toFixed(2),
    });
  }

  return apartments;
}

async function upsertProjects(dataSource: DataSource): Promise<Project[]> {
  const repo = dataSource.getRepository(Project);
  const saved: Project[] = [];

  for (const seed of PROJECTS) {
    let project = await repo.findOne({ where: { slug: seed.slug } });
    if (!project) {
      project = repo.create({
        name: seed.name,
        slug: seed.slug,
        city: seed.city,
      });
    } else {
      project.name = seed.name;
      project.city = seed.city;
    }
    saved.push(await repo.save(project));
  }

  return saved;
}

async function upsertApartments(
  dataSource: DataSource,
  projects: Project[],
): Promise<void> {
  const repo = dataSource.getRepository(Apartment);

  for (const project of projects) {
    const seed = PROJECTS.find((p) => p.slug === project.slug);
    if (!seed) continue;

    const apartments = buildApartments(project.name, seed.unitCount);

    for (const data of apartments) {
      let apartment = await repo.findOne({
        where: { projectId: project.id, unitNumber: data.unitNumber },
      });
      if (!apartment) {
        apartment = repo.create({ ...data, projectId: project.id });
      } else {
        Object.assign(apartment, data);
      }
      await repo.save(apartment);
    }
  }
}

export async function runSeed(dataSource: DataSource): Promise<void> {
  const projects = await upsertProjects(dataSource);
  await upsertApartments(dataSource, projects);
}
