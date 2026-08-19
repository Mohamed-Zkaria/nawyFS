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

export interface DbConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  ssl: boolean;
  logging: boolean;
  poolMax: number;
}

export interface CorsConfig {
  origins: string[];
  credentials: boolean;
}

export interface RateLimitConfig {
  ttlMs: number;
  limit: number;
  authLimit: number;
}

export interface JwtConfig {
  secret: string;
  expiresInSeconds: number;
  issuer: string;
}

export interface BcryptConfig {
  saltRounds: number;
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

export function toDbConfig(env: Env): DbConfig {
  return {
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USERNAME,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    ssl: env.DB_SSL,
    logging: env.DB_LOGGING,
    poolMax: env.DB_POOL_MAX,
  };
}

export function toCorsConfig(env: Env): CorsConfig {
  return {
    origins: env.CORS_ORIGINS,
    credentials: env.CORS_CREDENTIALS,
  };
}

export function toRateLimitConfig(env: Env): RateLimitConfig {
  return {
    ttlMs: env.RATE_LIMIT_TTL_MS,
    limit: env.RATE_LIMIT_LIMIT,
    authLimit: env.AUTH_RATE_LIMIT_LIMIT,
  };
}

export function toJwtConfig(env: Env): JwtConfig {
  return {
    secret: env.JWT_SECRET,
    expiresInSeconds: env.JWT_EXPIRES_IN,
    issuer: env.JWT_ISSUER,
  };
}

export function toBcryptConfig(env: Env): BcryptConfig {
  return {
    saltRounds: env.BCRYPT_SALT_ROUNDS,
  };
}
