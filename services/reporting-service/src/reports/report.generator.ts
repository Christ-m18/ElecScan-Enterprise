import { Injectable } from '@nestjs/common';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { StorageService } from '../storage/storage.service.js';
import { buildPdf } from './pdf.builder.js';
import type { Report, ReportType } from './report.entity.js';
// biome-ignore lint/style/useImportType: value import required for NestJS emitDecoratorMetadata
import { ReportStore } from './report.store.js';

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
  constructor(
    private readonly store: ReportStore,
    private readonly storage: StorageService,
  ) {}

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
        this.store.updateStatus(report.id, 'error', report.errorMessage);
        return;
      }

      if (report.format === 'pdf') {
        await this.generatePdf(report, body.rows, aliases);
      } else if (report.format === 'csv') {
        await this.generateCsv(report, body.rows, aliases);
      } else {
        await this.generateJson(report, body.rows);
      }

      report.status = 'ready';
      this.store.updateStatus(report.id, 'ready', undefined, report.filename);
    } catch (err) {
      report.status = 'error';
      report.errorMessage = err instanceof Error ? err.message : String(err);
      this.store.updateStatus(report.id, 'error', report.errorMessage);
    }
  }

  private async generatePdf(
    report: Report,
    rows: HistorianRow[],
    aliases: string[],
  ): Promise<void> {
    const pdfBuffer = await buildPdf({
      deviceId: report.deviceId,
      type: report.type,
      from: report.from,
      to: report.to,
      rows,
      aliases,
    });

    const filename = `reports/${report.deviceId}/${report.id}.pdf`;
    const storageKey = await this.storage.upload(filename, pdfBuffer, 'application/pdf');

    if (storageKey) {
      report.filename = storageKey;
      // Store small base64 snapshot only for in-memory fallback on small PDFs
      if (pdfBuffer.length < 5_000_000) {
        report.content = pdfBuffer.toString('base64');
      }
    } else {
      // MinIO unavailable — keep PDF in memory as base64
      report.content = pdfBuffer.toString('base64');
      report.filename = `${report.deviceId}-${report.type}-${Date.now()}.pdf`;
    }
  }

  private async generateCsv(
    report: Report,
    rows: HistorianRow[],
    aliases: string[],
  ): Promise<void> {
    const { csv, filename } = this.toCsv(report, rows, aliases);
    report.content = csv;
    report.filename = filename;

    const storageKey = await this.storage.upload(
      `reports/${report.deviceId}/${report.id}.csv`,
      Buffer.from(csv, 'utf-8'),
      'text/csv',
    );
    if (storageKey) report.filename = storageKey;
  }

  private async generateJson(report: Report, rows: HistorianRow[]): Promise<void> {
    const json = JSON.stringify(
      {
        report: {
          deviceId: report.deviceId,
          type: report.type,
          from: report.from,
          to: report.to,
        },
        rows,
      },
      null,
      2,
    );
    report.content = json;
    report.filename = `report-${report.deviceId}-${report.type}-${Date.now()}.json`;

    const storageKey = await this.storage.upload(
      `reports/${report.deviceId}/${report.id}.json`,
      Buffer.from(json, 'utf-8'),
      'application/json',
    );
    if (storageKey) report.filename = storageKey;
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
