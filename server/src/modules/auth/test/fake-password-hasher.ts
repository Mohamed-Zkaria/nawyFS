import { PasswordHasher } from '@/modules/auth/hashing/password-hasher.port';

// Deterministic, fast test double — BcryptPasswordHasher itself is a
// trivial pass-through to bcryptjs and doesn't need its own unit test.
export class FakePasswordHasher implements PasswordHasher {
  hash(plain: string): Promise<string> {
    return Promise.resolve(`hashed:${plain}`);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return Promise.resolve(hash === `hashed:${plain}`);
  }
}
