import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Env } from '@/config/env.validation';
import {
  AppConfig,
  BcryptConfig,
  CorsConfig,
  DbConfig,
  JwtConfig,
  LoggingConfig,
  RateLimitConfig,
  SwaggerConfig,
  toAppConfig,
  toBcryptConfig,
  toCorsConfig,
  toDbConfig,
  toJwtConfig,
  toLoggingConfig,
  toRateLimitConfig,
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

  get db(): DbConfig {
    return toDbConfig(this.snapshot());
  }

  get cors(): CorsConfig {
    return toCorsConfig(this.snapshot());
  }

  get rateLimit(): RateLimitConfig {
    return toRateLimitConfig(this.snapshot());
  }

  get jwt(): JwtConfig {
    return toJwtConfig(this.snapshot());
  }

  get bcrypt(): BcryptConfig {
    return toBcryptConfig(this.snapshot());
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
      DB_HOST: this.configService.get('DB_HOST', { infer: true }),
      DB_PORT: this.configService.get('DB_PORT', { infer: true }),
      DB_USERNAME: this.configService.get('DB_USERNAME', { infer: true }),
      DB_PASSWORD: this.configService.get('DB_PASSWORD', { infer: true }),
      DB_NAME: this.configService.get('DB_NAME', { infer: true }),
      DB_SSL: this.configService.get('DB_SSL', { infer: true }),
      DB_LOGGING: this.configService.get('DB_LOGGING', { infer: true }),
      DB_POOL_MAX: this.configService.get('DB_POOL_MAX', { infer: true }),
      CORS_ORIGINS: this.configService.get('CORS_ORIGINS', { infer: true }),
      CORS_CREDENTIALS: this.configService.get('CORS_CREDENTIALS', {
        infer: true,
      }),
      RATE_LIMIT_TTL_MS: this.configService.get('RATE_LIMIT_TTL_MS', {
        infer: true,
      }),
      RATE_LIMIT_LIMIT: this.configService.get('RATE_LIMIT_LIMIT', {
        infer: true,
      }),
      AUTH_RATE_LIMIT_LIMIT: this.configService.get('AUTH_RATE_LIMIT_LIMIT', {
        infer: true,
      }),
      JWT_SECRET: this.configService.get('JWT_SECRET', { infer: true }),
      JWT_EXPIRES_IN: this.configService.get('JWT_EXPIRES_IN', {
        infer: true,
      }),
      JWT_ISSUER: this.configService.get('JWT_ISSUER', { infer: true }),
      BCRYPT_SALT_ROUNDS: this.configService.get('BCRYPT_SALT_ROUNDS', {
        infer: true,
      }),
      ADMIN_EMAIL: this.configService.get('ADMIN_EMAIL', { infer: true }),
      ADMIN_PASSWORD: this.configService.get('ADMIN_PASSWORD', {
        infer: true,
      }),
    };
  }
}
