import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { DatabaseService } from '../database/database.service.js';

const CONNECTOR_URL = process.env.CONNECTOR_SERVICE_URL ?? 'http://127.0.0.1:4003';
const FLUSH_INTERVAL_MS = 10_000;
// Sentinel tenant ID used when data arrives without a tenant context
const DEFAULT_TENANT_ID = '00000000-0000-4000-8000-000000000000';

interface SnapshotValue {
  alias: string;
  value: number | string;
  unit?: string;
  timestamp: string;
}

interface DeviceSnapshotResponse {
  deviceId: string;
  updatedAt: string;
  values: Record<string, SnapshotValue>;
}

interface Device {
  id: string;
}

@Injectable()
export class WriterService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(WriterService.name);
  private timer: NodeJS.Timeout | null = null;
  private readonly lastFlush = new Map<string, string>();

  constructor(private readonly db: DatabaseService) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => void this.flush(), FLUSH_INTERVAL_MS);
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async flush(): Promise<void> {
    if (!this.db.available) return;
    try {
      const devices = await this.fetchJson<Device[]>(`${CONNECTOR_URL}/devices`);
      for (const device of devices) {
        await this.flushDevice(device.id);
      }
    } catch (err) {
      this.logger.debug(`flush skipped: ${err instanceof Error ? err.message : err}`);
    }
  }

  private async flushDevice(deviceId: string): Promise<void> {
    const snap = await this.fetchJson<DeviceSnapshotResponse>(
      `${CONNECTOR_URL}/devices/${deviceId}/snapshot`,
    );

    const prevFlush = this.lastFlush.get(deviceId);
    if (prevFlush && snap.updatedAt <= prevFlush) return;
    this.lastFlush.set(deviceId, snap.updatedAt);

    const rows = Object.values(snap.values);
    if (rows.length === 0) return;

    const values: unknown[] = [];
    const placeholders: string[] = [];
    let idx = 1;

    for (const row of rows) {
      const numVal = typeof row.value === 'bigint' ? Number(row.value) : Number(row.value);
      if (Number.isNaN(numVal)) continue;
      placeholders.push(`($${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++}, $${idx++})`);
      values.push(snap.updatedAt, DEFAULT_TENANT_ID, deviceId, row.alias, 'TOTAL', numVal);
    }

    if (placeholders.length === 0) return;

    await this.db.query(
      `INSERT INTO realtime_metric (ts, tenant_id, device_id, metric_key, phase, value)
       VALUES ${placeholders.join(', ')}
       ON CONFLICT DO NOTHING`,
      values,
    );
    this.logger.debug(`[${deviceId}] flushed ${placeholders.length} metrics`);
  }

  private async fetchJson<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} from ${url}`);
    return res.json() as Promise<T>;
  }
}
