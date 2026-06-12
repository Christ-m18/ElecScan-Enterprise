import { Injectable, Logger } from '@nestjs/common';
import type { DatabaseService } from '../database/database.service.js';
import type { Report, ReportFormat, ReportStatus, ReportType } from './report.entity.js';

@Injectable()
export class ReportStore {
  private readonly logger = new Logger(ReportStore.name);
  private db: DatabaseService | null = null;
  private readonly reports = new Map<string, Report>();

  setDb(db: DatabaseService): void {
    this.db = db;
  }

  set(report: Report): void {
    this.reports.set(report.id, report);
    if (this.db?.available) {
      this.db
        .query(
          `INSERT INTO report(id,device_id,type,format,range_from,range_to,status,created_at)
         VALUES($1,$2,$3,$4,$5,$6,$7,$8) ON CONFLICT DO NOTHING`,
          [
            report.id,
            report.deviceId,
            report.type,
            report.format,
            report.from,
            report.to,
            report.status,
            report.createdAt,
          ],
        )
        .catch((e: Error) => this.logger.warn(`DB insert report: ${e.message}`));
    }
  }

  updateStatus(id: string, status: ReportStatus, errorMessage?: string, filename?: string): void {
    const r = this.reports.get(id);
    if (r) {
      r.status = status;
      r.errorMessage = errorMessage;
      r.filename = filename;
    }
    if (this.db?.available) {
      this.db
        .query(
          'UPDATE report SET status=$2, error_message=$3, storage_key=$4, finished_at=now() WHERE id=$1',
          [id, status, errorMessage ?? null, filename ?? null],
        )
        .catch((e: Error) => this.logger.warn(`DB update report: ${e.message}`));
    }
  }

  get(id: string): Report | undefined {
    return this.reports.get(id);
  }

  async getAll(): Promise<Report[]> {
    if (this.db?.available) {
      try {
        const { rows } = await this.db.query<{
          id: string;
          device_id: string;
          type: string;
          format: string;
          range_from: string;
          range_to: string;
          status: string;
          created_at: Date;
          error_message: string | null;
          storage_key: string | null;
        }>('SELECT * FROM report ORDER BY created_at DESC LIMIT 200');
        return rows.map((r) => ({
          id: r.id,
          deviceId: r.device_id,
          type: r.type as ReportType,
          format: r.format as ReportFormat,
          from: r.range_from,
          to: r.range_to,
          status: r.status as ReportStatus,
          createdAt: new Date(r.created_at).toISOString(),
          errorMessage: r.error_message ?? undefined,
          content: undefined,
          filename: r.storage_key ?? undefined,
        }));
      } catch {
        /* fall through */
      }
    }
    return Array.from(this.reports.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
}
