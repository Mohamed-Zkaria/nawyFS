import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createTestApp } from './setup/test-app';

// A dedicated spec file (its own Jest module registry) so this is the
// *first* thing to import config.module.ts in this process — env.validation.ts's
// NODE_ENV=test override raises AUTH_RATE_LIMIT_LIMIT to 10,000 by design
// (see env.validation.ts), which every other e2e spec relies on to avoid
// self-inflicted 429s. Setting AUTH_RATE_LIMIT_LIMIT explicitly here, before
// createTestApp() ever imports AppModule, overrides that default for this
// file only — proving the limit is real without breaking every other suite.
describe('Rate limiting (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.AUTH_RATE_LIMIT_LIMIT = '2';
    app = await createTestApp();
  });

  afterAll(async () => {
    delete process.env.AUTH_RATE_LIMIT_LIMIT;
    await app.close();
  });

  it('returns 429 once the auth rate limit is exceeded', async () => {
    const attempt = () =>
      request(app.getHttpServer())
        .post('/api/v1/auth/login')
        .send({ email: 'nobody@example.com', password: 'irrelevant123' });

    await attempt().expect(401);
    await attempt().expect(401);

    const res = await attempt().expect(429);
    expect(res.body.error.code).toBe('TOO_MANY_REQUESTS');
  });
});
