import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from './setup/test-app';
import { truncateAll } from './setup/db-reset';
import { Project } from '../src/modules/projects/entities/project.entity';

describe('Projects (e2e)', () => {
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

  it('GET /api/v1/projects lists all projects ordered by name', async () => {
    const repo = dataSource.getRepository(Project);
    await repo.save(repo.create({ name: 'Zeta', slug: 'zeta', city: 'Cairo' }));
    await repo.save(
      repo.create({ name: 'Alpha', slug: 'alpha', city: 'Cairo' }),
    );

    const res = await request(app.getHttpServer())
      .get('/api/v1/projects')
      .expect(200);

    expect(res.body.data.map((p: { name: string }) => p.name)).toEqual([
      'Alpha',
      'Zeta',
    ]);
  });
});
