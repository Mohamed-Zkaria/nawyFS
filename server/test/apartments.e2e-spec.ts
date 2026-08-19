import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from './setup/test-app';
import { truncateAll } from './setup/db-reset';
import { Project } from '../src/modules/projects/entities/project.entity';
import { Apartment } from '../src/modules/apartments/entities/apartment.entity';

describe('Apartments (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    app = await createTestApp();
    dataSource = app.get(DataSource);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await truncateAll(dataSource);
  });

  async function seedProject(
    overrides: Partial<Project> = {},
  ): Promise<Project> {
    const repo = dataSource.getRepository(Project);
    return repo.save(
      repo.create({
        name: 'Sunset Residences',
        slug: 'sunset-residences',
        city: 'Cairo',
        ...overrides,
      }),
    );
  }

  async function seedApartment(
    project: Project,
    overrides: Partial<Apartment> = {},
  ): Promise<Apartment> {
    const repo = dataSource.getRepository(Apartment);
    return repo.save(
      repo.create({
        unitName: 'Sunset Residences - A-1',
        unitNumber: 'A-1',
        projectId: project.id,
        price: '1000000.00',
        bedrooms: 2,
        bathrooms: 1,
        areaSqm: '90.00',
        ...overrides,
      }),
    );
  }

  describe('GET /api/v1/apartments', () => {
    it('paginates results and returns correct meta', async () => {
      const project = await seedProject();
      for (let i = 0; i < 15; i++) {
        await seedApartment(project, { unitNumber: `A-${i + 1}` });
      }

      const res = await request(app.getHttpServer())
        .get('/api/v1/apartments?page=2&limit=10')
        .expect(200);

      expect(res.body.data).toHaveLength(5);
      expect(res.body.meta).toEqual({
        page: 2,
        limit: 10,
        total: 15,
        totalPages: 2,
        hasNextPage: false,
        hasPreviousPage: true,
      });
    });

    it('searches by unit name', async () => {
      const project = await seedProject();
      await seedApartment(project, {
        unitName: 'Penthouse Suite',
        unitNumber: 'P-1',
      });
      await seedApartment(project, { unitNumber: 'A-2' });

      const res = await request(app.getHttpServer())
        .get('/api/v1/apartments?search=Penthouse')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].unitName).toBe('Penthouse Suite');
    });

    it('searches by unit number', async () => {
      const project = await seedProject();
      await seedApartment(project, { unitNumber: 'Z-99' });
      await seedApartment(project, { unitNumber: 'A-2' });

      const res = await request(app.getHttpServer())
        .get('/api/v1/apartments?search=Z-99')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].unitNumber).toBe('Z-99');
    });

    it('searches by project name', async () => {
      const projectA = await seedProject({
        name: 'Marina Heights',
        slug: 'marina-heights',
      });
      const projectB = await seedProject({
        name: 'Palm Gardens',
        slug: 'palm-gardens',
      });
      await seedApartment(projectA, { unitNumber: 'A-1' });
      await seedApartment(projectB, { unitNumber: 'A-1' });

      const res = await request(app.getHttpServer())
        .get('/api/v1/apartments?search=Marina')
        .expect(200);

      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].projectName).toBe('Marina Heights');
    });

    it('escapes % so a literal percent search returns no false positives', async () => {
      const project = await seedProject();
      await seedApartment(project, { unitNumber: 'A-1' });
      await seedApartment(project, { unitNumber: 'A-2' });

      const res = await request(app.getHttpServer())
        .get('/api/v1/apartments?search=%25')
        .expect(200);

      expect(res.body.data).toHaveLength(0);
    });

    it('rejects an invalid sortBy with a VALIDATION_ERROR', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/apartments?sortBy=hacked')
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('GET /api/v1/apartments/:id', () => {
    it('returns 200 with the apartment detail', async () => {
      const project = await seedProject();
      const apartment = await seedApartment(project);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/apartments/${apartment.id}`)
        .expect(200);

      expect(res.body.data.id).toBe(apartment.id);
      expect(res.body.data.projectName).toBe(project.name);
    });

    it('returns 404 with APARTMENT_NOT_FOUND for a missing id', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/apartments/00000000-0000-0000-0000-000000000000')
        .expect(404);

      expect(res.body.error.code).toBe('APARTMENT_NOT_FOUND');
    });

    it('returns 400 for a malformed id', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/apartments/not-a-uuid')
        .expect(400);
    });
  });
});
