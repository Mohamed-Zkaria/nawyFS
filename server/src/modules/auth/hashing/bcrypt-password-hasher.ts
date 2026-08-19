import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AppConfigService } from '@/config/app-config.service';
import { PasswordHasher } from '@/modules/auth/hashing/password-hasher.port';

// bcryptjs, not native bcrypt — pure JS, no python3/make/g++ needed in the
// alpine Docker build stage. Behind this port so it's a one-line swap if
// that ever changes.
@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  constructor(private readonly cfg: AppConfigService) {}

  hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.cfg.bcrypt.saltRounds);
  }

  compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
