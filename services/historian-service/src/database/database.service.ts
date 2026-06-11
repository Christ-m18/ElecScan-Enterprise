import { Injectable, Logger, type OnApplicationShutdown } from '@nestjs/common';
import { Pool, type QueryResult, type QueryResultRow } from 'pg';

@Injectable()
export class DatabaseService implements OnApplicationShutdown {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool | null = null;
  private _available = false;

  get available(): boolean {
    return this._available;
  }

  async connect(connectionString: string): Promise<void> {
    this.pool = new Pool({ connectionString, max: 5 });
    try {
      const client = await this.pool.connect();
      client.release();
      this._available = true;
      this.logger.log('TimescaleDB connected');
    } catch (err) {
      this._available = false;
      this.logger.warn(
        `TimescaleDB unavailable — historian runs in no-op mode: ${err instanceof Error ? err.message : err}`,
      );
    }
  }

  async query<T extends QueryResultRow = QueryResultRow>(
    sql: string,
    values?: unknown[],
  ): Promise<QueryResult<T>> {
    if (!this.pool || !this._available) throw new Error('Database not available');
    return this.pool.query<T>(sql, values);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.pool?.end();
  }
}
