import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  @MaxLength(320)
  email!: string;

  // MaxLength(72) matters: bcrypt silently truncates past 72 bytes.
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;
}
