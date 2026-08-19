import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '@/modules/auth/auth.service';
import { InMemoryUserRepository } from '@/modules/users/repositories/in-memory-user.repository';
import { FakePasswordHasher } from '@/modules/auth/test/fake-password-hasher';
import { UserRole } from '@/modules/users/entities/user-role.enum';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { AppConfigService } from '@/config/app-config.service';

function createService(): {
  service: AuthService;
  users: InMemoryUserRepository;
} {
  const users = new InMemoryUserRepository();
  const hasher = new FakePasswordHasher();
  const jwtService = new JwtService({
    secret: 'test-only-secret-at-least-32-characters-long',
  });
  const cfg = {
    jwt: { expiresInSeconds: 3600 },
  } as unknown as AppConfigService;

  return { service: new AuthService(users, hasher, jwtService, cfg), users };
}

function registerDto(overrides: Partial<RegisterDto> = {}): RegisterDto {
  const dto = new RegisterDto();
  dto.email = overrides.email ?? 'user@example.com';
  dto.password = overrides.password ?? 'password123';
  return dto;
}

describe('AuthService', () => {
  describe('register', () => {
    it('creates a user with role always normal, never leaking the hash', async () => {
      const { service } = createService();

      const result = await service.register(registerDto());

      expect(result.user.role).toBe(UserRole.NORMAL);
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.accessToken).toEqual(expect.any(String));
    });

    it('normalizes email to lowercase', async () => {
      const { service } = createService();

      const result = await service.register(
        registerDto({ email: 'User@Example.COM' }),
      );

      expect(result.user.email).toBe('user@example.com');
    });

    it('throws ConflictException on a duplicate email', async () => {
      const { service } = createService();
      await service.register(registerDto());

      await expect(service.register(registerDto())).rejects.toBeInstanceOf(
        ConflictException,
      );
    });
  });

  describe('login', () => {
    it('returns a token for correct credentials', async () => {
      const { service } = createService();
      await service.register(registerDto({ password: 'correct-password' }));

      const result = await service.login(
        Object.assign(new LoginDto(), {
          email: 'user@example.com',
          password: 'correct-password',
        }),
      );

      expect(result.accessToken).toEqual(expect.any(String));
    });

    it('throws the identical error for an unknown email and a wrong password', async () => {
      const { service } = createService();
      await service.register(registerDto({ password: 'correct-password' }));

      const wrongPassword = service.login(
        Object.assign(new LoginDto(), {
          email: 'user@example.com',
          password: 'wrong-password',
        }),
      );
      const unknownEmail = service.login(
        Object.assign(new LoginDto(), {
          email: 'nobody@example.com',
          password: 'anything',
        }),
      );

      await expect(wrongPassword).rejects.toBeInstanceOf(UnauthorizedException);
      await expect(unknownEmail).rejects.toBeInstanceOf(UnauthorizedException);

      const [wrongPasswordError, unknownEmailError] = await Promise.allSettled([
        wrongPassword,
        unknownEmail,
      ]);
      const bodyOf = (result: PromiseSettledResult<unknown>): unknown =>
        result.status === 'rejected'
          ? (result.reason as UnauthorizedException).getResponse()
          : undefined;

      expect(bodyOf(wrongPasswordError)).toEqual(bodyOf(unknownEmailError));
    });
  });
});
