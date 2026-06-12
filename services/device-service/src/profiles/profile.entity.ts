import { randomUUID } from 'node:crypto';

export interface ProfileEntry {
  alias: string;
  instructionCode: number;
  value: number;
  unit?: string;
}

export interface DeviceProfileVersion {
  id: string;
  deviceId: string;
  version: number;
  label: string;
  entries: ProfileEntry[];
  createdAt: string;
  createdBy: string;
  note: string;
}

export function makeVersion(
  deviceId: string,
  version: number,
  entries: ProfileEntry[],
  createdBy: string,
  note: string,
): DeviceProfileVersion {
  return {
    id: randomUUID(),
    deviceId,
    version,
    label: `v${version}`,
    entries,
    createdAt: new Date().toISOString(),
    createdBy,
    note,
  };
}
