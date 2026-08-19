import { validateEnv } from '@/config/env.validation';

describe('validateEnv', () => {
  it('applies defaults when optional vars are absent', () => {
    const env = validateEnv({});

    expect(env).toEqual({
      NODE_ENV: 'development',
      PORT: 4000,
      HOST: '0.0.0.0',
      API_GLOBAL_PREFIX: 'api',
      API_DEFAULT_VERSION: '1',
      LOG_LEVEL: 'debug',
      LOG_PRETTY: true,
      SWAGGER_ENABLED: true,
      SWAGGER_PATH: 'api/docs',
      DB_HOST: 'localhost',
      DB_PORT: 5432,
      DB_USERNAME: 'nawy',
      DB_PASSWORD: 'nawy_dev_only',
      DB_NAME: 'nawy',
      DB_SSL: false,
      DB_LOGGING: false,
      DB_POOL_MAX: 10,
      PUBLIC_UPLOADS_PATH: '/uploads',
      JWT_SECRET:
        'dev_only_insecure_secret_change_me_in_production_env_1234567890',
      JWT_EXPIRES_IN: 3600,
      JWT_ISSUER: 'nawy-apartments',
      BCRYPT_SALT_ROUNDS: 12,
      ADMIN_EMAIL: 'admin@nawy.local',
      ADMIN_PASSWORD: 'ChangeMe_Admin123!',
    });
  });

  it('defaults BCRYPT_SALT_ROUNDS to 4 in the test environment', () => {
    const env = validateEnv({ NODE_ENV: 'test' });
    expect(env.BCRYPT_SALT_ROUNDS).toBe(4);
  });

  it('coerces and accepts a valid explicit env', () => {
    const env = validateEnv({
      NODE_ENV: 'production',
      PORT: '8080',
      HOST: '127.0.0.1',
      LOG_PRETTY: 'false',
      SWAGGER_ENABLED: 'false',
      JWT_SECRET: 'a-real-production-secret-that-is-at-least-32-chars',
      ADMIN_PASSWORD: 'a-real-production-admin-password',
    });

    expect(env.NODE_ENV).toBe('production');
    expect(env.PORT).toBe(8080);
    expect(env.HOST).toBe('127.0.0.1');
    expect(env.LOG_PRETTY).toBe(false);
    expect(env.SWAGGER_ENABLED).toBe(false);
  });

  it('refuses to boot in production with the default JWT_SECRET', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        ADMIN_PASSWORD: 'a-real-production-admin-password',
      }),
    ).toThrow(/default JWT_SECRET in production/);
  });

  it('refuses to boot in production with the default ADMIN_PASSWORD', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'production',
        JWT_SECRET: 'a-real-production-secret-that-is-at-least-32-chars',
      }),
    ).toThrow(/default ADMIN_PASSWORD in production/);
  });

  it('fails fast with a readable message on a non-numeric PORT', () => {
    expect(() => validateEnv({ PORT: 'not-a-number' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('fails fast on an out-of-range PORT', () => {
    expect(() => validateEnv({ PORT: '70000' })).toThrow(
      /Invalid environment configuration/,
    );
  });

  it('fails fast on an invalid NODE_ENV value', () => {
    expect(() => validateEnv({ NODE_ENV: 'staging' })).toThrow(
      /Invalid environment configuration/,
    );
  });
});
