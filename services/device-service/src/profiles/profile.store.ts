import { Injectable } from '@nestjs/common';
import { type DeviceProfileVersion, type ProfileEntry, makeVersion } from './profile.entity.js';

const MAX_VERSIONS_PER_DEVICE = 50;

@Injectable()
export class ProfileStore {
  private readonly versions = new Map<string, DeviceProfileVersion[]>();

  private list(deviceId: string): DeviceProfileVersion[] {
    if (!this.versions.has(deviceId)) this.versions.set(deviceId, []);
    return this.versions.get(deviceId) as DeviceProfileVersion[];
  }

  getAll(deviceId: string): DeviceProfileVersion[] {
    return [...this.list(deviceId)].sort((a, b) => b.version - a.version);
  }

  getLatest(deviceId: string): DeviceProfileVersion | null {
    const list = this.list(deviceId);
    return list.reduce<DeviceProfileVersion | null>(
      (best, v) => (!best || v.version > best.version ? v : best),
      null,
    );
  }

  getById(deviceId: string, versionId: string): DeviceProfileVersion | undefined {
    return this.list(deviceId).find((v) => v.id === versionId);
  }

  save(
    deviceId: string,
    entries: ProfileEntry[],
    createdBy: string,
    note: string,
  ): DeviceProfileVersion {
    const list = this.list(deviceId);
    const nextVersion = (this.getLatest(deviceId)?.version ?? 0) + 1;
    const version = makeVersion(deviceId, nextVersion, entries, createdBy, note);
    list.push(version);
    if (list.length > MAX_VERSIONS_PER_DEVICE)
      list.splice(0, list.length - MAX_VERSIONS_PER_DEVICE);
    return version;
  }
}
