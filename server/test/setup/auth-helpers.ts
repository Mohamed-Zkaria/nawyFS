import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from '../../src/modules/users/entities/user.entity';
import { UserRole } from '../../src/modules/users/entities/user-role.enum';

export async function registerAndLogin(
  app: INestApplication,
  email: string,
  password: string,
): Promise<string> {
  await request(app.getHttpServer())
    .post('/api/v1/auth/register')
    .send({ email, password })
    .expect(201);

  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);

  return (res.body.data as { accessToken: string }).accessToken;
}

// Mirrors how seed.ts creates the real admin — bypasses the register
// endpoint entirely since register always hardcodes role: 'normal'.
export async function seedAdminAndLogin(
  app: INestApplication,
  dataSource: DataSource,
  email: string,
  password: string,
): Promise<string> {
  const repo = dataSource.getRepository(User);
  const passwordHash = await bcrypt.hash(password, 4);
  await repo.save(repo.create({ email, passwordHash, role: UserRole.ADMIN }));

  const res = await request(app.getHttpServer())
    .post('/api/v1/auth/login')
    .send({ email, password })
    .expect(200);

  return (res.body.data as { accessToken: string }).accessToken;
}
