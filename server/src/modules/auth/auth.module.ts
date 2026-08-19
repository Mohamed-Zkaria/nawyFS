import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { AppConfigService } from '@/config/app-config.service';
import { ConfigModule } from '@/config/config.module';
import { UsersModule } from '@/modules/users/users.module';
import { PasswordHasher } from '@/modules/auth/hashing/password-hasher.port';
import { BcryptPasswordHasher } from '@/modules/auth/hashing/bcrypt-password-hasher';
import { JwtStrategy } from '@/modules/auth/strategies/jwt.strategy';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { AuthService } from '@/modules/auth/auth.service';
import { AuthController } from '@/modules/auth/auth.controller';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [AppConfigService],
      useFactory: (cfg: AppConfigService) => ({
        secret: cfg.jwt.secret,
        signOptions: {
          expiresIn: cfg.jwt.expiresInSeconds,
          issuer: cfg.jwt.issuer,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    // Global guards run in registration order: JwtAuthGuard must run
    // before RolesGuard so request.user is populated by the time
    // RolesGuard reads it.
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
