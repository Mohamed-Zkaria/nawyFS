import { MigrationInterface, QueryRunner } from 'typeorm';

// Trigram GIN indexes, not full-text search: unit_name/unit_number/project
// name are short identifier-like fields ("A-12", "12B") that need
// leading-wildcard ILIKE matching, which tsvector/to_tsquery cannot do
// (it's lexeme/prefix-based, not infix). See ImplementationPlan.md §5.
export class SearchIndexes1735000000001 implements MigrationInterface {
  name = 'SearchIndexes1735000000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('CREATE EXTENSION IF NOT EXISTS pg_trgm');

    await queryRunner.query(
      `CREATE INDEX idx_apartments_unit_name_trgm ON apartments USING gin (unit_name gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_apartments_unit_number_trgm ON apartments USING gin (unit_number gin_trgm_ops)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_projects_name_trgm ON projects USING gin (name gin_trgm_ops)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX IF EXISTS idx_projects_name_trgm');
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_apartments_unit_number_trgm',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS idx_apartments_unit_name_trgm',
    );
  }
}
