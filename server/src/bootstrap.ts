import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { AppConfigService } from '@/config/app-config.service';

export function configureApp(app: INestApplication): void {
  const cfg = app.get(AppConfigService);

  app.setGlobalPrefix(cfg.app.globalPrefix, {
    exclude: ['health', 'uploads/(.*)'],
  });

  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: cfg.app.defaultVersion,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.enableShutdownHooks();
}
