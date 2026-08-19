import {
  Controller,
  Get,
  ServiceUnavailableException,
  VERSION_NEUTRAL,
} from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { DataSource } from 'typeorm';
import { Public } from '@/modules/auth/decorators/public.decorator';
import { ErrorCode } from '@/common/constants/error-codes';

@SkipThrottle({ auth: true })
@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Public()
  @Get()
  async check(): Promise<{ status: 'ok'; db: 'up'; timestamp: string }> {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      // A liveness/readiness check that can't reach its own dependency is
      // the whole point of checking — surface it as 503, not a bare 500.
      throw new ServiceUnavailableException({
        code: ErrorCode.SERVICE_UNAVAILABLE,
        message: 'Database is unreachable',
      });
    }

    return { status: 'ok', db: 'up', timestamp: new Date().toISOString() };
  }
}
