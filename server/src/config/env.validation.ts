import { z } from 'zod';

// z.coerce.boolean() uses JS `Boolean(value)` semantics, so the string "false"
// coerces to `true` (any non-empty string is truthy). Env vars are always
// strings, so booleans need an explicit true/false parse instead.
const booleanEnvVar = (defaultValue: boolean) =>
  z
    .enum(['true', 'false'])
    .default(defaultValue ? 'true' : 'false')
    .transform((value) => value === 'true');

const DEFAULT_JWT_SECRET =
  'dev_only_insecure_secret_change_me_in_production_env_1234567890';
const DEFAULT_ADMIN_PASSWORD = 'ChangeMe_Admin123!';

const baseEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().int().min(1).max(65535).default(4000),
  HOST: z.string().min(1).default('0.0.0.0'),
  API_GLOBAL_PREFIX: z.string().min(1).default('api'),
  API_DEFAULT_VERSION: z.string().min(1).default('1'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('debug'),
  LOG_PRETTY: booleanEnvVar(true),
  SWAGGER_ENABLED: booleanEnvVar(true),
  SWAGGER_PATH: z.string().min(1).default('api/docs'),

  DB_HOST: z.string().min(1).default('localhost'),
  DB_PORT: z.coerce.number().int().min(1).max(65535).default(5432),
  DB_USERNAME: z.string().min(1).default('nawy'),
  DB_PASSWORD: z.string().min(1).default('nawy_dev_only'),
  DB_NAME: z.string().min(1).default('nawy'),
  DB_SSL: booleanEnvVar(false),
  DB_LOGGING: booleanEnvVar(false),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),

  CORS_ORIGINS: z
    .string()
    .default('http://localhost:3000')
    .transform((value) =>
      value
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    ),
  CORS_CREDENTIALS: booleanEnvVar(true),

  // Limit is left unset here — the transform below defaults it high in
  // NODE_ENV=test (so the e2e suite's dozens of auth requests in a few
  // seconds don't 429 themselves) and to the real production value
  // otherwise. Same pattern as BCRYPT_SALT_ROUNDS below.
  RATE_LIMIT_TTL_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_LIMIT: z.coerce.number().int().positive().optional(),
  AUTH_RATE_LIMIT_LIMIT: z.coerce.number().int().positive().optional(),

  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters')
    .default(DEFAULT_JWT_SECRET),
  // Seconds, not a duration string — avoids needing a duration parser
  // anywhere the value is consumed (jsonwebtoken's `expiresIn` and the auth
  // response body both just want a number).
  JWT_EXPIRES_IN: z.coerce.number().int().positive().default(3600),
  JWT_ISSUER: z.string().min(1).default('nawy-apartments'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(1).max(20).optional(),
  ADMIN_EMAIL: z.string().email().default('admin@nawy.local'),
  ADMIN_PASSWORD: z.string().min(8).default(DEFAULT_ADMIN_PASSWORD),
});

export const envSchema = baseEnvSchema
  .transform((env) => ({
    ...env,
    BCRYPT_SALT_ROUNDS:
      env.BCRYPT_SALT_ROUNDS ?? (env.NODE_ENV === 'test' ? 4 : 12),
    RATE_LIMIT_LIMIT:
      env.RATE_LIMIT_LIMIT ?? (env.NODE_ENV === 'test' ? 10_000 : 120),
    AUTH_RATE_LIMIT_LIMIT:
      env.AUTH_RATE_LIMIT_LIMIT ?? (env.NODE_ENV === 'test' ? 10_000 : 10),
  }))
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production') {
      if (env.JWT_SECRET === DEFAULT_JWT_SECRET) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['JWT_SECRET'],
          message: 'Refusing to boot: default JWT_SECRET in production',
        });
      }
      if (env.ADMIN_PASSWORD === DEFAULT_ADMIN_PASSWORD) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['ADMIN_PASSWORD'],
          message: 'Refusing to boot: default ADMIN_PASSWORD in production',
        });
      }
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const result = envSchema.safeParse(config);
  if (!result.success) {
    const details = result.error.issues
      .map(
        (issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
      )
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${details}`);
  }
  return result.data;
}
