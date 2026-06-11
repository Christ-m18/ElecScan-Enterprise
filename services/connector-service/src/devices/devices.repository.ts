import { Injectable } from '@nestjs/common';
import type { DeviceConfig } from './device.entity.js';

@Injectable()
export class DevicesRepository {
  private readonly store = new Map<string, DeviceConfig>();

  add(device: DeviceConfig): void {
    this.store.set(device.id, device);
  }

  findAll(): DeviceConfig[] {
    return Array.from(this.store.values());
  }

  findById(id: string): DeviceConfig | undefined {
    return this.store.get(id);
  }

  remove(id: string): boolean {
    return this.store.delete(id);
  }
}
