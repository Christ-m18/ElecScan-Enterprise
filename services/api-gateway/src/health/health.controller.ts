import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health')
  liveness(): { status: 'ok'; service: 'api-gateway' } {
    return { status: 'ok', service: 'api-gateway' };
  }

  @Get('/ready')
  readiness(): { status: 'ready'; service: 'api-gateway' } {
    return { status: 'ready', service: 'api-gateway' };
  }
}
