import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { createTestApp } from './setup/test-app';
import { truncateAll } from './setup/db-reset';
import { registerAndLogin } from './setup/auth-helpers';

describe('Auth (e2e)', () => {
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

  describe('POST /api/v1/auth/register', () => {
    it('registers a new user and returns a normal-role token', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'newuser@example.com', password: 'CorrectHorse123' })
        .expect(201);

      expect(res.body.data.accessToken).toEqual(expect.any(String));
      expect(res.body.data.user).toMatchObject({
        email: 'newuser@example.com',
        role: 'normal',
      });
      expect(res.body.data.user.passwordHash).toBeUndefined();
    });

    it('lowercases the email on write', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'MixedCase@Example.com', password: 'CorrectHorse123' })
        .expect(201);

      expect(res.body.data.user.email).toBe('mixedcase@example.com');
    });

    it('returns 409 EMAIL_ALREADY_EXISTS for a duplicate email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'dup@example.com', password: 'CorrectHorse123' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'dup@example.com', password: 'AnotherPass123' })
        .expect(409);

      expect(res.body.error.code).toBe('EMAIL_ALREADY_EXISTS');
    });

    it('returns 400 for a password shorter than 8 characters', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'weak@example.com', password: 'short1' })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });

    it('ignores a smuggled role field and hardcodes normal', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({
          email: 'smuggler@example.com',
          password: 'CorrectHorse123',
          role: 'admin',
        })
        .expect(400);

      expect(res.body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('logs in with correct credentials', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'login@example.com', password: 'CorrectHorse123' })
        .expect(201);

      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'login@example.com', password: 'CorrectHorse123' })
        .expect(200);

      expect(res.body.data.accessToken).toEqual(expect.any(String));
      expect(res.body.data.user.email).toBe('login@example.com');
    });

    it('returns 401 INVALID_CREDENTIALS for an unknown email', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'CorrectHorse123' })
        .expect(401);

      expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
    });

    it('returns the identical body shape for wrong password as for unknown email', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/auth/register')
        .send({ email: 'wrongpass@example.com', password: 'CorrectHorse123' })
        .expect(201);

      const unknownEmailRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody2@example.com', password: 'CorrectHorse123' })
        .expect(401);

      const wrongPasswordRes = await request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'wrongpass@example.com', password: 'WrongPassword1' })
        .expect(401);

      expect(wrongPasswordRes.body.error.code).toBe(
        unknownEmailRes.body.error.code,
      );
      expect(wrongPasswordRes.body.error.message).toBe(
        unknownEmailRes.body.error.message,
      );
    });
  });

  describe('GET /api/v1/auth/me', () => {
    it('returns the current user for a valid token', async () => {
      const token = await registerAndLogin(
        app,
        'me@example.com',
        'CorrectHorse123',
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.data).toMatchObject({
        email: 'me@example.com',
        role: 'normal',
      });
    });

    it('returns 401 without a token', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .expect(401);

      expect(res.body.error.code).toBe('UNAUTHORIZED');
    });

    it('returns 401 for a malformed token', async () => {
      await request(app.getHttpServer())
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer not-a-real-token')
        .expect(401);
    });
  });
});
