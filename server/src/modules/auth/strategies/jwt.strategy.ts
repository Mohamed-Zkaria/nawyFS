import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AppConfigService } from '@/config/app-config.service';
import { AuthenticatedUser } from '@/modules/auth/decorators/current-user.decorator';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(cfg: AppConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: cfg.jwt.secret,
      issuer: cfg.jwt.issuer,
    });
  }

  // Trusts the signed claims — no DB lookup per request. Tradeoff: a role
  // change doesn't take effect until the token expires. Acceptable at the
  // default 1h TTL; the fix (a version claim or a short cache) is a
  // documented next step, not built here.
  validate(payload: AuthenticatedUser): AuthenticatedUser {
    return payload;
  }
}
