import { z } from 'zod';

// z.coerce.boolean() uses JS `Boolean(value)` semantics, so the string "false"
// coerces to `true` (any non-empty string is truthy). Env vars are always
// strings, so booleans need an explicit true/false parse instead.
const booleanEnvVar = (defaultValue: boolean) =>
  z
    .enum(['true', 'false'])
    .default(defaultValue ? 'true' : 'false')
    .transform((value) => value === 'true');

export const envSchema = z.object({
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
