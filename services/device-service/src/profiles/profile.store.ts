import { Injectable, Logger } from '@nestjs/common';
import type { DatabaseService } from '../database/database.service.js';
import { type DeviceProfileVersion, type ProfileEntry, makeVersion } from './profile.entity.js';

const MAX_VERSIONS_PER_DEVICE = 50;

@Injectable()
export class ProfileStore {
  private readonly logger = new Logger(ProfileStore.name);
  private db: DatabaseService | null = null;
  private readonly versions = new Map<string, DeviceProfileVersion[]>();

  setDb(db: DatabaseService): void {
    this.db = db;
  }

  private list(deviceId: string): DeviceProfileVersion[] {
    if (!this.versions.has(deviceId)) this.versions.set(deviceId, []);
    return this.versions.get(deviceId) as DeviceProfileVersion[];
  }

  async getAll(deviceId: string): Promise<DeviceProfileVersion[]> {
    if (this.db?.available) {
      try {
        const { rows } = await this.db.query<{
          id: string;
          device_id: string;
          version: number;
          label: string;
          entries: ProfileEntry[];
          created_at: Date;
          created_by: string;
          note: string;
        }>(
          'SELECT * FROM device_profile_version WHERE device_id=$1 ORDER BY version DESC LIMIT $2',
          [deviceId, MAX_VERSIONS_PER_DEVICE],
        );
        return rows.map((r) => ({
          id: r.id,
          deviceId: r.device_id,
          version: r.version,
          label: r.label,
          entries: r.entries,
          createdAt: new Date(r.created_at).toISOString(),
          createdBy: r.created_by,
          note: r.note,
        }));
      } catch {
        /* fall through */
      }
    }
    return [...this.list(deviceId)].sort((a, b) => b.version - a.version);
  }

  async getLatest(deviceId: string): Promise<DeviceProfileVersion | null> {
    if (this.db?.available) {
      try {
        const { rows } = await this.db.query<{
          id: string;
          device_id: string;
          version: number;
          label: string;
          entries: ProfileEntry[];
          created_at: Date;
          created_by: string;
          note: string;
        }>(
          'SELECT * FROM device_profile_version WHERE device_id=$1 ORDER BY version DESC LIMIT 1',
          [deviceId],
        );
        const r = rows[0];
        if (!r) return null;
        return {
          id: r.id,
          deviceId: r.device_id,
          version: r.version,
          label: r.label,
          entries: r.entries,
          createdAt: new Date(r.created_at).toISOString(),
          createdBy: r.created_by,
          note: r.note,
        };
      } catch {
        /* fall through */
      }
    }
    const list = this.list(deviceId);
    return list.reduce<DeviceProfileVersion | null>(
      (best, v) => (!best || v.version > best.version ? v : best),
      null,
    );
  }

  async getById(deviceId: string, versionId: string): Promise<DeviceProfileVersion | undefined> {
    if (this.db?.available) {
      try {
        const { rows } = await this.db.query<{
          id: string;
          device_id: string;
          version: number;
          label: string;
          entries: ProfileEntry[];
          created_at: Date;
          created_by: string;
          note: string;
        }>('SELECT * FROM device_profile_version WHERE device_id=$1 AND id=$2', [
          deviceId,
          versionId,
        ]);
        const r = rows[0];
        if (!r) return undefined;
        return {
          id: r.id,
          deviceId: r.device_id,
          version: r.version,
          label: r.label,
          entries: r.entries,
          createdAt: new Date(r.created_at).toISOString(),
          createdBy: r.created_by,
          note: r.note,
        };
      } catch {
        /* fall through */
      }
    }
    return this.list(deviceId).find((v) => v.id === versionId);
  }

  async save(
    deviceId: string,
    entries: ProfileEntry[],
    createdBy: string,
    note: string,
  ): Promise<DeviceProfileVersion> {
    const latest = await this.getLatest(deviceId);
    const nextVersion = (latest?.version ?? 0) + 1;
    const version = makeVersion(deviceId, nextVersion, entries, createdBy, note);

    const list = this.list(deviceId);
    list.push(version);
    if (list.length > MAX_VERSIONS_PER_DEVICE)
      list.splice(0, list.length - MAX_VERSIONS_PER_DEVICE);

    if (this.db?.available) {
      await this.db
        .query(
          `INSERT INTO device_profile_version(id,device_id,version,label,entries,created_at,created_by,note)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
          [
            version.id,
            version.deviceId,
            version.version,
            version.label,
            JSON.stringify(version.entries),
            version.createdAt,
            version.createdBy,
            version.note,
          ],
        )
        .catch((e: Error) => this.logger.warn(`DB insert profile version: ${e.message}`));
    }

    return version;
  }
}
