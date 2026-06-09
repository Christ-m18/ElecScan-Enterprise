import { Controller, Get } from '@nestjs/common';

@Controller()
export class HealthController {
  @Get('/health') liveness() { return { status: 'ok' as const, service: 'alarm-service' as const }; }
  @Get('/ready') readiness() { return { status: 'ready' as const, service: 'alarm-service' as const }; }
}
