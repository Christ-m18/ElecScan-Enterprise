import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health') liveness() {
    return { status: 'ok' as const, service: 'event-detection-service' as const };
  }
  @Get('/ready') readiness() {
    return { status: 'ready' as const, service: 'event-detection-service' as const };
  }
}
