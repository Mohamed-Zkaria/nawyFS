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
    });
  });

  it('coerces and accepts a valid explicit env', () => {
    const env = validateEnv({
      NODE_ENV: 'production',
      PORT: '8080',
      HOST: '127.0.0.1',
      LOG_PRETTY: 'false',
      SWAGGER_ENABLED: 'false',
    });

    expect(env.NODE_ENV).toBe('production');
    expect(env.PORT).toBe(8080);
    expect(env.HOST).toBe('127.0.0.1');
    expect(env.LOG_PRETTY).toBe(false);
    expect(env.SWAGGER_ENABLED).toBe(false);
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
