import { UserRole } from '@/modules/users/entities/user-role.enum';

export class AuthUserDto {
  id!: string;
  email!: string;
  role!: UserRole;
}

export class AuthResponseDto {
  accessToken!: string;
  expiresIn!: number;
  user!: AuthUserDto;
}
