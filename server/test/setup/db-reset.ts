import { DataSource } from 'typeorm';

export async function truncateAll(dataSource: DataSource): Promise<void> {
  await dataSource.query(
    'TRUNCATE TABLE apartment_images, apartments, projects, users RESTART IDENTITY CASCADE',
  );
}
