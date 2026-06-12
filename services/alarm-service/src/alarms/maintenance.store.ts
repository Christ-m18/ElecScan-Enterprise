import { Injectable, Logger } from '@nestjs/common';
import type { QueryResultRow } from 'pg';
import type { DatabaseService } from '../database/database.service.js';
import { type MaintenanceWindow, isWindowActive, makeWindow } from './maintenance.entity.js';

interface WindowRow extends QueryResultRow {
  id: string;
  device_id: string;
  label: string;
  starts_at: Date;
  ends_at: Date;
  created_by: string;
  created_at: Date;
}

function rowToWindow(r: WindowRow): MaintenanceWindow {
  return {
    id: r.id,
    deviceId: r.device_id,
    label: r.label,
    startsAt: r.starts_at.toISOString(),
    endsAt: r.ends_at.toISOString(),
    createdBy: r.created_by,
    createdAt: r.created_at.toISOString(),
  };
}

@Injectable()
export class MaintenanceStore {
  private readonly logger = new Logger(MaintenanceStore.name);
  private db: DatabaseService | null = null;
  private readonly windows = new Map<string, MaintenanceWindow>();

  setDb(db: DatabaseService): void {
    this.db = db;
  }

  async loadFromDb(): Promise<void> {
    if (!this.db?.available) return;
    try {
      const { rows } = await this.db.query<WindowRow>(
        'SELECT * FROM alarm_maintenance_window WHERE ends_at > now()',
      );
      for (const r of rows) this.windows.set(r.id, rowToWindow(r));
      this.logger.log(`Loaded ${this.windows.size} maintenance windows from DB`);
    } catch (err) {
      this.logger.warn(
        `Failed to load maintenance windows: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async add(data: Omit<MaintenanceWindow, 'id' | 'createdAt'>): Promise<MaintenanceWindow> {
    const w = makeWindow(data);
    this.windows.set(w.id, w);
    if (this.db?.available) {
      await this.db
        .query(
          `INSERT INTO alarm_maintenance_window(id,device_id,label,starts_at,ends_at,created_by,created_at)
           VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT DO NOTHING`,
          [w.id, w.deviceId, w.label, w.startsAt, w.endsAt, w.createdBy, w.createdAt],
        )
        .catch((e: Error) => this.logger.warn(`DB insert window: ${e.message}`));
    }
    return w;
  }

  async remove(id: string): Promise<boolean> {
    const existed = this.windows.delete(id);
    if (existed && this.db?.available) {
      await this.db
        .query('DELETE FROM alarm_maintenance_window WHERE id=$1', [id])
        .catch((e: Error) => this.logger.warn(`DB delete window: ${e.message}`));
    }
    return existed;
  }

  getAll(): MaintenanceWindow[] {
    return [...this.windows.values()];
  }

  isActive(deviceId: string): boolean {
    for (const w of this.windows.values()) {
      if (w.deviceId === deviceId && isWindowActive(w)) return true;
    }
    return false;
  }
}
