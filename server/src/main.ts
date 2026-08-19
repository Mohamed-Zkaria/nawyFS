import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import { configureApp } from '@/bootstrap';
import { AppConfigService } from '@/config/app-config.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  configureApp(app);

  const cfg = app.get(AppConfigService);
  await app.listen(cfg.app.port, cfg.app.host);
}

void bootstrap();
