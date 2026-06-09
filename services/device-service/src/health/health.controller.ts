import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  liveness(): { status: 'ok'; service: 'device-service' } {
    return { status: 'ok', service: 'device-service' };
  }

  @Get('/ready')
  readiness(): { status: 'ready'; service: 'device-service' } {
    return { status: 'ready', service: 'device-service' };
  }
}
