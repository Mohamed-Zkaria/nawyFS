import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import { Project } from '@/modules/projects/entities/project.entity';
import { Apartment } from '@/modules/apartments/entities/apartment.entity';
import { ApartmentImage } from '@/modules/apartments/entities/apartment-image.entity';
import { User } from '@/modules/users/entities/user.entity';

// Dev-only entry point for the TypeORM CLI (migration:generate/run/revert).
// The production image does not ship the CLI — see database/cli.ts instead.
const options: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USERNAME ?? 'nawy',
  password: process.env.DB_PASSWORD ?? 'nawy_dev_only',
  database: process.env.DB_NAME ?? 'nawy',
  ssl: process.env.DB_SSL === 'true',
  synchronize: false,
  entities: [Project, Apartment, ApartmentImage, User],
  migrations: [__dirname + '/migrations/*.{ts,js}'],
};

export const AppDataSource = new DataSource(options);
