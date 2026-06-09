import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  liveness(): { status: 'ok'; service: 'iam-service' } {
    return { status: 'ok', service: 'iam-service' };
  }

  @Get('/ready')
  readiness(): { status: 'ready'; service: 'iam-service' } {
    return { status: 'ready', service: 'iam-service' };
  }
}
