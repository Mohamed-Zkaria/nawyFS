import { Env } from '@/config/env.validation';

export interface AppConfig {
  port: number;
  host: string;
  globalPrefix: string;
  defaultVersion: string;
}

export interface LoggingConfig {
  level: Env['LOG_LEVEL'];
  pretty: boolean;
}

export interface SwaggerConfig {
  enabled: boolean;
  path: string;
}

export function toAppConfig(env: Env): AppConfig {
  return {
    port: env.PORT,
    host: env.HOST,
    globalPrefix: env.API_GLOBAL_PREFIX,
    defaultVersion: env.API_DEFAULT_VERSION,
  };
}

export function toLoggingConfig(env: Env): LoggingConfig {
  return {
    level: env.LOG_LEVEL,
    pretty: env.LOG_PRETTY,
  };
}

export function toSwaggerConfig(env: Env): SwaggerConfig {
  return {
    enabled: env.SWAGGER_ENABLED,
    path: env.SWAGGER_PATH,
  };
}
