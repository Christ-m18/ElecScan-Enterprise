import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Put,
} from '@nestjs/common';
import { z } from 'zod';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { GeoStore } from './geo.store.js';

const CONNECTOR_URL = process.env.CONNECTOR_SERVICE_URL ?? 'http://127.0.0.1:4003';

const SetLocationSchema = z.object({
  name: z.string().min(1),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  address: z.string().optional(),
  siteId: z.string().optional(),
});

interface DeviceStatus {
  connected: boolean;
  lastPollAt: string | null;
  errorCount: number;
}

async function fetchDeviceStatus(): Promise<Record<string, DeviceStatus>> {
  try {
    const r = await fetch(`${CONNECTOR_URL}/devices`);
    if (!r.ok) return {};
    const devices = (await r.json()) as Array<{ id: string; status: DeviceStatus }>;
    return Object.fromEntries(devices.map((d) => [d.id, d.status]));
  } catch {
    return {};
  }
}

@Controller()
export class GeoController {
  constructor(private readonly store: GeoStore) {}

  @Put('locations/:deviceId')
  setLocation(@Param('deviceId') deviceId: string, @Body() body: unknown) {
    const dto = SetLocationSchema.parse(body);
    const loc = Object.fromEntries(
      Object.entries({ deviceId, ...dto }).filter(([, v]) => v !== undefined),
    ) as Parameters<GeoStore['set']>[0];
    return this.store.set(loc);
  }

  @Get('locations/:deviceId')
  getLocation(@Param('deviceId') deviceId: string) {
    const loc = this.store.get(deviceId);
    if (!loc) throw new NotFoundException(`No location for device ${deviceId}`);
    return loc;
  }

  @Delete('locations/:deviceId')
  @HttpCode(204)
  deleteLocation(@Param('deviceId') deviceId: string) {
    if (!this.store.remove(deviceId)) {
      throw new NotFoundException(`No location for device ${deviceId}`);
    }
  }

  @Get('locations')
  listLocations() {
    return this.store.getAll();
  }

  @Get('devices.geojson')
  async getGeoJson() {
    const locations = this.store.getAll();
    const statusMap = await fetchDeviceStatus();

    const features = locations.map((loc) => {
      const status = statusMap[loc.deviceId];
      return {
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates: [loc.lng, loc.lat] },
        properties: {
          deviceId: loc.deviceId,
          name: loc.name,
          address: loc.address ?? null,
          siteId: loc.siteId ?? null,
          connected: status?.connected ?? null,
          errorCount: status?.errorCount ?? null,
          lastPollAt: status?.lastPollAt ?? null,
          updatedAt: loc.updatedAt,
        },
      };
    });

    return {
      type: 'FeatureCollection' as const,
      features,
    };
  }
}
