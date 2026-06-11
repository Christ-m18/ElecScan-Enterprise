export interface DeviceConfig {
  readonly id: string;
  readonly name: string;
  readonly host: string;
  readonly port: number;
  readonly unitId: number;
  readonly enabled: boolean;
  readonly createdAt: string;
}

export interface DeviceStatus {
  readonly connected: boolean;
  readonly lastPollAt: string | null;
  readonly errorCount: number;
  readonly lastError: string | null;
}
