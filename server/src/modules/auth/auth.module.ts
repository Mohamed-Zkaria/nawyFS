import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
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
    // Two named throttlers: 'default' applies everywhere, 'auth' is a
    // tighter bucket that only AuthController is actually subject to —
    // every other controller opts out with @SkipThrottle({ auth: true }),
    // since by default every named throttler checks every route.
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [AppConfigService],
      useFactory: (cfg: AppConfigService) => [
        {
          name: 'default',
          ttl: cfg.rateLimit.ttlMs,
          limit: cfg.rateLimit.limit,
        },
        {
          name: 'auth',
          ttl: cfg.rateLimit.ttlMs,
          limit: cfg.rateLimit.authLimit,
        },
      ],
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    { provide: PasswordHasher, useClass: BcryptPasswordHasher },
    // Global guards run in registration order: throttling first (cheapest
    // check, protects against abuse before any auth work happens), then
    // JwtAuthGuard so request.user is populated by the time RolesGuard
    // reads it.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AuthModule {}
