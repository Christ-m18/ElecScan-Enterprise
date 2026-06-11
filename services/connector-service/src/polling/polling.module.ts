import { Module } from '@nestjs/common';
import { SnapshotDecoder } from '../application/snapshot-decoder.js';
import { PollingEngine } from './polling.engine.js';
import { SnapshotStore } from './snapshot.store.js';

@Module({
  providers: [PollingEngine, SnapshotStore, SnapshotDecoder],
  exports: [PollingEngine, SnapshotStore],
})
export class PollingModule {}
