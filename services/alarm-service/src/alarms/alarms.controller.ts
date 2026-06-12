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
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { MaintenanceStore } from './maintenance.store.js';

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

interface CreateWindowDto {
  deviceId: string;
  label: string;
  startsAt: string;
  endsAt: string;
  createdBy?: string;
}

@Controller()
export class AlarmsController {
  constructor(
    private readonly store: AlarmStore,
    private readonly maintenance: MaintenanceStore,
  ) {}

  // ── Rules ──────────────────────────────────────────────────────────────────

  @Get('rules')
  getRules() {
    return this.store.getRules();
  }

  @Post('rules')
  async createRule(@Body() dto: CreateRuleDto) {
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
  async updateRule(@Param('id') id: string, @Body() dto: Partial<CreateRuleDto>) {
    const rule = await this.store.updateRule(id, dto);
    if (!rule) throw new NotFoundException(`Rule ${id} not found`);
    return rule;
  }

  @Delete('rules/:id')
  @HttpCode(204)
  async deleteRule(@Param('id') id: string) {
    const ok = await this.store.deleteRule(id);
    if (!ok) throw new NotFoundException(`Rule ${id} not found`);
  }

  // ── Active alarms ──────────────────────────────────────────────────────────

  @Get('active')
  getActive() {
    return this.store.getActive();
  }

  @Post('active/:id/ack')
  async acknowledgeAlarm(@Param('id') id: string, @Body() dto: AckDto) {
    const inst = await this.store.acknowledge(id, dto.by ?? 'system');
    if (!inst) throw new NotFoundException(`Active alarm ${id} not found`);
    return inst;
  }

  // ── History ────────────────────────────────────────────────────────────────

  @Get('history')
  getHistory() {
    return this.store.getHistory();
  }

  // ── Maintenance windows ────────────────────────────────────────────────────

  @Get('maintenance')
  getMaintenanceWindows() {
    return this.maintenance.getAll();
  }

  @Post('maintenance')
  async createMaintenanceWindow(@Body() dto: CreateWindowDto) {
    return this.maintenance.add({
      deviceId: dto.deviceId,
      label: dto.label,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
      createdBy: dto.createdBy ?? 'system',
    });
  }

  @Delete('maintenance/:id')
  @HttpCode(204)
  async deleteMaintenanceWindow(@Param('id') id: string) {
    const ok = await this.maintenance.remove(id);
    if (!ok) throw new NotFoundException(`Maintenance window ${id} not found`);
  }
}
