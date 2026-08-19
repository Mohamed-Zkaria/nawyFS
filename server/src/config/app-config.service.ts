import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '@/config/env.validation';
import {
  AppConfig,
  LoggingConfig,
  SwaggerConfig,
  toAppConfig,
  toLoggingConfig,
  toSwaggerConfig,
} from '@/config/configuration';

@Injectable()
export class AppConfigService {
  constructor(private readonly configService: ConfigService<Env, true>) {}

  get nodeEnv(): Env['NODE_ENV'] {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get isProduction(): boolean {
    return this.nodeEnv === 'production';
  }

  get app(): AppConfig {
    return toAppConfig(this.snapshot());
  }

  get logging(): LoggingConfig {
    return toLoggingConfig(this.snapshot());
  }

  get swagger(): SwaggerConfig {
    return toSwaggerConfig(this.snapshot());
  }

  private snapshot(): Env {
    return {
      NODE_ENV: this.configService.get('NODE_ENV', { infer: true }),
      PORT: this.configService.get('PORT', { infer: true }),
      HOST: this.configService.get('HOST', { infer: true }),
      API_GLOBAL_PREFIX: this.configService.get('API_GLOBAL_PREFIX', {
        infer: true,
      }),
      API_DEFAULT_VERSION: this.configService.get('API_DEFAULT_VERSION', {
        infer: true,
      }),
      LOG_LEVEL: this.configService.get('LOG_LEVEL', { infer: true }),
      LOG_PRETTY: this.configService.get('LOG_PRETTY', { infer: true }),
      SWAGGER_ENABLED: this.configService.get('SWAGGER_ENABLED', {
        infer: true,
      }),
      SWAGGER_PATH: this.configService.get('SWAGGER_PATH', { infer: true }),
    };
  }
}
