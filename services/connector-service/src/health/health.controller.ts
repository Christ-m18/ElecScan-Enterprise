import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  liveness(): { status: 'ok'; service: 'connector-service' } {
    return { status: 'ok', service: 'connector-service' };
  }

  @Get('/ready')
  readiness(): { status: 'ready'; service: 'connector-service' } {
    return { status: 'ready', service: 'connector-service' };
  }
}
