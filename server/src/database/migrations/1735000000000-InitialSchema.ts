import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1735000000000 implements MigrationInterface {
  name = 'InitialSchema1735000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // gen_random_uuid() ships in Postgres core since v13, but pgcrypto is the
    // portable way to guarantee it's available regardless of exact version.
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

    await queryRunner.query(`
      CREATE TABLE projects (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        name varchar(120) NOT NULL,
        slug varchar(140) NOT NULL,
        city varchar(120) NOT NULL,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_projects_slug ON projects (slug)`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_projects_name_lower ON projects (lower(name))`,
    );

    await queryRunner.query(`
      CREATE TABLE apartments (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        unit_name varchar(120) NOT NULL,
        unit_number varchar(40) NOT NULL,
        project_id uuid NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
        description text,
        price numeric(12,2) NOT NULL CHECK (price >= 0),
        bedrooms smallint NOT NULL CHECK (bedrooms BETWEEN 0 AND 20),
        bathrooms smallint NOT NULL CHECK (bathrooms >= 0),
        area_sqm numeric(8,2) NOT NULL CHECK (area_sqm > 0),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now(),
        deleted_at timestamptz
      )
    `);

    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_apartments_project_unit ON apartments (project_id, unit_number) WHERE deleted_at IS NULL`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_apartments_project_id ON apartments (project_id)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_apartments_created_at ON apartments (created_at DESC)`,
    );

    await queryRunner.query(`
      CREATE TABLE apartment_images (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        apartment_id uuid NOT NULL REFERENCES apartments(id) ON DELETE CASCADE,
        storage_key varchar(255) NOT NULL,
        original_name varchar(255) NOT NULL,
        mime_type varchar(100) NOT NULL,
        size_bytes integer NOT NULL,
        sort_order smallint NOT NULL DEFAULT 0,
        created_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(
      `CREATE INDEX idx_apartment_images_apartment_id ON apartment_images (apartment_id)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS apartment_images');
    await queryRunner.query('DROP TABLE IF EXISTS apartments');
    await queryRunner.query('DROP TABLE IF EXISTS projects');
  }
}
