export type ReportFormat = 'csv' | 'json' | 'pdf';
export type ReportType = 'realtime' | 'energy' | 'demand';
export type ReportStatus = 'pending' | 'ready' | 'error';

export interface Report {
  readonly id: string;
  readonly deviceId: string;
  readonly type: ReportType;
  readonly format: ReportFormat;
  readonly from: string;
  readonly to: string;
  readonly createdAt: string;
  status: ReportStatus;
  errorMessage: string | undefined;
  content: string | undefined;
  filename: string | undefined;
}
