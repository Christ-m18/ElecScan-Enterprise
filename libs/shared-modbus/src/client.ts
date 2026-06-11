import { Socket } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { ModbusConnectionError, ModbusTimeoutError } from './errors.js';
import { MBAP_HEADER_LENGTH, encodeMbap, firstFrameLength } from './mbap.js';
import { decodeResponsePdu, encodeReadHoldingRequest, encodeWriteMultipleRequest } from './pdu.js';
import type { ModbusClientOptions, ModbusReadResponse, ModbusWriteResponse } from './types.js';

interface PendingTransaction {
  resolve: (pdu: Buffer) => void;
  reject: (err: Error) => void;
  timer: NodeJS.Timeout;
}

/**
 * Thin Modbus-TCP client for MI-550.
 *
 * Concurrency model: transactions are serialized per client to match the
 * MI-550 server-side assumption of one client at a time (manual is silent on
 * multi-client; we play safe). Transaction-id is still tracked because the
 * server replies with the same id (manual 6.1).
 */
export class ModbusTcpClient {
  private readonly host: string;
  private readonly port: number;
  private readonly unitId: number;
  private readonly requestTimeoutMs: number;
  private readonly connectTimeoutMs: number;

  private socket: Socket | null = null;
  private buffer: Buffer = Buffer.alloc(0);
  private nextTxId = 1;
  private pending = new Map<number, PendingTransaction>();
  private connecting: Promise<void> | null = null;
  private mutex: Promise<void> = Promise.resolve();

  constructor(opts: ModbusClientOptions) {
    this.host = opts.host;
    this.port = opts.port ?? 502;
    this.unitId = opts.unitId ?? 1;
    this.requestTimeoutMs = opts.requestTimeoutMs ?? 2000;
    this.connectTimeoutMs = opts.connectTimeoutMs ?? 3000;
  }

  async connect(): Promise<void> {
    if (this.socket && !this.socket.destroyed) return;
    if (this.connecting) return this.connecting;
    this.connecting = this.openSocket();
    try {
      await this.connecting;
    } finally {
      this.connecting = null;
    }
  }

  private openSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      const sock = new Socket();
      const onError = (err: Error) => {
        sock.destroy();
        reject(new ModbusConnectionError(err.message));
      };
      const timer = setTimeout(() => {
        sock.destroy();
        reject(new ModbusConnectionError(`connect timeout to ${this.host}:${this.port}`));
      }, this.connectTimeoutMs);

      sock.once('error', onError);
      sock.connect(this.port, this.host, () => {
        clearTimeout(timer);
        sock.off('error', onError);
        sock.on('data', (chunk) => this.handleData(chunk));
        sock.on('error', (err) => this.handleSocketError(err));
        sock.on('close', () => this.handleSocketClose());
        this.socket = sock;
        resolve();
      });
    });
  }

  async disconnect(): Promise<void> {
    const s = this.socket;
    this.socket = null;
    if (s && !s.destroyed) {
      await new Promise<void>((resolve) => {
        s.end(() => {
          s.destroy();
          resolve();
        });
      });
    }
    for (const [, t] of this.pending) {
      clearTimeout(t.timer);
      t.reject(new ModbusConnectionError('client disconnected'));
    }
    this.pending.clear();
    this.buffer = Buffer.alloc(0);
  }

  async readHoldingRegisters(startAddress: number, count: number): Promise<ModbusReadResponse> {
    return this.withMutex(async () => {
      await this.connect();
      const pdu = encodeReadHoldingRequest(startAddress, count);
      const responsePdu = await this.send(pdu);
      const decoded = decodeResponsePdu(responsePdu);
      if (decoded.fc !== 0x03) {
        throw new ModbusConnectionError(`unexpected FC in response: 0x${decoded.fc.toString(16)}`);
      }
      return decoded;
    });
  }

  async writeMultipleRegisters(
    startAddress: number,
    values: ReadonlyArray<number>,
  ): Promise<ModbusWriteResponse> {
    return this.withMutex(async () => {
      await this.connect();
      const pdu = encodeWriteMultipleRequest(startAddress, values);
      const responsePdu = await this.send(pdu);
      const decoded = decodeResponsePdu(responsePdu);
      if (decoded.fc !== 0x10) {
        throw new ModbusConnectionError(`unexpected FC in response: 0x${decoded.fc.toString(16)}`);
      }
      return decoded;
    });
  }

  private async send(pdu: Buffer): Promise<Buffer> {
    const sock = this.socket;
    if (!sock) throw new ModbusConnectionError('socket not connected');
    const txId = this.nextTxId++ & 0xffff;
    if (this.nextTxId > 0xffff) this.nextTxId = 1;
    const header = encodeMbap(txId, this.unitId, pdu.length + 1);
    const frame = Buffer.concat([header, pdu]);

    return new Promise<Buffer>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pending.delete(txId);
        reject(new ModbusTimeoutError(`request timed out (txId=${txId})`));
      }, this.requestTimeoutMs);
      this.pending.set(txId, { resolve, reject, timer });
      sock.write(frame, (err) => {
        if (err) {
          const p = this.pending.get(txId);
          if (p) {
            clearTimeout(p.timer);
            this.pending.delete(txId);
            p.reject(new ModbusConnectionError(err.message));
          }
        }
      });
    });
  }

  private handleData(chunk: Buffer): void {
    this.buffer = Buffer.concat([this.buffer, chunk]);
    // drain as many complete frames as possible
    for (;;) {
      const total = firstFrameLength(this.buffer);
      if (total === null) return;
      const frame = this.buffer.subarray(0, total);
      this.buffer = this.buffer.subarray(total);
      const txId = frame.readUInt16BE(0);
      const pdu = frame.subarray(MBAP_HEADER_LENGTH);
      const p = this.pending.get(txId);
      if (!p) continue;
      clearTimeout(p.timer);
      this.pending.delete(txId);
      p.resolve(pdu);
    }
  }

  private handleSocketError(err: Error): void {
    for (const [, t] of this.pending) {
      clearTimeout(t.timer);
      t.reject(new ModbusConnectionError(err.message));
    }
    this.pending.clear();
  }

  private handleSocketClose(): void {
    for (const [, t] of this.pending) {
      clearTimeout(t.timer);
      t.reject(new ModbusConnectionError('socket closed'));
    }
    this.pending.clear();
    this.socket = null;
  }

  /**
   * Serialize transactions per client. The mutex chain ensures only one
   * request is in flight at a time.
   */
  private async withMutex<T>(fn: () => Promise<T>): Promise<T> {
    const prev = this.mutex;
    let release!: () => void;
    this.mutex = new Promise<void>((r) => {
      release = r;
    });
    try {
      await prev;
      return await fn();
    } finally {
      release();
    }
  }

  /**
   * Convenience: small back-off retry wrapper. Used by upper layers.
   */
  static async withBackoff<T>(
    op: () => Promise<T>,
    opts: { retries?: number; baseMs?: number; capMs?: number } = {},
  ): Promise<T> {
    const retries = opts.retries ?? 3;
    const base = opts.baseMs ?? 250;
    const cap = opts.capMs ?? 5000;
    let lastErr: unknown;
    for (let i = 0; i <= retries; i++) {
      try {
        return await op();
      } catch (err) {
        lastErr = err;
        if (i === retries) break;
        const wait = Math.min(cap, base * 2 ** i) + Math.floor(Math.random() * 50);
        await delay(wait);
      }
    }
    throw lastErr as Error;
  }
}
