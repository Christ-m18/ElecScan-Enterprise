import {
  Injectable,
  type OnApplicationBootstrap,
  type OnApplicationShutdown,
} from '@nestjs/common';
import {
  type NormalizedSnapshot,
  type ValidationError,
  normalize,
} from '../normalize/normalizer.js';

const CONNECTOR_URL = process.env.CONNECTOR_SERVICE_URL ?? 'http://127.0.0.1:4003';
const POLL_MS = 5_000;

interface DeviceEntry {
  id: string;
  name: string;
}

@Injectable()
export class IngestService implements OnApplicationBootstrap, OnApplicationShutdown {
  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly snapshots = new Map<string, NormalizedSnapshot>();
  private readonly recentErrors: ValidationError[] = [];
  private pollCount = 0;
  private lastPollAt: string | null = null;

  onApplicationBootstrap(): void {
    void this.poll();
    this.timer = setInterval(() => void this.poll(), POLL_MS);
  }

  onApplicationShutdown(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async poll(): Promise<void> {
    try {
      const devR = await fetch(`${CONNECTOR_URL}/devices`);
      if (!devR.ok) return;
      const devices = (await devR.json()) as DeviceEntry[];

      for (const dev of devices) {
        try {
          const snapR = await fetch(`${CONNECTOR_URL}/devices/${dev.id}/snapshot`);
          if (!snapR.ok) continue;
          const raw = (await snapR.json()) as Record<string, number> | null;
          if (!raw) continue;

          const normalized = normalize(dev.id, raw);
          this.snapshots.set(dev.id, normalized);

          for (const err of normalized.errors) {
            this.recentErrors.push(err);
          }
          if (this.recentErrors.length > 200) {
            this.recentErrors.splice(0, this.recentErrors.length - 200);
          }
        } catch {
          // individual device failure — continue
        }
      }

      this.pollCount++;
      this.lastPollAt = new Date().toISOString();
    } catch {
      // connector unavailable — silent
    }
  }

  getAll(): NormalizedSnapshot[] {
    return Array.from(this.snapshots.values());
  }

  getOne(deviceId: string): NormalizedSnapshot | undefined {
    return this.snapshots.get(deviceId);
  }

  getStatus() {
    return {
      pollCount: this.pollCount,
      lastPollAt: this.lastPollAt,
      devicesTracked: this.snapshots.size,
      recentErrorCount: this.recentErrors.length,
    };
  }

  getRecentErrors(): ValidationError[] {
    return this.recentErrors.slice(-100);
  }
}
