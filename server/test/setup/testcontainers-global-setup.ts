import { writeFileSync } from 'fs';
import { join } from 'path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { DataSource } from 'typeorm';
import { InitialSchema1735000000000 } from '../../src/database/migrations/1735000000000-InitialSchema';
import { SearchIndexes1735000000001 } from '../../src/database/migrations/1735000000001-SearchIndexes';

// Jest's globalSetup runs outside the normal Jest module sandbox (plain
// Node require, no moduleNameMapper), so anything reachable from here must
// avoid the `@/` alias used elsewhere. The migration classes only import
// from 'typeorm', so runMigrations() works with an empty `entities` array
// — no need to pull in the entity files (which do use `@/`) at all.

const STATE_FILE = join(__dirname, '.testcontainers.json');

export default async function globalSetup(): Promise<void> {
  const container = await new PostgreSqlContainer('postgres:17-alpine')
    .withDatabase('nawy_test')
    .withUsername('nawy')
    .withPassword('nawy_test')
    .start();

  const connection = {
    host: container.getHost(),
    port: container.getMappedPort(5432),
    username: 'nawy',
    password: 'nawy_test',
    database: 'nawy_test',
  };

  const dataSource = new DataSource({
    type: 'postgres',
    ...connection,
    entities: [],
    migrations: [InitialSchema1735000000000, SearchIndexes1735000000001],
  });

  await dataSource.initialize();
  await dataSource.runMigrations();
  await dataSource.destroy();

  writeFileSync(STATE_FILE, JSON.stringify(connection), 'utf-8');
}
