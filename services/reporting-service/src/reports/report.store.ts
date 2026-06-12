import { Injectable } from '@nestjs/common';
import type { Report } from './report.entity.js';

@Injectable()
export class ReportStore {
  private readonly reports = new Map<string, Report>();

  set(report: Report): void {
    this.reports.set(report.id, report);
  }

  get(id: string): Report | undefined {
    return this.reports.get(id);
  }

  getAll(): Report[] {
    return Array.from(this.reports.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }
}
