import { User } from '@/modules/users/entities/user.entity';
import { UserRole } from '@/modules/users/entities/user-role.enum';

export interface CreateUserData {
  email: string;
  passwordHash: string;
  role: UserRole;
}

export abstract class UserRepositoryPort {
  // Always includes passwordHash (select: false on the entity means it's
  // excluded by default) — the only consumer, AuthService, always needs it.
  abstract findByEmail(email: string): Promise<User | null>;
  abstract save(data: CreateUserData): Promise<User>;
}
