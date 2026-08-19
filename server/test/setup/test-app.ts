import { readFileSync } from 'fs';
import { join } from 'path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

const STATE_FILE = join(__dirname, '.testcontainers.json');

interface ContainerConnection {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

function applyTestDbEnv(): void {
  const connection = JSON.parse(
    readFileSync(STATE_FILE, 'utf-8'),
  ) as ContainerConnection;
  process.env.NODE_ENV = 'test';
  process.env.DB_HOST = connection.host;
  process.env.DB_PORT = String(connection.port);
  process.env.DB_USERNAME = connection.username;
  process.env.DB_PASSWORD = connection.password;
  process.env.DB_NAME = connection.database;
}

// @nestjs/config's ConfigModule.forRoot() reads process.env synchronously
// the moment it's *called* — which, for a plain function invocation inside
// a @Module() decorator's `imports` array, happens at import time of
// config.module.ts, not at Test.createTestingModule().compile() time. So
// AppModule (and everything importing ConfigModule transitively) must be
// imported dynamically — not statically — after applyTestDbEnv() has set
// process.env, or DatabaseModule silently validates against the default
// (pre-testcontainers) DB_HOST/DB_PORT. A static `import` is hoisted and
// would run before applyTestDbEnv() ever executes.
export async function createTestApp(): Promise<INestApplication> {
  applyTestDbEnv();

  const { AppModule } = await import('../../src/app.module');
  const { configureApp } = await import('../../src/bootstrap');

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}
