import { Module } from '@nestjs/common';
import { ConfigModule } from '@/config/config.module';
import { HealthModule } from '@/health/health.module';
import { DatabaseModule } from '@/database/database.module';
import { ProjectsModule } from '@/modules/projects/projects.module';
import { ApartmentsModule } from '@/modules/apartments/apartments.module';

@Module({
  imports: [
    ConfigModule,
    HealthModule,
    DatabaseModule,
    ProjectsModule,
    ApartmentsModule,
  ],
})
export class AppModule {}
