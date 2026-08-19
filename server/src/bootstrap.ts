import {
  INestApplication,
  ValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppConfigService } from '@/config/app-config.service';
import { ResponseEnvelopeInterceptor } from '@/common/interceptors/response-envelope.interceptor';
import { AllExceptionsFilter } from '@/common/filters/all-exceptions.filter';

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

  app.useGlobalInterceptors(new ResponseEnvelopeInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  if (cfg.swagger.enabled) {
    const document = SwaggerModule.createDocument(
      app,
      new DocumentBuilder()
        .setTitle('Nawy Apartments API')
        .setDescription('Apartment listing, detail, and search API')
        .setVersion('1.0')
        .build(),
    );
    SwaggerModule.setup(cfg.swagger.path, app, document);
  }

  app.enableShutdownHooks();
}
