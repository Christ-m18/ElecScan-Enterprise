import { Controller, Get, NotFoundException, Param, Query } from '@nestjs/common';
import type { QueryResultRow } from 'pg';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { DatabaseService } from '../database/database.service.js';

interface MetricRow extends QueryResultRow {
  ts: Date;
  metric_key: string;
  phase: string;
  value: number;
}

@Controller()
export class HistorianController {
  constructor(private readonly db: DatabaseService) {}

  @Get('metrics/:deviceId')
  async getMetrics(
    @Param('deviceId') deviceId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('aliases') aliases?: string,
    @Query('bucket') bucket?: string,
  ) {
    if (!this.db.available) {
      return { available: false, message: 'TimescaleDB not connected', rows: [] };
    }

    const fromTs = from ? new Date(from) : new Date(Date.now() - 3_600_000);
    const toTs = to ? new Date(to) : new Date();
    const aliasList = aliases ? aliases.split(',').filter(Boolean) : null;
    const bucketInterval = bucket ?? '1 minute';

    const params: unknown[] = [deviceId, fromTs.toISOString(), toTs.toISOString()];
    let aliasFilter = '';
    if (aliasList?.length) {
      aliasFilter = `AND metric_key = ANY($${params.length + 1})`;
      params.push(aliasList);
    }
    params.push(bucketInterval);

    const sql = `
      SELECT
        time_bucket($${params.length}::interval, ts) AS ts,
        metric_key,
        phase,
        AVG(value) AS value
      FROM realtime_metric
      WHERE device_id = $1
        AND ts >= $2
        AND ts < $3
        ${aliasFilter}
      GROUP BY 1, metric_key, phase
      ORDER BY 1
    `;

    const result = await this.db.query<MetricRow>(sql, params);
    return { available: true, rows: result.rows };
  }

  @Get('report/:deviceId')
  async getReport(
    @Param('deviceId') deviceId: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('format') format?: string,
  ) {
    if (!this.db.available) throw new NotFoundException('TimescaleDB not connected');

    const fromTs = from ? new Date(from) : new Date(Date.now() - 86_400_000);
    const toTs = to ? new Date(to) : new Date();

    const result = await this.db.query<MetricRow>(
      `SELECT time_bucket('5 minutes', ts) AS ts, metric_key, phase, AVG(value) AS value
       FROM realtime_metric
       WHERE device_id = $1 AND ts >= $2 AND ts < $3
       GROUP BY 1, metric_key, phase
       ORDER BY 1`,
      [deviceId, fromTs.toISOString(), toTs.toISOString()],
    );

    if (format === 'csv') {
      const lines = ['ts,metric_key,phase,value'];
      for (const row of result.rows) {
        lines.push(
          `${new Date(row.ts).toISOString()},${row.metric_key},${row.phase},${Number(row.value).toFixed(6)}`,
        );
      }
      return { csv: lines.join('\n'), filename: `report-${deviceId}.csv` };
    }

    return { deviceId, from: fromTs, to: toTs, rows: result.rows };
  }
}
