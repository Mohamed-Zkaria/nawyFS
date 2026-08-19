import { MigrationInterface, QueryRunner } from 'typeorm';

// Images are admin-supplied external URLs (validated with @IsUrl()), not
// uploaded files — there is no storage/upload pipeline in this project.
// Collapses storage_key/original_name/mime_type/size_bytes into one url
// column; apartment_images has stayed empty through every prior phase, so
// this carries no real data.
export class ApartmentImagesUrl1735000000003 implements MigrationInterface {
  name = 'ApartmentImagesUrl1735000000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE apartment_images DROP COLUMN original_name`,
    );
    await queryRunner.query(
      `ALTER TABLE apartment_images DROP COLUMN mime_type`,
    );
    await queryRunner.query(
      `ALTER TABLE apartment_images DROP COLUMN size_bytes`,
    );
    await queryRunner.query(
      `ALTER TABLE apartment_images RENAME COLUMN storage_key TO url`,
    );
    await queryRunner.query(
      `ALTER TABLE apartment_images ALTER COLUMN url TYPE varchar(2048)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE apartment_images ALTER COLUMN url TYPE varchar(255)`,
    );
    await queryRunner.query(
      `ALTER TABLE apartment_images RENAME COLUMN url TO storage_key`,
    );
    await queryRunner.query(
      `ALTER TABLE apartment_images ADD COLUMN original_name varchar(255) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE apartment_images ADD COLUMN mime_type varchar(100) NOT NULL DEFAULT ''`,
    );
    await queryRunner.query(
      `ALTER TABLE apartment_images ADD COLUMN size_bytes integer NOT NULL DEFAULT 0`,
    );
  }
}
