import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { z } from 'zod';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { AlarmStore } from './alarm.store.js';

const ConditionSchema = z.enum(['>', '<', '>=', '<=', '==', '!=']);
const SeveritySchema = z.enum(['info', 'warning', 'critical']);

const CreateRuleSchema = z.object({
  name: z.string().min(1).max(80),
  deviceId: z.string().uuid(),
  alias: z.string().min(1),
  condition: ConditionSchema,
  threshold: z.number(),
  severity: SeveritySchema.default('warning'),
  enabled: z.boolean().default(true),
});

const UpdateRuleSchema = CreateRuleSchema.partial();

@Controller('alarms')
export class AlarmController {
  constructor(private readonly store: AlarmStore) {}

  // ── Rules ─────────────────────────────────────────────────────────────────

  @Post('rules')
  createRule(@Body() body: unknown) {
    const dto = CreateRuleSchema.parse(body);
    return this.store.addRule(dto);
  }

  @Get('rules')
  listRules() {
    return this.store.getRules();
  }

  @Patch('rules/:id')
  updateRule(@Param('id') id: string, @Body() body: unknown) {
    const dto = UpdateRuleSchema.parse(body);
    const patch = Object.fromEntries(Object.entries(dto).filter(([, v]) => v !== undefined));
    const updated = this.store.updateRule(id, patch);
    if (!updated) throw new NotFoundException(`Rule ${id} not found`);
    return updated;
  }

  @Delete('rules/:id')
  @HttpCode(204)
  deleteRule(@Param('id') id: string) {
    if (!this.store.removeRule(id)) throw new NotFoundException(`Rule ${id} not found`);
  }

  // ── Active alarms ─────────────────────────────────────────────────────────

  @Get('active')
  getActive() {
    return this.store.getActive();
  }

  @Post('active/:id/ack')
  ackAlarm(@Param('id') id: string, @Body() body: unknown) {
    const dto = z.object({ by: z.string().min(1).default('operator') }).parse(body ?? {});
    const alarm = this.store.acknowledge(id, dto.by);
    if (!alarm) throw new NotFoundException(`Active alarm ${id} not found`);
    return alarm;
  }

  @Get('history')
  getHistory(@Query('limit') limit?: string) {
    const n = limit ? Number.parseInt(limit, 10) : 100;
    return this.store.getHistory(Number.isNaN(n) ? 100 : n);
  }
}
