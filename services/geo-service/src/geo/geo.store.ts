import { Injectable } from '@nestjs/common';

export interface DeviceLocation {
  deviceId: string;
  name: string;
  lat: number;
  lng: number;
  address?: string;
  siteId?: string;
  updatedAt: string;
}

@Injectable()
export class GeoStore {
  private readonly locations = new Map<string, DeviceLocation>();

  set(loc: Omit<DeviceLocation, 'updatedAt'>): DeviceLocation {
    const full: DeviceLocation = { ...loc, updatedAt: new Date().toISOString() };
    this.locations.set(loc.deviceId, full);
    return full;
  }

  get(deviceId: string): DeviceLocation | undefined {
    return this.locations.get(deviceId);
  }

  getAll(): DeviceLocation[] {
    return Array.from(this.locations.values());
  }

  remove(deviceId: string): boolean {
    return this.locations.delete(deviceId);
  }
}
