import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from './setup/test-app';
import { truncateAll } from './setup/db-reset';
import { registerAndLogin, seedAdminAndLogin } from './setup/auth-helpers';
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

  describe('POST /api/v1/apartments', () => {
    function createPayload(overrides: Record<string, unknown> = {}) {
      return {
        unitName: 'New Unit',
        unitNumber: 'B-1',
        description: 'A brand new unit',
        price: 1500000,
        bedrooms: 3,
        bathrooms: 2,
        areaSqm: 120,
        ...overrides,
      };
    }

    it('returns 401 for an unauthenticated request', async () => {
      const project = await seedProject();

      const res = await request(app.getHttpServer())
        .post('/api/v1/apartments')
        .send(createPayload({ projectId: project.id }))
        .expect(401);

      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 403 for an authenticated normal user', async () => {
      const project = await seedProject();
      const token = await registerAndLogin(
        app,
        'normal@example.com',
        'CorrectHorse123',
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/apartments')
        .set('Authorization', `Bearer ${token}`)
        .send(createPayload({ projectId: project.id }))
        .expect(403);

      expect(res.body.error.code).toBe('FORBIDDEN');
    });

    it('returns 201 and creates the apartment for an admin', async () => {
      const project = await seedProject();
      const token = await seedAdminAndLogin(
        app,
        dataSource,
        'admin@example.com',
        'CorrectHorse123',
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/apartments')
        .set('Authorization', `Bearer ${token}`)
        .send(createPayload({ projectId: project.id }))
        .expect(201);

      expect(res.body.data).toMatchObject({
        unitName: 'New Unit',
        unitNumber: 'B-1',
        projectName: project.name,
      });

      await request(app.getHttpServer())
        .get(`/api/v1/apartments/${res.body.data.id}`)
        .expect(200);
    });

    it('returns 409 UNIT_ALREADY_EXISTS for a duplicate unit in the same project', async () => {
      const project = await seedProject();
      await seedApartment(project, { unitNumber: 'B-1' });
      const token = await seedAdminAndLogin(
        app,
        dataSource,
        'admin2@example.com',
        'CorrectHorse123',
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/apartments')
        .set('Authorization', `Bearer ${token}`)
        .send(createPayload({ projectId: project.id, unitNumber: 'B-1' }))
        .expect(409);

      expect(res.body.error.code).toBe('UNIT_ALREADY_EXISTS');
    });

    it('auto-creates a project when given projectName/projectCity instead of projectId', async () => {
      const token = await seedAdminAndLogin(
        app,
        dataSource,
        'admin3@example.com',
        'CorrectHorse123',
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/apartments')
        .set('Authorization', `Bearer ${token}`)
        .send(
          createPayload({
            projectName: 'Brand New Project',
            projectCity: 'Alexandria',
          }),
        )
        .expect(201);

      expect(res.body.data.projectName).toBe('Brand New Project');

      const projectsRepo = dataSource.getRepository(Project);
      const created = await projectsRepo.findOneBy({
        name: 'Brand New Project',
      });
      expect(created).not.toBeNull();
      expect(created?.city).toBe('Alexandria');
    });

    it('returns 400 when neither projectId nor projectName is provided', async () => {
      const token = await seedAdminAndLogin(
        app,
        dataSource,
        'admin4@example.com',
        'CorrectHorse123',
      );

      const res = await request(app.getHttpServer())
        .post('/api/v1/apartments')
        .set('Authorization', `Bearer ${token}`)
        .send(createPayload())
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('PATCH /api/v1/apartments/:id', () => {
    it('returns 401 for an unauthenticated request', async () => {
      const project = await seedProject();
      const apartment = await seedApartment(project);

      await request(app.getHttpServer())
        .patch(`/api/v1/apartments/${apartment.id}`)
        .send({ bedrooms: 5 })
        .expect(401);
    });

    it('returns 403 for an authenticated normal user', async () => {
      const project = await seedProject();
      const apartment = await seedApartment(project);
      const token = await registerAndLogin(
        app,
        'patch-normal@example.com',
        'CorrectHorse123',
      );

      await request(app.getHttpServer())
        .patch(`/api/v1/apartments/${apartment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ bedrooms: 5 })
        .expect(403);
    });

    it('patches only the fields provided for an admin', async () => {
      const project = await seedProject();
      const apartment = await seedApartment(project, {
        unitName: 'Original Name',
        bedrooms: 2,
      });
      const token = await seedAdminAndLogin(
        app,
        dataSource,
        'patch-admin@example.com',
        'CorrectHorse123',
      );

      const res = await request(app.getHttpServer())
        .patch(`/api/v1/apartments/${apartment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ bedrooms: 5 })
        .expect(200);

      expect(res.body.data.bedrooms).toBe(5);
      expect(res.body.data.unitName).toBe('Original Name');
    });

    it('returns 404 for a missing apartment', async () => {
      const token = await seedAdminAndLogin(
        app,
        dataSource,
        'patch-admin2@example.com',
        'CorrectHorse123',
      );

      const res = await request(app.getHttpServer())
        .patch('/api/v1/apartments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .send({ bedrooms: 5 })
        .expect(404);

      expect(res.body.error.code).toBe('APARTMENT_NOT_FOUND');
    });
  });

  describe('DELETE /api/v1/apartments/:id', () => {
    it('returns 401 for an unauthenticated request', async () => {
      const project = await seedProject();
      const apartment = await seedApartment(project);

      await request(app.getHttpServer())
        .delete(`/api/v1/apartments/${apartment.id}`)
        .expect(401);
    });

    it('returns 403 for an authenticated normal user', async () => {
      const project = await seedProject();
      const apartment = await seedApartment(project);
      const token = await registerAndLogin(
        app,
        'delete-normal@example.com',
        'CorrectHorse123',
      );

      await request(app.getHttpServer())
        .delete(`/api/v1/apartments/${apartment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });

    it('soft-deletes for an admin, then 404s on subsequent reads', async () => {
      const project = await seedProject();
      const apartment = await seedApartment(project);
      const token = await seedAdminAndLogin(
        app,
        dataSource,
        'delete-admin@example.com',
        'CorrectHorse123',
      );

      await request(app.getHttpServer())
        .delete(`/api/v1/apartments/${apartment.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      const res = await request(app.getHttpServer())
        .get(`/api/v1/apartments/${apartment.id}`)
        .expect(404);
      expect(res.body.error.code).toBe('APARTMENT_NOT_FOUND');
    });

    it('returns 404 for a missing apartment', async () => {
      const token = await seedAdminAndLogin(
        app,
        dataSource,
        'delete-admin2@example.com',
        'CorrectHorse123',
      );

      await request(app.getHttpServer())
        .delete('/api/v1/apartments/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });
  });

  describe('apartment images', () => {
    it('POST .../images returns 401 for an unauthenticated request', async () => {
      const project = await seedProject();
      const apartment = await seedApartment(project);

      await request(app.getHttpServer())
        .post(`/api/v1/apartments/${apartment.id}/images`)
        .send({ urls: ['https://cdn.example.com/a.jpg'] })
        .expect(401);
    });

    it('POST .../images returns 403 for an authenticated normal user', async () => {
      const project = await seedProject();
      const apartment = await seedApartment(project);
      const token = await registerAndLogin(
        app,
        'images-normal@example.com',
        'CorrectHorse123',
      );

      await request(app.getHttpServer())
        .post(`/api/v1/apartments/${apartment.id}/images`)
        .set('Authorization', `Bearer ${token}`)
        .send({ urls: ['https://cdn.example.com/a.jpg'] })
        .expect(403);
    });

    it('POST .../images adds images in order for an admin', async () => {
      const project = await seedProject();
      const apartment = await seedApartment(project);
      const token = await seedAdminAndLogin(
        app,
        dataSource,
        'images-admin@example.com',
        'CorrectHorse123',
      );

      const res = await request(app.getHttpServer())
        .post(`/api/v1/apartments/${apartment.id}/images`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          urls: [
            'https://cdn.example.com/a.jpg',
            'https://cdn.example.com/b.jpg',
          ],
        })
        .expect(201);

      expect(res.body.data).toHaveLength(2);
      expect(
        res.body.data.map((image: { sortOrder: number }) => image.sortOrder),
      ).toEqual([0, 1]);

      const detail = await request(app.getHttpServer())
        .get(`/api/v1/apartments/${apartment.id}`)
        .expect(200);
      expect(detail.body.data.coverImageUrl).toBe(
        'https://cdn.example.com/a.jpg',
      );
    });

    it('POST .../images returns 400 VALIDATION_ERROR for a non-URL string', async () => {
      const project = await seedProject();
      const apartment = await seedApartment(project);
      const token = await seedAdminAndLogin(
        app,
        dataSource,
        'images-admin2@example.com',
        'CorrectHorse123',
      );

      const res = await request(app.getHttpServer())
        .post(`/api/v1/apartments/${apartment.id}/images`)
        .set('Authorization', `Bearer ${token}`)
        .send({ urls: ['not-a-url'] })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('POST .../images returns 404 for a missing apartment', async () => {
      const token = await seedAdminAndLogin(
        app,
        dataSource,
        'images-admin3@example.com',
        'CorrectHorse123',
      );

      await request(app.getHttpServer())
        .post('/api/v1/apartments/00000000-0000-0000-0000-000000000000/images')
        .set('Authorization', `Bearer ${token}`)
        .send({ urls: ['https://cdn.example.com/a.jpg'] })
        .expect(404);
    });

    it('DELETE .../images/:imageId removes the image for an admin, then 404s', async () => {
      const project = await seedProject();
      const apartment = await seedApartment(project);
      const token = await seedAdminAndLogin(
        app,
        dataSource,
        'images-admin4@example.com',
        'CorrectHorse123',
      );

      const created = await request(app.getHttpServer())
        .post(`/api/v1/apartments/${apartment.id}/images`)
        .set('Authorization', `Bearer ${token}`)
        .send({ urls: ['https://cdn.example.com/a.jpg'] })
        .expect(201);
      const imageId = created.body.data[0].id;

      await request(app.getHttpServer())
        .delete(`/api/v1/apartments/${apartment.id}/images/${imageId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      const res = await request(app.getHttpServer())
        .delete(`/api/v1/apartments/${apartment.id}/images/${imageId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      expect(res.body.error.code).toBe('IMAGE_NOT_FOUND');
    });
  });
});
