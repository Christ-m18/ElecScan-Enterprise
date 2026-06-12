import { Injectable } from '@nestjs/common';
import type { Report, ReportType } from './report.entity.js';

const HISTORIAN_URL = process.env.HISTORIAN_SERVICE_URL ?? 'http://127.0.0.1:4005';

const METRIC_ALIASES: Record<ReportType, string[]> = {
  realtime: [
    'voltage_l1',
    'voltage_l2',
    'voltage_l3',
    'current_l1',
    'current_l2',
    'current_l3',
    'power_factor',
    'frequency',
    'active_power_total',
  ],
  energy: ['energy_active_import', 'energy_reactive_import', 'energy_active_export'],
  demand: [
    'active_power_total',
    'reactive_power_total',
    'apparent_power_total',
    'current_l1',
    'current_l2',
    'current_l3',
  ],
};

interface HistorianRow {
  ts: string;
  metric_key: string;
  phase: string;
  value: number;
}

@Injectable()
export class ReportGenerator {
  async generate(report: Report): Promise<void> {
    try {
      const aliases = METRIC_ALIASES[report.type];
      const bucket = this.bucket(report.from, report.to);
      const url =
        `${HISTORIAN_URL}/historian/metrics/${report.deviceId}` +
        `?from=${encodeURIComponent(report.from)}&to=${encodeURIComponent(report.to)}` +
        `&aliases=${aliases.join(',')}&bucket=${encodeURIComponent(bucket)}`;

      const r = await fetch(url);
      if (!r.ok) throw new Error(`Historian returned ${r.status}`);
      const body = (await r.json()) as { available: boolean; rows: HistorianRow[] };

      if (!body.available) {
        report.status = 'error';
        report.errorMessage = 'TimescaleDB not available';
        return;
      }

      if (report.format === 'csv') {
        const { csv, filename } = this.toCsv(report, body.rows, aliases);
        report.content = csv;
        report.filename = filename;
      } else {
        report.content = JSON.stringify(
          {
            report: {
              deviceId: report.deviceId,
              type: report.type,
              from: report.from,
              to: report.to,
            },
            rows: body.rows,
          },
          null,
          2,
        );
        report.filename = `report-${report.deviceId}-${report.type}-${Date.now()}.json`;
      }

      report.status = 'ready';
    } catch (err) {
      report.status = 'error';
      report.errorMessage = err instanceof Error ? err.message : String(err);
    }
  }

  private bucket(from: string, to: string): string {
    const diffMs = new Date(to).getTime() - new Date(from).getTime();
    const diffH = diffMs / 3_600_000;
    if (diffH <= 1) return '1 minute';
    if (diffH <= 24) return '5 minutes';
    if (diffH <= 168) return '15 minutes';
    return '1 hour';
  }

  private toCsv(
    report: Report,
    rows: HistorianRow[],
    aliases: string[],
  ): { csv: string; filename: string } {
    const byTs = new Map<string, Record<string, string>>();
    for (const row of rows) {
      const key = `${row.metric_key}${row.phase && row.phase !== 'total' ? `_${row.phase}` : ''}`;
      const ts = new Date(row.ts).toISOString();
      const existing = byTs.get(ts) ?? {};
      existing[key] = Number(row.value).toFixed(6);
      byTs.set(ts, existing);
    }

    const headers = ['timestamp', ...aliases];
    const lines = [headers.join(',')];
    for (const [ts, vals] of [...byTs.entries()].sort()) {
      lines.push([ts, ...aliases.map((a) => vals[a] ?? '')].join(','));
    }

    return {
      csv: lines.join('\n'),
      filename: `report-${report.deviceId}-${report.type}-${Date.now()}.csv`,
    };
  }
}
