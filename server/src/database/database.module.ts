import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppConfigService } from '@/config/app-config.service';
import { ConfigModule } from '@/config/config.module';
import { Project } from '@/modules/projects/entities/project.entity';
import { Apartment } from '@/modules/apartments/entities/apartment.entity';
import { ApartmentImage } from '@/modules/apartments/entities/apartment-image.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [AppConfigService],
      useFactory: (cfg: AppConfigService) => ({
        type: 'postgres' as const,
        host: cfg.db.host,
        port: cfg.db.port,
        username: cfg.db.username,
        password: cfg.db.password,
        database: cfg.db.database,
        ssl: cfg.db.ssl,
        logging: cfg.db.logging,
        extra: { max: cfg.db.poolMax },
        synchronize: false,
        entities: [Project, Apartment, ApartmentImage],
      }),
    }),
  ],
})
export class DatabaseModule {}
