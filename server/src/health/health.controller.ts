import { Controller, Get, VERSION_NEUTRAL } from '@nestjs/common';
import { Public } from '@/modules/auth/decorators/public.decorator';

@Controller({ path: 'health', version: VERSION_NEUTRAL })
export class HealthController {
  @Public()
  @Get()
  check(): { status: 'ok'; timestamp: string } {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
