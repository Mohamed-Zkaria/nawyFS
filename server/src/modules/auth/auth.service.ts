import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AppConfigService } from '@/config/app-config.service';
import { ErrorCode } from '@/common/constants/error-codes';
import { UserRepositoryPort } from '@/modules/users/user.repository.port';
import { UserRole } from '@/modules/users/entities/user-role.enum';
import { User } from '@/modules/users/entities/user.entity';
import { PasswordHasher } from '@/modules/auth/hashing/password-hasher.port';
import { RegisterDto } from '@/modules/auth/dto/register.dto';
import { LoginDto } from '@/modules/auth/dto/login.dto';
import { AuthResponseDto } from '@/modules/auth/dto/auth-response.dto';
import { AuthenticatedUser } from '@/modules/auth/decorators/current-user.decorator';

// A fixed, lazily-computed dummy hash — compared against on every
// unknown-email login so response timing doesn't reveal whether the email
// exists (ImplementationPlan.md §7).
let dummyHash: string | undefined;
function getDummyHash(): string {
  dummyHash ??= bcrypt.hashSync('nawy-timing-safety-dummy-password', 10);
  return dummyHash;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepositoryPort,
    private readonly hasher: PasswordHasher,
    private readonly jwtService: JwtService,
    private readonly cfg: AppConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase();
    const existing = await this.users.findByEmail(email);
    if (existing) {
      throw new ConflictException({
        code: ErrorCode.EMAIL_ALREADY_EXISTS,
        message: 'Email is already registered',
      });
    }

    const passwordHash = await this.hasher.hash(dto.password);
    // role is hardcoded here — never read from the request body, even
    // though ValidationPipe's forbidNonWhitelisted would already reject a
    // smuggled `role` field.
    const user = await this.users.save({
      email,
      passwordHash,
      role: UserRole.NORMAL,
    });

    return this.buildAuthResponse(user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const email = dto.email.toLowerCase();
    const user = await this.users.findByEmail(email);

    const hashToCompare = user?.passwordHash ?? getDummyHash();
    const matches = await this.hasher.compare(dto.password, hashToCompare);

    if (!user || !matches) {
      throw new UnauthorizedException({
        code: ErrorCode.INVALID_CREDENTIALS,
        message: 'Invalid email or password',
      });
    }

    return this.buildAuthResponse(user);
  }

  private buildAuthResponse(user: User): AuthResponseDto {
    const payload: AuthenticatedUser = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      expiresIn: this.cfg.jwt.expiresInSeconds,
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}
