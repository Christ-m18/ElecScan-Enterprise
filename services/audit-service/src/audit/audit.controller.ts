import { Body, Controller, Get, HttpCode, Post, Query } from '@nestjs/common';
import { z } from 'zod';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { AuditStore } from '../chain/audit.store.js';

const AppendSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
  action: z.string().min(1),
  resource: z.string().min(1),
  resourceId: z.string().min(1),
  detail: z.unknown().optional(),
});

@Controller('audit')
export class AuditController {
  constructor(private readonly store: AuditStore) {}

  @Post('events')
  @HttpCode(201)
  append(@Body() body: unknown) {
    const dto = AppendSchema.parse(body);
    return this.store.append(dto);
  }

  @Get('events')
  list(@Query('tenantId') tenantId?: string, @Query('limit') limit?: string) {
    return this.store.list(tenantId, limit ? Number(limit) : 200);
  }

  @Get('verify')
  verify() {
    return this.store.verify();
  }
}
