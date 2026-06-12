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
} from '@nestjs/common';
import type { AlarmCondition, AlarmSeverity } from './alarm.entity.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { AlarmStore } from './alarm.store.js';

interface CreateRuleDto {
  name: string;
  deviceId: string;
  alias: string;
  condition: AlarmCondition;
  threshold: number;
  severity: AlarmSeverity;
  enabled?: boolean;
  escalateAfterMs?: number;
}

interface AckDto {
  by?: string;
}

@Controller()
export class AlarmsController {
  constructor(private readonly store: AlarmStore) {}

  // ── Rules ──────────────────────────────────────────────────────────────────

  @Get('rules')
  getRules() {
    return this.store.getRules();
  }

  @Post('rules')
  createRule(@Body() dto: CreateRuleDto) {
    const base = {
      name: dto.name,
      deviceId: dto.deviceId,
      alias: dto.alias,
      condition: dto.condition,
      threshold: dto.threshold,
      severity: dto.severity,
      enabled: dto.enabled ?? true,
    };
    return this.store.addRule(
      dto.escalateAfterMs !== undefined ? { ...base, escalateAfterMs: dto.escalateAfterMs } : base,
    );
  }

  @Patch('rules/:id')
  updateRule(@Param('id') id: string, @Body() dto: Partial<CreateRuleDto>) {
    const rule = this.store.updateRule(id, dto);
    if (!rule) throw new NotFoundException(`Rule ${id} not found`);
    return rule;
  }

  @Delete('rules/:id')
  @HttpCode(204)
  deleteRule(@Param('id') id: string) {
    const ok = this.store.deleteRule(id);
    if (!ok) throw new NotFoundException(`Rule ${id} not found`);
  }

  // ── Active alarms ──────────────────────────────────────────────────────────

  @Get('active')
  getActive() {
    return this.store.getActive();
  }

  @Post('active/:id/ack')
  acknowledgeAlarm(@Param('id') id: string, @Body() dto: AckDto) {
    const inst = this.store.acknowledge(id, dto.by ?? 'system');
    if (!inst) throw new NotFoundException(`Active alarm ${id} not found`);
    return inst;
  }

  // ── History ────────────────────────────────────────────────────────────────

  @Get('history')
  getHistory() {
    return this.store.getHistory();
  }
}
