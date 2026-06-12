import { Body, Controller, Get, NotFoundException, Param, Post } from '@nestjs/common';
import type { ProfileEntry } from './profile.entity.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { ProfileStore } from './profile.store.js';

interface SaveProfileDto {
  entries: ProfileEntry[];
  createdBy?: string;
  note?: string;
}

@Controller('/profiles')
export class ProfilesController {
  constructor(private readonly store: ProfileStore) {}

  @Get('/:deviceId')
  async getVersions(@Param('deviceId') deviceId: string) {
    return this.store.getAll(deviceId);
  }

  @Get('/:deviceId/latest')
  async getLatest(@Param('deviceId') deviceId: string) {
    const v = await this.store.getLatest(deviceId);
    if (!v) throw new NotFoundException(`No profiles for device ${deviceId}`);
    return v;
  }

  @Get('/:deviceId/:versionId')
  async getVersion(@Param('deviceId') deviceId: string, @Param('versionId') versionId: string) {
    const v = await this.store.getById(deviceId, versionId);
    if (!v) throw new NotFoundException(`Version ${versionId} not found`);
    return v;
  }

  @Post('/:deviceId')
  async saveVersion(@Param('deviceId') deviceId: string, @Body() dto: SaveProfileDto) {
    return this.store.save(deviceId, dto.entries, dto.createdBy ?? 'system', dto.note ?? '');
  }
}
