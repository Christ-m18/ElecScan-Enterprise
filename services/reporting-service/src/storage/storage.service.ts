import { Readable } from 'node:stream';
import { Injectable, Logger } from '@nestjs/common';
import { Client } from 'minio';

const BUCKET = process.env.MINIO_BUCKET ?? 'elecscan-reports';
const ENDPOINT = process.env.MINIO_ENDPOINT ?? '127.0.0.1';
const PORT = Number(process.env.MINIO_PORT ?? '9000');
const ACCESS_KEY = process.env.MINIO_ACCESS_KEY ?? 'elecscan';
const SECRET_KEY = process.env.MINIO_SECRET_KEY ?? 'elecscan-secret';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private client: Client | null = null;
  private available = false;

  async connect(): Promise<void> {
    try {
      this.client = new Client({
        endPoint: ENDPOINT,
        port: PORT,
        useSSL: false,
        accessKey: ACCESS_KEY,
        secretKey: SECRET_KEY,
      });
      const exists = await this.client.bucketExists(BUCKET);
      if (!exists) await this.client.makeBucket(BUCKET);
      this.available = true;
      this.logger.log(`MinIO connected — bucket: ${BUCKET}`);
    } catch (err) {
      this.available = false;
      this.logger.warn(
        `MinIO unavailable — reports stored in-memory only: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async upload(key: string, data: Buffer, contentType: string): Promise<string | null> {
    if (!this.client || !this.available) return null;
    try {
      await this.client.putObject(BUCKET, key, Readable.from(data), data.length, {
        'Content-Type': contentType,
      });
      return key;
    } catch (err) {
      this.logger.warn(`MinIO upload failed: ${err instanceof Error ? err.message : err}`);
      return null;
    }
  }

  async getPresignedUrl(key: string, expirySeconds = 3600): Promise<string | null> {
    if (!this.client || !this.available) return null;
    try {
      return await this.client.presignedGetObject(BUCKET, key, expirySeconds);
    } catch {
      return null;
    }
  }

  async getBuffer(key: string): Promise<Buffer | null> {
    if (!this.client || !this.available) return null;
    try {
      const stream = await this.client.getObject(BUCKET, key);
      const chunks: Buffer[] = [];
      for await (const chunk of stream) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
      }
      return Buffer.concat(chunks);
    } catch {
      return null;
    }
  }

  isAvailable(): boolean {
    return this.available;
  }
}
