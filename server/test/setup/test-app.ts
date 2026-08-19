import { readFileSync } from 'fs';
import { join } from 'path';
import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/bootstrap';

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

// @Module() decorators only register metadata at import time — env vars
// are read later, when Test.createTestingModule(...).compile() actually
// instantiates ConfigModule/DatabaseModule. So it's safe to apply the
// container's connection details here, right before compiling.
export async function createTestApp(): Promise<INestApplication> {
  applyTestDbEnv();

  const moduleFixture = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}
