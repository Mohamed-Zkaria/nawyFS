import { MigrationInterface, QueryRunner } from 'typeorm';

export class Users1735000000002 implements MigrationInterface {
  name = 'Users1735000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE users_role_enum AS ENUM ('admin', 'normal')`,
    );

    await queryRunner.query(`
      CREATE TABLE users (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        email varchar(320) NOT NULL,
        password_hash varchar(255) NOT NULL,
        role users_role_enum NOT NULL DEFAULT 'normal',
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    // Plain unique index, not lower(email) — the app normalizes email to
    // lowercase on write, so a functional index (and the citext extension
    // it would otherwise take to get this for free) isn't needed.
    await queryRunner.query(
      `CREATE UNIQUE INDEX uq_users_email ON users (email)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS users');
    await queryRunner.query('DROP TYPE IF EXISTS users_role_enum');
  }
}
